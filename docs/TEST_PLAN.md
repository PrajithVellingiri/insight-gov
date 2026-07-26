# InsightGov AI — Test Plan

## Purpose

Defines the complete testing strategy for InsightGov AI before final submission.

---

## Test Environment

| Service | Framework | URL |
|---------|-----------|-----|
| Frontend | React + Vite | http://localhost:5173 |
| Backend | FastAPI | http://localhost:8000 |
| AI Service | FastAPI | http://localhost:8001 |
| Ollama | - | http://localhost:11434 |
| Database | PostgreSQL / Supabase | localhost:5432 |

---

## Phase 1: Service Health

| Test | Method | Expected Result | Status |
|------|--------|-----------------|--------|
| AI Service health check | `GET http://localhost:8001/health` | `{"status":"ok","ollama":"reachable","chromadb":"ok (documents=0)"}` | ☐ |
| Backend health check | `GET http://localhost:8000/health` | `{"status":"ok"}` | ☐ |
| Frontend loads | Open http://localhost:5173 | Landing page renders | ☐ |
| Ollama serving | `GET http://localhost:11434` | 200 OK | ☐ |

---

## Authentication

| Test | Expected Result | Status |
|------|-----------------|--------|
| Register Citizen (POST /auth/register) | 201 + JWT + user object | ☐ |
| Login Citizen (POST /auth/login) | 200 + JWT + user object | ☐ |
| Login Officer | 200 + JWT + user object | ☐ |
| Login Admin | 200 + JWT + user object | ☐ |
| Invalid Password | 401 Unauthorized | ☐ |
| Missing fields (no email) | 422 Validation Error | ☐ |
| GET /auth/me with valid token | 200 + user profile | ☐ |
| GET /auth/me with invalid/expired token | 401 Unauthorized | ☐ |
| Invalid Token on protected route | 401 redirect to login | ☐ |
| Role guard — citizen hits GET /dashboard | 403 Forbidden | ☐ |
| Role guard — officer hits GET /dashboard | 200 OK | ☐ |
| Role guard — citizen hits GET /analytics | 403 Forbidden | ☐ |
| Role guard — admin hits GET /analytics | 200 OK | ☐ |

---

## Petition Module

| Test | Expected | Status |
|------|----------|--------|
| POST /petitions as citizen (with AI running) | 201 + petition with `status: "analysed"` + full `ai_analysis` block | ☐ |
| POST /petitions as citizen (with AI offline) | 201 + petition with `status: "pending"` + `ai_analysis: null` | ☐ |
| POST /petitions — missing `title` field | 422 Validation Error | ☐ |
| POST /petitions — `description` less than 10 chars | 422 Validation Error | ☐ |
| POST /petitions as officer | 403 Forbidden | ☐ |
| GET /petitions/my as citizen | 200 + list of own petitions | ☐ |
| GET /petitions/{id} as owner citizen | 200 + petition with AI analysis | ☐ |
| GET /petitions/{id} as different citizen | 403 Forbidden | ☐ |
| GET /petitions/{id} as officer | 200 + full petition data | ☐ |
| GET /petitions/{id} — non-existent ID | 404 Not Found | ☐ |
| GET /petitions as officer | 200 + paginated list | ☐ |
| GET /petitions?status=pending as officer | 200 + filtered list | ☐ |
| PATCH /petitions/{id}/status as officer | 200 + updated petition | ☐ |
| PATCH /petitions/{id}/status with department_override | 200 + department updated in ai_analysis | ☐ |
| PATCH /petitions/{id}/status with priority_override | 200 + priority updated in ai_analysis | ☐ |
| PATCH /petitions/{id}/status as citizen | 403 Forbidden | ☐ |
| GET /petitions/{id}/history as officer | 200 + list of history entries | ☐ |
| GET /petitions/{id}/history as citizen | 403 Forbidden | ☐ |

---

## AI Integration

| Test | Expected | Status |
|------|----------|--------|
| GET /health (AI Service) | `ollama: "reachable"` + `chromadb: "ok"` | ☐ |
| POST /ai/analyze — valid petition | 200 + full AnalysisResult with all fields populated | ☐ |
| POST /ai/analyze — `id` field missing | 422 Unprocessable Entity | ☐ |
| Duplicate Detection — analyze same content twice | Second response has `duplicate_ids` non-empty + `similarity_scores` | ☐ |
| POST /ai/search — valid query | 200 + `{"results": [...]}` | ☐ |
| POST /ai/search — empty ChromaDB | 200 + `{"results": []}` | ☐ |
| Backend → AI: petition submit while AI offline | Backend gracefully returns petition with `status: "pending"` and `ai_analysis: null` | ☐ |
| Backend POST /ai/search proxy | 200 + results forwarded from AI service | ☐ |
| Backend POST /ai/search as citizen (unauthorized) | 403 Forbidden | ☐ |

