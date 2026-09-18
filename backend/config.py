from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/insightgov"

    # JWT
    secret_key: str = "dev_secret_key_insightgov_change_in_production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    # AI Service (Microservice URL)
    ai_service_url: str = "http://localhost:8001"
    ollama_base_url: str = "http://localhost:11434"

    # Server binding
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    # Storage
    upload_dir: str = "uploads"

    # CORS
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    # ---------------------------------------------------------------
    # Hosted LLM & Embeddings Configuration
    # ---------------------------------------------------------------
    llm_provider: str = "gemini"                         # gemini | openai | grok | ollama
    llm_api_key: str = ""
    llm_model: str = "gemini-3.1-flash-lite"
    llm_base_url: str = ""

    embedding_provider: str = "gemini"                   # gemini | openai | ollama
    embedding_api_key: str = ""
    embedding_model: str = "gemini-embedding-001"
    embedding_base_url: str = ""

    # RAG Configuration
    rag_top_k: int = 3
    rag_similarity_threshold: float = 0.55
    rag_max_context_chars: int = 3500
    chroma_faq_path: str = "./chroma_faq_db"

    # ---------------------------------------------------------------
    # Chatbot & Vision (Gemini API)
    # ---------------------------------------------------------------
    gemini_api_key: str = ""                             # GEMINI_API_KEY
    chat_provider: str = "gemini"                        # gemini | grok (legacy) | openai | claude
    chat_model: str = "gemini-3.1-flash-lite"
    vision_ai_provider: str = "gemini"                   # VISION_AI_PROVIDER
    vision_ai_model: str = "gemini-3.5-flash-lite"       # VISION_AI_MODEL

    # Legacy Grok support (kept for optional fallback, not actively used)
    grok_api_key: str = ""
    grok_api_base_url: str = "https://api.x.ai/v1"
    chat_max_tokens: int = 800
    chat_temperature: float = 0.7
    chat_context_window: int = 10                       # number of conversation turns
    chat_rate_limit_anon: int = 20                      # messages per hour (anonymous)
    chat_rate_limit_user: int = 100                     # messages per hour (authenticated)
    chat_session_ttl_hours: int = 24
    chat_stream_timeout: int = 60
    chat_compression_threshold: int = 20               # turns before compression kicks in

    # Priority Escalation Configuration
    priority_threshold_medium: int = 2
    priority_threshold_high: int = 5
    priority_threshold_critical: int = 10

    # Location Verification
    location_verification_threshold_meters: float = 500.0

    # Analytics Demo Mode
    demo_mode: bool = False

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    model_config = {
        "env_file": [".env", str(Path(__file__).resolve().parent / ".env")],
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

settings = Settings()
