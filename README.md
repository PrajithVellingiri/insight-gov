# InsightGov AI 🏛️🤖

InsightGov AI is an intelligent, production-grade civic petition and grievance redressal platform designed to streamline communication between citizens and state government departments.

Powered by a cloud-deployable AI architecture (Google Gemini, OpenAI, or local Ollama dev fallback) and Vector Search (ChromaDB), InsightGov automatically categorizes, prioritizes, and routes citizen complaints to the correct department, detects geospatial duplicates, and empowers citizens through a grounded, RAG-augmented chatbot.

---

## ✨ Key Features

- **Cloud-Ready AI Triage:** Petitions are analyzed by hosted foundation models (default: Google Gemini `gemini-3.1-flash-lite`) via structured JSON schema enforcement, producing categories, priorities, executive summaries, and structured explainability.
- **Deterministic Department Routing:** AI predictions are deterministically mapped to official database departments (42+ verified state departments with fallback to the *Mudalvarin Mugavari Department*), preventing LLM hallucination and routing failures.
- **Geospatial Duplicate Detection:** Employs a strict two-factor duplication check: cosine similarity ($\ge 0.85$) combined with a **200-meter Haversine radius**. Similar petitions in different neighborhoods are never incorrectly flagged as duplicates.
- **Officer Semantic Search:** Municipal officers can search historical grievance records using natural language queries powered by high-dimensional hosted embeddings (`gemini-embedding-001`, 3072 dimensions).
- **Grounded Chatbot with RAG:** Citizens can interact with a multi-turn assistant that retrieves official state policies and timelines from a dedicated ChromaDB FAQ vector store (`insightgov_faq`), streams responses via Server-Sent Events (SSE), and renders collapsible, verified source citations in the UI.
- **Role-Based Workspaces:**
  - **Citizens:** Submit map-based petitions with photo evidence, verify geolocation integrity, and track resolution timelines live.
  - **Officers:** Review departmental petition queues, inspect AI reasoning blocks, verify geospatial integrity, override routings, and update grievance statuses.
  - **Admins:** System-wide analytics, department performance distribution, grievance heatmaps, and officer account management.

---

## 🏗️ Architecture

InsightGov utilizes a decoupled 3-tier microservice architecture:

```
                      ┌──────────────────────────────────────┐
                      │        Frontend (React 18 + Vite)     │
                      │  Tailwind CSS • Leaflet • i18n • SSE  │
                      └──────────────────┬───────────────────┘
                                         │ HTTP / SSE
                                         ▼
                      ┌──────────────────────────────────────┐
                      │         Core Backend (FastAPI)       │
                      │   PostgreSQL • SQLAlchemy • Alembic  │
                      │   JWT Auth • RBAC • SSE Chat Stream  │
                      └───────┬──────────────────────┬───────┘
                              │                      │
             Internal HTTP API│                      │ Vector Retrieval
                              ▼                      ▼
┌──────────────────────────────────────┐   ┌──────────────────────────────────┐
│          AI Microservice             │   │    ChromaDB FAQ Knowledge Base   │
│   Petition Analysis & Geospatial     │   │   Collection: 'insightgov_faq'   │
│   ChromaDB Collection: 'petitions'   │   │   7 Departmental Reference Docs  │
│   Gemini 3.1 Flash / Embeddings-001  │   │   Similarity Threshold: 0.55     │
└──────────────────────────────────────┘   └──────────────────────────────────┘
```

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, React Leaflet, TanStack Query, React Router v6.
- **Core Backend:** Python 3.10+, FastAPI, SQLAlchemy, PostgreSQL, Alembic, ChromaDB, SSE.
- **AI Microservice:** Python 3.10+, FastAPI, HTTPX, ChromaDB, Google GenAI SDK.
- **Supported AI Providers:**
  - **Primary / Production:** Google Gemini (`gemini-3.1-flash-lite`, `gemini-embedding-001`).
  - **Alternative Hosted:** OpenAI (`gpt-4o-mini`, `text-embedding-3-small`).
  - **Offline Local Dev:** Ollama (`llama3`, `nomic-embed-text`).

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js (v18+)
- PostgreSQL database
- Google Gemini API key (or OpenAI API key)

---

### 1. Database & Core Backend Setup

1. Create a PostgreSQL database named `insightgov`.
2. Configure the backend environment:
   ```bash
   cd backend
   cp .env.example .env
   ```
   Edit `.env` to set your `DATABASE_URL`, `SECRET_KEY`, and `LLM_API_KEY` / `GEMINI_API_KEY`.

3. Install dependencies and run database migrations:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   alembic upgrade head
   python seed.py  # Seeds admin user and 42 state departments
   ```

4. Ingest Official FAQ & Civic Knowledge Base into ChromaDB:
   ```bash
   python scripts/ingest_faq.py
   ```
   *Indexes 21 markdown chunks across 7 policy documents into the `insightgov_faq` collection.*

5. Start the backend:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

---

### 2. AI Microservice Setup

1. In a new terminal, configure the AI service:
   ```bash
   cd ai
   cp .env.example .env
   ```
   Set `LLM_API_KEY` and `EMBEDDING_API_KEY` in `ai/.env`.

2. Install dependencies and start the microservice:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8001
   ```

---

### 3. Frontend Setup

1. In a third terminal, configure and launch the UI:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Open `http://localhost:5173` in your browser.

---

## 🧪 Automated Testing

Both microservices feature comprehensive automated unit and integration suites:

```bash
# Run backend RAG, chat, and health tests:
pytest backend/tests/ -v

# Run AI service JSON parsing, duplicate detection, and semantic search tests:
pytest ai/tests/ -v
```

---

## ☁️ Production Deployment & Storage Guide

### Containerization & Services
- **Backend Service:** Deploy to container hosts (e.g., Render, Railway, AWS ECS, Google Cloud Run) with `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- **AI Microservice:** Deploy independently or alongside the backend. Ensure internal networking allows backend to resolve `AI_SERVICE_URL`.

### Persistent Storage Strategy
1. **ChromaDB Vector Stores:**
   - **`insightgov_faq`:** Can be ingested automatically on container startup or build via `python scripts/ingest_faq.py`, or persisted to a mounted volume (`CHROMA_FAQ_PATH=/data/chroma_faq_db`).
   - **`petitions` (AI service):** Mount persistent block storage (`CHROMA_PERSIST_DIR=/data/chroma_data`) to prevent losing petition vector indices across container restarts.
2. **Image Uploads (`UPLOAD_DIR`):**
   - In production, set `UPLOAD_DIR` to a mounted persistent volume (e.g., `/data/uploads`), or configure an object storage adapter (AWS S3, Cloudflare R2, or Supabase Storage).

---

## 🔐 Health & Readiness Monitoring

Inspect system readiness at runtime:
- Core Backend: `GET http://localhost:8000/health`
  - Returns database connection status, AI readiness, and FAQ knowledge base vector count.
- AI Microservice: `GET http://localhost:8001/health`
  - Returns provider status, ChromaDB petition collection status, and semantic search readiness.

---

## 📄 License
This project is open-source and available under the MIT License.
