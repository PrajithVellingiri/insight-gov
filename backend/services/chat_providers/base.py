"""
services/chat_providers/base.py

Abstract base class for all LLM chat providers.

All vendor-specific logic MUST be contained in concrete subclasses.
No router, service, or model outside this package should import
any vendor-specific module directly.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import AsyncGenerator


@dataclass
class ChatMessage:
    """A single message in a conversation thread."""
    role: str   # "user" | "assistant" | "system"
    content: str


@dataclass
class ChatResponse:
    """Full response from a chat provider (non-streaming)."""
    content: str
    model: str
    input_tokens: int
    output_tokens: int
    latency_ms: int


class ChatProvider(ABC):
    """
    Abstract interface for all LLM chat providers.

    Contract:
      - chat()        — returns a full ChatResponse (blocking).
      - stream_chat() — yields string token chunks via async generator.
      - model_name    — property returning the canonical model identifier.

    Implementations must handle:
      - API key injection from settings.
      - Exponential backoff on transient failures (429, 500).
      - Graceful error logging — never let raw API errors surface to routers.
    """

    @abstractmethod
    async def chat(
        self,
        messages: list[ChatMessage],
        system_prompt: str,
        max_tokens: int,
        temperature: float,
    ) -> ChatResponse:
        """
        Send a list of messages to the LLM and return the full response.
        The system_prompt is injected as the first system message.
        """
        ...

    @abstractmethod
    async def stream_chat(
        self,
        messages: list[ChatMessage],
        system_prompt: str,
        max_tokens: int,
        temperature: float,
    ) -> AsyncGenerator[str, None]:
        """
        Send messages and yield token strings as they arrive.
        The final yielded item must be the string "[DONE]" to signal completion.
        """
        ...

    @abstractmethod
    async def translate(self, text: str, target_language: str = "en") -> str:
        """
        Translate the given text to the target language.
        If it's already in the target language, return it unchanged.
        """
        ...

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Returns the canonical model identifier string (e.g. 'grok-3-mini')."""
        ...
