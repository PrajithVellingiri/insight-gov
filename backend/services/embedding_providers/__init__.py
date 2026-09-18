"""
backend/services/embedding_providers/__init__.py – Factory for instantiating backend embedding provider.
"""
from __future__ import annotations

from config import settings
from .base import BaseEmbeddingProvider
from .gemini import GeminiEmbeddingProvider
from .openai import OpenAIEmbeddingProvider
from .ollama import OllamaEmbeddingProvider

_cached_provider: BaseEmbeddingProvider | None = None


def get_embedding_provider() -> BaseEmbeddingProvider:
    """
    Return configured embedding provider instance (singleton).
    Configured via settings.embedding_provider ('gemini' | 'openai' | 'ollama').
    """
    global _cached_provider
    if _cached_provider is not None:
        return _cached_provider

    provider_name = getattr(settings, "embedding_provider", "gemini").lower()
    api_key = getattr(settings, "embedding_api_key", "") or getattr(settings, "gemini_api_key", "")
    model = getattr(settings, "embedding_model", "text-embedding-004")
    base_url = getattr(settings, "embedding_base_url", "")

    if provider_name == "gemini":
        _cached_provider = GeminiEmbeddingProvider(
            api_key=api_key,
            model=model,
            base_url=base_url,
        )
    elif provider_name in ("openai", "groq", "together"):
        _cached_provider = OpenAIEmbeddingProvider(
            api_key=api_key,
            model=model if "embedding" in model else "text-embedding-3-small",
            base_url=base_url,
        )
    elif provider_name == "ollama":
        _cached_provider = OllamaEmbeddingProvider(
            base_url=getattr(settings, "ollama_base_url", "http://localhost:11434"),
            model=model if model else "nomic-embed-text",
        )
    else:
        raise ValueError(f"Unsupported embedding provider: {provider_name}. Expected 'gemini', 'openai', or 'ollama'.")

    return _cached_provider
