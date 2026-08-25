from abc import ABC, abstractmethod
from typing import Any

class VisionProvider(ABC):
    """
    Abstract base class for vision intelligence providers.
    Allows swapping between different vision models (e.g., Gemini) without
    changing core petition analysis business logic.
    """

    @abstractmethod
    async def analyze_image(self, image_bytes: bytes, mime_type: str, context_text: str) -> dict[str, Any]:
        """
        Analyze an image given some text context (title + description).

        Args:
            image_bytes: Raw bytes of the image file.
            mime_type: MIME type (e.g., 'image/jpeg').
            context_text: The petition text to provide context for relevance.

        Returns:
            A dictionary containing structured image analysis results.
            Expected keys (though providers may vary):
                - relevance: str ("high", "medium", "low", "irrelevant")
                - visual_evidence: str (Detailed description of visual evidence)
                - problem_detected: str (Short summary of the core issue seen)
        """
        pass
