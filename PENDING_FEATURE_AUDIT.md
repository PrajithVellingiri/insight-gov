# INSIGHTGOV — PENDING FEATURE AUDIT

## 1. Current Architecture
InsightGov operates on a dual-backend microservices architecture with a decoupled frontend.
- **Frontend**: React SPA built with Vite and TailwindCSS. Uses React Query for data fetching and Server-Sent Events (SSE) for chatbot streaming.
- **Backend API Core**: FastAPI (Python) running on port 8000. Handles authentication (JWT), RBAC, petition CRUD, notifications, chat orchestration, and interfaces with PostgreSQL 15+ (via SQLAlchemy/Alembic). Uses `slowapi` for rate limiting.
- **AI Microservice**: Isolated FastAPI app running on port 8001. Manages local AI inference using Ollama (`qwen3:8b` for JSON extraction, `nomic-embed-text` for embeddings) and ChromaDB for semantic duplicate detection and semantic search.
- **Chatbot & RAG**: Cloud-backed AI (Google Gemini 2.5 Flash via `google-genai` SDK) abstracted via a `ChatProvider` registry. RAG is powered by a separate ChromaDB instance containing FAQ document embeddings.
- **Storage**: PostgreSQL for relational data, local file system for image uploads (`uploads/`), and dual ChromaDB instances for vectors.

## 2. Complete Feature Matrix

| FEATURE | STATUS | CURRENT IMPLEMENTATION | RELEVANT FILES | EVIDENCE | PENDING WORK |
|---------|--------|------------------------|----------------|----------|--------------|
| Citizen Authentication | ✅ COMPLETE | JWT-based registration and login with bcrypt hashing | `auth.py`, `auth_service.py` | Verified in endpoints | None |
| Officer/Admin Auth | ✅ COMPLETE | JWT-based RBAC with strict route guards | `middleware/auth.py` | Verified in endpoints | None |
| Citizen Petition Sub | ✅ COMPLETE | Title, description, GPS, map pinning, and image uploads | `PetitionForm.jsx`, `petitions.py` | Verified in codebase | None |
| Department Intell. | ✅ COMPLETE | Matches citizen choice against AI prediction, flags mismatch | `petition_service.py`, `SubmitPetition.jsx` | Verified in models/services | None |
| Location Integrity | ✅ COMPLETE | Stores browser GPS vs manual entry, validates accuracy | `petition.py`, `petition_service.py` | Verified in models | None |
| Multilingual System | ✅ COMPLETE | Static UI translations via i18next in 6 local languages | `frontend/src/locales/`, `i18n.js` | Verified | None |
| Dynamic Translation | ↩️ REVERTED / ABANDONED | Phase 6B translation cache removed completely | N/A | Missing from codebase | None |
| Image System | ✅ COMPLETE | Citizen upload, Officer proof upload, file retrieval | `petition_image.py`, `petitions.py` | Verified in endpoints | None |
| Notifications | ✅ COMPLETE | In-app petition status updates and read receipts | `notification_service.py` | Verified in services | Email/SMS push |
| AI Text Analysis | ✅ COMPLETE | Local Ollama routing, priority, explanation generation | `analysis_service.py` | Verified | None |
| AI Image Vision | ✅ COMPLETE | Gemini Vision extracts visual evidence from uploads | `vision_providers/`, `petition_service.py` | Verified | None |
| AI Duplicate Detect | ✅ COMPLETE | ChromaDB vector similarity + geographic proximity | `analysis_service.py` | Verified | None |
| AI Chatbot | ✅ COMPLETE | Streaming SSE Gemini chatbot with tool calling | `chat_service.py`, `chat.py` | Verified | PDF/Policy RAG |
| Semantic Search | ✅ COMPLETE | Officer active/historical vector search with isolation | `search.py`, `ai_client.py` | Verified | None |
| Admin Analytics | ✅ COMPLETE | Real backend data, individual officer history | `analytics_service.py`, `OfficerAnalytics.jsx`| Verified | None |
| Voice Input | ✅ COMPLETE | Web Speech API integration via MicButton | `useSpeechRecognition.js` | Verified | None |
| Rate Limiting | 🟡 PARTIAL | SlowAPI functioning but uses in-memory backend | `limiter.py` | Verified | Redis integration |
| Async Task Queue | 🟡 PARTIAL | Uses basic `asyncio.create_task` for background analysis | `petition_service.py` | Verified | Celery/Redis worker |

## 3. Already Completed Features
# DO NOT REIMPLEMENT

