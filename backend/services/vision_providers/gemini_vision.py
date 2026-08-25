import json
import logging
from typing import Any

from google import genai
from google.genai import types

from config import settings
from services.vision_providers.base import VisionProvider

logger = logging.getLogger(__name__)

class GeminiVisionProvider(VisionProvider):
    """
    Implements VisionProvider using the Google Gemini API (google-genai SDK).
    Specifically uses gemini-3.5-flash-lite for lightweight, fast image intelligence.
    """

    def __init__(self) -> None:
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is missing. Cannot initialize GeminiVisionProvider.")

        self._client = genai.Client(api_key=settings.gemini_api_key)
        self._model = settings.vision_ai_model or "gemini-3.5-flash-lite"

    async def analyze_image(self, image_bytes: bytes, mime_type: str, context_text: str) -> dict[str, Any]:
        """
        Send image and petition context to Gemini to extract visual evidence.
        """
        system_prompt = (
            "You are an AI assistant helping a municipal government analyze citizen-submitted photos of civic issues. "
            "You will be given the petition text and an uploaded image. "
            "Your task is to analyze the image to determine if it provides visual evidence for the issue described in the text.\n\n"
            "Return a JSON object with EXACTLY these keys:\n"
            "- problem_detected (string): Very brief summary (2-5 words) of the main issue visible in the photo.\n"
            "- visual_evidence (string): A clear, concise description (1-3 sentences) of what is physically visible in the image that supports or contradicts the petition. Do NOT invent details.\n"
            "- relevance (string): One of ['high', 'medium', 'low', 'irrelevant']. Rate how well the image supports the petition text.\n\n"
            "If the image is completely unrelated to the text, set relevance to 'irrelevant' and explain why in visual_evidence. "
            "DO NOT return markdown formatting for the JSON block, just the raw JSON."
        )

        user_prompt = f"Petition Context:\n{context_text}\n\nPlease analyze the provided image."

        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.1,
            response_mime_type="application/json",
        )

        contents = [
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            user_prompt,
        ]

        try:
            # Note: We must use generate_content since we are passing a single prompt with an image.
            # Using async generation (aio).
            response = await self._client.aio.models.generate_content(
                model=self._model,
                contents=contents,
                config=config,
            )

            # Attempt to parse JSON response
            text_response = response.text.strip()
            # If the model wraps it in markdown code blocks despite instructions, clean it up
            if text_response.startswith("```json"):
                text_response = text_response[7:]
            if text_response.startswith("```"):
                text_response = text_response[3:]
            if text_response.endswith("```"):
                text_response = text_response[:-3]

            result = json.loads(text_response.strip())
            return {
                "problem_detected": result.get("problem_detected", ""),
                "visual_evidence": result.get("visual_evidence", ""),
                "relevance": result.get("relevance", "low"),
            }

        except Exception as exc:
            logger.error(f"Gemini Vision API error: {exc}")
            # Do not throw an error, fail gracefully to allow petition submission to continue.
            return {}
