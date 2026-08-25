"""
services/rag_service.py

RAG (Retrieval-Augmented Generation) service for the InsightGov chatbot.

Phase 1: Returns empty context (no documents ingested yet).
Phase 2: Embed documents into ChromaDB 'insightgov_faq' collection and
         retrieve top-k relevant chunks at query time.

CRITICAL: This service uses a SEPARATE ChromaDB collection from the
          petition embedding pipeline. The 'insightgov_petitions' collection
          must NEVER be queried here. These two pipelines are completely isolated.
"""
from __future__ import annotations

import logging

from config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Collection name constants — never use petition collection here
# ---------------------------------------------------------------------------
FAQ_COLLECTION = "insightgov_faq"
DOCS_COLLECTION = "government_documents"
CIRCULARS_COLLECTION = "government_circulars"
POLICIES_COLLECTION = "government_policies"

# FORBIDDEN — do not reference this in this file:
# PETITION_COLLECTION = "insightgov_petitions"  <- petition pipeline only


class RAGService:
    """
    Retrieval-Augmented Generation service for the chatbot knowledge base.

    Phase 1 (current): All methods return empty results.
    Phase 2: Connect to ChromaDB FAQ collection and retrieve relevant chunks.

    To enable Phase 2:
      1. Install chromadb in requirements.txt.
      2. Run scripts/ingest_faq.py to populate the FAQ collection.
      3. Replace the stub methods below with real ChromaDB queries.
      4. Embed using nomic-embed-text via Ollama OR a dedicated embedding API.
    """

    def __init__(self) -> None:
        self._client = None
        self._faq_collection = None
        self._enabled = True
        
    def _init_chroma(self):
        if self._client is None:
            try:
                import chromadb
                from config import settings
                self._client = chromadb.PersistentClient(
                    path=str(settings.chroma_faq_path),
                    settings=chromadb.Settings(anonymized_telemetry=False)
                )
                self._faq_collection = self._client.get_or_create_collection(FAQ_COLLECTION)
                logger.info("RAGService initialized. Connected to ChromaDB FAQ collection.")
            except Exception as e:
                logger.error("Failed to initialize ChromaDB: %s", e)
                self._enabled = False

    async def retrieve_faq(self, query: str, top_k: int = 3) -> list[str]:
        """
        Retrieve the most relevant FAQ document chunks for a given query.

        Phase 1: Returns empty list (no-op).
        Phase 2: Embed query → query ChromaDB FAQ collection → return top-k chunks.
        """
        if not self._enabled:
            return []
        self._init_chroma()
        if not self._enabled or not self._faq_collection:
            return []

        import httpx
        try:
            print("[5] RAG retrieval started", flush=True)
            # Generate embedding using Ollama
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.ollama_base_url}/api/embeddings",
                    json={"model": "nomic-embed-text", "prompt": query},
                    timeout=30.0
                )
            response.raise_for_status()
            response_data = response.json()
            embedding = response_data.get("embedding")
            if not embedding:
                logger.error("Ollama response missing embedding")
                return []
            
            results = self._faq_collection.query(
                query_embeddings=[embedding],
                n_results=top_k,
                include=["documents"],
            )
            if results and results.get("documents") and results["documents"][0]:
                print("[6] RAG retrieval completed successfully", flush=True)
                return results["documents"][0]
            print("[6] RAG retrieval completed with no results", flush=True)
        except Exception as e:
            logger.error("RAG retrieval failed: %s", e)
        return []

    def retrieve_policy(self, query: str, top_k: int = 2) -> list[str]:
        """
        Retrieve relevant government policy document chunks.
        Phase 1: Returns empty list.
        """
        return []

    async def build_context_block(self, query: str) -> str:
        """
        Builds a context string to inject into the LLM system prompt.
        Returns empty string in Phase 1.

        Phase 2: Returns formatted chunks from FAQ and policy retrieval.
        """
        faq_chunks = await self.retrieve_faq(query)
        policy_chunks = self.retrieve_policy(query)

        all_chunks = faq_chunks + policy_chunks
        if not all_chunks:
            return ""

        joined = "\n\n---\n\n".join(all_chunks)
        return f"\n\n## Relevant Government Information\n\n{joined}\n"


# Singleton instance — no ChromaDB connection overhead in Phase 1
_rag_service: RAGService | None = None


def get_rag_service() -> RAGService:
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
