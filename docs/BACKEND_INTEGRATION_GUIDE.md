# InsightGov AI: Backend Integration Guide

## 1. Overview

The backend for InsightGov AI serves as the core orchestration layer for the Decision Intelligence Platform.

**Responsibilities:**
- Manage citizen and government user authentication and authorization.
- Provide a RESTful API for frontend consumption.
- Persist structured relational data (petitions, users, analytics).
- Mediate all communication with the internal AI Micro-service (the frontend never talks directly to the AI service).
- Handle robust error fallback if AI analysis fails or times out.

**Architecture:**
The backend follows a layered, service-oriented architecture:
`Routers (Controllers) → Services (Business Logic) → Repositories (Data Access) → Models (ORM)`

---

## 2. Technology Stack

- **FastAPI**: High-performance asynchronous web framework used for building the API and routing requests.
- **SQLAlchemy (v2.0)**: ORM used to abstract database interactions and define Python-based models.
- **PostgreSQL / Supabase**: Primary relational database. Chosen for robust JSONB support (critical for storing AI explanation data) and enterprise-grade reliability.
- **Pydantic (v2)**: Data validation and serialization. Used for defining strict API request/response contracts (`schemas/`).
- **JWT (python-jose & passlib)**: Handles stateless, secure authentication and role-based access control (RBAC).
- **Alembic**: Database migration tool to track schema changes over time.
- **HTTPX**: Asynchronous HTTP client used to reliably communicate with the AI micro-service.
- **pydantic-settings / python-dotenv**: Strict, type-safe environment variable management.

---

## 3. Project Structure

```text
backend/
├── main.py              # Application entry point, FastAPI setup, CORS, router mounting
├── config.py            # Global settings via pydantic-settings
├── database.py          # SQLAlchemy engine, SessionLocal, dependency injection
├── routers/             # API Endpoints (Controllers) — map HTTP requests to services
├── services/            # Business Logic — orchestrates logic, AI calls, and repo interactions
├── repositories/        # Data Access — encapsulates all SQLAlchemy database queries
├── models/              # SQLAlchemy ORM definitions (database tables)
├── schemas/             # Pydantic models for API request/response validation
├── middleware/          # FastAPI dependencies (auth, role guards)
└── alembic/             # Database migration configurations and scripts
```

---

## 4. API Endpoints

### Authentication

**POST `/auth/register`**
- **Purpose**: Create a new user account.
- **Auth**: None
- **Request**: `{"name": "...", "email": "...", "password": "...", "role": "citizen"}`
- **Response**: JWT Token + User Object
- **Status Codes**: 201 Created, 409 Conflict (Email exists), 422 Validation Error.

**POST `/auth/login`**
- **Purpose**: Authenticate and receive a JWT.
- **Auth**: None
- **Request**: `{"email": "...", "password": "..."}`
- **Response**: JWT Token + User Object
- **Status Codes**: 200 OK, 401 Unauthorized (Invalid credentials).

### Petitions

**POST `/petitions`**
- **Purpose**: Submit a new petition. *Triggers synchronous call to AI Service.*
- **Auth**: Citizen
- **Request**: `{"title": "...", "description": "...", "location": "..."}`
- **Response**: Petition object with nested `ai_analysis` block.
- **Status Codes**: 201 Created, 403 Forbidden.

**GET `/petitions`**
- **Purpose**: List all petitions (paginated, filterable by status/department).
- **Auth**: Officer, Admin
- **Request Params**: `?status={status}&department_id={id}&skip=0&limit=20`
- **Response**: List of Petitions with AI analysis data.
- **Status Codes**: 200 OK, 403 Forbidden.

**GET `/petitions/my`**
- **Purpose**: List authenticated citizen's submitted petitions.
- **Auth**: Citizen
- **Request Params**: `?skip=0&limit=20`
- **Response**: List of Petitions.
- **Status Codes**: 200 OK.

**GET `/petitions/{id}`**
- **Purpose**: Get a single petition by ID.
- **Auth**: Any (Citizens restricted to their own)
- **Response**: Petition object + AI analysis block.
- **Status Codes**: 200 OK, 403 Forbidden, 404 Not Found.

**PATCH `/petitions/{id}/status`**
- **Purpose**: Officer updates the status, optionally overriding AI suggestions.
- **Auth**: Officer
- **Request**: `{"status": "resolved", "note": "Fixed", "department_override": "...", "priority_override": "..."}`
- **Response**: Updated Petition object.
- **Status Codes**: 200 OK, 403 Forbidden, 404 Not Found.

**GET `/petitions/{id}/history`**
- **Purpose**: Audit trail of status changes.
- **Auth**: Officer
- **Response**: List of `PetitionHistoryOut` objects.

### Dashboard & Analytics

**GET `/dashboard`**
- **Purpose**: High-level aggregated metrics for the officer dashboard.
- **Auth**: Officer, Admin
- **Response**: Total counts, status breakdown, priority breakdown, duplicates.
- **Status Codes**: 200 OK, 403 Forbidden.

