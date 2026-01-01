"""
Centralized storage service for S3/MinIO operations.
Handles presigned URLs, uploads, downloads, and metadata retrieval.
"""

import hashlib
import os
from datetime import datetime, timedelta
from typing import Any, BinaryIO, Dict, Optional

from minio import Minio
from minio.error import S3Error

from utils.errors import StorageError


class StorageService:
    """
    Unified storage service for S3/MinIO.
    Centralizes all blob storage operations.
    """

    def __init__(
        self,
        minio_client: Minio,
        bucket_name: str,
        provider: str = "minio",
    ):
        """
        Initialize storage service.
        
        Args:
            minio_client: MinIO/S3 client
            bucket_name: Default bucket for operations
            provider: Storage provider name (minio, s3, gcs)
        """
        self.client = minio_client
        self.bucket = bucket_name
        self.provider = provider
        
        # Ensure bucket exists
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """Create bucket if it doesn't exist."""
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
        except S3Error as e:
            raise StorageError(f"Failed to create bucket: {str(e)}")

    # ===========================================
    # PRESIGNED URL GENERATION
    # ===========================================

    def get_presigned_upload_url(
        self,
        object_key: str,
        content_type: Optional[str] = None,
        expiry: timedelta = timedelta(hours=1),
    ) -> str:
        """
        Generate a presigned URL for direct upload from client.
        
        Args:
            object_key: S3 object key/path
            content_type: Optional MIME type
            expiry: URL expiration time
            
        Returns:
            Presigned upload URL (PUT)
        """
        try:
            url = self.client.presigned_put_object(
                bucket_name=self.bucket,
                object_name=object_key,
                expires=expiry,
            )
            return url
        except S3Error as e:
            raise StorageError(f"Failed to generate upload URL: {str(e)}")

    def get_presigned_download_url(
        self,
        object_key: str,
        expiry: timedelta = timedelta(hours=1),
        response_headers: Optional[Dict[str, str]] = None,
    ) -> str:
        """
        Generate a presigned URL for direct download from client.
        
        Args:
            object_key: S3 object key/path
            expiry: URL expiration time
            response_headers: Optional response headers (e.g., content-disposition)
            
        Returns:
            Presigned download URL (GET)
        """
        try:
            url = self.client.presigned_get_object(
                bucket_name=self.bucket,
                object_name=object_key,
                expires=expiry,
                response_headers=response_headers,
            )
            return url
        except S3Error as e:
            raise StorageError(f"Failed to generate download URL: {str(e)}")

    # ===========================================
    # FILE OPERATIONS
    # ===========================================

    async def upload_file(
        self,
        file: BinaryIO,
        object_key: str,
        content_type: str = "application/octet-stream",
        metadata: Optional[Dict[str, str]] = None,
    ) -> tuple[str, int]:
        """
        Upload file to S3/MinIO (server-side).
        
        Args:
            file: File object to upload
            object_key: S3 object key/path
            content_type: MIME type
            metadata: Optional metadata tags
            
        Returns:
            Tuple of (object_key, file_size)
        """
        try:
            # Get file size
            file.seek(0, 2)
            file_size = file.tell()
            file.seek(0)

            # Upload
            self.client.put_object(
                bucket_name=self.bucket,
                object_name=object_key,
                data=file,
                length=file_size,
                content_type=content_type,
                metadata=metadata or {},
            )

            return object_key, file_size

        except S3Error as e:
            raise StorageError(f"Failed to upload file: {str(e)}")

    async def download_file(self, object_key: str) -> bytes:
        """
        Download file from S3/MinIO.
        
        Args:
            object_key: S3 object key/path
            
        Returns:
            File content as bytes
        """
        try:
            response = self.client.get_object(
                bucket_name=self.bucket,
                object_name=object_key,
            )
            return response.read()

        except S3Error as e:
            raise StorageError(f"Failed to download file: {str(e)}")
        finally:
            if response:
                response.close()
                response.release_conn()

    def delete_file(self, object_key: str) -> bool:
        """
        Delete file from S3/MinIO.
        
        Args:
            object_key: S3 object key/path
            
        Returns:
            True if deleted successfully
        """
        try:
            self.client.remove_object(
                bucket_name=self.bucket,
                object_name=object_key,
            )
            return True

        except S3Error as e:
            raise StorageError(f"Failed to delete file: {str(e)}")

    def object_exists(self, object_key: str) -> bool:
        """Check if object exists in S3/MinIO."""
        try:
            self.client.stat_object(
                bucket_name=self.bucket,
                object_name=object_key,
            )
            return True
        except S3Error:
            return False

    def get_object_metadata(self, object_key: str) -> Dict[str, Any]:
        """
        Retrieve object metadata from S3/MinIO.
        
        Args:
            object_key: S3 object key/path
            
        Returns:
            Dict with size, etag, content_type, last_modified, metadata
        """
        try:
            stat = self.client.stat_object(
                bucket_name=self.bucket,
                object_name=object_key,
            )

            return {
                "size": stat.size,
                "etag": stat.etag,
                "content_type": stat.content_type,
                "last_modified": stat.last_modified,
                "metadata": stat.metadata or {},
            }

        except S3Error as e:
            raise StorageError(f"Failed to get object metadata: {str(e)}")

    # ===========================================
    # UTILITIES
    # ===========================================

    def generate_object_key(
        self,
        object_type: str,
        user_id: str,
        filename: str,
        subfolder: Optional[str] = None,
    ) -> str:
        """
        Generate a unique S3 object key.
        
        Pattern: {object_type}/{user_id}/{subfolder}/{timestamp}_{filename}
        
        Args:
            object_type: Type of object (datasets, models, artifacts)
            user_id: User ID
            filename: Original filename
            subfolder: Optional subfolder (project_id, etc.)
            
        Returns:
            S3 object key
        """
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        
        parts = [object_type, user_id]
        if subfolder:
            parts.append(subfolder)
        parts.append(f"{timestamp}_{filename}")
        
        return "/".join(parts)

    @staticmethod
    def compute_checksum(file: BinaryIO, algorithm: str = "md5") -> str:
        """
        Compute checksum of file.
        
        Args:
            file: File object
            algorithm: Hash algorithm (md5, sha256)
            
        Returns:
            Hex digest of file content
        """
        file.seek(0)
        
        if algorithm == "md5":
            hasher = hashlib.md5()
        elif algorithm == "sha256":
            hasher = hashlib.sha256()
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
        
        for chunk in iter(lambda: file.read(8192), b""):
            hasher.update(chunk)
        
        file.seek(0)
        return hasher.hexdigest()


def get_storage_service(
    minio_client: Minio,
    bucket_name: str,
    provider: str = "minio",
) -> StorageService:
    """Factory function to get storage service instance."""
    return StorageService(minio_client, bucket_name, provider)
