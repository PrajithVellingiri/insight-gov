"""
services/chat_providers/__init__.py

Provider factory. Returns a ChatProvider implementation based on the
CHAT_PROVIDER environment variable.

Adding a new provider:
  1. Create services/chat_providers/my_provider.py implementing ChatProvider.
  2. Register it in PROVIDER_REGISTRY below.
  3. Set CHAT_PROVIDER=my_provider in .env.
  No other file needs to change.
"""
from __future__ import annotations

from services.chat_providers.base import ChatMessage, ChatProvider
from services.chat_providers.gemini import GeminiProvider
from services.chat_providers.grok import GrokProvider

PROVIDER_REGISTRY: dict[str, type[ChatProvider]] = {
    "gemini": GeminiProvider,   # Primary provider
    "grok": GrokProvider,       # Legacy / fallback
    # Future providers registered here:
    # "openai": OpenAIProvider,
    # "claude": ClaudeProvider,
}


def get_chat_provider() -> ChatProvider:
    """
    Factory function — reads settings.chat_provider and instantiates the
    matching ChatProvider. ChatService depends on the abstract ChatProvider,
    not on any concrete vendor class (Dependency Inversion Principle).
    """
    from config import settings

    provider_name = settings.chat_provider.lower()
    cls = PROVIDER_REGISTRY.get(provider_name)
    if not cls:
        raise ValueError(
            f"Unknown chat provider '{provider_name}'. "
            f"Available: {list(PROVIDER_REGISTRY.keys())}"
        )
    return cls()


__all__ = ["ChatProvider", "ChatMessage", "get_chat_provider"]
