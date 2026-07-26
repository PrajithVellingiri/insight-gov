# InsightGov AI — Bug Tracker

## Purpose

Track all issues discovered during integration and testing.

---

| ID | Module | Description | Severity | Status | Fix Applied |
|----|--------|-------------|----------|--------|-------------|
| BUG-001 | Frontend | Login button disabled (pre-existing placeholder) | High | Open | Needs frontend team to implement login page logic |
| BUG-002 | Backend | JWT expiry issue | Medium | Closed | Already fixed prior to integration |
| BUG-003 | AI | Wrong category prediction (model quality) | Low | Open | Model-level issue; out of scope for integration |
| BUG-004 | Backend | Missing `GET /auth/me` endpoint — frontend calls it on every page load to restore session from localStorage | Critical | **Resolved** | Added `GET /auth/me` to `routers/auth.py` returning `UserOut` for the authenticated user |
| BUG-005 | Frontend | `updatePetition()` in `petitions.api.js` called `PATCH /petitions/:id` but backend endpoint is `PATCH /petitions/:id/status` — officer status updates would silently 404 | Critical | **Resolved** | Fixed URL in `frontend/src/api/petitions.api.js` |
| BUG-006 | Frontend | `markNotificationRead()` called `PATCH /notifications/:id` but backend endpoint is `PATCH /notifications/:id/read` | High | **Resolved** | Fixed URL in `frontend/src/api/notifications.api.js` |
| BUG-007 | Frontend | `markAllRead()` called `PATCH /notifications/read-all` which has no corresponding backend endpoint | Medium | **Resolved** | Removed `markAllRead` from `notifications.api.js` (feature not implemented in backend) |
| BUG-008 | Backend | Frontend's `admin.api.js` calls `/admin/departments` and `/admin/officers` — backend had no `/admin` router mounted | Critical | **Resolved** | Created `routers/admin.py` with CRUD for departments and officers; mounted at `/admin` in `main.py` |
| BUG-009 | Frontend | Frontend `.env` file did not exist (only `.env.example`). `axios` would fall back to `http://localhost:8000` correctly, but `.env` is required for explicit config | Low | **Resolved** | Created `frontend/.env` with `VITE_API_BASE_URL=http://localhost:8000` |
| BUG-010 | Docs | `FRONTEND_INTEGRATION_GUIDE.md` documents `confidence_score` and `duplicates[]` shape for `ai_analysis`, but actual frontend components correctly use `confidence`, `duplicate_ids[]`, and `similarity_scores[]` from the backend — guide was wrong | Low | **Resolved (doc-only)** | No code change needed; actual implementation is correct; recorded for documentation alignment |

---

## Severity Legend

| Level | Meaning |
|-------|---------|
| Critical | Blocks a core user flow (login, petition submit, officer review) |
| High | Feature broken but workaround exists |
| Medium | Minor functional regression |
| Low | Cosmetic or documentation only |

---

## Status Legend

| Status | Meaning |
|--------|---------|
| Open | Not yet addressed |
| In Progress | Being worked on |
| Resolved | Fix applied and verified |
| Closed | Verified by another team member |

---

## Issue Details

### BUG-004: Missing GET /auth/me
- **Steps to reproduce**: Start all services → open the app in browser → refresh the page while logged in → AuthContext calls `GET /auth/me` → 404 response → user is silently logged out
- **Expected**: 200 OK with user profile JSON
- **Actual**: 404 Not Found (endpoint did not exist)
- **Fix**: Added `@router.get("/me")` handler to `backend/routers/auth.py`

### BUG-005: Wrong PATCH URL for petition status update
- **Steps to reproduce**: Log in as officer → open a petition → change status → submit → network error visible in browser devtools (404)
- **Expected**: `PATCH /petitions/{id}/status` → 200 OK with updated petition
- **Actual**: `PATCH /petitions/{id}` → 405 Method Not Allowed
- **Fix**: Changed `api.patch(\`/petitions/${id}\`, data)` to `api.patch(\`/petitions/${id}/status\`, data)` in `petitions.api.js`

### BUG-006: Wrong PATCH URL for marking notification read
- **Steps to reproduce**: Click the "mark read" action on a notification in the UI → 404 in network tab
- **Expected**: `PATCH /notifications/{id}/read` → 200 OK
- **Actual**: `PATCH /notifications/{id}` → 404 Not Found
- **Fix**: Fixed URL in `notifications.api.js`

### BUG-007: Non-existent markAllRead endpoint
- **Steps to reproduce**: Any UI feature calling `markAllRead()` → network error
- **Expected**: Endpoint exists on backend
- **Actual**: No such endpoint in the backend
- **Fix**: Removed `markAllRead` from `notifications.api.js`. If needed in future, a `PATCH /notifications/read-all` endpoint must be added to the backend first.

### BUG-008: Missing /admin router
- **Steps to reproduce**: Log in as admin → navigate to `/admin/departments` or `/admin/officers` → all API calls return 404
- **Expected**: Lists of departments and officers returned
- **Actual**: 404 Not Found on all `/admin/*` routes
- **Fix**: Created `backend/routers/admin.py` with department and officer CRUD; mounted it in `main.py`