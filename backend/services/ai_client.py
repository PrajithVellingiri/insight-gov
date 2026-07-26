import logging
from typing import Any

import httpx

from config import settings

logger = logging.getLogger(__name__)

# Timeouts: AI analysis can take up to 120 s (3 LLM retries inside the AI service)
_ANALYZE_TIMEOUT = 150.0
_SEARCH_TIMEOUT = 30.0
_HEALTH_TIMEOUT = 5.0


class AIClient:
    """
    Async HTTP client that talks to the AI micro-service.

    The frontend never calls the AI service directly — all AI data flows
    through this client → backend → database → frontend.
    """

    def __init__(self) -> None:
        self._base_url = settings.ai_service_url.rstrip("/")

    async def health(self) -> dict[str, Any]:
        """Call GET /health on the AI service. Returns the raw response dict."""
        async with httpx.AsyncClient(timeout=_HEALTH_TIMEOUT) as client:
            response = await client.get(f"{self._base_url}/health")
            response.raise_for_status()
            return response.json()

    async def analyze(self, petition_id: str, title: str, description: str, location: str, submitted_by: str | None = None, latitude: float | None = None, longitude: float | None = None) -> dict[str, Any] | None:
        """
        POST /ai/analyze — run the full AI analysis pipeline on a petition.

        Returns the AnalysisResult dict on success, or None if the AI service
        is unreachable or returns an error (caller keeps petition as 'pending').
        """
        payload = {
            "id": petition_id,
            "title": title,
            "description": description,
            "location": location,
        }
        if submitted_by:
            payload["submitted_by"] = submitted_by
        if latitude is not None:
            payload["latitude"] = latitude
        if longitude is not None:
            payload["longitude"] = longitude

        try:
            async with httpx.AsyncClient(timeout=_ANALYZE_TIMEOUT) as client:
                response = await client.post(
                    f"{self._base_url}/ai/analyze", json=payload
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as exc:
            logger.error(
                "AI service returned %s for petition %s: %s",
                exc.response.status_code,
                petition_id,
                exc.response.text,
            )
            return None
        except httpx.RequestError as exc:
            logger.error(
                "AI service unreachable for petition %s: %s", petition_id, exc
            )
            return None

    async def search(self, query: str, top_k: int = 5) -> dict[str, Any]:
        """
        POST /ai/search — semantic search over stored petition embeddings.

        Returns the SearchResponse dict. On failure, returns empty results
        rather than raising so the officer dashboard degrades gracefully.
        """
        payload = {"query": query, "top_k": top_k}
        try:
            async with httpx.AsyncClient(timeout=_SEARCH_TIMEOUT) as client:
                response = await client.post(
                    f"{self._base_url}/ai/search", json=payload
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as exc:
            logger.error("AI search failed (%s): %s", exc.response.status_code, exc.response.text)
            return {"results": []}
        except httpx.RequestError as exc:
            logger.error("AI service unreachable during search: %s", exc)
            return {"results": []}