- **Petition Submission & Auto-Routing** (Implemented in `SubmitPetition.jsx`, `petition_service.py`, `ai/analysis_service.py`) — Current Status: COMPLETE
- **Department Decision Intelligence** (Implemented in `petition_service.py`, `AIAnalysisPanel.jsx`) — Current Status: COMPLETE
- **Location Integrity Verification** (Implemented in `petition_service.py`, `PetitionMap.jsx`) — Current Status: COMPLETE
- **Duplicate Detection via ChromaDB** (Implemented in `ai/duplicate_service.py`) — Current Status: COMPLETE
- **Officer Semantic Search** (Implemented in `search.py`, `SemanticSearch.jsx`) — Current Status: COMPLETE
- **Role-Based Authentication** (Implemented in `auth.py`, `middleware/auth.py`) — Current Status: COMPLETE
- **Static UI Translations via i18next** (Implemented in `i18n.js`, `locales/`) — Current Status: COMPLETE
- **Chatbot Framework** (Gemini, Tool Calling, SSE Streaming, FAQ RAG) (Implemented in `chat_service.py`, `chat_tools.py`) — Current Status: COMPLETE
- **Officer Resolution Workflow** (Resolution History, 2-day retention rule) (Implemented in `ResolutionHistory.jsx`, `petition_repo.py`) — Current Status: COMPLETE
- **Admin Officer Analytics** (Implemented in `analytics_service.py`, `OfficerAnalyticsPage.jsx`) — Current Status: COMPLETE
- **Voice Input** (Implemented in `useSpeechRecognition.js`, `MicButton.jsx`) — Current Status: COMPLETE

## 4. Partial Features
# PARTIAL FEATURES

### Distributed Rate Limiting
- **CURRENT:** `slowapi` rate limits chat interactions (20/hour anon, 100/hour auth) successfully using an in-memory store.
- **MISSING:** Scalable shared state for production deployments.
- **REMAINING:** Wire the `limiter.py` to a distributed Redis backend.

### Background Task Queue
- **CURRENT:** AI Petition Analysis triggers asynchronously via `asyncio.create_task()` in `petition_service.py`, keeping the HTTP submission endpoint fast.
- **MISSING:** Resilience, retries, and persistence across server restarts.
- **REMAINING:** Integrate a robust message queue (Celery + Redis) for production petition processing.

### Advanced RAG Pipeline
- **CURRENT:** Static markdown FAQ files are chunked and stored in ChromaDB `insightgov_faq`, correctly injected into the Gemini context.
- **MISSING:** Advanced document processing for government policies, circulars, and PDFs.
- **REMAINING:** Develop chunking and extraction pipelines for complex document structures.

## 5. Broken Features
No broken features identified in the current core workflow.

## 6. Reverted / Abandoned Features
# REVERTED / ABANDONED

- **Phase 6B Dynamic Website Translation:** The dynamic backend translation of all website text using an auto-translate cache was intentionally reverted. The project relies entirely on localized static UI files and native browser translation for user-generated content. Do NOT reimplement this.

## 7. Pending Features
# PENDING FEATURES

### Email/SMS Notifications
- **WHY IT IS PENDING:** Currently, notifications only trigger in-app database alerts (`notifications` table). External push was planned but deferred to avoid blocking HTTP threads.
- **CURRENT STATE:** Not implemented.
- **WHAT ALREADY EXISTS:** The `notification_service.py` architecture that acts as a hook point for status changes.
- **WHAT REMAINS TO IMPLEMENT:** Twilio/SendGrid integration within the existing notification service to trigger outbound messages.
- **AFFECTED FRONTEND FILES:** None (Backend only).
- **AFFECTED BACKEND FILES:** `services/notification_service.py`.
- **DATABASE IMPACT:** Minor (potentially adding user phone numbers to the `users` table).
- **AI IMPACT:** None.
- **RISK LEVEL:** Low.

### Proactive AI Insights (Vector Clustering)
- **WHY IT IS PENDING:** Listed in `PROJECT_HANDOFF_v2.md` as "Phase 11" for advanced AI insights. Requires a populated production database.
- **CURRENT STATE:** Not implemented.
- **WHAT ALREADY EXISTS:** ChromaDB `petitions` collection natively holding dense vectors of all petitions.
- **WHAT REMAINS TO IMPLEMENT:** Scheduled clustering algorithms (e.g., HDBSCAN) running against ChromaDB to group rapidly emerging similar petitions into "Crises Alerts" for Admins.
- **AFFECTED FRONTEND FILES:** Admin Dashboard UI additions.
- **AFFECTED BACKEND FILES:** New `services/clustering_service.py` or similar.
- **DATABASE IMPACT:** New table to track clustered crisis events.
- **AI IMPACT:** Heavy read operations on ChromaDB.
- **RISK LEVEL:** High (Compute intensive).

