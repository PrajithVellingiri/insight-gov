# InsightGov AI - Project Specification

## Project Overview

InsightGov AI is an AI-powered Decision Intelligence Platform that helps government departments manage citizen petitions more efficiently.

The platform collects citizen complaints, analyzes them using AI, detects duplicate petitions, prioritizes urgency, routes them to the correct department, and provides explainable recommendations to government officers.

The AI assists officers in decision-making. Final decisions are always made by humans.

---

# Objectives

- Reduce manual workload
- Detect duplicate petitions
- Prioritize urgent issues
- Route petitions automatically
- Generate executive summaries
- Provide explainable AI decisions
- Visualize trends through dashboards

---

# User Roles

## Citizen

- Register/Login
- Submit Petition
- Track Petition Status
- Receive Updates

## Government Officer

- Login
- Review Assigned Petitions
- View AI Analysis
- Accept or Override AI Suggestions
- Update Petition Status

## Administrator

- Manage Departments
- Manage Officers
- View Analytics
- Monitor Platform

---

# Core Features

- Authentication
- Petition Submission
- AI Petition Analysis
- Duplicate Detection
- Priority Prediction
- Department Routing
- Petition Tracking
- Dashboards
- Analytics
- Notifications

---

# Technology Stack

Frontend

- React
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- React Query
- Leaflet
- Recharts

Backend

- FastAPI
- PostgreSQL
- SQLAlchemy
- JWT Authentication

AI

- Ollama
- Qwen3-8B-Instruct
- nomic-embed-text
- ChromaDB

Deployment

- Frontend → Vercel
- Backend → Railway
- Database → Supabase

---

# Development Principles

- Modular Architecture
- Explainable AI
- Clean Code
- Production Ready
- Scalable Design
- Reusable Components
- Stateless APIs
- Documentation First