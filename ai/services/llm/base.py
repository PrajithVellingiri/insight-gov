"""
ai/services/llm/base.py – Abstract Base Class for LLM providers.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, AsyncGenerator, Type, TypeVar
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class BaseLLMProvider(ABC):
    """Abstract base class for all LLM providers (Gemini, OpenAI, Ollama, etc.)."""

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.2,
        max_tokens: int | None = None,
    ) -> str:
        """Generate raw text response from the LLM."""
        pass

    @abstractmethod
    async def generate_json(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.2,
        schema: Type[T] | None = None,
    ) -> dict[str, Any]:
        """Generate and parse structured JSON from the LLM, optionally validated against a Pydantic schema."""
        pass

    async def stream(
        self,
        prompt: str,
        system_prompt: str | None = None,
        messages: list[dict[str, str]] | None = None,
        temperature: float = 0.7,
        max_tokens: int | None = None,
    ) -> AsyncGenerator[str, None]:
        """Stream response tokens from the LLM (optional)."""
        response = await self.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        yield response
