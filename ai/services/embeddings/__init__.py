"""
ai/services/embeddings/__init__.py – Factory for instantiating embedding provider based on config.
"""
from __future__ import annotations

import config
from .base import BaseEmbeddingProvider
from .gemini_provider import GeminiEmbeddingProvider
from .openai_provider import OpenAIEmbeddingProvider
from .ollama_provider import OllamaEmbeddingProvider

_cached_provider: BaseEmbeddingProvider | None = None


def get_embedding_provider() -> BaseEmbeddingProvider:
    """
    Return configured embedding provider instance (singleton).
    Configured via EMBEDDING_PROVIDER ('gemini' | 'openai' | 'ollama').
    """
    global _cached_provider
    if _cached_provider is not None:
        return _cached_provider

    provider_name = config.EMBEDDING_PROVIDER.lower()

    if provider_name == "gemini":
        _cached_provider = GeminiEmbeddingProvider(
            api_key=config.EMBEDDING_API_KEY,
            model=config.EMBEDDING_MODEL or "gemini-embedding-001",
            base_url=config.EMBEDDING_BASE_URL,
        )
    elif provider_name in ("openai", "groq", "together"):
        _cached_provider = OpenAIEmbeddingProvider(
            api_key=config.EMBEDDING_API_KEY,
            model=config.EMBEDDING_MODEL or "text-embedding-3-small",
            base_url=config.EMBEDDING_BASE_URL,
        )
    elif provider_name == "ollama":
        _cached_provider = OllamaEmbeddingProvider(
            base_url=config.OLLAMA_BASE_URL,
            model=config.OLLAMA_EMBED_MODEL or "nomic-embed-text",
        )
    else:
        raise ValueError(f"Unsupported EMBEDDING_PROVIDER: {provider_name}. Expected 'gemini', 'openai', or 'ollama'.")

    return _cached_provider
