# INSIGHTGOV CURRENT STATE

This document describes the actual implemented current state of the InsightGov project as of the present moment. It is generated through direct inspection of the source code, configurations, database models, API routes, frontend components, and AI services. 

## 1. PROJECT OVERVIEW
- **Project Name**: InsightGov
- **Purpose**: A modern civic engagement SaaS platform allowing citizens to report issues (petitions) and enabling government officers and administrators to efficiently manage and resolve them.
- **Current Architecture**: A decoupled monolithic backend structure utilizing a React frontend, a FastAPI core backend, and an independent FastAPI AI microservice for LLM and vector processing.
- **Major Subsystems**: 
  - Frontend SPA (React)
  - Core Backend API (FastAPI)
  - AI Microservice (FastAPI, Ollama, ChromaDB)
- **Current Deployment Model**: Local development environment. No cloud deployment or containerization is currently implemented.
- **Current Runtime Structure**: Requires running a Vite dev server (port 5173), Core Backend Uvicorn server (port 8000), AI Service Uvicorn server (port 8001), local PostgreSQL instance, and a local Ollama service.

**High-Level Flow**:
Citizen → Frontend (Web) → Backend API → AI Service (Classification/Duplication check via Ollama/ChromaDB) → Database (PostgreSQL) → Officer Dashboard (Assignment) → Officer Action (Resolution proof upload) → Backend API → Citizen (Notification).

## 2. CURRENT TECHNOLOGY STACK

### Frontend
- **Framework**: React 18
- **Language**: JavaScript/JSX
- **Build Tool**: Vite
- **CSS Framework**: Tailwind CSS (Vanilla CSS variables for theming)
- **Routing**: React Router DOM (v6)
- **State Management**: React Context (for Auth), React Query (`@tanstack/react-query` for data fetching/caching)
- **HTTP Client**: Axios
- **UI/Component Libraries**: Lucide React (icons), React Leaflet (maps)
- **Voice Input**: Native browser Web Speech API (SpeechRecognition)
- **Internationalization**: `react-i18next`

### Backend
- **Framework**: FastAPI (v0.111.0)
- **Language**: Python 3.11+
- **ORM**: SQLAlchemy 2.0
- **Validation**: Pydantic v2
- **Authentication**: Passlib (Bcrypt) for hashing, python-jose for JWT creation/validation
- **API Architecture**: RESTful with specific endpoint modularization via APIRouter.
- **Middleware**: CORSMiddleware, SlowAPI (rate limiting)
- **File Handling**: FastAPI `UploadFile`, saving binary chunks directly to the local filesystem using unique UUID filenames.
- **Streaming**: Native Server-Sent Events (SSE) via FastAPI `StreamingResponse` for Chatbot.

### Database
- **Database Engine**: PostgreSQL
- **Driver**: psycopg2-binary
- **Migration System**: Alembic
- **Major Models**: User, Department, Petition, PetitionImage, PetitionHistory, AIAnalysis, Notification.

### AI
- **AI Service Framework**: FastAPI (separated from core backend)
- **Local Models**: Ollama (`qwen3:8b` for generation, `nomic-embed-text` for embeddings)
- **Cloud Models**: Google Gemini API (`gemini-3.1-flash-lite`) used strictly for the citizen chatbot.
- **Vector Database**: ChromaDB
- **Usage**:
  - **Duplicate Detection**: Cosine similarity against embeddings in ChromaDB.
  - **Classification**: Zero-shot or few-shot inference against departments dynamically loaded from DB.
  - **Chatbot**: Real-time generative answers via Gemini.

### Infrastructure
- **Local Services**: PostgreSQL (5432), Backend (8000), AI Service (8001), Frontend (5173), Ollama (11434).
- **Environment Configuration**: Standard `.env` files parsed using Pydantic `BaseSettings`.

## 3. COMPLETE DIRECTORY STRUCTURE

