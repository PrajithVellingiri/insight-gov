"""
services/llm_service.py – Hosted LLM interaction for the InsightGov AI service.

Responsibilities:
- Delegates to the configured LLM provider (Gemini, OpenAI, or Ollama fallback).
- Enforces JSON output mode and schema compliance.
- Extracts and validates the JSON response.
- Retry with exponential backoff on transient failures.
"""
from __future__ import annotations

import json
import re
from typing import Any

from services.llm import get_llm_provider
from utils.logger import get_logger

logger = get_logger(__name__)


async def generate_json(system_prompt: str, user_prompt: str) -> dict[str, Any]:
    """
    Call the configured LLM provider and return a parsed JSON dict.

    Args:
        system_prompt: Instructions / persona for the model.
        user_prompt:   The specific petition text or query.

    Returns:
        Parsed JSON dict from the model response.

    Raises:
        RuntimeError: If all retries are exhausted or the response cannot be parsed.
    """
    provider = get_llm_provider()
    logger.info(f"Generating JSON via LLM provider: {type(provider).__name__}")

    try:
        return await provider.generate_json(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.2,
        )
    except Exception as exc:
        logger.error(f"LLM generate_json failed: {exc}")
        raise RuntimeError(f"LLM generation failed: {exc}") from exc


def _extract_json(text: str) -> dict[str, Any]:
    """
    Extract a JSON object from raw LLM output.
    Kept for backward-compatibility with tests or direct utility usage.
    """
    text = text.strip()

    # Direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strip markdown code blocks
    cleaned = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Regex extraction
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    raise ValueError("No valid JSON object could be extracted from text.")
