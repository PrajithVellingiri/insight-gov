# InsightGov V2 Dependency Audit

This document outlines the resolved dependencies for all three components of the InsightGov V2 platform: Frontend, Backend, and AI Microservice.

## 1. Frontend Dependencies
The React frontend depends on a suite of modern web libraries managed via Vite and npm. All unused dependencies (e.g. Radix UI, class-variance-authority) have been pruned from the `package.json`.

**Runtime Dependencies:**
- `@tanstack/react-query` (State & Data Fetching)
- `axios` (HTTP Client)
- `react`, `react-dom`, `react-router-dom` (Core Framework & Routing)
- `recharts` (Analytics Dashboards)
- `leaflet`, `react-leaflet` (Map/Location Services)
- `i18next`, `react-i18next`, `i18next-browser-languagedetector` (Localization/Translation)
- `react-hot-toast` (Notifications)
- `lucide-react` (Icons)
- `react-markdown` (Chatbot rendering)
- `clsx`, `tailwind-merge` (Styling utilities)

**Build/Dev Dependencies:**
- `vite`, `@vitejs/plugin-react`
- `tailwindcss`, `postcss`, `autoprefixer`
- `oxlint`
- `@types/react`, `@types/react-dom`

## 2. Backend Dependencies
The Python backend uses FastAPI and SQLAlchemy for core orchestration. Dependencies are locked via `backend/requirements.txt`. Redis and Celery dependencies are intentionally excluded following the Phase 1 rollback.

**Runtime Packages:**
- `fastapi`, `uvicorn[standard]` (Web framework)
- `sqlalchemy`, `alembic`, `psycopg2-binary` (ORM and PostgreSQL driver)
- `pydantic`, `pydantic-settings` (Validation and Configuration)
- `python-jose[cryptography]`, `passlib[bcrypt]` (Authentication and JWT)
- `httpx`, `requests` (External API clients)
- `slowapi` (In-memory rate limiting)
- `chromadb` (Vector database for RAG/FAQ)
- `google-genai` (Chatbot LLM integration)
- `python-multipart` (Form data processing)
- `python-dotenv` (Environment configuration)

## 3. AI Microservice Dependencies
The Python AI microservice handles complex background reasoning and semantic embeddings via Ollama. Dependencies are locked via `ai/requirements.txt`.

**Runtime Packages:**
- `fastapi`, `uvicorn[standard]` (Microservice web framework)
- `httpx` (Asynchronous HTTP client for communicating with Ollama)
- `chromadb` (Vector database for semantic similarity)
- `asyncpg` (Asynchronous PostgreSQL driver for read-only analytics)
- `pydantic` (Data validation)
- `python-dotenv` (Environment configuration)

## 4. Required External Services
- **PostgreSQL**: Primary relational database.
- **Ollama**: Local/dedicated LLM inference engine.
- **Gemini API**: Cloud LLM API for chatbot and vision features.

## 5. Required Ollama Models
These models must be pulled locally into the Ollama instance for the AI service to function correctly. Do **not** install these via pip.
- `qwen3:8b` (General reasoning and analysis)
- `nomic-embed-text` (Vector embedding generation)

## 6. Required Environment Variables (Names Only)
Below are the environment variables expected by the system. Never commit actual values.

### Frontend
- `VITE_API_BASE_URL`

### Backend
- `DATABASE_URL`
- `SECRET_KEY`
- `ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `AI_SERVICE_URL`
- `OLLAMA_BASE_URL`
- `BACKEND_HOST`
- `BACKEND_PORT`
- `UPLOAD_DIR`
- `ALLOWED_ORIGINS`
- `GEMINI_API_KEY`
- `CHAT_PROVIDER`
- `CHAT_MODEL`
- `VISION_AI_PROVIDER`
- `VISION_AI_MODEL`
- `GROK_API_KEY`
- `GROK_API_BASE_URL`
- `CHAT_MAX_TOKENS`
- `CHAT_TEMPERATURE`
- `CHAT_CONTEXT_WINDOW`
- `CHAT_RATE_LIMIT_ANON`
- `CHAT_RATE_LIMIT_USER`
- `CHAT_SESSION_TTL_HOURS`
- `CHAT_STREAM_TIMEOUT`
- `CHAT_COMPRESSION_THRESHOLD`
- `CHROMA_FAQ_PATH`
- `PRIORITY_THRESHOLD_MEDIUM`
- `PRIORITY_THRESHOLD_HIGH`
- `PRIORITY_THRESHOLD_CRITICAL`
- `LOCATION_VERIFICATION_THRESHOLD_METERS`

### AI Microservice
- `OLLAMA_BASE_URL`
- `OLLAMA_LLM_MODEL`
- `OLLAMA_EMBED_MODEL`
- `CHROMA_PERSIST_DIR`
- `DUPLICATE_THRESHOLD`
- `AI_HOST`
- `AI_PORT`
- `DATABASE_URL`
