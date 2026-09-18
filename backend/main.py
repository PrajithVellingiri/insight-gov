import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import settings
from routers import auth, petitions, dashboard, analytics, notifications, search, admin
from routers import chat as chat_router
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from limiter import limiter


app = FastAPI(
    title="InsightGov AI — Backend API",
    description=(
        "REST API for the InsightGov AI Decision Intelligence Platform. "
        "Handles authentication, petition management, AI service integration, "
        "analytics, and notifications."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# Rate Limiting
# ---------------------------------------------------------------------------
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
from routers import departments

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(departments.router, tags=["Departments"])
app.include_router(petitions.router, prefix="/petitions", tags=["Petitions"])
app.include_router(dashboard.router, tags=["Dashboard"])
app.include_router(analytics.router, tags=["Analytics"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
app.include_router(search.router, prefix="/ai", tags=["AI Search"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(chat_router.router, tags=["Chatbot"])


@app.get("/health", tags=["Health"])
async def health():
    """Operational health check: verifies backend, database, AI provider, and RAG vector store."""
    from database import SessionLocal
    from sqlalchemy import text

    db_status = "error"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_status = "connected"
    except Exception:
        db_status = "unreachable"

    # AI provider configuration check
    ai_ready = bool(settings.llm_api_key or settings.gemini_api_key or settings.llm_provider == "ollama")

    # ChromaDB FAQ RAG check
    rag_status = "unavailable"
    try:
        from services.rag_service import get_rag_service
        rag = get_rag_service()
        rag._init_chroma()
        if rag._faq_collection:
            rag_status = f"ok (documents={rag._faq_collection.count()})"
    except Exception:
        pass

    return {
        "status": "ok",
        "database": db_status,
        "llm_provider": settings.llm_provider,
        "ai_configured": "ready" if ai_ready else "missing_key",
        "rag_vector_store": rag_status,
    }


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host=settings.backend_host, port=settings.backend_port)
