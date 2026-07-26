"""
services/llm_service.py – Ollama LLM interaction for the InsightGov AI service.

Responsibilities:
- Send system + user prompts to Ollama /api/generate.
- Enforce JSON output mode (format="json").
- Extract and validate the JSON response.
- Retry up to 3 times on transient failures.
"""

from __future__ import annotations

import json
import re

import httpx

from config import OLLAMA_BASE_URL, OLLAMA_LLM_MODEL
from utils.logger import get_logger

logger = get_logger(__name__)

_MAX_RETRIES = 3
_TIMEOUT_SECONDS = 120.0


async def generate_json(system_prompt: str, user_prompt: str) -> dict:
    """
    Call the Ollama LLM and return a parsed JSON dict.

    Args:
        system_prompt: Instructions / persona for the model.
        user_prompt:   The specific petition text or query.

    Returns:
        Parsed JSON dict from the model response.

    Raises:
        RuntimeError: If all retries are exhausted or the response cannot be parsed.
    """
    url = f"{OLLAMA_BASE_URL}/api/generate"
    payload = {
        "model": OLLAMA_LLM_MODEL,
        "system": system_prompt,
        "prompt": user_prompt,
        "stream": False,
        "format": "json",  # Instructs Ollama to guarantee valid JSON output
    }

    last_error: Exception | None = None

    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            logger.info(f"LLM request attempt {attempt}/{_MAX_RETRIES} (model={OLLAMA_LLM_MODEL})")
            async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()

            data = response.json()
            raw_text: str = data.get("response", "")
            parsed = _extract_json(raw_text)
            logger.info("LLM response parsed successfully.")
            return parsed

        except Exception as exc:
            logger.warning(f"LLM attempt {attempt} failed: {exc}")
            last_error = exc

    raise RuntimeError(
        f"LLM generation failed after {_MAX_RETRIES} attempts. Last error: {last_error}"
    )


def _extract_json(text: str) -> dict:
    """
    Extract a JSON object from raw LLM output.

    Tries direct parsing first; falls back to regex extraction of the first
    JSON object in the string if the model included surrounding text despite
    the format=json directive.

    Raises:
        ValueError: If no valid JSON object can be found.
    """
    text = text.strip()

    # Attempt 1 – direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Attempt 2 – extract first JSON object via regex
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    raise ValueError(
        f"Could not parse JSON from LLM response. "
        f"First 300 chars: {text[:300]!r}"
    )
