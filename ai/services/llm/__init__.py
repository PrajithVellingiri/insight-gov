"""
ai/services/llm/__init__.py – Factory for instantiating LLM providers based on config.
"""
from __future__ import annotations

import os
from .base import BaseLLMProvider
from .gemini_provider import GeminiLLMProvider
from .openai_provider import OpenAILLMProvider
from .ollama_provider import OllamaLLMProvider
import config

_cached_provider: BaseLLMProvider | None = None


def get_llm_provider() -> BaseLLMProvider:
    """
    Return the configured LLM provider instance (singleton).
    Configured via LLM_PROVIDER ('gemini' | 'openai' | 'ollama').
    """
    global _cached_provider
    if _cached_provider is not None:
        return _cached_provider

    provider_name = config.LLM_PROVIDER.lower()

    if provider_name == "gemini":
        _cached_provider = GeminiLLMProvider(
            api_key=config.LLM_API_KEY,
            model=config.LLM_MODEL or "gemini-2.5-flash",
            base_url=config.LLM_BASE_URL,
        )
    elif provider_name in ("openai", "groq", "together"):
        _cached_provider = OpenAILLMProvider(
            api_key=config.LLM_API_KEY,
            model=config.LLM_MODEL or "gpt-4o-mini",
            base_url=config.LLM_BASE_URL,
        )
    elif provider_name == "ollama":
        _cached_provider = OllamaLLMProvider(
            base_url=config.OLLAMA_BASE_URL,
            model=config.OLLAMA_LLM_MODEL or "qwen3:8b",
        )
    else:
        raise ValueError(f"Unsupported LLM provider: {provider_name}. Expected 'gemini', 'openai', or 'ollama'.")

    return _cached_provider
