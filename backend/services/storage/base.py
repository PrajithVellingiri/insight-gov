"""
backend/services/storage/base.py – Abstract Base Class for file & image storage.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path


class BaseStorageProvider(ABC):
    """Abstract interface for storing and retrieving uploaded petition files and resolution proofs."""

    @abstractmethod
    async def save_file(self, content: bytes, destination_path: str, content_type: str = "image/jpeg") -> str:
        """
        Save file bytes to the storage backend.

        Args:
            content: Raw file bytes.
            destination_path: Relative storage path (e.g. 'petition_images/<id>/image.jpg').
            content_type: MIME type of the file.

        Returns:
            The normalized stored path or URL.
        """
        pass

    @abstractmethod
    async def get_file_bytes(self, stored_path: str) -> bytes | None:
        """Retrieve raw file bytes from storage."""
        pass

    @abstractmethod
    def get_local_path(self, stored_path: str) -> Path | None:
        """Return a local Path if the provider stores files on local disk (for FileResponse)."""
        pass

    @abstractmethod
    async def file_exists(self, stored_path: str) -> bool:
        """Check if a file exists at the given path."""
        pass

    @abstractmethod
    async def delete_file(self, stored_path: str) -> bool:
        """Delete a file from storage."""
        pass

    def get_public_url(self, stored_path: str) -> str | None:
        """Return a direct public/signed URL if supported by the provider, else None."""
        return None
