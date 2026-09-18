"""
backend/services/storage/supabase.py – Supabase Storage API provider.
Uploads files directly to Supabase Storage bucket via its REST API.
"""
from __future__ import annotations

import logging
from pathlib import Path
import httpx

from .base import BaseStorageProvider
from config import settings

logger = logging.getLogger(__name__)


class SupabaseStorageProvider(BaseStorageProvider):
    """
    Stores and retrieves files using Supabase Storage REST API.
    Requires SUPABASE_URL (or STORAGE_URL) and SUPABASE_KEY (or STORAGE_API_KEY).
    """

    def __init__(self) -> None:
        self.bucket = getattr(settings, "storage_bucket", "petition-images")
        raw_url = getattr(settings, "storage_url", "") or getattr(settings, "supabase_url", "")
        self.supabase_url = raw_url.rstrip("/")
        self.api_key = getattr(settings, "storage_api_key", "") or getattr(settings, "supabase_key", "")

        from .local import LocalStorageProvider
        self._local_fallback = LocalStorageProvider()

    async def save_file(self, content: bytes, destination_path: str, content_type: str = "image/jpeg") -> str:
        clean_path = destination_path.replace("\\", "/").lstrip("/")

        if not (self.supabase_url and self.api_key):
            logger.info("Supabase storage credentials not configured; using local storage fallback.")
            return await self._local_fallback.save_file(content, clean_path, content_type)

        url = f"{self.supabase_url}/storage/v1/object/{self.bucket}/{clean_path}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "apiKey": self.api_key,
            "Content-Type": content_type,
            "x-upsert": "true",
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, headers=headers, content=content)
                resp.raise_for_status()
            logger.info("Uploaded %s to Supabase storage bucket %s", clean_path, self.bucket)
            # Save local copy for fast read caching
            await self._local_fallback.save_file(content, clean_path, content_type)
            return clean_path
        except Exception as e:
            logger.error("Supabase upload failed for %s (%s); storing locally", clean_path, e)
            return await self._local_fallback.save_file(content, clean_path, content_type)

    async def get_file_bytes(self, stored_path: str) -> bytes | None:
        clean_path = stored_path.replace("\\", "/").lstrip("/")
        # Check local cache first
        local_bytes = await self._local_fallback.get_file_bytes(clean_path)
        if local_bytes:
            return local_bytes

        if not (self.supabase_url and self.api_key):
            return None

        url = f"{self.supabase_url}/storage/v1/object/public/{self.bucket}/{clean_path}"
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    return resp.content
        except Exception as e:
            logger.warning("Failed to fetch from Supabase Storage: %s", e)
        return None

    def get_local_path(self, stored_path: str) -> Path | None:
        return self._local_fallback.get_local_path(stored_path)

    async def file_exists(self, stored_path: str) -> bool:
        clean_path = stored_path.replace("\\", "/").lstrip("/")
        if await self._local_fallback.file_exists(clean_path):
            return True
        bytes_data = await self.get_file_bytes(clean_path)
        return bytes_data is not None

    async def delete_file(self, stored_path: str) -> bool:
        clean_path = stored_path.replace("\\", "/").lstrip("/")
        await self._local_fallback.delete_file(clean_path)
        if not (self.supabase_url and self.api_key):
            return True

        url = f"{self.supabase_url}/storage/v1/object/{self.bucket}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "apiKey": self.api_key,
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.request("DELETE", url, headers=headers, json={"prefixes": [clean_path]})
            return True
        except Exception:
            return False
