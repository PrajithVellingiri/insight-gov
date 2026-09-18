"""
backend/services/storage/s3.py – S3-compatible object storage provider.
Supports AWS S3, Cloudflare R2, MinIO, and Supabase Storage (S3 API).
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any
import httpx

from .base import BaseStorageProvider
from config import settings

logger = logging.getLogger(__name__)


class S3StorageProvider(BaseStorageProvider):
    """
    S3 and S3-compatible cloud object storage provider.
    Falls back gracefully to local storage if credentials are not configured.
    """

    def __init__(self) -> None:
        self.bucket = getattr(settings, "storage_bucket", "insightgov-uploads")
        self.endpoint_url = getattr(settings, "storage_url", "").rstrip("/")
        self.access_key = getattr(settings, "storage_api_key", "")
        self.secret_key = getattr(settings, "storage_secret_key", "")
        self.region = getattr(settings, "storage_region", "auto")

        # Fallback local cache
        from .local import LocalStorageProvider
        self._local_fallback = LocalStorageProvider()

    async def save_file(self, content: bytes, destination_path: str, content_type: str = "image/jpeg") -> str:
        clean_path = destination_path.replace("\\", "/").lstrip("/")

        if not (self.endpoint_url and self.access_key and self.secret_key):
            logger.info("S3 credentials not fully configured; using local storage fallback.")
            return await self._local_fallback.save_file(content, clean_path, content_type)

        try:
            # If boto3 is available, use it
            import boto3
            from botocore.config import Config

            s3_client = boto3.client(
                "s3",
                endpoint_url=self.endpoint_url if self.endpoint_url else None,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                region_name=self.region,
                config=Config(signature_version="s3v4"),
            )
            s3_client.put_object(
                Bucket=self.bucket,
                Key=clean_path,
                Body=content,
                ContentType=content_type,
            )
            logger.info("Uploaded %s to S3 bucket %s", clean_path, self.bucket)
            return clean_path
        except ImportError:
            # If boto3 not installed, store locally and log recommendation
            logger.warning("boto3 not installed; storing locally under %s", clean_path)
            return await self._local_fallback.save_file(content, clean_path, content_type)
        except Exception as e:
            logger.error("Failed to upload to S3 (%s); falling back to local: %s", clean_path, e)
            return await self._local_fallback.save_file(content, clean_path, content_type)

    async def get_file_bytes(self, stored_path: str) -> bytes | None:
        clean_path = stored_path.replace("\\", "/").lstrip("/")
        try:
            import boto3
            s3_client = boto3.client(
                "s3",
                endpoint_url=self.endpoint_url if self.endpoint_url else None,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                region_name=self.region,
            )
            resp = s3_client.get_object(Bucket=self.bucket, Key=clean_path)
            return resp["Body"].read()
        except Exception:
            return await self._local_fallback.get_file_bytes(clean_path)

    def get_local_path(self, stored_path: str) -> Path | None:
        return self._local_fallback.get_local_path(stored_path)

    async def file_exists(self, stored_path: str) -> bool:
        clean_path = stored_path.replace("\\", "/").lstrip("/")
        try:
            import boto3
            s3_client = boto3.client(
                "s3",
                endpoint_url=self.endpoint_url if self.endpoint_url else None,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                region_name=self.region,
            )
            s3_client.head_object(Bucket=self.bucket, Key=clean_path)
            return True
        except Exception:
            return await self._local_fallback.file_exists(clean_path)

    async def delete_file(self, stored_path: str) -> bool:
        clean_path = stored_path.replace("\\", "/").lstrip("/")
        try:
            import boto3
            s3_client = boto3.client("s3", endpoint_url=self.endpoint_url, aws_access_key_id=self.access_key, aws_secret_access_key=self.secret_key)
            s3_client.delete_object(Bucket=self.bucket, Key=clean_path)
            return True
        except Exception:
            return await self._local_fallback.delete_file(clean_path)
