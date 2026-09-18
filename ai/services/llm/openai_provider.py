"""
ai/services/llm/openai_provider.py – OpenAI / OpenAI-compatible LLM provider.
Works with OpenAI, Groq, Together, DeepSeek, or any /v1/chat/completions endpoint.
"""
from __future__ import annotations

import asyncio
import json
import re
from typing import Any, Type, TypeVar
import httpx
from pydantic import BaseModel, ValidationError

from .base import BaseLLMProvider
from utils.logger import get_logger

logger = get_logger(__name__)

T = TypeVar("T", bound=BaseModel)

_MAX_RETRIES = 3
_RETRY_BASE_DELAY = 1.5
_TIMEOUT_SECONDS = 60.0


class OpenAILLMProvider(BaseLLMProvider):
    """OpenAI-compatible hosted LLM provider."""

    def __init__(self, api_key: str, model: str = "gpt-4o-mini", base_url: str = "") -> None:
        self.api_key = api_key
        self.model = model
        self.base_url = (base_url.rstrip("/") if base_url else "https://api.openai.com/v1").rstrip("/")

    async def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.2,
        max_tokens: int | None = None,
    ) -> str:
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
        }
        if max_tokens:
            payload["max_tokens"] = max_tokens

        last_err: Exception | None = None

        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    resp.raise_for_status()

                data = resp.json()
                choices = data.get("choices", [])
                if not choices:
                    raise ValueError(f"No choices returned: {data}")
                return choices[0]["message"]["content"].strip()

            except Exception as exc:
                logger.warning(f"OpenAI generate attempt {attempt} failed: {exc}")
                last_err = exc
                if attempt < _MAX_RETRIES:
                    await asyncio.sleep(_RETRY_BASE_DELAY * attempt)
                    continue

        raise RuntimeError(f"OpenAI generate failed after {_MAX_RETRIES} attempts: {last_err}")

    async def generate_json(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.2,
        schema: Type[T] | None = None,
    ) -> dict[str, Any]:
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        messages = []
        sys = (system_prompt or "") + "\nOutput MUST be valid JSON conforming to the requested schema."
        messages.append({"role": "system", "content": sys})
        messages.append({"role": "user", "content": prompt})

        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "response_format": {"type": "json_object"},
        }

        last_err: Exception | None = None

        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    resp.raise_for_status()

                data = resp.json()
                raw_text = data["choices"][0]["message"]["content"]
                parsed = self._extract_json(raw_text)

                if schema:
                    try:
                        validated = schema.model_validate(parsed)
                        return validated.model_dump()
                    except ValidationError as ve:
                        logger.warning(f"OpenAI JSON validation failed: {ve}")
                        last_err = ve
                        if attempt < _MAX_RETRIES:
                            payload["messages"].append({"role": "assistant", "content": raw_text})
                            payload["messages"].append({
                                "role": "user",
                                "content": f"Schema validation error: {ve}. Please fix and return pure valid JSON."
                            })
                            continue
                        raise ValueError(f"Malformed LLM output failing schema: {ve}") from ve

                return parsed

            except Exception as exc:
                logger.warning(f"OpenAI JSON attempt {attempt} failed: {exc}")
                last_err = exc
                if attempt < _MAX_RETRIES:
                    await asyncio.sleep(_RETRY_BASE_DELAY * attempt)
                    continue

        raise RuntimeError(f"OpenAI generate_json failed after {_MAX_RETRIES} attempts: {last_err}")

    def _extract_json(self, text: str) -> dict[str, Any]:
        text = text.strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        cleaned = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
        cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

        raise ValueError(f"Could not extract valid JSON from LLM output: {text[:200]}")
