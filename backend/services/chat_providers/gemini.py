"""
services/chat_providers/gemini.py

GeminiProvider — concrete ChatProvider implementation using the Google Gemini API
via the official `google-genai` SDK.

This is the ONLY file in the entire codebase that imports or references
anything Gemini-specific. All vendor logic is contained here.

API reference: https://ai.google.dev/gemini-api/docs
SDK: pip install google-genai
"""
from __future__ import annotations

import asyncio
import logging
import time
from typing import AsyncGenerator

from google import genai
from google.genai import types

from config import settings
from services.chat_providers.base import ChatMessage, ChatProvider, ChatResponse

logger = logging.getLogger(__name__)

# Retry configuration
_MAX_RETRIES = 3
_RETRY_BASE_DELAY = 1.0  # seconds

# Timeout (seconds) before we give up waiting for the first token
_STREAM_READ_TIMEOUT = 60.0


def _to_gemini_role(role: str) -> str:
    """Map our internal role names to the Gemini SDK role names."""
    # Gemini uses "user" and "model" (not "assistant")
    return "model" if role == "assistant" else role


def _build_history(messages: list[ChatMessage]) -> list[types.Content]:
    """Convert our ChatMessage list (excluding the last user turn) into Gemini history."""
    history: list[types.Content] = []
    # All messages except the final user message go into history
    for msg in messages[:-1]:
        history.append(
            types.Content(
                role=_to_gemini_role(msg.role),
                parts=[types.Part.from_text(text=msg.content)],
            )
        )
    return history


class GeminiProvider(ChatProvider):
    """
    Implements ChatProvider using the Google Gemini API (google-genai SDK).

    Authentication: GEMINI_API_KEY environment variable.
    Model: Configurable via GEMINI_MODEL / CHAT_MODEL env var (default: gemini-2.5-flash).
    """

    def __init__(self) -> None:
        self._api_key = settings.gemini_api_key
        self._model = settings.chat_model

        if not self._api_key:
            logger.warning(
                "GEMINI_API_KEY is not set. Chatbot will fail on first request."
            )

        self._client = genai.Client(api_key=self._api_key)

    @property
    def model_name(self) -> str:
        return self._model

    def _make_config(self, system_prompt: str, max_tokens: int, temperature: float) -> types.GenerateContentConfig:
        return types.GenerateContentConfig(
            system_instruction=system_prompt,
            max_output_tokens=max_tokens,
            temperature=temperature,
        )

    async def chat(
        self,
        messages: list[ChatMessage],
        system_prompt: str,
        max_tokens: int,
        temperature: float,
    ) -> ChatResponse:
        """Full (non-streaming) chat completion via Gemini."""
        if not messages:
            raise ValueError("messages list cannot be empty")

        history = _build_history(messages)
        last_message = messages[-1].content
        config = self._make_config(system_prompt, max_tokens, temperature)

        start = time.monotonic()
        last_exc: Exception | None = None

        for attempt in range(_MAX_RETRIES):
            try:
                chat = self._client.aio.chats.create(
                    model=self._model,
                    config=config,
                    history=history,
                )
                response = await chat.send_message(last_message)
                latency_ms = int((time.monotonic() - start) * 1000)

                # Extract token usage if available
                usage = response.usage_metadata
                input_tokens = getattr(usage, "prompt_token_count", 0) or 0
                output_tokens = getattr(usage, "candidates_token_count", 0) or 0

                return ChatResponse(
                    content=response.text,
                    model=self._model,
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    latency_ms=latency_ms,
                )
            except Exception as exc:
                last_exc = exc
                err_str = str(exc).lower()
                # Only retry on transient errors
                if any(kw in err_str for kw in ("429", "500", "502", "503", "504", "rate", "quota")):
                    if attempt < _MAX_RETRIES - 1:
                        delay = _RETRY_BASE_DELAY * (2 ** attempt)
                        logger.warning(
                            "Gemini API transient error (attempt %d/%d): %s. Retrying in %.1fs.",
                            attempt + 1, _MAX_RETRIES, exc, delay,
                        )
                        await asyncio.sleep(delay)
                        continue
                # Non-retryable error — surface it
                logger.error("Gemini chat error: %s", exc)
                raise

        raise last_exc or RuntimeError("Gemini: Max retries exceeded")

    async def stream_chat(
        self,
        messages: list[ChatMessage],
        system_prompt: str,
        max_tokens: int,
        temperature: float,
    ) -> AsyncGenerator[str, None]:
        """Streaming chat completion — yields token chunks then '[DONE]'."""
        if not messages:
            yield "[ERROR:empty]"
            return

        history = _build_history(messages)
        last_message = messages[-1].content
        config = self._make_config(system_prompt, max_tokens, temperature)

        try:
            print("[7] Sending request to Gemini", flush=True)
            chat = self._client.aio.chats.create(
                model=self._model,
                config=config,
                history=history,
            )

            first_token = True
            async for chunk in await chat.send_message_stream(last_message):
                token = chunk.text
                if token:
                    if first_token:
                        print("[8] First token received from Gemini", flush=True)
                        first_token = False
                    yield token

        except Exception as exc:
            err_str = str(exc).lower()
            if any(kw in err_str for kw in ("permission", "api key", "403", "401", "unauthenticated", "invalid")):
                logger.error("Gemini auth error: %s", exc)
                yield "[ERROR:auth]"
            elif any(kw in err_str for kw in ("timeout", "deadline")):
                logger.error("Gemini stream timed out: %s", exc)
                yield "[ERROR:timeout]"
            else:
                logger.error("Gemini stream error: %s", exc)
                yield "[ERROR:unavailable]"

    async def translate(self, text: str, target_language: str = "en") -> str:
        """Translate the given text to the target language."""
        if not text.strip():
            return text
            
        system_prompt = f"You are a translator. Translate the user's text to the language code '{target_language}'. If it is already in that language, return the original text exactly without any conversational filler."
        config = self._make_config(system_prompt, 1024, 0.1)

        try:
            chat = self._client.aio.chats.create(
                model=self._model,
                config=config,
            )
            response = await chat.send_message(text)
            return response.text.strip()
        except Exception as exc:
            logger.error("Gemini translation error: %s", exc)
            return text # fallback to original text on error
