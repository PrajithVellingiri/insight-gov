from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import auth, petitions, dashboard, analytics, notifications, search

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
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(petitions.router, prefix="/petitions", tags=["Petitions"])
app.include_router(dashboard.router, tags=["Dashboard"])
app.include_router(analytics.router, tags=["Analytics"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
app.include_router(search.router, prefix="/ai", tags=["AI Search"])


@app.get("/health", tags=["Health"])
async def health():
    """Liveness probe — confirms the backend process is running."""
    return {"status": "ok"}
