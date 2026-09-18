"""
backend/services/storage/__init__.py – Factory for file & image storage providers.
"""
from __future__ import annotations

import logging
from config import settings
from .base import BaseStorageProvider
from .local import LocalStorageProvider

logger = logging.getLogger(__name__)

_storage_provider: BaseStorageProvider | None = None


def get_storage_provider() -> BaseStorageProvider:
    """
    Returns the configured storage provider (singleton).
    Configurable via STORAGE_PROVIDER in .env:
    - 'local' (default): stores in local filesystem (settings.upload_dir)
    - 's3': AWS S3, Cloudflare R2, MinIO
    - 'supabase': Supabase Storage REST API
    """
    global _storage_provider
    if _storage_provider is None:
        provider_name = getattr(settings, "storage_provider", "local").lower().strip()

        if provider_name == "s3":
            from .s3 import S3StorageProvider
            _storage_provider = S3StorageProvider()
            logger.info("Initialized S3StorageProvider")
        elif provider_name == "supabase":
            from .supabase import SupabaseStorageProvider
            _storage_provider = SupabaseStorageProvider()
            logger.info("Initialized SupabaseStorageProvider")
        else:
            _storage_provider = LocalStorageProvider()
            logger.info("Initialized LocalStorageProvider (path=%s)", settings.upload_dir)

    return _storage_provider
