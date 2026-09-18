"""
ai/tests/test_ai_service.py – Comprehensive automated tests for InsightGov AI microservice.

Covers:
1. LLM JSON extraction & resilience (clean, markdown-fenced, dirty chat prefix/suffix, syntax error).
2. AnalysisResult schema & Explanation explainability block validation.
3. Haversine distance accuracy & 200m geospatial duplicate petition filtering.
4. Self-petition duplicate exclusion and similarity threshold enforcement.
5. Officer semantic search similarity ranking.
6. AI microservice health check verification.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure ai directory is in sys.path
AI_DIR = Path(__file__).resolve().parent.parent
if str(AI_DIR) not in sys.path:
    sys.path.insert(0, str(AI_DIR))

from schemas.analysis import AnalysisResult, Explanation
from services.duplicate_service import find_duplicates, haversine_distance
from services.llm_service import _extract_json
from services.search_service import search


# ===========================================================================
# 1. LLM JSON Parsing & Resilience
# ===========================================================================

class TestLLMJSONExtraction:
    """Test resilient JSON extraction and schema parsing from LLM outputs."""

    def test_extract_clean_json(self):
        raw = '{"category": "Infrastructure", "department": "Public Works Department", "priority": "high"}'
        parsed = _extract_json(raw)
        assert parsed["category"] == "Infrastructure"
        assert parsed["department"] == "Public Works Department"
        assert parsed["priority"] == "high"

    def test_extract_markdown_fenced_json(self):
        raw = """```json
{
  "category": "Sanitation",
  "department": "Department of Municipal Administration and Water Supply",
  "priority": "medium",
  "confidence": 0.88
}
```"""
        parsed = _extract_json(raw)
        assert parsed["category"] == "Sanitation"
        assert parsed["confidence"] == 0.88

    def test_extract_json_with_surrounding_conversational_chatter(self):
        raw = """Here is the structured grievance analysis requested:
{
  "category": "Revenue & Land",
  "department": "Revenue and Disaster Management Department",
  "priority": "critical",
  "summary": "Boundary dispute regarding ancestral patta.",
  "confidence": 0.95
}
Hope this analysis satisfies the municipal service guidelines!"""
        parsed = _extract_json(raw)
        assert parsed["category"] == "Revenue & Land"
        assert parsed["priority"] == "critical"
        assert "patta" in parsed["summary"]

    def test_extract_invalid_json_raises_value_error(self):
        raw = "I am sorry, but I cannot classify this petition."
        with pytest.raises(ValueError, match="No valid JSON object could be extracted"):
            _extract_json(raw)


# ===========================================================================
# 2. Schema Validation & Explainability Block
# ===========================================================================

class TestAnalysisSchemas:
    """Test AnalysisResult schema compliance and explainability."""

    def test_valid_analysis_result(self):
        data = {
            "petition_id": "test-uuid-001",
            "category": "Infrastructure",
            "department": "Public Works Department",
            "priority": "high",
            "summary": "Streetlights non-functional on MG Road for 3 weeks.",
            "duplicate_ids": [],
            "similarity_scores": [],
            "explanation": {
                "category_reason": "Streetlights are municipal road infrastructure.",
                "priority_reason": "Prolonged darkness poses safety hazards.",
                "department_reason": "PWD handles urban lighting infrastructure.",
            },
            "confidence": 0.92,
            "analyzed_at": "2026-09-18T10:00:00Z",
        }
        res = AnalysisResult.model_validate(data)
        assert res.petition_id == "test-uuid-001"
        assert res.explanation.category_reason.startswith("Streetlights")
        assert res.confidence == 0.92


# ===========================================================================
# 3. Geospatial & Duplicate Detection Logic
# ===========================================================================

class TestDuplicateDetectionAndHaversine:
    """Test Haversine distance and geospatial duplicate filtering."""

    def test_haversine_same_point(self):
        dist = haversine_distance(13.0827, 80.2707, 13.0827, 80.2707)
        assert dist == 0.0

    def test_haversine_known_distance(self):
        # Chennai Central (13.0827, 80.2757) to Ripon Building (13.0818, 80.2728) ~320-350m
        dist = haversine_distance(13.0827, 80.2757, 13.0818, 80.2728)
        assert 300 <= dist <= 380

    def test_haversine_short_distance_under_200m(self):
        # ~111m offset
        dist = haversine_distance(13.0827, 80.2707, 13.0837, 80.2707)
        assert 100 <= dist <= 120

    @pytest.mark.asyncio
    async def test_duplicate_filtering_within_200m(self):
        mock_collection = MagicMock()
        mock_collection.count.return_value = 3

        # Return 3 mock matches:
        # 1. Nearby (dist ~111m), high similarity (0.92) -> SHOULD BE FLAGGED
        # 2. Far away (dist ~1360m), high similarity (0.95) -> MUST BE IGNORED
        # 3. Nearby, but low similarity (0.60) -> MUST BE IGNORED (threshold 0.85)
        mock_collection.query.return_value = {
            "ids": [["dup-nearby", "dup-far", "dup-lowsim"]],
            "distances": [[0.08, 0.05, 0.40]],  # similarities: 0.92, 0.95, 0.60
            "metadatas": [[
                {"latitude": 13.0837, "longitude": 80.2707},  # ~111m away
                {"latitude": 13.0950, "longitude": 80.2707},  # ~1360m away
                {"latitude": 13.0828, "longitude": 80.2707},  # ~11m away
            ]],
        }

        with patch("services.duplicate_service.get_collection", return_value=mock_collection):
            dup_ids, scores = await find_duplicates(
                petition_id="current-pet-123",
                embedding=[0.1] * 128,
                latitude=13.0827,
                longitude=80.2707,
            )

            assert dup_ids == ["dup-nearby"]
            assert len(scores) == 1
            assert scores[0] == 0.92

    @pytest.mark.asyncio
    async def test_duplicate_excludes_self_id(self):
        mock_collection = MagicMock()
        mock_collection.count.return_value = 1
        mock_collection.query.return_value = {
            "ids": [["current-pet-123"]],
            "distances": [[0.0]],  # exact identical match
            "metadatas": [[{"latitude": 13.0827, "longitude": 80.2707}]],
        }

        with patch("services.duplicate_service.get_collection", return_value=mock_collection):
            dup_ids, scores = await find_duplicates(
                petition_id="current-pet-123",
                embedding=[0.1] * 128,
                latitude=13.0827,
                longitude=80.2707,
            )
            assert dup_ids == []
            assert scores == []


# ===========================================================================
# 4. Officer Semantic Search Tests
# ===========================================================================

class TestSemanticSearch:
    """Test ChromaDB semantic search ranking for municipal officers."""

    @pytest.mark.asyncio
    async def test_search_petitions_ranking(self):
        mock_collection = MagicMock()
        mock_collection.count.return_value = 2
        mock_collection.query.return_value = {
            "ids": [["pet-1", "pet-2"]],
            "distances": [[0.15, 0.35]],  # similarities 0.85 and 0.65
            "documents": [["Broken streetlight on 1st avenue", "Drainage overflow on main road"]],
            "metadatas": [[
                {"title": "Streetlight Broken", "category": "Infrastructure"},
                {"title": "Drain Block", "category": "Sanitation"},
            ]],
        }

        with patch("services.search_service.get_collection", return_value=mock_collection), \
             patch("services.search_service.embedding_service.embed", new_callable=AsyncMock) as mock_embed:

            mock_embed.return_value = [0.1] * 128

            search_response = await search("streetlight outage", top_k=5)
            results = search_response.results

            assert len(results) == 2
            assert results[0].petition_id == "pet-1"
            assert results[0].score == 0.85
            assert results[0].title == "Streetlight Broken"
            assert results[1].petition_id == "pet-2"
            assert results[1].score == 0.65


# ===========================================================================
# 5. AI Microservice Health Endpoint
# ===========================================================================

class TestAIHealthCheck:
    """Test AI microservice /health status."""

    def test_ai_health_endpoint(self):
        from fastapi.testclient import TestClient
        from main import app

        with patch("utils.chroma_client.get_collection") as mock_col:
            mock_col_inst = MagicMock()
            mock_col_inst.count.return_value = 5
            mock_col.return_value = mock_col_inst

            client = TestClient(app)
            response = client.get("/health")

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
            assert "llm_provider" in data
            assert "embedding_provider" in data
            assert "chromadb" in data
            assert "semantic_search" in data
