from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str

    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    # AI Service (Ollama pipeline — DO NOT use for chatbot)
    ai_service_url: str
    ollama_base_url: str

    # Server binding
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    # Storage
    upload_dir: str = "uploads"

    # CORS
    allowed_origins: str

    # ---------------------------------------------------------------
    # Chatbot & Vision (Gemini API) — completely independent from Ollama pipeline
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
    chroma_faq_path: str = "./chroma_faq_db"

    # Priority Escalation Configuration
    priority_threshold_medium: int = 2
    priority_threshold_high: int = 5
    priority_threshold_critical: int = 10

    # Location Verification
    location_verification_threshold_meters: float = 500.0

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

settings = Settings()
