"""
services/chat_providers/grok.py

GrokProvider — concrete ChatProvider implementation using the xAI Grok REST API.

This is the ONLY file in the entire codebase that imports or references
anything Grok-specific. All vendor logic is contained here.

API reference: https://docs.x.ai/api/endpoints#chat-completions
"""
from __future__ import annotations

import asyncio
import json
import logging

import time
from typing import AsyncGenerator

import httpx

from config import settings
from services.chat_providers.base import ChatMessage, ChatProvider, ChatResponse

logger = logging.getLogger(__name__)

# Retry configuration
_MAX_RETRIES = 3
_RETRY_BASE_DELAY = 1.0   # seconds
_RETRYABLE_STATUS = {429, 500, 502, 503, 504}

# Timeouts
_CONNECT_TIMEOUT = 5.0
_FIRST_TOKEN_TIMEOUT = 15.0
_STREAM_READ_TIMEOUT = 60.0


class GrokProvider(ChatProvider):
    """
    Implements ChatProvider using the Grok (xAI) Chat Completions API.

    Endpoint: POST https://api.x.ai/v1/chat/completions
    Authentication: Bearer token via GROK_API_KEY env var.
    """

    def __init__(self) -> None:
        self._api_key = settings.grok_api_key
        self._base_url = settings.grok_api_base_url.rstrip("/")
        self._model = settings.chat_model

        if not self._api_key:
            logger.warning(
                "GROK_API_KEY is not set. Chatbot will fail on first request."
            )

    @property
    def model_name(self) -> str:
        return self._model

    def _build_headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

    def _build_payload(
        self,
        messages: list[ChatMessage],
        system_prompt: str,
        max_tokens: int,
        temperature: float,
        stream: bool = False,
    ) -> dict:
        api_messages = [{"role": "system", "content": system_prompt}]
        for msg in messages:
            api_messages.append({"role": msg.role, "content": msg.content})
        return {
            "model": self._model,
            "messages": api_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": stream,
        }

    async def _request_with_retry(
        self, client: httpx.AsyncClient, payload: dict
    ) -> httpx.Response:
        """POST to Grok with exponential backoff on transient errors."""
        last_exc: Exception | None = None
        for attempt in range(_MAX_RETRIES):
            try:
                response = await client.post(
                    f"{self._base_url}/chat/completions",
                    json=payload,
                    headers=self._build_headers(),
                )
                if response.status_code in _RETRYABLE_STATUS and attempt < _MAX_RETRIES - 1:
                    delay = _RETRY_BASE_DELAY * (2 ** attempt)
                    logger.warning(
                        "Grok API returned %s (attempt %d/%d). Retrying in %.1fs.",
                        response.status_code, attempt + 1, _MAX_RETRIES, delay,
                    )
                    await asyncio.sleep(delay)
                    continue
                return response
            except httpx.RequestError as exc:
                last_exc = exc
                if attempt < _MAX_RETRIES - 1:
                    delay = _RETRY_BASE_DELAY * (2 ** attempt)
                    logger.warning(
                        "Grok request error (attempt %d/%d): %s. Retrying in %.1fs.",
                        attempt + 1, _MAX_RETRIES, exc, delay,
                    )
                    await asyncio.sleep(delay)

        raise last_exc or httpx.RequestError("Max retries exceeded")

    async def chat(
        self,
        messages: list[ChatMessage],
        system_prompt: str,
        max_tokens: int,
        temperature: float,
    ) -> ChatResponse:
        """Full (non-streaming) chat completion."""
        payload = self._build_payload(
            messages, system_prompt, max_tokens, temperature, stream=False
        )

        start = time.monotonic()
        timeout = httpx.Timeout(
            connect=_CONNECT_TIMEOUT, read=_FIRST_TOKEN_TIMEOUT, write=10.0, pool=5.0
        )

        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await self._request_with_retry(client, payload)

        latency_ms = int((time.monotonic() - start) * 1000)

        if response.status_code == 401:
            logger.error("Grok API key is invalid or expired.")
            raise ValueError("Grok API authentication failed. Check GROK_API_KEY.")

        response.raise_for_status()

        data = response.json()
        choice = data["choices"][0]["message"]["content"]
        usage = data.get("usage", {})

        return ChatResponse(
            content=choice,
            model=data.get("model", self._model),
            input_tokens=usage.get("prompt_tokens", 0),
            output_tokens=usage.get("completion_tokens", 0),
            latency_ms=latency_ms,
        )

    async def stream_chat(
        self,
        messages: list[ChatMessage],
        system_prompt: str,
        max_tokens: int,
        temperature: float,
    ) -> AsyncGenerator[str, None]:
        """Streaming chat completion — yields token chunks then '[DONE]'."""
        payload = self._build_payload(
            messages, system_prompt, max_tokens, temperature, stream=True
        )

        timeout = httpx.Timeout(
            connect=_CONNECT_TIMEOUT,
            read=_STREAM_READ_TIMEOUT,
            write=10.0,
            pool=5.0,
        )
        headers = self._build_headers()

        try:
            print("[7] Sending request to Grok", flush=True)
            async with httpx.AsyncClient(timeout=timeout) as client:
                async with client.stream(
                    "POST",
                    f"{self._base_url}/chat/completions",
                    json=payload,
                    headers=headers,
                ) as response:
                    if response.status_code >= 400:
                        logger.error("Grok stream returned error %s", response.status_code)
                        if response.status_code in (401, 403):
                            yield "[ERROR:auth]"
                        else:
                            yield "[ERROR:unavailable]"
                        return

                    first_token = True
                    async for line in response.aiter_lines():
                        if not line or not line.startswith("data:"):
                            continue
                        raw = line[len("data:"):].strip()
                        if raw == "[DONE]":
                            break
                        try:
                            chunk = json.loads(raw)
                            delta = chunk["choices"][0].get("delta", {})
                            token = delta.get("content", "")
                            if token:
                                if first_token:
                                    print("[8] First token received", flush=True)
                                    first_token = False
                                yield token
                        except (json.JSONDecodeError, KeyError, IndexError):
                            continue

        except httpx.TimeoutException:
            logger.error("Grok stream timed out after %ss.", _STREAM_READ_TIMEOUT)
            yield "[ERROR:timeout]"
            return
        except httpx.RequestError as exc:
            logger.error("Grok stream connection error: %s", exc)
            yield "[ERROR:connection]"
            return

    async def translate(self, text: str, target_language: str = "en") -> str:
        """Translate the given text to the target language."""
        if not text or not text.strip():
            return text

        sys_prompt = (
            f"You are a professional translator. Translate the following text into {target_language}. "
            "Return ONLY the translation, with no conversational filler or markdown formatting."
            f"If the text is already in {target_language}, return it unchanged."
        )

        try:
            resp = await self.chat(
                messages=[ChatMessage(role="user", content=text)],
                system_prompt=sys_prompt,
                max_tokens=2000,
                temperature=0.1
            )
            return resp.content.strip()
        except Exception as e:
            logger.error(f"Grok translation failed: {e}")
            return text
