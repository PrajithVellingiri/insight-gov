"""
services/embedding_service.py – Text embedding via Ollama nomic-embed-text.

Exposes a single async function `embed(text)` that returns a float vector.
All callers (analysis_service, search_service) go through this module.
"""

from __future__ import annotations

import httpx

from config import OLLAMA_BASE_URL, OLLAMA_EMBED_MODEL
from utils.logger import get_logger

logger = get_logger(__name__)

_TIMEOUT_SECONDS = 60.0


async def embed(text: str) -> list[float]:
    """
    Generate an embedding vector for the given text using nomic-embed-text.

    Args:
        text: The text to embed (petition content or search query).

    Returns:
        A list of floats representing the embedding vector.

    Raises:
        httpx.HTTPStatusError: On a non-2xx response from Ollama.
        KeyError: If the Ollama response does not contain an 'embedding' field.
    """
    url = f"{OLLAMA_BASE_URL}/api/embeddings"
    payload = {
        "model": OLLAMA_EMBED_MODEL,
        "prompt": text,
    }

    logger.info(f"Generating embedding (model={OLLAMA_EMBED_MODEL}, text_len={len(text)})")

    async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()

    data = response.json()
    embedding: list[float] = data["embedding"]
    logger.info(f"Embedding generated (dims={len(embedding)})")
    return embedding