---

## Dashboard

| Test | Expected | Status |
|------|----------|--------|
| Citizen dashboard loads | 200 + own petitions list | ☐ |
| Officer dashboard loads | 200 + all petitions + AI analysis data | ☐ |
| Admin dashboard loads | 200 + dashboard stats | ☐ |
| GET /dashboard as officer | 200 + DashboardStats JSON | ☐ |
| GET /dashboard as citizen | 403 Forbidden | ☐ |

---

## Notifications

| Test | Expected | Status |
|------|----------|--------|
| Notification created on petition submit | DB has notification for the citizen | ☐ |
| Notification created when officer updates status | DB has notification for petition owner | ☐ |
| GET /notifications returns user's notifications | 200 + list | ☐ |
| PATCH /notifications/{id}/read marks as read | 200 + `is_read: true` | ☐ |
| PATCH /notifications/{id}/read for another user's notification | 404 Not Found | ☐ |

---

## Analytics

| Test | Expected | Status |
|------|----------|--------|
| GET /analytics as admin | 200 + AnalyticsOut with all fields | ☐ |
| GET /analytics as officer | 403 Forbidden | ☐ |
| Category distribution reflects AI analysis | counts match petition count | ☐ |
| Department distribution reflects AI analysis | counts match petition count | ☐ |

---

## Admin Module

| Test | Expected | Status |
|------|----------|--------|
| GET /admin/departments as admin | 200 + list of departments | ☐ |
| POST /admin/departments as admin | 201 + new department | ☐ |
| POST /admin/departments — duplicate name | 409 Conflict | ☐ |
| GET /admin/departments as citizen | 403 Forbidden | ☐ |
| GET /admin/officers as admin | 200 + list of officers | ☐ |
| POST /admin/officers as admin | 201 + new officer user | ☐ |
| POST /admin/officers — duplicate email | 409 Conflict | ☐ |

---

## UI (Frontend)

| Test | Expected | Status |
|------|----------|--------|
| Responsive layout on mobile (375px) | No overflow, readable layout | ☐ |
| Loading states while fetching | Skeleton / spinner visible | ☐ |
| Error states on 4xx/5xx | User-facing error message shown | ☐ |
| Empty states (no petitions) | Empty state UI shown, not blank | ☐ |
| AIAnalysisPanel renders with full analysis | All fields displayed correctly | ☐ |
| AIAnalysisPanel renders when analysis is null | "AI analysis pending…" shown | ☐ |
| DuplicateAlert shown when duplicate_ids non-empty | Orange warning banner visible | ☐ |
| ConfidenceBar turns amber below 60% | Visual warning indicator shown | ☐ |
| ExplainabilityPanel collapses and expands | Toggle works correctly | ☐ |
| PriorityBadge colour codes all four levels | critical=red, high=orange, medium=yellow, low=green | ☐ |

---

## Performance

| Test | Expected | Status |
|------|----------|--------|
| Initial frontend load | < 3 seconds on localhost | ☐ |
| Backend API latency (non-AI) | < 200ms per request | ☐ |
| AI analysis response (Ollama warmed up) | < 30 seconds end-to-end | ☐ |
| Frontend polls petition status every 5s | No UI freeze, stops when status changes | ☐ |

---

## End-to-End Flow

**Steps:**

1. Citizen registers → logs in → submits petition  
2. Backend stores petition (status: `pending`) → calls AI service  
3. AI analyses petition → returns result  
4. Backend stores AI result → updates status to `analysed`  
5. Frontend polls → detects `status: "analysed"` → shows AI analysis panel  
6. Officer logs in → views petition queue → opens petition → reviews AI recommendation  
7. Officer updates status to `resolved` → optionally overrides department/priority  
8. Citizen sees notification → views updated petition status  

| Sub-test | Expected | Status |
|----------|----------|--------|
| Full E2E with AI running | Petition ends in `analysed` with full AI data | ☐ |
| Full E2E with AI offline | Petition ends in `pending`, no AI data, no crash | ☐ |
| Officer override persists | Post-override fields visible on next GET | ☐ |
| Notification delivered to citizen | Notification visible in citizen UI | ☐ |

**Overall E2E Status:** ☐ PASS  ☐ FAIL