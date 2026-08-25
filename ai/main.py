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
        "Local AI micro-service for InsightGov. "
        "Provides petition analysis, duplicate detection, and semantic search "
        "using Ollama (Qwen3 + nomic-embed-text) and ChromaDB."
    ),
    version="1.0.0",
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
    description="Verifies that the service is running and that Ollama and ChromaDB are reachable.",
    tags=["Health"],
)
async def health_check() -> dict:
    """Return the operational status of the AI service and its dependencies."""

    text_model_status = "missing"
    embedding_model_status = "missing"
    ollama_status = "unreachable"

    try:
        from config import OLLAMA_LLM_MODEL, OLLAMA_EMBED_MODEL
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                ollama_status = "reachable"
                models = resp.json().get("models", [])
                model_names = [m.get("name") for m in models]
                
                # Check for exact matches or matches without the tag if default is 'latest'
                def has_model(target: str) -> bool:
                    if target in model_names:
                        return True
                    if ":" not in target and f"{target}:latest" in model_names:
                        return True
                    return False

                if has_model(OLLAMA_LLM_MODEL):
                    text_model_status = "ready"
                if has_model(OLLAMA_EMBED_MODEL):
                    embedding_model_status = "ready"
    except Exception:
        pass

    # Check ChromaDB
    chroma_status = "error"
    try:
        collection = get_collection()
        count = collection.count()
        chroma_status = f"ok (documents={count})"
    except Exception:
        pass

    return {
        "status": "ok",
        "ollama": ollama_status,
        "text_model": text_model_status,
        "embedding_model": embedding_model_status,
        "chromadb": chroma_status,
        "semantic_search": "ready" if embedding_model_status == "ready" and chroma_status.startswith("ok") else "unavailable"
    }


# ---------------------------------------------------------------------------
# Development entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    from config import AI_HOST

    uvicorn.run("main:app", host=AI_HOST, port=AI_PORT, reload=True)