**GET `/analytics`**
- **Purpose**: Deep dive statistics including AI category/department distributions and resolution rates.
- **Auth**: Admin
- **Response**: Detailed analytics object.
- **Status Codes**: 200 OK, 403 Forbidden.

### Notifications

**GET `/notifications`**
- **Purpose**: Fetch paginated unread/read notifications for the user.
- **Auth**: Any
- **Request Params**: `?skip=0&limit=50`
- **Response**: List of notifications.

**PATCH `/notifications/{id}/read`**
- **Purpose**: Mark a specific notification as read.
- **Auth**: Any
- **Response**: Updated notification.

### AI Integration

**POST `/ai/search`**
- **Purpose**: Semantic search across petitions via the AI service.
- **Auth**: Officer
- **Request**: `{"query": "pothole issue", "top_k": 5}`
- **Response**: Search result dictionary direct from AI service.
- **Status Codes**: 200 OK, 403 Forbidden.

---

## 5. Authentication

- **Implementation**: JSON Web Tokens (JWT) using `python-jose`.
- **Token Generation**: On successful login/registration, a JWT is signed using the `SECRET_KEY` and the HS256 algorithm. The token contains the user's ID (`sub`) and `role` as claims.
- **Token Validation**: Processed automatically by FastAPI's `Depends(get_current_user)` via `HTTPBearer`.
- **Password Hashing**: `bcrypt` (via `passlib`) is used. Raw passwords are never stored or logged.
- **Role-based Authorization**: Implemented via middleware dependencies:
  - `require_citizen` (403 if not citizen)
  - `require_officer` (403 if not officer or admin)
  - `require_admin` (403 if not admin)
- **Flow**: Client attaches header `Authorization: Bearer <token>`. Middleware intercepts, decodes token, looks up `User` from DB, and injects it into the route handler.

---

## 6. Database

**Technology**: PostgreSQL 
**Connection**: via `DATABASE_URL` using SQLAlchemy synchronous driver `psycopg2`.

### Tables

1. **`users`**
   - Purpose: Stores all accounts (Citizens, Officers, Admins).
   - Columns: id (UUID), name, email (unique index), hashed_password, role, department_id, created_at.
   - Relations: Belongs to `departments`. Has many `petitions`.

2. **`departments`**
   - Purpose: System departments (often dynamically generated by AI suggestions).
   - Columns: id (UUID), name (unique), created_at.

3. **`petitions`**
   - Purpose: The core citizen request.
   - Columns: id, title, description, location, status, is_duplicate, submitted_by (User FK), department_id (Department FK), officer_id (User FK).
   - Indexes: status, submitted_by, department_id.

4. **`ai_analysis`**
   - Purpose: Stores the result of the LLM pipeline for a petition.
   - Columns: id, petition_id (1:1 unique FK), category, department, priority, summary, confidence, analyzed_at.
   - JSONB Columns: duplicate_ids (List), similarity_scores (List), explanation (Dict).

5. **`notifications`**
   - Purpose: System messages alerting users to status changes or AI completion.
   - Columns: id, user_id (FK), message, is_read, created_at.

6. **`petition_history`**
   - Purpose: Append-only audit log for status transitions.
   - Columns: id, petition_id (FK), officer_id (FK), old_status, new_status, note, created_at.

---

## 7. Business Logic (Services)

- **AuthService**: Manages `bcrypt` hashing, password verification, and JWT encode/decode lifecycles.
- **PetitionService**: The heaviest service. Orchestrates the flow:
  1. Creates petition (status='pending')
  2. Awaits `AIClient.analyze()`
  3. If successful, writes `AIAnalysis`, assigns department, sets duplicates, updates status to 'analysed'.
  4. Triggers Citizen `Notification` creation.
  5. Writes `PetitionHistory` record.
- **AnalyticsService**: Executes heavy aggregate counting (group bys, sums) across `PetitionRepository` and `AIAnalysisRepository` to compile `DashboardStats` and `AnalyticsOut`.
- **NotificationService**: Thin wrapper mapping repository fetch/update operations to Pydantic schemas.
- **AIClient**: HTTPX-based async wrapper to communicate with the AI Micro-service. Handles timeouts, exceptions, and graceful degradation.

---

## 8. AI Integration

> **CRITICAL**: The Backend is the ONLY component allowed to communicate with the AI Service. The frontend MUST NOT make requests to the AI Service directly.

**Base URL**: Controlled by `AI_SERVICE_URL` env var.
**Client**: `backend/services/ai_client.py` using `httpx.AsyncClient`.

**Endpoints Consumed**:
- **`GET /health`**: 5s timeout. Used for liveness checks.
- **`POST /ai/analyze`**: 150s timeout (accommodates internal LLM retries). 
  - Payload: `{id, title, description, location, submitted_by}`
  - Response: Full analysis dict (category, priority, explanation, duplicates).
  - Error Handling: If the AI returns 5xx or times out, the backend gracefully catches it, logs the error, and leaves the petition in a `pending` state. The API request succeeds, returning the petition without AI data.
- **`POST /ai/search`**: 30s timeout.
  - Payload: `{query, top_k}`
  - Response: Search results dict.
  - Error Handling: Returns `{"results": []}` on failure so the officer UI degrades gracefully instead of crashing.

