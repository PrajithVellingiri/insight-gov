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
    """Liveness probe — confirms the backend process is running."""
    return {"status": "ok"}


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host=settings.backend_host, port=settings.backend_port)
