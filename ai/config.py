"""
config.py – Centralised configuration for the InsightGov AI service.

All values are read from environment variables (or a .env file loaded by python-dotenv).
No hard-coded secrets. Adjust defaults via your .env file.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# --- Hosted LLM Provider ---
LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini").lower()
LLM_API_KEY: str = os.getenv("LLM_API_KEY") or os.getenv("GEMINI_API_KEY", "")
LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-3.1-flash-lite")
LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "")

# --- Hosted Embedding Provider ---
EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "gemini").lower()
EMBEDDING_API_KEY: str = os.getenv("EMBEDDING_API_KEY") or os.getenv("LLM_API_KEY") or os.getenv("GEMINI_API_KEY", "")
EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "gemini-embedding-001")
EMBEDDING_BASE_URL: str = os.getenv("EMBEDDING_BASE_URL", "")

# --- Legacy Ollama (optional fallback for local dev) ---
OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_LLM_MODEL: str = os.getenv("OLLAMA_LLM_MODEL", "qwen3:8b")
OLLAMA_EMBED_MODEL: str = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")

# --- ChromaDB ---
CHROMA_PERSIST_DIR: str = os.getenv("CHROMA_PERSIST_DIR", "./chroma_data")

# --- Duplicate detection ---
DUPLICATE_THRESHOLD: float = float(os.getenv("DUPLICATE_THRESHOLD", "0.85"))

# --- Service ---
AI_HOST: str = os.getenv("AI_HOST", "0.0.0.0")
AI_PORT: int = int(os.getenv("AI_PORT", "8001"))

# --- Database ---
DATABASE_URL: str = os.getenv("DATABASE_URL")