---

## 9. Frontend Integration

The frontend should expect strictly typed JSON responses matching the Pydantic schemas in `schemas/`.

**Example: Successful Petition Submission**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Pothole on Main St",
  "description": "Large pothole causing damage.",
  "location": "Main St & 4th Ave",
  "status": "analysed",
  "is_duplicate": false,
  "submitted_by": "987e6543-e21b-12d3-a456-426614174000",
  "ai_analysis": {
    "category": "Infrastructure",
    "department": "Public Works",
    "priority": "medium",
    "summary": "Report of a large pothole at intersection.",
    "duplicate_ids": [],
    "similarity_scores": [],
    "explanation": {"category_reason": "...", "priority_reason": "..."},
    "confidence": 0.92,
    "analyzed_at": "2026-07-26T10:00:00Z"
  }
}
```
*Note: If the AI times out, `status` will be "pending" and `ai_analysis` will be `null`.*

---

## 10. Environment Variables

Managed via `backend/.env` and `pydantic-settings`:

- `DATABASE_URL`: Connection string for PostgreSQL (e.g., `postgresql://user:pass@localhost:5432/db`).
- `SECRET_KEY`: Long, cryptographically secure string for signing JWTs.
- `ALGORITHM`: JWT signing algorithm (Default: `HS256`).
- `ACCESS_TOKEN_EXPIRE_MINUTES`: JWT lifespan (Default: `1440` / 24 hours).
- `AI_SERVICE_URL`: Internal URL to the AI Python micro-service (e.g., `http://localhost:8001`).
- `ALLOWED_ORIGINS`: Comma-separated list of URLs permitted by CORS (e.g., `http://localhost:5173,http://localhost:3000`).

---

## 11. Error Handling

Standardized HTTP status codes are used exclusively:

- **401 Unauthorized**: Missing token, expired token, or invalid login credentials.
- **403 Forbidden**: Token valid, but user role (Citizen/Officer/Admin) lacks permission.
- **404 Not Found**: Requested ID (Petition, Notification) does not exist in DB.
- **409 Conflict**: Data violation (e.g., Email already registered).
- **422 Unprocessable Entity**: Request body failed Pydantic validation (e.g., missing field, string too short).

*Note: AI service unavailablity does NOT trigger a 500 on petition submission. It degrades gracefully.*

---

## 12. Build & Run

**Requirements**: Python 3.10+

```bash
# 1. Setup virtual environment
python -m venv .venv
# Activate: 
# Windows: .venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Setup Env
copy .env.example .env 

# 4. Run Migrations (creates schema in database)
alembic upgrade head

# 5. Run Server
uvicorn main:app --reload --port 8000
```

---

## 13. Deployment Notes

- **Database**: Run `alembic upgrade head` in the CI/CD pipeline prior to application start. Works natively with Supabase or managed RDS.
- **CORS**: Ensure `ALLOWED_ORIGINS` strictly matches the deployed frontend URL in production to prevent abuse.
- **Workers**: Run via `uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4` (or gunicorn) for concurrency.
- **AI Dependency**: The Backend and AI Service should ideally run in the same VPC/internal network to minimize latency during the synchronous `POST /petitions` flow.

---

## 14. Testing Checklist

To verify backend integrity, confirm the following flows:

1. **Authentication**: Register a citizen. Login. Ensure JWT is returned.
2. **Role Access**: Attempt to hit `GET /dashboard` with citizen JWT (Expect 403). Hit it with Officer JWT (Expect 200).
3. **Petition AI Integration**:
   - Submit petition while AI Service is running. Expect status `analysed` and full AI payload.
   - Submit petition while AI Service is off. Expect status `pending` and `ai_analysis=null`.
4. **Audit Trail**: As an officer, PATCH a petition status. Verify a citizen Notification is generated and `GET /history` returns a new row.
5. **Analytics**: As admin, verify `/analytics` successfully aggregates DB counts without crashing.

---

## 15. Known Limitations

- **Synchronous AI on Submission**: The citizen HTTP request blocks while waiting for the AI Service (`POST /ai/analyze`). If the LLM takes 60 seconds, the frontend HTTP connection must stay open for 60 seconds.
- **No Websockets**: Real-time notifications are not implemented; the frontend must poll `GET /notifications`.
- **Soft Deletes**: Deletion of petitions/users is not implemented.
- **Pagination Cursors**: Pagination relies on `skip`/`limit` (OFFSET/LIMIT), which is sufficient for v1 but degrades in performance on tables with millions of rows.

---

## 16. Future Improvements

- **Asynchronous AI Processing (Message Queue)**: Decouple petition submission from AI analysis using Redis + Celery or RabbitMQ. Return a `202 Accepted` immediately and update via WebSocket when AI finishes.
- **WebSocket Notifications**: Push real-time alerts to citizens when their petition status changes.
- **Rate Limiting**: Implement `slowapi` or Redis-based rate limiting to prevent spam on the `/petitions` endpoint.
- **Caching**: Cache `/dashboard` and `/analytics` responses in Redis, as they require heavy database aggregations.
