"""
ai/services/embeddings/gemini_provider.py – Google Gemini text embedding provider.
Supports both the official google-genai SDK and direct httpx REST fallback.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any
import httpx

from .base import BaseEmbeddingProvider
from utils.logger import get_logger

logger = get_logger(__name__)


class GeminiEmbeddingProvider(BaseEmbeddingProvider):
    """Google Gemini hosted embedding provider."""

    def __init__(self, api_key: str, model: str = "gemini-embedding-001", base_url: str = "") -> None:
        self.api_key = api_key
        self.model = model.replace("models/", "")
        self.base_url = (base_url.rstrip("/") if base_url else "https://generativelanguage.googleapis.com/v1beta").rstrip("/")
        self._sdk_client = None

        if not self.api_key:
            logger.warning("Gemini API key is empty for AI service embeddings.")
        else:
            try:
                from google import genai
                self._sdk_client = genai.Client(api_key=self.api_key)
            except ImportError:
                self._sdk_client = None

    async def embed_text(self, text: str) -> list[float]:
        if self._sdk_client:
            loop = asyncio.get_running_loop()
            return await loop.run_in_executor(None, self._sdk_embed_text, text)

        return (await self._http_embed_documents([text]))[0]

    def _sdk_embed_text(self, text: str) -> list[float]:
        res = self._sdk_client.models.embed_content(
            model=self.model,
            contents=text,
        )
        if res.embeddings:
            return res.embeddings[0].values
        raise KeyError(f"No embeddings returned: {res}")

    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        if self._sdk_client:
            loop = asyncio.get_running_loop()
            return await loop.run_in_executor(None, self._sdk_embed_documents, texts)

        return await self._http_embed_documents(texts)

    def _sdk_embed_documents(self, texts: list[str]) -> list[list[float]]:
        batch_size = 50
        all_embs: list[list[float]] = []
        for i in range(0, len(texts), batch_size):
            chunk = texts[i : i + batch_size]
            res = self._sdk_client.models.embed_content(
                model=self.model,
                contents=chunk,
            )
            if res.embeddings:
                for item in res.embeddings:
                    all_embs.append(item.values)
        return all_embs

    async def _http_embed_documents(self, texts: list[str]) -> list[list[float]]:
        url = f"{self.base_url}/models/{self.model}:batchEmbedContents?key={self.api_key}"
        batch_size = 50
        all_embeddings: list[list[float]] = []

        for i in range(0, len(texts), batch_size):
            chunk = texts[i : i + batch_size]
            payload = {
                "requests": [
                    {
                        "model": f"models/{self.model}",
                        "content": {"parts": [{"text": t}]},
                    }
                    for t in chunk
                ]
            }

            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()
                for item in data.get("embeddings", []):
                    all_embeddings.append(item.get("values", []))

        return all_embeddings