```text
InsightGov/
├── backend/
│   ├── alembic/              # Database migration logic and version files
│   ├── middleware/           # Auth and Rate limiting middleware
│   ├── models/               # SQLAlchemy ORM model definitions
│   ├── repositories/         # Database access layer (CRUD methods)
│   ├── routers/              # FastAPI endpoint controllers
│   ├── schemas/              # Pydantic validation schemas
│   ├── services/             # Core business logic
│   ├── config.py             # Pydantic Settings implementation
│   ├── database.py           # Engine and session initialization
│   ├── main.py               # Application entry point
│   └── seed.py               # Database population script
├── frontend/
│   ├── src/
│   │   ├── api/              # Axios instance configuration and HTTP clients
│   │   ├── components/       # Reusable UI components (ai, chatbot, map, petition, ui)
│   │   ├── context/          # React contexts (AuthContext)
│   │   ├── hooks/            # Custom React hooks (useAuth, useSpeechRecognition)
│   │   ├── pages/            # Role-based view components (admin, citizen, officer, public)
│   │   ├── router/           # Route definitions and ProtectedRoute wrapper
│   │   ├── main.jsx          # React DOM entry
│   │   └── index.css         # Global CSS and Tailwind directives/theme tokens
│   ├── .env                  # Frontend environment variables
│   └── tailwind.config.js    # Tailwind configuration
├── ai/
│   ├── routers/              # AI service endpoints
│   ├── services/             # Ollama and ChromaDB interaction logic
│   ├── main.py               # AI FastAPI entry point
│   └── .env                  # AI environment configuration
└── INSIGHTGOV_CURRENT_STATE.md # This document
```

## 4. FRONTEND ARCHITECTURE
- **Entry Point**: `main.jsx` wraps the application in `AuthProvider`, `QueryClientProvider`, and a `BrowserRouter`.
- **Routing**: Implemented in `AppRouter.jsx`. Uses a `ProtectedRoute` component to check user roles against the authenticated JWT context before allowing access to dashboard routes.
- **State Management**: Data mutations and retrieval are handled primarily by `@tanstack/react-query`, abstracting loading states and caching. Global session state is handled by `AuthContext`. Local UI state is handled by native `useState` and `useReducer`.
- **Theme System**: Implemented entirely via CSS variables (e.g., `--background`, `--card`) in `index.css`. Tailwind classes reference these variables using HSL formats (e.g., `bg-background`).
- **Translation System**: Uses `react-i18next`. Currently supports English, Hindi, and Tamil on the frontend.
- **Communication**: Frontend communicates to the Core Backend via an Axios instance using `import.meta.env.VITE_API_BASE_URL`. JWT tokens are passed via the `Authorization: Bearer <token>` header. Image retrieval passes the token via a `?token=` query parameter.

## 5. USER ROLES
Three distinct roles are fully implemented:
- **Citizen**: Can log in, submit petitions, view own petitions, view notifications, chat with Gemini bot, and withdraw petitions. Forced to `citizen` routes.
- **Officer**: Assigned to exactly one department. Can log in, view the petition queue for their department, update petition status, transfer petitions to other departments, resolve petitions by uploading images, and perform semantic search across petitions.
- **Admin**: Can log in, manage (CRUD) users, officers, and departments. Can view all petitions system-wide and view aggregated analytics.

## 6. CITIZEN SYSTEM
- **Implemented Features**:
  - Registration / Login
  - Citizen Dashboard (list of submitted petitions)
  - Petition Submission (Title, Description, Category, Location string, Map Pin Lat/Lng, up to 5 Image Uploads, Voice-to-Text input).
  - Petition Detail View (includes timeline, AI reasoning, and officer resolution images).
  - Withdrawal action (if the petition is not yet processed).
  - Notifications list.
  - Chatbot (Gemini-powered).
- **Petition Submission Fields**:
  - `title` -> string -> `petitions.title`
  - `description` -> text -> `petitions.description`
  - `location` -> string -> `petitions.location`
  - `latitude`/`longitude` -> float -> `petitions.latitude`, `petitions.longitude`

