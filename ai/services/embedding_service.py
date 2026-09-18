"""
services/embedding_service.py – Text embedding via hosted embedding provider.

Exposes async function `embed(text)` and `embed_many(texts)` that return float vectors.
All callers (analysis_service, search_service) go through this module.
"""
from __future__ import annotations

from services.embeddings import get_embedding_provider
from utils.logger import get_logger

logger = get_logger(__name__)


async def embed(text: str) -> list[float]:
    """
    Generate an embedding vector for the given text using the configured provider.

    Args:
        text: The text to embed (petition content or search query).

    Returns:
        A list of floats representing the embedding vector.
    """
    provider = get_embedding_provider()
    logger.info(f"Generating embedding via {type(provider).__name__} (text_len={len(text)})")
    return await provider.embed_text(text)


async def embed_many(texts: list[str]) -> list[list[float]]:
    """
    Generate embedding vectors for multiple texts using the configured provider.
    """
    provider = get_embedding_provider()
    return await provider.embed_documents(texts)
