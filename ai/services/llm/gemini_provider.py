"""
ai/services/llm/gemini_provider.py – Google Gemini LLM provider implementation.
Uses the official Gemini REST API via httpx for lightweight, robust async operations.
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


class GeminiLLMProvider(BaseLLMProvider):
    """Hosted Google Gemini LLM provider."""

    def __init__(self, api_key: str, model: str = "gemini-2.5-flash", base_url: str = "") -> None:
        self.api_key = api_key
        # Clean model name if passed with 'models/' prefix
        self.model = model.replace("models/", "")
        self.base_url = (base_url.rstrip("/") if base_url else "https://generativelanguage.googleapis.com/v1beta").rstrip("/")

        if not self.api_key:
            logger.warning("Gemini API key is empty. Set GEMINI_API_KEY or LLM_API_KEY.")

    async def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.2,
        max_tokens: int | None = None,
    ) -> str:
        """Call Gemini generateContent API and return raw response text."""
        url = f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}"

        payload: dict[str, Any] = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}],
                }
            ],
            "generationConfig": {
                "temperature": temperature,
            },
        }

        if system_prompt:
            payload["systemInstruction"] = {
                "parts": [{"text": system_prompt}]
            }

        if max_tokens:
            payload["generationConfig"]["maxOutputTokens"] = max_tokens

        last_err: Exception | None = None

        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS) as client:
                    resp = await client.post(url, json=payload)
                    resp.raise_for_status()

                data = resp.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    raise ValueError(f"Gemini returned no candidates: {data}")

                parts = candidates[0].get("content", {}).get("parts", [])
                text = "".join(part.get("text", "") for part in parts)
                return text.strip()

            except httpx.HTTPStatusError as exc:
                status = exc.response.status_code
                logger.warning(f"Gemini API attempt {attempt} failed with status {status}: {exc.response.text}")
                last_err = exc
                if status in (429, 500, 502, 503, 504) and attempt < _MAX_RETRIES:
                    await asyncio.sleep(_RETRY_BASE_DELAY * (2 ** (attempt - 1)))
                    continue
                raise RuntimeError(f"Gemini API error {status}: {exc.response.text}") from exc

            except Exception as exc:
                logger.warning(f"Gemini request attempt {attempt} failed: {exc}")
                last_err = exc
                if attempt < _MAX_RETRIES:
                    await asyncio.sleep(_RETRY_BASE_DELAY * attempt)
                    continue
                raise RuntimeError(f"Gemini API request failed after {_MAX_RETRIES} attempts: {last_err}") from exc

        raise RuntimeError(f"Gemini generate failed: {last_err}")

    async def generate_json(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.2,
        schema: Type[T] | None = None,
    ) -> dict[str, Any]:
        """Call Gemini with JSON output formatting, parse response, and validate against schema."""
        url = f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}"

        payload: dict[str, Any] = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}],
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "responseMimeType": "application/json",
            },
        }

        if system_prompt:
            payload["systemInstruction"] = {
                "parts": [{"text": system_prompt}]
            }

        last_err: Exception | None = None

        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS) as client:
                    resp = await client.post(url, json=payload)
                    resp.raise_for_status()

                data = resp.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    raise ValueError(f"Gemini returned no candidates: {data}")

                parts = candidates[0].get("content", {}).get("parts", [])
                raw_text = "".join(part.get("text", "") for part in parts)
                parsed = self._extract_json(raw_text)

                if schema:
                    try:
                        validated = schema.model_validate(parsed)
                        return validated.model_dump()
                    except ValidationError as ve:
                        logger.warning(f"JSON validation failed against schema on attempt {attempt}: {ve}")
                        last_err = ve
                        if attempt < _MAX_RETRIES:
                            # Adjust prompt to repair schema errors
                            payload["contents"].append({
                                "role": "model",
                                "parts": [{"text": raw_text}]
                            })
                            payload["contents"].append({
                                "role": "user",
                                "parts": [{"text": f"Your previous response had validation errors: {ve}. Please output ONLY a valid JSON object satisfying the required schema."}]
                            })
                            continue
                        raise ValueError(f"Malformed LLM output failing schema: {ve}") from ve

                return parsed

            except httpx.HTTPStatusError as exc:
                status = exc.response.status_code
                logger.warning(f"Gemini JSON attempt {attempt} failed ({status}): {exc.response.text}")
                last_err = exc
                if status in (429, 500, 502, 503, 504) and attempt < _MAX_RETRIES:
                    await asyncio.sleep(_RETRY_BASE_DELAY * (2 ** (attempt - 1)))
                    continue
                raise RuntimeError(f"Gemini API error {status}: {exc.response.text}") from exc

            except Exception as exc:
                logger.warning(f"Gemini JSON attempt {attempt} error: {exc}")
                last_err = exc
                if attempt < _MAX_RETRIES:
                    await asyncio.sleep(_RETRY_BASE_DELAY * attempt)
                    continue

        raise RuntimeError(f"Gemini generate_json failed after {_MAX_RETRIES} attempts: {last_err}")

    def _extract_json(self, text: str) -> dict[str, Any]:
        """Extract a JSON object from text with regex fallback."""
        text = text.strip()
        # Direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Strip markdown code fencing if present
        cleaned = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
        cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        # Regex search for first outer {...}
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

        raise ValueError(f"Could not extract valid JSON from LLM output: {text[:200]}")
