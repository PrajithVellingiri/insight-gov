# InsightGov AI — Deployment Guide

## Requirements

| Tool | Minimum Version | Purpose |
|------|----------------|---------|
| Python | 3.10+ | Backend + AI service |
| Node.js | 18+ | Frontend |
| Ollama | Latest | Local LLM inference |
| PostgreSQL | 14+ | Relational database |
| Git | Any | Source control |

---

## Clone Repository

```bash
git clone <repo-url>
cd InsightGov
```

---

## 1. Ollama Setup (start first)

```bash
# Install Ollama from https://ollama.com if not already installed
ollama serve

# In a new terminal — pull required models (one-time, takes several minutes)
ollama pull qwen3:8b
ollama pull nomic-embed-text
```

**Verify:** `GET http://localhost:11434` → should return 200

---

## 2. AI Service Setup

```bash
cd ai

# Create and activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Mac/Linux:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env if your Ollama port or model names differ from defaults

# Start the AI service
uvicorn main:app --reload --port 8001
```

**Verify:** `GET http://localhost:8001/health`

Expected response:
```json
{
  "status": "ok",
  "ollama": "reachable",
  "chromadb": "ok (documents=0)"
}
```

> ⚠ If `ollama` is `"unreachable"`, run `ollama serve` first and retry.

---

## 3. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Mac/Linux:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env — fill in DATABASE_URL and change SECRET_KEY
```

**Required `.env` values:**

```env
# Replace with your actual PostgreSQL credentials
DATABASE_URL=postgresql://postgres:password@localhost:5432/insightgov

# Change to a long, random secret (minimum 32 characters)
SECRET_KEY=your-very-long-secret-key-here

ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI service URL (keep as-is for local development)
AI_SERVICE_URL=http://localhost:8001

# CORS — add your frontend URL
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Create the database:**

```bash
# Using psql (or your PostgreSQL GUI):
psql -U postgres -c "CREATE DATABASE insightgov;"
```

**Run migrations:**

```bash
alembic upgrade head
```

**Start the backend:**

```bash
uvicorn main:app --reload --port 8000
```

**Verify:** Open `http://localhost:8000/docs` → Swagger UI should load all routes.

---

## 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
copy .env.example .env
# .env already contains: VITE_API_BASE_URL=http://localhost:8000

# Start development server
npm run dev
```

**Verify:** Open `http://localhost:5173` → Landing page should render.

---

## Startup Order (Summary)

```
1. Ollama         → ollama serve
2. AI Service     → uvicorn main:app --reload --port 8001   (from ai/)
3. Backend        → uvicorn main:app --reload --port 8000   (from backend/)
4. Frontend       → npm run dev                             (from frontend/)
```

---

## Health Checks

| Service | URL | Expected |
|---------|-----|---------|
| Ollama | http://localhost:11434 | 200 OK |
| AI Service | http://localhost:8001/health | `{"status":"ok","ollama":"reachable",...}` |
| Backend | http://localhost:8000/health | `{"status":"ok"}` |
| Backend API Docs | http://localhost:8000/docs | Swagger UI |
| Frontend | http://localhost:5173 | Landing page |

---

## First-Run Checklist

- [ ] Ollama running and models pulled
- [ ] AI service `.env` configured and service started
- [ ] PostgreSQL database `insightgov` created
- [ ] Backend `.env` configured with correct `DATABASE_URL` and strong `SECRET_KEY`
- [ ] `alembic upgrade head` ran successfully (all 6 tables created)
- [ ] Backend started and `/docs` loads
- [ ] Frontend started and landing page loads
- [ ] AI health check shows `"ollama": "reachable"` and `"chromadb": "ok"`
- [ ] Register a citizen → submit a petition → verify AI analysis appears

---

## Production Notes

| Topic | Recommendation |
|-------|---------------|
| HTTPS | Terminate TLS at Nginx or a cloud load balancer |
| CORS | Set `ALLOWED_ORIGINS` to the exact deployed frontend URL only |
| JWT Secret | Generate with `python -c "import secrets; print(secrets.token_hex(32))"` |
| PostgreSQL | Use a managed PostgreSQL instance (Supabase, RDS, etc.) |
| Backend workers | `uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4` |
| AI service workers | Use `--workers 1` only (ChromaDB singleton is not multi-worker safe) |
| Migrations | Run `alembic upgrade head` in the CI/CD pipeline before deploying the backend |
| Frontend build | `npm run build` then serve `dist/` as static files with 404→index.html fallback |
| Env variables (frontend) | Set `VITE_API_BASE_URL` to the production backend URL at build time |
| ChromaDB data | Back up the `ai/chroma_data/` directory regularly; deleting it loses duplicate detection history |