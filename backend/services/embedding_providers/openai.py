"""
backend/services/embedding_providers/openai.py – OpenAI-compatible embedding provider for backend RAG.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any
import httpx

from .base import BaseEmbeddingProvider

logger = logging.getLogger(__name__)

_MAX_RETRIES = 3
_RETRY_BASE_DELAY = 1.5
_TIMEOUT_SECONDS = 60.0


class OpenAIEmbeddingProvider(BaseEmbeddingProvider):
    """OpenAI-compatible hosted embedding provider."""

    def __init__(self, api_key: str, model: str = "text-embedding-3-small", base_url: str = "") -> None:
        self.api_key = api_key
        self.model = model
        self.base_url = (base_url.rstrip("/") if base_url else "https://api.openai.com/v1").rstrip("/")

    async def embed_text(self, text: str) -> list[float]:
        res = await self.embed_documents([text])
        return res[0]

    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        url = f"{self.base_url}/embeddings"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "input": texts,
        }

        last_err: Exception | None = None
        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    resp.raise_for_status()

                data = resp.json()
                items = sorted(data.get("data", []), key=lambda x: x["index"])
                return [item["embedding"] for item in items]

            except Exception as exc:
                logger.warning(f"Backend OpenAI embedding attempt {attempt} failed: {exc}")
                last_err = exc
                if attempt < _MAX_RETRIES:
                    await asyncio.sleep(_RETRY_BASE_DELAY * attempt)

        raise RuntimeError(f"Backend OpenAI embed_documents failed: {last_err}")