## 7. OFFICER SYSTEM
- **Implemented Features**:
  - Officer Dashboard: Shows critical stats and the petition queue for their specific department. The UI was recently refined to remove redundant department columns.
  - Petition Details: Full view of a citizen's petition including AI-assigned priority and confidence.
  - Processing: Can change status from `analysed` to `under_review`.
  - Resolution: Can resolve an issue by providing a text note and uploading a "resolution proof" image.
  - Transfer: Can assign the petition to a different department ID.
  - Semantic Search: Can search past petitions using natural language.

## 8. ADMIN SYSTEM
- **Implemented Features**:
  - Global Dashboard with aggregate statistics.
  - User Management: Lists all citizens.
  - Officer Management: Can create officers and assign them to departments.
  - Department Management: Can create and edit departments (name, code, description).
  - System-wide petition viewer.

## 9. PETITION DATA MODEL
**Lifecycle**: Pending → AI Analysis → Analysed (assigned to Dept) → Under Review (by Officer) → Resolved / Rejected. A Citizen can force it to 'Withdrawn' before review.
**Petition Model (PostgreSQL)**:
- `id` (UUID, Primary Key)
- `petition_number` (String, Unique, generated sequentially via Postgres `SEQUENCE`, e.g., 'IG-PET-000001')
- `title` (String), `description` (Text), `location` (String), `latitude` (Float), `longitude` (Float)
- `status` (String)
- `submitted_by` (UUID, FK to users)
- `department_id` (UUID, FK to departments)
- `officer_id` (UUID, FK to users)
- `created_at`, `updated_at` (DateTime)

## 10. DATABASE ARCHITECTURE
- **User**: FK `department_id` (if officer).
- **Department**: Has many Users(officers), has many Petitions.
- **Petition**: Has one User(submitter), has one User(officer), has one Department, has many PetitionImages, has many PetitionHistory logs.
- **AIAnalysis**: 1-to-1 with Petition (holds category, priority, duplicate flags).
- **Notification**: Belongs to User.

## 11. API ARCHITECTURE
Major routers implemented in FastAPI:
- `auth`: `/auth/register`, `/auth/login` (JWT generation)
- `users`: `/users/me`, `/users/officers`
- `petitions`: `/petitions` (POST with multipart/form-data), `/petitions/my`, `/petitions/{id}`
- `departments`: `/departments` (CRUD)
- `notifications`: `/notifications`, `/notifications/read`
- `chat`: `/chat/stream` (Gemini SSE streaming)
- `ai`: Handled internally via HTTP calls to port 8001.

## 12. API DATA FLOW (EXAMPLE)
**Petition Submission**:
Citizen React form submits multipart payload (Axios) → Core Backend `POST /petitions` → `PetitionService` extracts files and JSON data → Saves files to local disk → Saves `Petition` to Postgres → Makes HTTP call to AI Service `POST /analyze` → AI Service returns routing JSON → Core Backend saves `AIAnalysis` to Postgres → Returns response to Frontend.

## 13. AI ARCHITECTURE
**A. Petition AI Analysis (Routing/Classification)**
- Provider: Local Ollama (`qwen3:8b`).
- Execution: Called via HTTP from Core Backend.
- Behavior: Reads petition text, fetches dynamic department descriptions from Postgres, outputs strict JSON.

**B. Duplicate Detection**
- Provider: ChromaDB (Local Vector Store) + Ollama Embeddings (`nomic-embed-text`).
- Execution: Performed synchronously during Petition AI Analysis.
- Behavior: Compares new petition embedding against past records using cosine similarity. If > threshold, flags as duplicate.

**C. Chatbot**
- Provider: Google Gemini API (`gemini-3.1-flash-lite`).
- Execution: Core Backend streams SSE directly to frontend.

## 14. LOCAL AI / OLLAMA
- **Role**: Heavy lifting for internal civic logic (data privacy preservation).
- **Configured Models**: `qwen3:8b` (Classification), `nomic-embed-text` (Embeddings).
- **Configuration**: Managed in `ai/.env` (`OLLAMA_BASE_URL`, `OLLAMA_LLM_MODEL`).

