# InsightGov AI — Integration Guide

## Objective

Integrate the AI Service, Backend, and Frontend into one working application.

---

## Integration Order

Phase 1

AI

↓

Backend

Verify

GET /health

POST /ai/analyze

POST /ai/search

---

Phase 2

Backend

↓

Frontend

Verify

Authentication

Petitions

Dashboard

Analytics

Notifications

---

Phase 3

Complete Flow

Citizen

↓

Frontend

↓

Backend

↓

AI

↓

Backend

↓

Frontend

↓

Officer

---

## Integration Checklist

### AI

☐ Health

☐ Analyze

☐ Search

☐ Duplicate Detection

---

### Backend

☐ Database

☐ JWT

☐ CRUD

☐ AI Calls

---

### Frontend

☐ Login

☐ Register

☐ Petition Form

☐ Dashboard

☐ Analytics

☐ AI Display

---

### End-to-End

☐ Citizen Submission

☐ AI Analysis

☐ Officer Review

☐ Status Update

☐ Notification

---

## Success Criteria

All APIs respond successfully.

No console errors.

No backend exceptions.

AI analysis displayed correctly.

All user roles functional.

Responsive UI.

Demo ready.