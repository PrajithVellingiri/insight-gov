"""
config.py – Centralised configuration for the InsightGov AI service.

All values are read from environment variables (or a .env file loaded by python-dotenv).
No hard-coded secrets. Adjust defaults via your .env file.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# --- Ollama ---
OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_LLM_MODEL: str = os.getenv("OLLAMA_LLM_MODEL", "qwen3:8b")
OLLAMA_EMBED_MODEL: str = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")

# --- ChromaDB ---
CHROMA_PERSIST_DIR: str = os.getenv("CHROMA_PERSIST_DIR", "./chroma_data")

# --- Duplicate detection ---
DUPLICATE_THRESHOLD: float = float(os.getenv("DUPLICATE_THRESHOLD", "0.85"))

# --- Service ---
AI_PORT: int = int(os.getenv("AI_PORT", "8001"))