## 15. GEMINI CHATBOT
- **Provider**: Google GenAI SDK.
- **Configuration**: Core Backend `.env` (`GEMINI_API_KEY`, `CHAT_MODEL`, `CHAT_PROVIDER`).
- **Integration**: Independent from Ollama. Frontend submits messages to `POST /chat/stream`, receives SSE chunks.
- **Session**: Handled by passing conversation history arrays.
- **RAG**: NOT IMPLEMENTED. Chatbot has no vector access to internal data.

## 16. RAG / VECTOR SEARCH
- **Vector Database**: ChromaDB (Running within the AI Service).
- **Embedding Model**: `nomic-embed-text` via Ollama.
- **Usage**: Used STRICTLY for Duplicate Detection and Officer Semantic Search of petitions. The collection stores petition text and IDs.
- **Note**: The Gemini Chatbot does NOT use ChromaDB.

## 17. IMAGE STORAGE
- **Storage Location**: Local filesystem under `backend/uploads/petition_images/<petition_id>/`.
- **Filename Generation**: Original names discarded. Uses `uuid4().hex`.
- **Metadata**: Stored in `petition_images` table in Postgres.
- **Retrieval endpoint**: `GET /petitions/{id}/images/{filename}`
- **Authorization**: Protected endpoint. Frontend must append `?token=<jwt>` for access. 

## 18. LOCATION SYSTEM
- **Frontend**: React Leaflet map for manual pin drops. Browser geolocation API used for 'Detect Location'.
- **Backend**: Accepts `latitude` and `longitude` floats.
- **Anti-Spoofing / Reverse Geocoding**: NOT IMPLEMENTED.

## 19. VOICE INPUT
- **Library**: Native Browser Web Speech API (`SpeechRecognition`).
- **Implementation**: Custom `useSpeechRecognition.js` hook manages a global singleton to ensure only one microphone is active at a time. It implements an automatic 3-second inactivity timeout. Used exclusively in the petition submission form.

## 20. INTERNATIONALIZATION
- **Library**: `react-i18next`.
- **State**: Translated keys stored in standard JSON files.
- **Scope**: Frontend UI only. Backend/AI-generated content (like petition summaries) is NOT automatically translated by the system, though the user can type in native languages and the AI attempts to interpret it.

## 21. THEME SYSTEM
- **Implementation**: CSS Variables defined in `index.css` (`--background`, `--card`, etc.) targeting `.dark` class. Tailwind utilities apply these dynamically (e.g. `bg-card`).
- **State**: Saved in `localStorage`.

## 22. AUTHENTICATION AND SECURITY
- **Method**: JWT (JSON Web Tokens).
- **Password Hashing**: Bcrypt (via Passlib).
- **Authorization**: Core Backend enforces RBAC via `Depends(require_admin)` and `Depends(require_officer)`.
- **CORS**: Enforced by FastAPI CORSMiddleware, mapped to frontend URLs defined in `.env`.

## 23. ENVIRONMENT CONFIGURATION
- **Core Backend (`backend/.env`)**:
  - `DATABASE_URL`: Postgres connection string.
  - `SECRET_KEY`, `ALGORITHM`: JWT Config.
  - `AI_SERVICE_URL`: Internal routing to AI service.
  - `OLLAMA_BASE_URL`: Ollama host (used by AI and core).
  - `GEMINI_API_KEY`: Chatbot API key.
- **AI Service (`ai/.env`)**:
  - `OLLAMA_BASE_URL`: Ollama host.
  - `DATABASE_URL`: Postgres access.
- **Frontend (`frontend/.env`)**:
  - `VITE_API_BASE_URL`: Target base URL for the backend API.

## 24. CURRENT RUNTIME / SERVICES
- **PostgreSQL**: Standard relational DB (port 5432).
- **Core Backend**: FastAPI API gateway (port 8000).
- **AI Microservice**: FastAPI service wrapping Chroma/Ollama (port 8001).
- **Ollama**: Local LLM server (port 11434).
- **Frontend**: React/Vite dev server (port 5173).

