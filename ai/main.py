"""
main.py – InsightGov AI Service entry point.

Starts a FastAPI application that exposes:
    POST /ai/analyze  – Full petition analysis
    POST /ai/search   – Semantic search
    GET  /health      – Liveness + dependency check

Run with:
    uvicorn main:app --reload --port 8001
"""

from contextlib import asynccontextmanager
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import AI_PORT, OLLAMA_BASE_URL
from routers import analyze, search
from utils.chroma_client import get_collection
from utils.logger import get_logger

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise ChromaDB collection on startup so the first request is fast."""
    logger.info("InsightGov AI Service starting up...")
    try:
        get_collection()
    except Exception as exc:
        logger.error(f"ChromaDB initialisation failed on startup: {exc}")
    yield

app = FastAPI(
    title="InsightGov AI Service",
    description=(
        "Cloud-ready AI micro-service for InsightGov. "
        "Provides petition analysis, duplicate detection, and semantic search "
        "using hosted LLM/Embedding providers (Gemini / OpenAI / Ollama fallback) and ChromaDB."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS – open for internal backend calls; restrict origins in production
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(analyze.router, tags=["Analysis"])
app.include_router(search.router, tags=["Search"])



# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get(
    "/health",
    summary="Health check",
    description="Verifies that the service is running and that AI providers and ChromaDB are operational.",
    tags=["Health"],
)
async def health_check() -> dict:
    """Return the operational status of the AI service and its dependencies without leaking secrets."""
    import config
    llm_provider = config.LLM_PROVIDER
    embed_provider = config.EMBEDDING_PROVIDER

    llm_configured = bool(config.LLM_API_KEY) or llm_provider == "ollama"
    embed_configured = bool(config.EMBEDDING_API_KEY) or embed_provider == "ollama"

    # Check ChromaDB
    chroma_status = "error"
    try:
        collection = get_collection()
        count = collection.count()
        chroma_status = f"ok (documents={count})"
    except Exception as exc:
        logger.error(f"Chroma health check failed: {exc}")

    semantic_ready = embed_configured and chroma_status.startswith("ok")

    return {
        "status": "ok",
        "llm_provider": llm_provider,
        "llm_ready": "ready" if llm_configured else "missing_key",
        "embedding_provider": embed_provider,
        "embedding_ready": "ready" if embed_configured else "missing_key",
        "chromadb": chroma_status,
        "semantic_search": "ready" if semantic_ready else "unavailable",
    }


# ---------------------------------------------------------------------------
# Development entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    from config import AI_HOST

    uvicorn.run("main:app", host=AI_HOST, port=AI_PORT, reload=True)
