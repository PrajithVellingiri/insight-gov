"""
ai/services/llm/ollama_provider.py – Local Ollama LLM provider (optional fallback).
"""
from __future__ import annotations

import json
import re
from typing import Any, Type, TypeVar
import httpx
from pydantic import BaseModel, ValidationError

from .base import BaseLLMProvider
from utils.logger import get_logger

logger = get_logger(__name__)

T = TypeVar("T", bound=BaseModel)

_TIMEOUT_SECONDS = 120.0


class OllamaLLMProvider(BaseLLMProvider):
    """Optional local Ollama provider for offline development."""

    def __init__(self, base_url: str = "http://localhost:11434", model: str = "qwen3:8b") -> None:
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.2,
        max_tokens: int | None = None,
    ) -> str:
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system_prompt or "",
            "stream": False,
            "options": {"temperature": temperature},
        }
        async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("response", "").strip()

    async def generate_json(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.2,
        schema: Type[T] | None = None,
    ) -> dict[str, Any]:
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system_prompt or "",
            "stream": False,
            "format": "json",
            "options": {"temperature": temperature},
        }
        async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data.get("response", "")
            parsed = self._extract_json(raw_text)

            if schema:
                validated = schema.model_validate(parsed)
                return validated.model_dump()

            return parsed

    def _extract_json(self, text: str) -> dict[str, Any]:
        text = text.strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

        raise ValueError(f"Could not extract JSON: {text[:200]}")