## 25. CURRENT FILE / STORAGE STRUCTURE
- **Uploads**: `backend/uploads/` (Persistent petition and resolution images).
- **Chroma Data**: `ai/chroma_data/` (Persistent SQLite vector store files).

## 26. CURRENT FRONTEND → BACKEND → AI → DATABASE ARCHITECTURE
```text
Citizen/Officer Browser
        │
    (React SPA)
        │ HTTP/REST (Port 8000)
        ▼
[ Core Backend API ] ─────────► [ PostgreSQL DB ]
        │
        │ HTTP/REST (Port 8001)
        ▼
[ AI Microservice ] ──────────► [ ChromaDB Vector Store ]
        │
        │ HTTP (Port 11434)
        ▼
[ Ollama Local Server ]
```

## 27. CURRENT FEATURE MATRIX
| Feature | Citizen | Officer | Admin | Backend | AI | Database | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Login/Auth** | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | N/A | IMPLEMENTED | Complete |
| **Submit Petition** | IMPLEMENTED | N/A | N/A | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | Complete |
| **Image Upload** | IMPLEMENTED | IMPLEMENTED | N/A | IMPLEMENTED | N/A | IMPLEMENTED | Complete |
| **Process Petition** | N/A | IMPLEMENTED | N/A | IMPLEMENTED | N/A | IMPLEMENTED | Complete |
| **AI Routing** | N/A | N/A | N/A | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | Complete |
| **Gemini Chat** | IMPLEMENTED | N/A | N/A | IMPLEMENTED | N/A | N/A | Complete |
| **Semantic Search** | N/A | IMPLEMENTED | N/A | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | Complete |

## 28. CURRENT DATA FLOW EXAMPLES
**Semantic Search (Officer)**:
Officer types query → Hits Core Backend `GET /search` → Backend calls AI Service `POST /search` → AI Service creates embedding via Ollama → Queries ChromaDB for similar vectors → Fetches petition IDs → Core Backend queries Postgres for full petition records → Returns results to Officer.

## 29. THIRD-PARTY DEPENDENCIES
- **FastAPI / Uvicorn**: Backend routing and async server.
- **SQLAlchemy / psycopg2-binary**: Postgres interaction.
- **Pydantic**: Data validation schemas.
- **ChromaDB**: Vector similarity search.
- **Google GenAI SDK**: Chatbot streaming interaction.
- **React Router**: Frontend SPA navigation.
- **Axios**: Frontend HTTP communication.
- **Tailwind CSS**: Frontend styling.

## 30. TESTING CURRENTLY PRESENT
IMPLEMENTATION NOT FOUND. There is no formal test suite (e.g., pytest, jest) visible in the core directories, aside from a small `scratch/test_sequence.py` script created for manual debugging.

## 31. CURRENT KNOWN LIMITATIONS
- Image storage relies completely on the local filesystem. This is not horizontally scalable.
- The Gemini Chatbot lacks internal RAG capabilities (it only knows what the user explicitly tells it).
- Voice recognition relies heavily on webkit browser implementations and fails silently in unsupported browsers.
- No automated database backups or scheduled cron cleanup jobs for orphaned files currently exist.

## 32. IMPORTANT IMPLEMENTATION NOTES
- **UUIDs vs Human IDs**: Petitions have two IDs. The `id` (UUID) is used strictly for internal routing and database relations. The `petition_number` (e.g., IG-PET-000021) is explicitly for frontend display and human interaction.
- **Backend Responsibility**: The Core Backend handles all authentication, user limits, and direct database writes. The AI Service is entirely stateless except for its internal ChromaDB vector store; it only reads from Postgres (e.g., fetching department descriptions) to enrich its prompts.
- **Environment Isolation**: Frontend API URLs and backend AI URLs are fully environment-variable driven. There are absolutely no hardcoded `localhost` routes present in frontend API clients. 
