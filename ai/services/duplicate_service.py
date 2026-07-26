"""
services/duplicate_service.py – Duplicate petition detection using ChromaDB.

Logic:
    - find_duplicates: Queries the collection for vectors whose cosine
      similarity to the given embedding meets or exceeds DUPLICATE_THRESHOLD.
    - store_petition: Upserts a petition embedding (called AFTER LLM analysis
      so that the category is available as metadata).
"""

from __future__ import annotations

import math
from typing import Optional

from config import DUPLICATE_THRESHOLD
from utils.chroma_client import get_collection
from utils.logger import get_logger

logger = get_logger(__name__)


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on the Earth surface in meters."""
    R = 6371000  # Radius of earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


async def find_duplicates(
    petition_id: str,
    embedding: list[float],
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
) -> tuple[list[str], list[float]]:
    """
    Query ChromaDB for petitions similar to the given embedding.

    Args:
        petition_id: The current petition's ID (excluded from results).
        embedding:   The embedding vector for the current petition.

    Returns:
        A tuple of (duplicate_ids, similarity_scores) — both lists are
        parallel and ordered by descending similarity.
    """
    collection = get_collection()

    total = collection.count()
    if total == 0:
        logger.info("ChromaDB collection is empty; skipping duplicate check.")
        return [], []

    # Query up to 30 neighbours to ensure we find ones within our radius
    n_results = min(30, total)

    results = collection.query(
        query_embeddings=[embedding],
        n_results=n_results,
        include=["distances", "metadatas"],
    )

    duplicate_ids: list[str] = []
    similarity_scores: list[float] = []

    ids: list[str] = results.get("ids", [[]])[0]
    distances: list[float] = results.get("distances", [[]])[0]
    metadatas: list[dict] = results.get("metadatas", [[]])[0]

    for doc_id, distance, metadata in zip(ids, distances, metadatas):
        if doc_id == petition_id:
            # Never flag a petition as its own duplicate (e.g. on re-analysis)
            continue

        # ChromaDB cosine distance: distance ∈ [0, 2]; similarity = 1 - distance
        similarity = round(1.0 - distance, 4)

        if similarity < DUPLICATE_THRESHOLD:
            continue

        is_duplicate = False

        if latitude is not None and longitude is not None:
            # We have coordinates for the incoming petition.
            candidate_lat = metadata.get("latitude")
            candidate_lon = metadata.get("longitude")
            
            if candidate_lat is not None and candidate_lon is not None:
                # Both petitions have coordinates, enforce the 200m radius rule.
                dist_m = haversine_distance(latitude, longitude, candidate_lat, candidate_lon)
                if dist_m <= 200:
                    is_duplicate = True
                    logger.info(f"Duplicate found: {doc_id} (similarity={similarity:.4f}, distance={dist_m:.1f}m)")
                else:
                    # Semantic title is similar, but it's too far away to be the exact same issue.
                    continue
            else:
                # Target has coordinates, but candidate is missing them (legacy data).
                # Fallback to pure semantic match.
                is_duplicate = True
                logger.info(f"Duplicate found (legacy candidate): {doc_id} (similarity={similarity:.4f})")
        else:
            # Incoming petition has no coordinates (shouldn't happen with map UI, but fallback).
            # Fallback to pure semantic match.
            is_duplicate = True
            logger.info(f"Duplicate found (no coords): {doc_id} (similarity={similarity:.4f})")

        if is_duplicate:
            duplicate_ids.append(doc_id)
            similarity_scores.append(similarity)

    return duplicate_ids, similarity_scores


def store_petition(
    petition_id: str,
    text: str,
    embedding: list[float],
    metadata: dict,
) -> None:
    """
    Upsert a petition into the ChromaDB collection.

    Call this AFTER the LLM analysis so that 'category' can be included in
    the metadata (enabling category-aware filtering in future search queries).

    Args:
        petition_id: Unique petition identifier.
        text:        Raw petition text (stored as the ChromaDB document).
        embedding:   Pre-computed embedding vector.
        metadata:    Arbitrary key-value metadata (title, location, category).
    """
    collection = get_collection()
    collection.upsert(
        ids=[petition_id],
        embeddings=[embedding],
        documents=[text],
        metadatas=[metadata],
    )
    logger.info(f"Petition {petition_id} stored in ChromaDB (metadata={metadata})")
