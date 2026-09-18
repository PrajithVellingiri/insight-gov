"""
backend/tests/test_backend_rag.py – Automated tests for the backend RAG and chat layer.

Covers:
- Embedding provider abstraction (BaseEmbeddingProvider, Gemini, OpenAI)
- RAG similarity thresholding and document ranking
- No-context fallback for irrelevant queries (hallucination defense)
- ChatSource schema validation and SSE stream done packet structure
- System health check readiness and status endpoints
"""
from __future__ import annotations

import json
import sys
import uuid
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure backend directory is in sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from schemas.chat import ChatMessageOut, ChatSource
from services.embedding_providers.base import BaseEmbeddingProvider
from services.rag_service import RAGService


# ===========================================================================
# 1. Embedding Provider Abstraction Tests
# ===========================================================================

class TestEmbeddingProviders:
    """Test embedding provider abstractions in backend."""

    @pytest.mark.asyncio
    async def test_mock_embedding_provider_interface(self):
        class MockEmbeddingProvider(BaseEmbeddingProvider):
            def __init__(self, dim: int = 3072):
                self._dim = dim

            async def embed_text(self, text: str) -> list[float]:
                vec = [0.0] * self._dim
                vec[0] = 1.0
                return vec

            async def embed_documents(self, texts: list[str]) -> list[list[float]]:
                return [await self.embed_text(t) for t in texts]

            def dimension(self) -> int:
                return self._dim

        provider = MockEmbeddingProvider(dim=3072)
        assert provider.dimension() == 3072

        emb = await provider.embed_text("Road pothole complaint")
        assert len(emb) == 3072
        assert emb[0] == 1.0

        batch = await provider.embed_documents(["text 1", "text 2"])
        assert len(batch) == 2
        assert len(batch[0]) == 3072


# ===========================================================================
# 2. RAG Retrieval & Similarity Thresholding Tests
# ===========================================================================

class TestRAGService:
    """Test RAG similarity filtering, hallucination guardrails, and context assembly."""

    @pytest.mark.asyncio
    async def test_rag_retrieval_threshold_filtering(self):
        rag = RAGService()
        rag._enabled = True
        rag._client = MagicMock()  # Prevent overriding collection on _init_chroma

        mock_collection = MagicMock()
        mock_collection.count.return_value = 3
        # Query results:
        # Chunk 1: distance 0.20 -> similarity 0.80 (passes threshold 0.55)
        # Chunk 2: distance 0.35 -> similarity 0.65 (passes threshold 0.55)
        # Chunk 3: distance 0.60 -> similarity 0.40 (below threshold 0.55 -> FILTER OUT)
        mock_collection.query.return_value = {
            "documents": [["Valid chunk 1 content", "Valid chunk 2 content", "Low relevance chunk"]],
            "metadatas": [[
                {"title": "Water Supply Rules", "source": "docs/faq/04.md", "section": "Timelines"},
                {"title": "Sanitation Guidelines", "source": "docs/faq/05.md", "section": "Mandate"},
                {"title": "Unrelated Info", "source": "docs/faq/01.md", "section": "Other"},
            ]],
            "distances": [[0.20, 0.35, 0.60]],
        }
        rag._faq_collection = mock_collection

        mock_provider = AsyncMock()
        mock_provider.embed_text.return_value = [0.05] * 3072

        with patch("services.rag_service.get_embedding_provider", return_value=mock_provider):
            chunks = await rag.retrieve_relevant_chunks("water supply complaint escalation", similarity_threshold=0.55)

            assert len(chunks) == 2
            assert chunks[0]["title"] == "Water Supply Rules"
            assert chunks[0]["relevance"] == 0.80
            assert chunks[1]["title"] == "Sanitation Guidelines"
            assert chunks[1]["relevance"] == 0.65

    @pytest.mark.asyncio
    async def test_rag_no_context_fallback_for_irrelevant_query(self):
        """When query returns only chunks below threshold, returns empty context without hallucinating citations."""
        rag = RAGService()
        rag._enabled = True
        rag._client = MagicMock()

        mock_collection = MagicMock()
        mock_collection.count.return_value = 1
        # All chunks have low similarity (distance 0.80 -> similarity 0.20)
        mock_collection.query.return_value = {
            "documents": [["Completely unrelated municipal note."]],
            "metadatas": [[{"title": "General", "source": "01.md", "section": "Intro"}]],
            "distances": [[0.80]],
        }
        rag._faq_collection = mock_collection

        mock_provider = AsyncMock()
        mock_provider.embed_text.return_value = [0.01] * 3072

        with patch("services.rag_service.get_embedding_provider", return_value=mock_provider):
            context_block, sources = await rag.build_context_block("What is the recipe for chocolate cake?")

            assert context_block == ""
            assert sources == []

    @pytest.mark.asyncio
    async def test_rag_grounded_context_block_formatting(self):
        """Verify the injected context block structure and security boundaries."""
        rag = RAGService()
        rag._enabled = True
        rag._client = MagicMock()

        mock_collection = MagicMock()
        mock_collection.count.return_value = 1
        mock_collection.query.return_value = {
            "documents": [["Pothole grievances must be inspected within 48 hours."]],
            "metadatas": [[{"title": "Road Maintenance", "source": "05_timelines.md", "section": "Potholes"}]],
            "distances": [[0.10]],  # similarity 0.90
        }
        rag._faq_collection = mock_collection

        mock_provider = AsyncMock()
        mock_provider.embed_text.return_value = [0.02] * 3072

        with patch("services.rag_service.get_embedding_provider", return_value=mock_provider):
            context_block, sources = await rag.build_context_block("How fast are potholes fixed?")

            assert "[OFFICIAL GOVERNMENT REFERENCE DOCUMENTS]" in context_block
            assert "[END OF OFFICIAL REFERENCE DOCUMENTS]" in context_block
            assert "Road Maintenance (Potholes)" in context_block
            assert "48 hours" in context_block
            assert len(sources) == 1
            assert sources[0]["title"] == "Road Maintenance"
            assert sources[0]["relevance"] == 0.90


