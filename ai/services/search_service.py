"""
services/search_service.py – Semantic search over stored petitions.

Pipeline:
    1. Embed the search query using nomic-embed-text.
    2. Query ChromaDB for the top_k nearest neighbours.
    3. Return results as a SearchResponse with cosine similarity scores.
"""

from __future__ import annotations

from schemas.analysis import SearchResponse, SearchResultItem
from services import embedding_service
from utils.chroma_client import get_collection
from utils.logger import get_logger

logger = get_logger(__name__)


async def search(query: str, top_k: int = 5) -> SearchResponse:
    """
    Perform semantic search over all petitions stored in ChromaDB.

    Args:
        query:  Natural language search query.
        top_k:  Maximum number of results to return.

    Returns:
        SearchResponse containing a ranked list of matching petitions.
    """
    collection = get_collection()
    total = collection.count()

    if total == 0:
        logger.info("ChromaDB collection is empty; returning empty search results.")
        return SearchResponse(results=[])

    logger.info(f"Semantic search: query='{query[:80]}', top_k={top_k}")

    # Embed the query
    query_embedding = await embedding_service.embed(query)

    # Clamp n_results to the actual collection size
    n_results = min(top_k, total)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        include=["distances", "documents", "metadatas"],
    )

    ids: list[str] = results.get("ids", [[]])[0]
    distances: list[float] = results.get("distances", [[]])[0]
    documents: list[str] = results.get("documents", [[]])[0]
    metadatas: list[dict] = results.get("metadatas", [[]])[0]

    items: list[SearchResultItem] = []
    for doc_id, distance, document, metadata in zip(ids, distances, documents, metadatas):
        similarity = round(1.0 - distance, 4)
        items.append(
            SearchResultItem(
                petition_id=doc_id,
                score=similarity,
                title=metadata.get("title", ""),
                description=document,
                category=metadata.get("category", "Other"),
            )
        )

    logger.info(f"Returning {len(items)} search result(s).")
    return SearchResponse(results=items)
