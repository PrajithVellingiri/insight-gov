# InsightGov AI — Developer Handoff Document (v2)

## 1. Project Overview

**Project Name:** InsightGov AI  
**Objective:** A next-generation civic grievance portal for the Government of Tamil Nadu. It uses local AI to automatically categorize petitions, predict department routing, assign priority levels, and detect duplicate submissions, reducing the manual triage burden on government officers.  
**Problem Being Solved:** The current petition lifecycle is slow because every petition must be manually read, categorized, and assigned by a human. InsightGov automates this initial triage stage instantly. Additionally, citizens lacked an intuitive way to get help, which we solved by introducing an AI-powered conversational assistant.

**Architecture Overview:**  
- **Frontend:** React (Vite) + Tailwind CSS + React Query. Includes dashboards for Citizens, Officers, and Admins, plus a floating AI Chatbot widget.
- **Backend:** FastAPI (Python) serving a REST API. Uses SQLAlchemy with PostgreSQL. Contains rate-limiting (slowapi) and authentication (JWT).
- **AI Service:** A fully isolated FastAPI microservice on Port 8001 dedicated to petition analysis (Ollama + ChromaDB).
- **Database:** PostgreSQL (relational data) and ChromaDB (vector data for petition duplicates and FAQ RAG).
- **Chatbot:** Grok API driven conversational assistant with Provider Abstraction and RAG (Retrieval-Augmented Generation) capabilities.

**Repository Structure:**
- `/frontend`: React SPA
- `/backend`: Core FastAPI application
- `/ai`: Isolated AI Microservice for Petition Analysis

---

## 2. Current Development Status

**Completed:**
- Core petition submission, tracking, and dashboard workflows.
- JWT Authentication and Role-Based Access Control (RBAC).
- AI Petition Analysis Pipeline (Ollama + ChromaDB) — fully isolated and functional.
- Duplicate detection using vector similarity and Haversine distance.
- Advanced Analytics and Admin Dashboards (with UI-blended charts).
- Grok-powered Chatbot Module (Phase 1 & Phase 2 & Phase 3 RAG integration complete).
- Chatbot UI (Floating Widget, Chat Panel, Streaming Markdown, Real-time tokens).
- Rate Limiting (`slowapi`) implemented on backend chat endpoints.

**Partially Completed / Technical Debt:**
- Redis Integration: Currently, `slowapi` uses an in-memory store. In production, it should be wired to Redis.
- Background Tasks: `ai_client.py` uses `asyncio.create_task`. A robust message queue (Celery/Redis) is recommended for production petition processing.
- RAG Pipeline: FAQ knowledge base is ingested into a ChromaDB collection (`insightgov_faq`), but more complex government documents (PDFs, Circulars) will require advanced chunking and extraction strategies in Phase 4.

**Not Started:**
- Mobile App / React Native wrapper.
- Email/SMS notifications (currently only in-app notifications).

---

## 3. System Architecture

### Frontend (React + Vite)
The presentation layer. Uses React Query for data fetching and caching. Tailwind CSS is used for utility-first styling. Connects to the backend via standard REST and uses the native `fetch` API for Server-Sent Events (SSE) streaming during chatbot interactions.

### Backend (FastAPI - Port 8000)
The core application server. Handles routing, business logic, PostgreSQL database interactions, authentication, and orchestrates the Chatbot workflow (including `ChatService` and `RAGService`). Communicates with the AI Service via HTTP for petition analysis.

### AI Service (FastAPI - Port 8001)
A completely isolated service responsible *only* for petition triage. It uses Ollama to run local LLMs (like Llama 3) for categorization and summarization, and ChromaDB (`insightgov_petitions` collection) to detect duplicates.

### Database (PostgreSQL)
Stores persistent relational data: `users`, `petitions`, `departments`, `notifications`, `chat_sessions`, and `chat_messages`. Managed via Alembic migrations.

### Ollama (Local AI Engine)
Runs local LLMs for the petition triage pipeline. Ensures sensitive citizen data never leaves the government's on-premise infrastructure.

