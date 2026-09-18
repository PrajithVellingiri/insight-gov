"""
backend/services/storage/local.py – Local disk storage provider.
"""
from __future__ import annotations

import os
from pathlib import Path

from .base import BaseStorageProvider
from config import settings


class LocalStorageProvider(BaseStorageProvider):
    """Stores files on the local filesystem under settings.upload_dir."""

    def __init__(self, base_dir: str | Path | None = None) -> None:
        self.base_dir = Path(base_dir or settings.upload_dir).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _resolve(self, stored_path: str) -> Path:
        clean = stored_path.replace("\\", "/").lstrip("/")
        if clean.startswith("uploads/"):
            clean = clean[len("uploads/"):]
        return (self.base_dir / clean).resolve()

    async def save_file(self, content: bytes, destination_path: str, content_type: str = "image/jpeg") -> str:
        target = self._resolve(destination_path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
        # Return standardized relative path
        rel = destination_path.replace("\\", "/").lstrip("/")
        if rel.startswith("uploads/"):
            rel = rel[len("uploads/"):]
        return rel

    async def get_file_bytes(self, stored_path: str) -> bytes | None:
        target = self._resolve(stored_path)
        if target.is_file():
            return target.read_bytes()
        return None

    def get_local_path(self, stored_path: str) -> Path | None:
        target = self._resolve(stored_path)
        if target.is_file():
            return target
        return None

    async def file_exists(self, stored_path: str) -> bool:
        target = self._resolve(stored_path)
        return target.is_file()

    async def delete_file(self, stored_path: str) -> bool:
        target = self._resolve(stored_path)
        if target.is_file():
            target.unlink()
            return True
        return False
