# InsightGov AI 🏛️🤖

InsightGov AI is an intelligent, modern petition and grievance management platform designed to streamline communication between citizens and government departments. 

By leveraging local Artificial Intelligence (Ollama) and Vector Search (ChromaDB), InsightGov automatically categorizes, prioritizes, and routes citizen complaints to the correct department, while instantly detecting duplicate submissions via geospatial mapping.

## ✨ Key Features

- **Local AI Triage:** Petitions are analyzed instantly by a local Large Language Model (e.g., Llama 3) to predict the category, priority, and generate a concise summary.
- **Deterministic Department Routing:** AI-generated categories are strictly mapped to official state departments, eliminating LLM hallucination and ensuring grievances always reach a real inbox.
- **Geospatial Duplicate Detection:** Employs a strict two-factor duplication check. If a new petition is submitted within a **200-meter radius** of an existing petition, and shares high semantic title similarity, it is instantly flagged as a duplicate.
- **Role-Based Dashboards:** 
  - **Citizens** can submit map-based petitions and track status live.
  - **Officers** can review petitions, view AI explanations, and manually override AI routing if necessary.
  - **Admins** have access to platform-wide analytics, department distribution charts, and officer management.
- **Explainable Decisions:** Officers are provided with a full JSON-structured breakdown of *why* the AI chose a specific priority and department, keeping a "human in the loop".
- **Real-Time Notifications:** Dynamic, in-app notification dropdown for tracking petition status updates and departmental re-routings.

## 🏗️ Architecture

InsightGov utilizes a decoupled 3-tier microservice architecture:

1. **Frontend (React.js):** A Vite-powered React SPA using TailwindCSS for styling and Recharts for admin analytics. 
2. **Core Backend (FastAPI):** Manages user authentication (JWT), PostgreSQL database interactions (via SQLAlchemy), and business logic.
3. **AI Service (FastAPI):** A dedicated, stateless microservice that orchestrates the local Ollama LLM and ChromaDB vector store. This separation allows the AI service to run on heavy GPU hardware independently of the core API.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide React, TanStack Query, React Router v6.
- **Backend:** Python 3.10+, FastAPI, SQLAlchemy (Asyncpg), PostgreSQL.
- **AI Service:** Python 3.10+, FastAPI, HTTPX, ChromaDB, Ollama (`llama3` / `nomic-embed-text`).

## 🚀 Getting Started

### Prerequisites
- PostgreSQL running locally.
- Node.js (v18+)
- Python 3.10+
- [Ollama](https://ollama.com/) installed and running.

### 1. Start Ollama Models
Ensure your local Ollama instance has the required models:
```bash
ollama pull llama3
ollama pull nomic-embed-text
```

### 2. Setup the Core Backend
1. Create a PostgreSQL database named `insightgov`.
2. Open a terminal and setup the backend:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
python seed.py  # Generates the Admin account and 42 generic departments
uvicorn main:app --reload --port 8000
```

### 3. Setup the AI Service
Open a second terminal:
```bash
cd ai
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### 4. Setup the Frontend
Open a third terminal:
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173` to view the application!

## 🔐 Authentication
The `seed.py` script automatically creates an admin account for you to use out of the box. 
**Citizen accounts** can be registered freely via the public `/register` portal.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License
This project is open-source and available under the MIT License.