### Production Hardening (Docker/CI/CD)
- **WHY IT IS PENDING:** System is currently run locally via disparate terminal commands.
- **CURRENT STATE:** `PROJECT_HANDOFF_v2.md` states "Phase 10: Production Hardening" is next.
- **WHAT ALREADY EXISTS:** Working Python and Node environments.
- **WHAT REMAINS TO IMPLEMENT:** `Dockerfile`s for Frontend, Backend, AI Service. `docker-compose.yml` orchestrating Postgres, ChromaDB, and Redis.
- **AFFECTED FRONTEND FILES:** Root configuration.
- **AFFECTED BACKEND FILES:** Root configuration.
- **DATABASE IMPACT:** None.
- **AI IMPACT:** None.
- **RISK LEVEL:** Medium.

## 8. Department Intelligence Status
- **Citizen department selection:** COMPLETE (Captured via `citizen_department_id`).
- **AI department prediction:** COMPLETE (Predicted via Ollama pipeline).
- **Comparison:** COMPLETE (Handled in `petition_service.py`).
- **Mismatch flag:** COMPLETE (Stored as `department_match` boolean).
- **AI decision application:** COMPLETE (AI overrides citizen choice automatically).
- **Officer override:** COMPLETE (Officer can re-route in `PetitionReview`).

## 9. Location Integrity Status
- **location capture:** COMPLETE (Frontend `useLocation` hook).
- **backend validation:** COMPLETE (`latitude` / `longitude` float validation).
- **verification:** COMPLETE (`location_verification_status` updated dynamically).
- **accuracy handling:** COMPLETE (`device_accuracy` recorded).
- **mismatch detection:** COMPLETE (Haversine distance calculated if manually overridden).
- **location spoof detection:** COMPLETE (Basic mock-location flags caught).
- **suspicious-location detection:** COMPLETE (Logged in verification reasons).

## 10. Multilingual Status
- **current i18n architecture:** COMPLETE (Standard `i18next` React bindings).
- **supported languages:** EN, TA, HI, ML, TE, KN (JSON translation files present).
- **static UI translations:** COMPLETE (Fully applied to components).
- **untranslated areas:** User-generated petition text (handled by browser natively).
- **language persistence:** COMPLETE (Saves to `localStorage`).
- **fallback behavior:** COMPLETE (Falls back to English).
- **dynamic translation:** REVERTED (Do not reimplement Phase 6B).

## 11. AI Feature Status
- **Text analysis:** COMPLETE.
- **Department classification:** COMPLETE.
- **AI reasoning:** COMPLETE.
- **AI confidence:** COMPLETE.
- **Priority support:** COMPLETE.
- **Gemini Vision (Image analysis / evidence extraction):** COMPLETE.
- **Embeddings & ChromaDB:** COMPLETE.
- **Semantic similarity & Duplicate detection:** COMPLETE.
- **Active / Historical Petition search:** COMPLETE.
- **Chatbot (Streaming, Context, Tools):** COMPLETE.

## 12. Officer Feature Status
All Officer features (Dashboard, filtering, petition processing, resolution uploads, History with 2-day rules, Semantic Search) are COMPLETE.

## 13. Admin Feature Status
All Admin features (Dashboards, Department CRUD, Officer CRUD, Backend-derived Analytics) are COMPLETE.

## 14. Citizen Feature Status
All Citizen features (Dashboards, Petition Creation, Timeline Status, Notifications, Language/Voice) are COMPLETE, with the sole exception of outbound Email/SMS delivery.

## 15. Feature Dependencies
- **Email/SMS Notifications** ↓ depends on ↓ **Background Task Queue** (To prevent webhook/SMTP latency from blocking the main FastAPI event loop).
- **Proactive AI Insights** ↓ depends on ↓ **Background Task Queue** (Clustering must run asynchronously to avoid blocking).

## 16. Recommended Pending-Only Implementation Order
**PHASE 1:** Background Task Queue & Distributed State (Integrate Redis/Celery to handle `slowapi` state and offload `asyncio.create_task` operations).  
**PHASE 2:** Email & SMS Notifications (Wired into the new Task Queue).  
**PHASE 3:** Production Hardening (Dockerize the multi-service architecture for staging deployment).  
**PHASE 4:** Advanced RAG & Policy Ingestion (Expand the existing ChromaDB pipeline to handle complex PDFs).  
**PHASE 5:** Proactive AI Insights (Scheduled Vector Clustering).  

## 17. V2.1 Readiness
**READY FOR V2.1 FEATURE DEVELOPMENT**  
The core platform is highly stable. The dual-backend AI architecture correctly isolates inference from web traffic, and all major civic workflows (submission, routing, resolution, analytics) are thoroughly implemented and functioning without critical regressions.

## 18. Final Recommendation
Do not build any new user-facing features or alter existing UI flows immediately. The application logic is feature-complete for its primary goals. The immediate next step must be implementing a **Background Task Queue (Celery/Redis)** to migrate away from volatile in-memory operations, paving the way for safe Email/SMS dispatch and production containerization.
