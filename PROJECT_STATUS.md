# InsightGov AI — PROJECT_STATUS.md

> **Living Document** — Updated after every meaningful implementation.
> Last updated: **2026-08-09**
> Current phase: **Phase 01.5 Complete — Post-Implementation Verification, Regression Audit and Stabilization**

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [Current Workflow](#3-current-workflow)
4. [Database](#4-database)
5. [AI Architecture](#5-ai-architecture)
6. [APIs](#6-apis)
7. [Frontend](#7-frontend)
8. [Backend](#8-backend)
9. [Environment Variables](#9-environment-variables)
10. [Current Known Issues](#10-current-known-issues)
11. [Future Roadmap](#11-future-roadmap)
12. [Testing Status](#12-testing-status)
13. [Deployment Status](#13-deployment-status)
14. [Important Design Decisions](#14-important-design-decisions)
15. [Recovery Instructions](#15-recovery-instructions)

---

## 1. Project Overview

### Purpose
InsightGov is an AI-powered civic petition management system designed for Indian state governments (Tamil Nadu). It enables citizens to submit grievances online, routes them automatically to the correct government department using local AI, and provides officers with a dashboard to track and resolve petitions.

### Goals
- Reduce manual petition routing effort by 90%+ using AI
- Provide citizens with real-time petition tracking
- Detect duplicate petitions automatically to reduce redundancy
- Deliver transparent, explainable AI decisions to officers
- Provide a conversational AI chatbot for citizen self-service

### Current Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/Vite)                    │
│                     http://localhost:5173                    │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST + SSE via /api proxy
┌─────────────────────▼───────────────────────────────────────┐
│               BACKEND (FastAPI) — Port 8000                  │
│  Auth │ Petitions │ Admin │ Analytics │ Notifications        │
│  Chat (SSE streaming) │ Search │ Dashboard                   │
└──────────┬─────────────────────────┬────────────────────────┘
           │ Internal HTTP           │ Google Gemini API
┌──────────▼──────────┐   ┌─────────▼──────────────────────┐
│  AI SERVICE (FastAPI)│   │  Gemini API (google-genai SDK) │
│  Port 8001           │   │  gemini-2.5-flash              │
│  /ai/analyze         │   │  Chat · RAG · Streaming        │
│  /ai/search          │   └────────────────────────────────┘
└──────────┬──────────┘
           │
   ┌───────▼────────┐   ┌────────────────┐
   │  Ollama (local) │   │  ChromaDB      │
   │  qwen3:8b       │   │  ./chroma_data │
   │  nomic-embed    │   │  petition      │
   └────────────────┘   │  embeddings    │
                        └────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS, React Router v6 |
| Backend API | FastAPI, SQLAlchemy, Alembic, PostgreSQL |
| AI Service | FastAPI, Ollama (qwen3:8b), ChromaDB |
| Chatbot | Google Gemini API (`gemini-2.5-flash`), `google-genai` SDK |
| RAG (chatbot) | ChromaDB FAQ collection, Ollama embeddings |
| Auth | JWT (python-jose), bcrypt |
| Rate Limiting | SlowAPI |
| Database | PostgreSQL 15+ |
| Vector DB | ChromaDB 0.5.3 (petition embeddings + FAQ embeddings) |

### Folder Structure
```
InsightGov/
├── ai/                         # AI microservice (Ollama pipeline)
│   ├── config.py               # Env config (Ollama, ChromaDB settings)
│   ├── main.py                 # FastAPI app, port 8001
│   ├── department_mapping.json # 42 Tamil Nadu departments → category mapping
│   ├── prompts/analysis.md     # System prompt for LLM petition analysis
│   ├── routers/                # analyze.py, search.py
│   ├── schemas/                # analysis.py, petition.py
│   ├── services/               # analysis, duplicate, embedding, llm, search services
│   └── utils/                  # logger.py, chroma_client.py
│
├── backend/                    # Main backend API (FastAPI)
│   ├── main.py                 # App factory, CORS, router registration
│   ├── config.py               # Pydantic Settings (all env vars)
│   ├── database.py             # SQLAlchemy engine + session
│   ├── limiter.py              # SlowAPI rate limiter singleton
│   ├── seed.py                 # Database seeder with 42 departments + admin user
│   ├── alembic/                # DB migrations
│   ├── docs/faq/               # FAQ markdown files for RAG ingestion
│   ├── middleware/auth.py      # JWT decode + role enforcement
│   ├── models/                 # SQLAlchemy ORM models
│   ├── repositories/           # DB query layer
│   ├── routers/                # FastAPI route handlers
│   ├── schemas/                # Pydantic I/O schemas
│   ├── scripts/ingest_faq.py   # Script to load FAQ docs into ChromaDB
│   ├── services/               # Business logic layer
│   │   ├── ai_client.py        # HTTP client to AI microservice
│   │   ├── auth_service.py     # JWT + password hashing
│   │   ├── chat_service.py     # Chat orchestrator (sessions, history, RAG, tools)
│   │   ├── chat_tools.py       # Tool implementations (petition lookup, profile, etc.)
│   │   ├── rag_service.py      # ChromaDB FAQ retrieval (async)
│   │   ├── petition_service.py # Create petitions + trigger AI analysis
│   │   ├── analytics_service.py# Aggregate stats queries
│   │   ├── notification_service.py
│   │   └── chat_providers/     # Provider abstraction for LLM chatbot
│   │       ├── base.py         # Abstract ChatProvider interface
│   │       ├── __init__.py     # Provider factory (PROVIDER_REGISTRY)
│   │       ├── gemini.py       # GeminiProvider (PRIMARY)
│   │       └── grok.py         # GrokProvider (LEGACY - kept for fallback)
│   └── prompts/chatbot_system.md  # System prompt injected into Gemini chat
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── api/                # Axios API modules per domain
│   │   ├── components/         # Reusable UI components
│   │   ├── context/AuthContext.jsx
│   │   ├── hooks/              # Custom React hooks
│   │   ├── pages/              # Route-level page components
│   │   └── router/             # AppRouter, ProtectedRoute, PublicRoute
│   └── vite.config.js          # Vite + proxy config
│
├── PROJECT_HANDOFF.md
├── PROJECT_HANDOFF_v2.md
├── PROJECT_STATUS.md           # ← This file (living document)
└── README.md
```

---

## 2. Features

### Core Features

| Feature | Status | Description |
|---------|--------|-------------|
| Citizen Registration & Login | ✅ Complete | JWT auth, bcrypt passwords, citizen-only registration |
| Officer Management | ✅ Complete | Admin creates officers and assigns them to departments |
| Department Management | ✅ Complete | Admin manages the 42 Tamil Nadu departments |
| Petition Submission | ✅ Complete | Citizens submit with title, description, location, optional GPS coords |
| AI Petition Analysis | ✅ Complete | Auto-routes to department, predicts priority, detects duplicates |
| Petition Status Tracking | ✅ Complete | Citizens see real-time status + AI analysis results |
| Officer Dashboard | ✅ Complete | Officers see petitions for their department, can update status |
| Petition Review | ✅ Complete | Officers can add notes, change status (Under Review → Resolved/Rejected) |
| Semantic Search | ✅ Complete | Officers use vector search to find semantically similar petitions |
| Admin Dashboard | ✅ Complete | Analytics with charts (status, category, timeline breakdown) |
| Notifications | ✅ Complete | Real-time notification bell, mark-as-read |
| AI Chatbot (Gemini) | ✅ Complete | Streaming SSE chatbot powered by Gemini 2.5 Flash |
| RAG for Chatbot | ✅ Complete | ChromaDB FAQ collection retrieval (Ollama embeddings) |
| Tool Calling (chatbot) | ✅ Complete | Chatbot can look up citizen petitions, profile, notifications |
| Chat History | ✅ Complete | Persisted per session in PostgreSQL |
| Chat Feedback | ✅ Complete | Thumbs up/down on assistant messages |
| Chat Analytics | ✅ Complete | Token counts, latency, model tracking per message |
| Rate Limiting (chat) | ✅ Complete | SlowAPI: 20/hour anon, 100/hour authenticated |
| Interactive Map | ✅ Complete | GPS pin on petition submission + map visualization |
| AI Analysis Display | ✅ Complete | Confidence bar, explainability panel, priority badge, duplicate alert |
| Multilingual Support | ✅ Complete | i18next setup for EN, TA, HI, ML, TE, KN |
| Voice Input | ✅ Complete | Web Speech API integration in inputs via MicButton |
| Accessibility | ✅ Complete | CSS focus rings, High Contrast mode, Font size scaling, ARIA |
| User Settings | ✅ Complete | Settings modal to manage preferences (persisted in DB for users) |
| UI Redesign & Dark Mode | ✅ Complete | Semantic color system, native dark mode, glassmorphism UI, Skeleton loading states |

---

## 3. Current Workflow

### Citizen Workflow
1. Lands on `/` (LandingPage) — overview of InsightGov
2. Registers at `/register` (citizen account auto-assigned)
3. Logs in at `/login` → JWT stored in AuthContext
4. Citizen Dashboard `/citizen/dashboard` — sees all own petitions with statuses
5. Submits petition at `/citizen/petitions/new` — fills form, optionally pins location on map
6. Backend creates petition → triggers AI analysis (async HTTP to AI Service on port 8001)
7. AI returns: category, department, priority (1–5), summary, duplicate flag, explanation, confidence
8. Citizen views full analysis at `/citizen/petitions/:id`
9. Uses AI Chatbot (floating widget, always visible) to ask questions about petition status

### Officer Workflow
1. Admin creates officer account and assigns to department
2. Officer logs in → Officer Dashboard `/officer/dashboard`
3. Sees petitions filtered to their department (status: analysed/under_review)
4. Uses semantic search at `/officer/search` to find related issues
5. Opens petition at `/officer/petitions/:id` — reviews AI analysis panel
6. Changes status to "Under Review" → "Resolved" or "Rejected" with notes
7. Status change triggers notification to the citizen

### Admin Workflow
1. Admin logs in → Admin Dashboard `/admin/dashboard`
2. Views aggregate analytics: petitions by status, category, over time
3. Manages departments at `/admin/departments` (CRUD)
4. Creates/manages officers at `/admin/officers` (create, assign department, delete)

### AI Petition Analysis Pipeline
```
Citizen submits petition
    ↓
Backend: PetitionService.create_petition()
    ↓
Backend: AIClient.analyze() → POST http://localhost:8001/ai/analyze
    ↓
AI Service: AnalysisService.analyze()
    ├─ 1. EmbeddingService.embed(title) → Ollama nomic-embed-text → 768-dim vector
    ├─ 2. DuplicateService.find_duplicates() → ChromaDB cosine similarity
    │       + geographic proximity check (200m threshold)
    ├─ 3. LLMService.generate_json() → Ollama qwen3:8b
    │       System: analysis.md prompt
    │       User:   "Title: ... Description: ... Location: ..."
    │       Format: JSON {category, priority, summary, explanation, confidence}
    ├─ 4. Department resolved from department_mapping.json (deterministic)
    └─ 5. Embedding stored in ChromaDB "petitions" collection
    ↓
AI returns AnalysisResult JSON to Backend
    ↓
Backend: Saves AIAnalysis to PostgreSQL
    ↓
Backend: Updates petition status → "analysed", sets department_id
    ↓
Citizen sees result on PetitionStatus page
```

### AI Chatbot Pipeline
```
User types message in ChatWidget
    ↓
Frontend: useChat hook → POST /api/chat/message/stream (SSE)
    ↓
Backend Router (chat.py): Validates, rate-limits, calls ChatService
    ↓
ChatService.stream_message():
    ├─ 1. Load session + last N messages from DB
    ├─ 2. ChatTools: detect intent → run tool (petition lookup / profile / notifications)
    ├─ 3. RAGService.build_context_block() [async] → ChromaDB FAQ retrieval via Ollama embeddings
    ├─ 4. Build enriched system prompt (base + RAG context + tool result)
    └─ 5. GeminiProvider.stream_chat() → Gemini API SSE stream
    ↓
Backend: Yields SSE events: data: {"token": "..."} / data: {"done": true, "message_id": "..."}
    ↓
Frontend: useChat hook reads SSE stream → renders tokens progressively
    ↓
Assistant message saved to DB with token_count, latency_ms, llm_model
```

---

## 4. Database

### Tables

| Table | Description |
|-------|-------------|
| `users` | All users: citizens, officers, admins |
| `departments` | 42 Tamil Nadu government departments with unique TNxxx codes |
| `petitions` | Submitted petitions with status, location, GPS coords |
| `ai_analyses` | AI output per petition (category, priority, summary, duplicates) |
| `petition_history` | Audit log of status changes with officer notes |
| `notifications` | Per-user notification messages |
| `chat_sessions` | Chat conversation threads (nullable user_id for anonymous) |
| `chat_messages` | Individual messages with role, content, token_count, feedback |

### Key Relationships
```
users ──< petitions (submitted_by)
users ──< petitions (officer_id)  
departments ──< petitions
departments ──< users (officers)
petitions ── ai_analyses (1:1)
petitions ──< petition_history
users ──< notifications
chat_sessions ──< chat_messages
users ──< chat_sessions (nullable)
```

### Petition Status Values
`pending` → `analysed` → `under_review` → `resolved` | `rejected`

### Migrations (Alembic — `/backend/alembic/versions/`)
| File | Description |
|------|-------------|
| `001_initial_schema.py` | Users, departments, petitions, notifications, petition_history |
| `0003_chat_tables.py` | chat_sessions, chat_messages tables |
| `12ea3f09fc2b_add_latitude_and_longitude...` | Added lat/lng float columns to petitions |
| `24c4f0c75b03_rename_model_used_to_llm_model` | Renamed column in chat_messages |

### Seed Data (`backend/seed.py`)
- 1 admin user (`admin@insightgov.in` / configurable password)
- 42 Tamil Nadu government departments
- Run: `python seed.py` in backend venv

### Vector Store (ChromaDB — 2 separate instances)
| Instance | Location | Collection | Purpose |
|----------|----------|------------|---------|
| AI Service | `ai/chroma_data/` | `petitions` | Petition embeddings for duplicate detection + semantic search |
| Backend/RAG | `backend/chroma_faq_db/` | `insightgov_faq` | FAQ embeddings for chatbot RAG |

---

## 5. AI Architecture

### Dual AI Pipeline (Independent, Never Mixed)

```
┌──────────────────────────────────────────────────────────┐
│  PETITION ANALYSIS PIPELINE (LOCAL AI — NEVER TOUCHES    │
│  GEMINI)                                                  │
│                                                           │
│  Ollama (qwen3:8b) + ChromaDB + nomic-embed-text         │
│  AI Service Port 8001                                     │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  CHATBOT PIPELINE (CLOUD AI — NEVER TOUCHES OLLAMA)       │
│                                                           │
│  Google Gemini 2.5 Flash + ChromaDB FAQ + RAG            │
│  Backend Port 8000 /chat/* endpoints                      │
└──────────────────────────────────────────────────────────┘
```

### Ollama Implementation (AI Service)
- **LLM Model**: `qwen3:8b` (via `llm_service.py`)
- **Embedding Model**: `nomic-embed-text` (via `embedding_service.py`)
- **Endpoint**: `POST http://localhost:11434/api/generate` (JSON mode enforced)
- **Embedding Endpoint**: `POST http://localhost:11434/api/embeddings`
- **Retry**: 3 attempts with `httpx`, 120s timeout per attempt
- **Output**: Forced JSON `{category, priority, summary, explanation, confidence}`

### Gemini Implementation (Chatbot)
- **Provider**: `GeminiProvider` in `backend/services/chat_providers/gemini.py`
- **SDK**: `google-genai` v2.16.0 (official Google SDK, not deprecated `google-generativeai`)
- **Model**: `gemini-2.5-flash` (configurable via `CHAT_MODEL`)
- **Interface**: `client.aio.chats.create()` → `chat.send_message_stream()` (async)
- **System Prompt**: Loaded from `backend/prompts/chatbot_system.md`
- **History**: Last `CHAT_CONTEXT_WINDOW` (default: 10) messages injected as history
- **Error Handling**: Yields `[ERROR:auth]`, `[ERROR:timeout]`, `[ERROR:unavailable]` sentinel tokens

### Provider Abstraction (`backend/services/chat_providers/`)
```python
# base.py — abstract interface
class ChatProvider(ABC):
    async def chat(messages, system_prompt, max_tokens, temperature) -> ChatResponse
    async def stream_chat(messages, ...) -> AsyncGenerator[str, None]
    property model_name -> str

# PROVIDER_REGISTRY in __init__.py
{
    "gemini": GeminiProvider,   # PRIMARY
    "grok":   GrokProvider,     # LEGACY / FALLBACK
}
# Selected by CHAT_PROVIDER env var
```

### RAG Pipeline (Chatbot Only)
- **Service**: `backend/services/rag_service.py` (`RAGService`)
- **Collection**: `insightgov_faq` in `backend/chroma_faq_db/`
- **Embedding**: Ollama `nomic-embed-text` via async `httpx` (non-blocking)
- **Ingest Script**: `backend/scripts/ingest_faq.py` reads `backend/docs/faq/*.md`
- **Retrieval**: Top-3 FAQ chunks by cosine similarity injected into system prompt
- **Status**: Phase 1 (retrieve_faq enabled) — `retrieve_policy` returns empty list

### ChromaDB (Petition Embeddings)
- **Collection**: `petitions` in `ai/chroma_data/`
- **Embed model**: `nomic-embed-text` (768-dim)
- **Stored metadata**: `{petition_id, category, latitude, longitude, submitted_at}`
- **Duplicate threshold**: cosine similarity > 0.85 AND geographic distance < 200m

### Tool Calling (Chatbot)
Defined in `backend/services/chat_tools.py` (`ChatTools`):

| Tool | Method | Description |
|------|--------|-------------|
| `petition_status` | `get_petition_status()` | Look up citizen's petition by title keyword |
| `user_profile` | `get_user_profile()` | Return safe read-only user profile |
| `notifications` | `get_notification_summary()` | Return unread count + recent 5 |
| `faq` | `get_faq_context()` | Return static FAQ text for topic |

### SSE Streaming Format
```
data: {"token": "Hello"}
data: {"token": " there!"}
data: {"done": true, "message_id": "uuid-here"}
data: {"error": "auth", "done": true}   ← on 401/403 from Gemini
```

---

## 6. APIs

### Base URL: `http://localhost:8000`

### Auth (`/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Register new citizen account |
| POST | `/auth/login` | Public | Login → JWT token |
| GET | `/auth/me` | JWT | Get current user profile |

### Petitions (`/petitions`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/petitions` | Citizen | Submit new petition (triggers AI analysis) |
| GET | `/petitions/my` | Citizen | List own petitions |
| GET | `/petitions` | Officer+ | List all petitions (filterable) |
| GET | `/petitions/{id}` | Citizen/Officer | Get single petition + analysis |
| PATCH | `/petitions/{id}/status` | Officer+ | Update petition status + notes |
| GET | `/petitions/{id}/history` | Officer+ | Get petition audit history |

### Admin (`/admin`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/departments` | Admin | List all departments |
| POST | `/admin/departments` | Admin | Create department |
| PATCH | `/admin/departments/{id}` | Admin | Update department |
| DELETE | `/admin/departments/{id}` | Admin | Delete department |
| GET | `/admin/officers` | Admin | List all officers |
| POST | `/admin/officers` | Admin | Create officer + assign department |
| PATCH | `/admin/officers/{id}` | Admin | Update officer |
| DELETE | `/admin/officers/{id}` | Admin | Delete officer |

### Notifications (`/notifications`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications` | JWT | Get user's notifications |
| PATCH | `/notifications/{id}/read` | JWT | Mark notification as read |

### Analytics (`/analytics`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/analytics` | Admin | Full analytics breakdown |

### Dashboard (`/dashboard`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard` | Officer+ | Officer dashboard stats |

### Search (`/search`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/search` | Officer+ | Semantic search via AI service |

### Chat (`/chat`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/chat/sessions` | Optional JWT | Create/get active chat session |
| POST | `/chat/message/stream` | Optional JWT | Send message → SSE stream |
| GET | `/chat/history` | Optional JWT | Get chat message history |
| POST | `/chat/feedback/{message_id}` | Optional JWT | Submit feedback (helpful/not_helpful) |
| GET | `/chat/analytics` | Admin | Chat usage analytics |

### AI Service (`http://localhost:8001`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/ai/analyze` | Full petition analysis pipeline |
| POST | `/ai/search` | Semantic vector search |
| GET | `/health` | Health check (Ollama + ChromaDB liveness) |

---

## 7. Frontend

### Tech Stack
React 18 + Vite + TailwindCSS + React Router v6 + Axios + react-markdown

### Routing (`src/router/AppRouter.jsx`)

| Path | Component | Role |
|------|-----------|------|
| `/` | `LandingPage` | Public |
| `/login` | `LoginPage` | Public |
| `/register` | `RegisterPage` | Public |
| `/citizen/dashboard` | `CitizenDashboard` | Citizen |
| `/citizen/petitions/new` | `SubmitPetition` | Citizen |
| `/citizen/petitions/:id` | `PetitionStatus` | Citizen |
| `/officer/dashboard` | `OfficerDashboard` | Officer |
| `/officer/search` | `SemanticSearch` | Officer |
| `/officer/petitions/:id` | `PetitionReview` | Officer |
| `/admin/dashboard` | `AdminDashboard` | Admin |
| `/admin/departments` | `DepartmentManagement` | Admin |
| `/admin/officers` | `OfficerManagement` | Admin |
| `*` | Redirect to `/` | — |

Route protection handled by `ProtectedRoute.jsx` (role-based) and `PublicRoute.jsx` (redirects if already logged in).

### Pages

| Page | Path | Description |
|------|------|-------------|
| `LandingPage.jsx` | `pages/public/` | Hero, features overview, CTA |
| `LoginPage.jsx` | `pages/public/` | Email/password login form |
| `RegisterPage.jsx` | `pages/public/` | Citizen registration form |
| `CitizenDashboard.jsx` | `pages/citizen/` | List own petitions, status cards |
| `SubmitPetition.jsx` | `pages/citizen/` | Petition form with map picker |
| `PetitionStatus.jsx` | `pages/citizen/` | Full petition detail + AI analysis panel |
| `OfficerDashboard.jsx` | `pages/officer/` | Department petition list, filters |
| `SemanticSearch.jsx` | `pages/officer/` | Vector search UI |
| `PetitionReview.jsx` | `pages/officer/` | Full review + status update |
| `AdminDashboard.jsx` | `pages/admin/` | Analytics charts |
| `DepartmentManagement.jsx` | `pages/admin/` | Department CRUD |
| `OfficerManagement.jsx` | `pages/admin/` | Officer CRUD |

### Components

**Layout (`components/layout/`)**
| Component | Description |
|-----------|-------------|
| `Navbar.jsx` | Top nav bar with user info, logout |
| `Sidebar.jsx` | Role-based sidebar navigation |
| `PageWrapper.jsx` | Layout shell: Sidebar + Navbar + main content area |

**Chatbot (`components/chatbot/`)**
| Component | Description |
|-----------|-------------|
| `ChatWidget.jsx` | Floating chat button/panel toggle, always visible |
| `ChatPanel.jsx` | Main chat UI container |
| `ChatMessageList.jsx` | Scrollable message history |
| `ChatBubble.jsx` | Individual message bubble (user/assistant) + feedback buttons |
| `ChatInput.jsx` | Message input + send button |

**AI (`components/ai/`)**
| Component | Description |
|-----------|-------------|
| `AIAnalysisPanel.jsx` | Full AI result display (category, department, summary) |
| `ConfidenceBar.jsx` | Visual confidence percentage bar |
| `DuplicateAlert.jsx` | Duplicate detection warning with linked petition |
| `ExplainabilityPanel.jsx` | AI explanation text display |
| `PriorityBadge.jsx` | Color-coded priority label (1-5) |

**Charts (`components/charts/`)**
| Component | Description |
|-----------|-------------|
| `PetitionsByCategory.jsx` | Bar chart: petitions per AI category |
| `PetitionsByStatus.jsx` | Pie/donut chart: status distribution |
| `PetitionsOverTime.jsx` | Line chart: submission volume over time |

**Map (`components/map/`)**
| Component | Description |
|-----------|-------------|
| `PetitionMap.jsx` | Leaflet map for GPS pin + visualization |

**Petition (`components/petition/`)**
| Component | Description |
|-----------|-------------|
| `PetitionCard.jsx` | Summary card for dashboard listing |
| `PetitionForm.jsx` | Reusable petition submission form |
| `PetitionTable.jsx` | Officer table view of petitions |
| `StatusTimeline.jsx` | Visual timeline of petition history |

### Hooks (`src/hooks/`)
| Hook | Description |
|------|-------------|
| `useAuth.js` | Auth state, login/logout, token management |
| `useChat.js` | Chat session management, SSE streaming, message state |
| `useNotifications.js` | Poll and manage notifications |
| `usePetitions.js` | Petition CRUD, status filter state |

### Context (`src/context/`)
| Context | Description |
|---------|-------------|
| `AuthContext.jsx` | Global auth state provider (user, token, role) |

### API Layer (`src/api/`)
| Module | Description |
|--------|-------------|
| `axiosInstance.js` | Axios base instance with JWT interceptor |
| `auth.api.js` | login, register, me |
| `petitions.api.js` | CRUD, my-petitions, status update |
| `admin.api.js` | Department + officer management |
| `analytics.api.js` | GET /analytics |
| `dashboard.api.js` | GET /dashboard |
| `notifications.api.js` | list, mark-read |
| `chat.api.js` | createSession, streamChatMessage (SSE fetch), getHistory, submitFeedback |

---

## 8. Backend

### Entry Point (`backend/main.py`)
- Creates FastAPI app with CORS middleware (from `ALLOWED_ORIGINS`)
- Registers SlowAPI rate limiter error handler
- Mounts routers: auth, petitions, admin, notifications, analytics, dashboard, search, chat

### Middleware (`backend/middleware/auth.py`)
- `get_current_user()` — Decodes JWT, returns User object
- `require_officer()` — Requires officer or admin role
- `require_admin()` — Requires admin role only

### Services (`backend/services/`)
| Service | Description |
|---------|-------------|
| `auth_service.py` | `hash_password()`, `create_access_token()`, `decode_token()` |
| `petition_service.py` | `create_petition()` — saves to DB, calls AI service, updates department |
| `ai_client.py` | `analyze()`, `search()`, `health()` — HTTP client to AI Service |
| `chat_service.py` | Full chatbot orchestrator — session management, tool calling, RAG, streaming |
| `chat_tools.py` | `ChatTools` — petition lookup, profile, notifications, FAQ tool handlers |
| `rag_service.py` | `RAGService` — async FAQ retrieval from ChromaDB |
| `analytics_service.py` | Aggregate analytics queries |
| `notification_service.py` | Get and mark-read notifications |

### Repositories (`backend/repositories/`)
| Repository | Model | Key Methods |
|------------|-------|-------------|
| `user_repo.py` | `User` | `get_by_email`, `get_by_id`, `create` |
| `petition_repo.py` | `Petition` | `get_by_user`, `get_all`, `get_by_id`, `update_status` |
| `department_repo.py` | `Department` | `get_all`, `get_by_name`, `create` |
| `ai_analysis_repo.py` | `AIAnalysis` | `create`, `get_by_petition` |
| `notification_repo.py` | `Notification` | `create`, `get_for_user`, `mark_read` |
| `petition_history_repo.py` | `PetitionHistory` | `create`, `get_by_petition` |

### Models (`backend/models/`)
| Model | Table | Key Columns |
|-------|-------|-------------|
| `User` | `users` | id, name, email, hashed_password, role, department_id |
| `Department` | `departments` | id, name, short_name |
| `Petition` | `petitions` | id, title, description, location, lat, lng, status, submitted_by, department_id, officer_id, is_duplicate |
| `AIAnalysis` | `ai_analyses` | id, petition_id, category, department_name, priority, summary, explanation, confidence, duplicate_ids |
| `PetitionHistory` | `petition_history` | id, petition_id, officer_id, old_status, new_status, notes |
| `Notification` | `notifications` | id, user_id, message, is_read |
| `ChatSession` | `chat_sessions` | id, user_id (nullable), is_active, last_active_at |
| `ChatMessage` | `chat_messages` | id, session_id, role, content, token_count, llm_model, latency_ms, feedback |

---

## 9. Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `SECRET_KEY` | JWT signing key (keep secret!) | Required |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime | `1440` (24h) |
| `AI_SERVICE_URL` | AI microservice base URL | Required (no fallback) |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | Required (no fallback) |
| `BACKEND_HOST` | FastAPI binding IP | `0.0.0.0` |
| `BACKEND_PORT` | FastAPI binding port | `8000` |
| `OLLAMA_BASE_URL` | Ollama API endpoint for RAG | Required (no fallback) |
| `UPLOAD_DIR` | Server image storage relative directory | `uploads` |
| `GEMINI_API_KEY` | Google AI Studio API key (**required for chatbot**) | `""` |
| `CHAT_PROVIDER` | Active chat provider | `gemini` |
| `CHAT_MODEL` | Gemini model name | `gemini-2.5-flash` |
| `CHAT_MAX_TOKENS` | Max output tokens per response | `800` |
| `CHAT_TEMPERATURE` | LLM temperature | `0.7` |
| `CHAT_CONTEXT_WINDOW` | Conversation turns to keep in history | `10` |
| `CHAT_RATE_LIMIT_ANON` | Anonymous messages per hour | `20` |
| `CHAT_RATE_LIMIT_USER` | Authenticated messages per hour | `100` |
| `CHAT_SESSION_TTL_HOURS` | Session expiry | `24` |
| `CHAT_STREAM_TIMEOUT` | SSE stream timeout (seconds) | `60` |
| `CHAT_COMPRESSION_THRESHOLD` | Turns before history compression | `20` |
| `CHROMA_FAQ_PATH` | Path to FAQ ChromaDB | `./chroma_faq_db` |
| `GROK_API_KEY` | Grok legacy key (optional fallback) | `""` |
| `GROK_API_BASE_URL` | Grok API base URL (legacy) | `https://api.x.ai/v1` |

### AI Service (`ai/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `OLLAMA_BASE_URL` | Ollama server URL | Required (no fallback) |
| `AI_HOST` | AI service interface binding | `0.0.0.0` |
| `OLLAMA_LLM_MODEL` | LLM model for analysis | `qwen3:8b` |
| `OLLAMA_EMBED_MODEL` | Embedding model | `nomic-embed-text` |
| `CHROMA_PERSIST_DIR` | ChromaDB data directory | `./chroma_data` |
| `DUPLICATE_THRESHOLD` | Similarity threshold for duplicate detection | `0.85` |
| `AI_PORT` | AI service port | `8001` |

---

## 10. Current Known Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| Chatbot requires Gemini API key | High | `GEMINI_API_KEY` must be set in `backend/.env` — chatbot returns `[ERROR:auth]` without it |
| ChromaDB telemetry logs | Low | Harmless `Failed to send telemetry event` warnings in backend logs (telemetry disabled in RAGService, may still appear from AI service) |
| RAG retrieve_policy empty | Low | `retrieve_policy()` in `rag_service.py` returns empty list (Phase 1 placeholder) |
| Polling frequency | Low | Frontend polling intervals (`GET /petitions/my`, `/notifications`) generate verbose logs |

---

## 11. Future Roadmap

Ordered by priority:

1. **Set GEMINI_API_KEY** — Get from [Google AI Studio](https://aistudio.google.com/app/apikey) and paste into `backend/.env`
2. **FAQ RAG ingestion** — Run `python scripts/ingest_faq.py` to load `docs/faq/*.md` into ChromaDB FAQ collection
3. **Policy document RAG** — Implement `retrieve_policy()` in `rag_service.py` (currently returns empty)
4. **Chat history compression** — Implement summarization when context exceeds `CHAT_COMPRESSION_THRESHOLD` turns
5. **Chatbot tool: department info** — Add tool to answer "which department handles water?"
6. **WebSocket notifications** — Replace polling with WebSocket push for real-time notifications
7. **Officer mobile view** — Responsive design improvements for officer dashboard
8. **Petition bulk operations** — Allow officers to batch-update petition statuses
9. **AI confidence calibration** — Track confidence scores vs. officer overrides to improve prompts
10. **Production deployment** — Docker Compose, nginx reverse proxy, SSL, environment separation
11. **AI Service health monitoring** — Dashboard indicator showing Ollama/ChromaDB status

---

## 12. Testing Status

| Feature | Tested | Method |
|---------|--------|--------|
| Backend startup | ✅ | Manual — uvicorn starts cleanly |
| AI Service startup | ✅ | Manual — uvicorn starts cleanly on port 8001 |
| Citizen registration/login | ✅ | Manual via frontend |
| Petition submission + AI analysis | ✅ | Manual — AI pipeline verified with 11 sample petitions in ChromaDB |
| Officer dashboard | ✅ | Manual via frontend |
| Admin department/officer management | ✅ | Manual via frontend |
| Chat session creation | ✅ | Manual + Python test script |
| Chat SSE streaming (mock) | ✅ | Python test script — mock provider |
| Chat SSE streaming (Gemini) | ⚠️ | Requires GEMINI_API_KEY — infrastructure verified, live test pending |
| RAG retrieval | ✅ | Verified in backend logs ([5] [6] stage markers) |
| Tool calling (petition lookup) | ✅ | Manual — intent detection verified |
| Feedback submission | ✅ | Manual — fixed 422 for temporary IDs |
| Semantic search | ✅ | Manual via officer search page |
| Notifications | ✅ | Manual — mark-read verified |
| Analytics | ✅ | Manual via admin dashboard |
| Rate limiting | ✅ | SlowAPI configured, not load-tested |
| Duplicate detection | ✅ | Verified with ChromaDB containing 11 petitions |

---

## 13. Deployment Status

**Current:** Local development only

| Service | Run Command | Port |
|---------|-------------|------|
| Frontend | `npm run dev` (in `frontend/`) | 5173 |
| Backend | `.venv\Scripts\python.exe -m uvicorn main:app` (in `backend/`) | 8000 |
| AI Service | `.venv\Scripts\python.exe -m uvicorn main:app --port 8001` (in `ai/`) | 8001 |
| Ollama | `ollama serve` | 11434 |

**Production:** Not yet configured (Docker, nginx, SSL pending)

---

## 14. Important Design Decisions

### Why two separate AI pipelines?
**Petition analysis** must be fully local (Ollama) for data sovereignty, cost, and offline resilience. **Chatbot** uses Gemini because it requires conversational intelligence and the citizen-facing chatbot doesn't process sensitive petition content in depth.

### Why the ChatProvider abstraction?
Allows swapping the chatbot LLM vendor (Grok → Gemini → Claude) without touching any router, service, or frontend code. Only `chat_providers/` changes.

### Why ChromaDB 0.5.3 (pinned)?
Newer versions (0.6+) broke the Python bindings API (`RustBindingsAPI` error). 0.5.3 is the last stable version compatible with this Python/platform combination.

### Why SSE instead of WebSockets for chat?
SSE is simpler, stateless (HTTP), works through any reverse proxy/CDN, and is sufficient for unidirectional token streaming. WebSockets were not needed.

### Why SlowAPI for rate limiting?
FastAPI-native integration with minimal config. IP-based limiting is sufficient for the current deployment scope.

### Why async RAG retrieval?
`rag_service.py` originally used synchronous `requests.post()` inside an `async` generator, which blocked the entire FastAPI event loop. Refactored to `httpx.AsyncClient` to prevent the chatbot from hanging.

### Why department_mapping.json over LLM?
Department routing is deterministic — mapping a category string to a fixed department list is 100% reliable, fast, and auditable. The LLM predicts the category; the mapping converts it to a department. This separation avoids hallucinated department names.

---

## 15. Recovery Instructions

### To resume development immediately:

**1. Prerequisites:**
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Ollama installed and running (`ollama serve`)
- Ollama models pulled: `ollama pull qwen3:8b && ollama pull nomic-embed-text`

**2. Database setup:**
```bash
psql -U postgres -c "CREATE DATABASE insightgov;"
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
python seed.py
```

**3. Set environment variables:**
```bash
# backend/.env — fill in:
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/insightgov
SECRET_KEY=<random-64-char-string>
GEMINI_API_KEY=<your-google-ai-studio-key>
```

**4. Start all services:**
```bash
# Terminal 1 — AI Service
cd ai && .venv\Scripts\python.exe -m uvicorn main:app --port 8001

# Terminal 2 — Backend
cd backend && .venv\Scripts\python.exe -m uvicorn main:app

# Terminal 3 — Frontend
cd frontend && npm install && npm run dev
```

**5. Login:**
- Admin: email set in `seed.py`, password set in `seed.py`
- Register citizens at `http://localhost:5173/register`

**6. To enable chatbot:**
- Get Gemini API key from https://aistudio.google.com/app/apikey
- Set `GEMINI_API_KEY=AIza...` in `backend/.env`
- Restart backend

**7. Key files to read first if resuming:**
1. `backend/services/chat_service.py` — chatbot orchestration
2. `backend/services/chat_providers/gemini.py` — Gemini integration
3. `ai/services/analysis_service.py` — petition AI pipeline
4. `backend/routers/chat.py` — SSE streaming endpoint
