"""
backend/services/storage/supabase.py – Supabase Storage API provider.
Uploads and retrieves files directly to/from a private Supabase Storage bucket via its REST API.
"""
from __future__ import annotations

import logging
from pathlib import Path
import urllib.parse
import httpx

from .base import (
    BaseStorageProvider,
    StorageConfigurationError,
    StorageUploadError,
    StorageDeleteError,
)
from config import settings

logger = logging.getLogger(__name__)


class SupabaseStorageProvider(BaseStorageProvider):
    """
    Stores and retrieves files using Supabase Storage REST API.
    Designed for private buckets authenticated via the Supabase Service Role Key.
    """

    def __init__(self) -> None:
        self.bucket = getattr(settings, "storage_bucket", "petition-evidence")
        raw_url = getattr(settings, "supabase_url", "") or getattr(settings, "storage_url", "")
        self.supabase_url = raw_url.rstrip("/")
        self.service_role_key = (
            getattr(settings, "supabase_service_role_key", "")
            or getattr(settings, "supabase_key", "")
            or getattr(settings, "storage_api_key", "")
        )

        if not (self.supabase_url and self.service_role_key):
            logger.warning(
                "Supabase Storage credentials (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) are not configured."
            )

    def _ensure_configured(self) -> None:
        if not (self.supabase_url and self.service_role_key):
            raise StorageConfigurationError(
                "Supabase Storage credentials (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are missing."
            )

    def _headers(self, content_type: str | None = None) -> dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self.service_role_key}",
            "apikey": self.service_role_key,
        }
        if content_type:
            headers["Content-Type"] = content_type
        return headers

    def _clean_path(self, destination_path: str) -> str:
        # Strip leading slashes, backslashes, and accidental bucket prefix
        clean = destination_path.replace("\\", "/").lstrip("/")
        if clean.startswith(f"{self.bucket}/"):
            clean = clean[len(self.bucket) + 1:].lstrip("/")
        return clean

    def _encode_path(self, clean_path: str) -> str:
        # URL-encode each path component safely
        parts = clean_path.split("/")
        return "/".join(urllib.parse.quote(part, safe="") for part in parts)

    async def save_file(
        self, content: bytes, destination_path: str, content_type: str = "image/jpeg"
    ) -> str:
        """
        Uploads file bytes to the private Supabase Storage bucket.
        Returns the object key inside the bucket (e.g. '<petition_id>/petition/<unique_uuid>.jpg').
        """
        self._ensure_configured()
        clean_path = self._clean_path(destination_path)
        encoded_path = self._encode_path(clean_path)

        url = f"{self.supabase_url}/storage/v1/object/{self.bucket}/{encoded_path}"
        headers = self._headers(content_type)
        headers["x-upsert"] = "true"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, headers=headers, content=content)
                if resp.status_code not in (200, 201):
                    logger.error(
                        "Supabase storage upload failed with status %d for path '%s': %s",
                        resp.status_code,
                        clean_path,
                        resp.text,
                    )
                    raise StorageUploadError(
                        f"Supabase upload failed for '{clean_path}' (HTTP {resp.status_code})."
                    )
            logger.info("Successfully uploaded %s to Supabase bucket '%s'", clean_path, self.bucket)
            return clean_path
        except StorageUploadError:
            raise
        except Exception as e:
            logger.error("Supabase storage upload exception for '%s': %s", clean_path, str(e))
            raise StorageUploadError(f"Failed to upload '{clean_path}' to Supabase: {str(e)}") from e

    async def get_signed_url(self, stored_path: str, expires_in: int = 3600) -> str | None:
        """
        Generates a time-limited signed URL (default: 1 hour) for secure client-side retrieval
        from the private Supabase Storage bucket.
        """
        self._ensure_configured()
        clean_path = self._clean_path(stored_path)
        encoded_path = self._encode_path(clean_path)

        url = f"{self.supabase_url}/storage/v1/object/sign/{self.bucket}/{encoded_path}"
        headers = self._headers("application/json")
        payload = {"expiresIn": expires_in}

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code != 200:
                    logger.error(
                        "Failed to generate signed URL for '%s' (status %d): %s",
                        clean_path,
                        resp.status_code,
                        resp.text,
                    )
                    return None
                data = resp.json()
                signed_path = data.get("signedURL") or data.get("signedUrl")
                if not signed_path:
                    logger.error("No signedURL returned in Supabase response: %s", data)
                    return None

                # Assemble complete URL
                if signed_path.startswith("http://") or signed_path.startswith("https://"):
                    return signed_path
                if signed_path.startswith("/storage/v1/"):
                    return f"{self.supabase_url}{signed_path}"
                if signed_path.startswith("/"):
                    return f"{self.supabase_url}/storage/v1{signed_path}"
                return f"{self.supabase_url}/storage/v1/{signed_path}"
        except Exception as e:
            logger.warning("Exception generating Supabase signed URL for '%s': %s", clean_path, str(e))
            return None

    async def get_file_bytes(self, stored_path: str) -> bytes | None:
        """
        Downloads the raw file bytes using the service role key from the private bucket.
        """
        self._ensure_configured()
        clean_path = self._clean_path(stored_path)
        encoded_path = self._encode_path(clean_path)

        url = f"{self.supabase_url}/storage/v1/object/authenticated/{self.bucket}/{encoded_path}"
        headers = self._headers()

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    return resp.content
                # Fallback to direct object endpoint with auth header
                alt_url = f"{self.supabase_url}/storage/v1/object/{self.bucket}/{encoded_path}"
                alt_resp = await client.get(alt_url, headers=headers)
                if alt_resp.status_code == 200:
                    return alt_resp.content
                logger.warning(
                    "Supabase get_file_bytes failed for '%s' (status %d)",
                    clean_path,
                    resp.status_code,
                )
        except Exception as e:
            logger.warning("Exception fetching bytes from Supabase for '%s': %s", clean_path, str(e))
        return None

    def get_local_path(self, stored_path: str) -> Path | None:
        """Supabase Storage does not store files on the local filesystem."""
        return None

    async def file_exists(self, stored_path: str) -> bool:
        bytes_data = await self.get_file_bytes(stored_path)
        return bytes_data is not None

    async def delete_file(self, stored_path: str) -> bool:
        """
        Deletes a single object from the private Supabase Storage bucket.
        """
        self._ensure_configured()
        clean_path = self._clean_path(stored_path)

        url = f"{self.supabase_url}/storage/v1/object/{self.bucket}"
        headers = self._headers("application/json")

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.request(
                    "DELETE", url, headers=headers, json={"prefixes": [clean_path]}
                )
                if resp.status_code in (200, 204):
                    logger.info("Deleted %s from Supabase bucket '%s'", clean_path, self.bucket)
                    return True
                logger.warning(
                    "Failed to delete %s from Supabase (status %d): %s",
                    clean_path,
                    resp.status_code,
                    resp.text,
                )
                return False
        except Exception as e:
            logger.error("Exception deleting %s from Supabase: %s", clean_path, str(e))
            return False
