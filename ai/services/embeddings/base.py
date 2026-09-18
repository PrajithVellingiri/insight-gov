"""
ai/services/embeddings/base.py – Abstract Base Class for Embedding Providers.
"""
from __future__ import annotations

from abc import ABC, abstractmethod


class BaseEmbeddingProvider(ABC):
    """Abstract interface for text embedding providers."""

    @abstractmethod
    async def embed_text(self, text: str) -> list[float]:
        """Generate a single embedding vector for the provided text."""
        pass

    @abstractmethod
    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Generate embedding vectors for multiple documents."""
        pass