### ChromaDB (Vector Database)
Manages vector embeddings for similarity search. We maintain **two strictly isolated collections**:
1. `insightgov_petitions`: Managed by the AI Service for duplicate petition detection.
2. `insightgov_faq`: Managed by the Backend's `RAGService` for chatbot knowledge retrieval.

### Chatbot Architecture (Grok API)
- The chatbot uses the Grok API via a `ChatProvider` abstraction, meaning it can be swapped to OpenAI/Claude easily.
- It operates under strict security boundaries via `ChatTools` — it can *read* petition statuses and department info, but cannot modify anything or perform petition analysis.
- Supports streaming via SSE for a responsive user experience.

---

## 4. Folder Walkthrough

### `/frontend`
- **Purpose:** Citizen, Officer, and Admin UI.
- **Key Folders:**
  - `src/components/chatbot`: UI components for the Grok Chatbot (`ChatWidget.jsx`, `ChatPanel.jsx`, etc).
  - `src/pages`: Page components organized by role (`citizen`, `officer`, `admin`, `public`).
  - `src/api`: Axios wrappers for API communication.
  - `src/hooks`: Custom React hooks (`useChat.js` manages session and SSE streams).

### `/backend`
- **Purpose:** Core monolithic API.
- **Key Folders:**
  - `routers/`: API route definitions (e.g., `chat.py`, `petitions.py`).
  - `services/`: Business logic. Contains `chat_service.py` (orchestrates chatbot logic) and `rag_service.py` (ChromaDB FAQ retrieval).
  - `services/chat_providers/`: Provider abstraction layer (`grok.py`, `base.py`).
  - `models/`: SQLAlchemy ORM definitions (`chat_session.py`, `chat_message.py`).
  - `schemas/`: Pydantic models for request/response validation.
  - `docs/faq/`: Static markdown knowledge base ingested into the RAG pipeline.
  - `scripts/`: Utility scripts (e.g., `ingest_faq.py`).
  - `alembic/`: Database migrations.

### `/ai`
- **Purpose:** Isolated AI Analysis pipeline.
- **Responsibilities:** Categorization, department routing, duplication check.
- **How it connects:** The Core Backend sends a POST request to `/api/v1/analyze` whenever a petition is submitted. The AI service processes it locally and returns structured JSON.

---

## 5. Development Guide

### Running the App Locally

**1. Start PostgreSQL & ChromaDB**
Ensure PostgreSQL is running locally and the database `insightgov` exists.
(ChromaDB runs in-memory/local-file mode automatically).

**2. Start the Backend**
```bash
cd backend
python -m venv .venv
# Activate venv
pip install -r requirements.txt
alembic upgrade head
python seed.py # Optional: Seed test data
uvicorn main:app --reload --port 8000
```

**3. Start the AI Service**
Ensure Ollama is installed and running (`ollama run llama3`).
```bash
cd ai
python -m venv .venv
# Activate venv
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

**4. Start the Frontend**
```bash
cd frontend
npm install
npm run dev
```

### Ingesting Chatbot FAQs
To populate the Chatbot's RAG knowledge base:
```bash
cd backend
.venv\Scripts\python.exe -m scripts.ingest_faq
```

## 6. Important Notes for the Next Engineer

- **Architecture Freeze:** The AI Petition Analysis Pipeline (Ollama) is locked and isolated from the Chatbot (Grok). Do not mix them.
- **Provider Abstraction:** If you need to change the chatbot LLM from Grok to OpenAI, create a new `OpenAIProvider` in `backend/services/chat_providers/` and update `CHAT_PROVIDER` in `.env`. Do not modify the routers.
- **Streaming Restrictions:** Frontend `fetch` is used for the chatbot stream because native `EventSource` cannot send JSON payloads via POST.
- **Database Migrations:** If modifying `chat_session` or `chat_message`, generate a new Alembic migration using `alembic revision --autogenerate`.