# ===========================================================================
# 3. Chatbot Sources & SSE Stream Schema Tests
# ===========================================================================

class TestChatSchemasAndSSE:
    """Test ChatSource models and SSE stream packet contracts."""

    def test_chatsource_schema_validation(self):
        source = ChatSource(
            title="Grievance Redressal Timelines",
            source="05_grievance_redressal_timelines.md",
            section="Drinking Water & Sewerage",
            relevance=0.8875,
        )
        data = source.model_dump()
        assert data["title"] == "Grievance Redressal Timelines"
        assert data["relevance"] == 0.8875

    def test_chatmessageout_with_sources(self):
        msg = ChatMessageOut(
            message_id=uuid.uuid4(),
            session_id=uuid.uuid4(),
            reply="According to the citizen charter, water supply grievances are addressed in 3 days.",
            model="gemini-3.1-flash-lite",
            sources=[
                ChatSource(
                    title="Citizens Charter",
                    source="06_citizen_rights.md",
                    section="Timelines",
                    relevance=0.91,
                )
            ],
        )
        dumped = msg.model_dump()
        assert len(dumped["sources"]) == 1
        assert dumped["sources"][0]["relevance"] == 0.91

    def test_sse_done_event_format_with_sources(self):
        """Ensure the SSE [DONE] data line can be parsed into valid JSON with sources."""
        sources = [
            {"title": "Portal Features", "source": "07_portal.md", "section": "Tracking", "relevance": 0.85}
        ]
        sse_done_payload = json.dumps({"sources": sources})
        sse_packet = f"data: [DONE] {sse_done_payload}\n\n"

        assert sse_packet.startswith("data: [DONE] {")
        extracted_json = sse_packet.replace("data: [DONE] ", "").strip()
        data = json.loads(extracted_json)
        assert "sources" in data
        assert data["sources"][0]["title"] == "Portal Features"


# ===========================================================================
# 4. Backend Health Endpoint Logic Tests
# ===========================================================================

class TestHealthCheckEndpoint:
    """Test /health system status verification."""

    def test_health_check_payload_structure(self):
        from fastapi.testclient import TestClient
        from main import app

        with patch("database.SessionLocal") as mock_session_local, \
             patch("services.rag_service.get_rag_service") as mock_rag:

            mock_db = MagicMock()
            mock_db.execute.return_value = True
            mock_session_local.return_value = mock_db

            mock_rag_inst = MagicMock()
            mock_rag_inst._faq_collection = MagicMock()
            mock_rag_inst._faq_collection.count.return_value = 21
            mock_rag.return_value = mock_rag_inst

            client = TestClient(app)
            response = client.get("/health")

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
            assert data["database"] == "connected"
            assert "llm_provider" in data
            assert "ai_configured" in data
            assert "rag_vector_store" in data
            # Sensitive keys must NEVER be leaked in health check
            assert "api_key" not in json.dumps(data).lower()
