import logging
from typing import Optional

from config import settings
from services.vision_providers.base import VisionProvider
from services.vision_providers.gemini_vision import GeminiVisionProvider

logger = logging.getLogger(__name__)

# Cache the instance to avoid re-instantiating the provider repeatedly.
_vision_provider_instance: Optional[VisionProvider] = None

def get_vision_provider() -> VisionProvider:
    """
    Factory function to get the configured vision provider instance.
    Uses the VISION_AI_PROVIDER environment variable to determine which provider to use.
    """
    global _vision_provider_instance

    if _vision_provider_instance is not None:
        return _vision_provider_instance

    provider_name = settings.vision_ai_provider.lower()

    try:
        if provider_name == "gemini":
            _vision_provider_instance = GeminiVisionProvider()
        else:
            logger.warning(
                f"Unknown VISION_AI_PROVIDER '{provider_name}'. Falling back to Gemini."
            )
            _vision_provider_instance = GeminiVisionProvider()
    except Exception as exc:
        logger.error(f"Failed to initialize vision provider '{provider_name}': {exc}")
        # In case of initialization failure, we could return a dummy provider or re-raise
        # We will re-raise so the application fails fast if configured improperly, 
        # or we could let the caller handle it.
        raise

    return _vision_provider_instance
