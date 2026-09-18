"""
ai/services/embeddings/ollama_provider.py – Local Ollama embedding provider (optional fallback).
"""
from __future__ import annotations

import httpx
from .base import BaseEmbeddingProvider
from utils.logger import get_logger

logger = get_logger(__name__)

_TIMEOUT_SECONDS = 60.0


class OllamaEmbeddingProvider(BaseEmbeddingProvider):
    """Optional local Ollama embedding provider for offline dev."""

    def __init__(self, base_url: str = "http://localhost:11434", model: str = "nomic-embed-text") -> None:
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def embed_text(self, text: str) -> list[float]:
        url = f"{self.base_url}/api/embeddings"
        payload = {"model": self.model, "prompt": text}
        async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["embedding"]

    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        results = []
        for t in texts:
            results.append(await self.embed_text(t))
        return results
