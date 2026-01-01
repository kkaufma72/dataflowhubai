"""
Refactored data management service using StorageService.
Stores only metadata in Postgres, artifacts in S3/MinIO.
"""

import io
import uuid
from datetime import datetime, timedelta
from typing import Any, BinaryIO, Dict, List, Optional

import pandas as pd
from minio import Minio

from schemas.dataset import (
    Dataset,
    DatasetMetadata,
    DatasetProfileResponse,
    UploadResponse,
    PresignedUploadResponse,
    PresignedUploadRequest,
    DownloadUrlResponse,
    ConfirmUploadRequest,
)
from services.storage_service import StorageService
from utils.errors import NotFoundError, StorageError, ValidationError


class DataServiceRefactored:
    """
    Refactored service for managing datasets.
    Uses StorageService for S3/MinIO operations and presigned URLs.
    """

    def __init__(self, storage_service: StorageService):
        self.storage = storage_service

    # ===========================================
    # PRESIGNED URL WORKFLOW (Recommended)
    # ===========================================

    async def get_upload_url(
        self,
        request: PresignedUploadRequest,
        user_id: str,
        project_id: Optional[str] = None,
    ) -> PresignedUploadResponse:
        """
        Generate a presigned URL for client-side upload.
        
        Workflow:
        1. Client calls this endpoint
        2. Client uploads directly to S3 using returned URL
        3. Client calls confirm_upload() to finalize metadata
        
        Args:
            request: Upload request with filename and metadata
            user_id: User ID
            project_id: Optional project ID
            
        Returns:
            PresignedUploadResponse with upload URL and dataset ID
        """
        # Validate file extension
        if not any(request.filename.endswith(ext) for ext in [".csv", ".json", ".parquet", ".xlsx", ".xls"]):
            raise ValidationError("Unsupported file format. Supported: csv, json, parquet, xlsx, xls")

        # Generate dataset ID and S3 key
        dataset_id = str(uuid.uuid4())
        s3_key = self.storage.generate_object_key(
            object_type="datasets",
            user_id=user_id,
            filename=request.filename,
            subfolder=project_id or "default",
        )

        # Generate presigned upload URL (valid for 1 hour)
        upload_url = self.storage.get_presigned_upload_url(
            object_key=s3_key,
            content_type=request.content_type,
            expiry=timedelta(hours=1),
        )

        # TODO: Store pending dataset metadata in Postgres
        # For now, return the URL and expect confirm_upload() to create the row

        return PresignedUploadResponse(
            upload_url=upload_url,
            s3_key=s3_key,
            s3_bucket=self.storage.bucket,
            expires_in_seconds=3600,
            dataset_id=dataset_id,
            message="Upload file to this URL, then call POST /datasets/confirm-upload",
        )

    async def confirm_upload(
        self,
        request: ConfirmUploadRequest,
        user_id: str,
        dataset_name: str,
        project_id: Optional[str] = None,
    ) -> UploadResponse:
        """
        Confirm upload and finalize dataset metadata in Postgres.
        
        Called by client after successful S3 upload.
        
        Args:
            request: Confirmation request with s3_key and file_size
            user_id: User ID
            dataset_name: Name for the dataset
            project_id: Optional project ID
            
        Returns:
            UploadResponse with dataset details
        """
        # Verify object exists in S3
        if not self.storage.object_exists(request.s3_key):
            raise NotFoundError(f"Object not found in storage: {request.s3_key}")

        # Get object metadata from S3
        obj_metadata = self.storage.get_object_metadata(request.s3_key)

        # Determine file format from S3 key
        file_format = request.s3_key.split(".")[-1].lower()
        if file_format == "xlsx":
            file_format = "xlsx"
        elif file_format not in ["csv", "json", "parquet"]:
            file_format = "csv"  # default

        # TODO: Insert metadata into Postgres datasets table
        # This should include: id, name, s3_key, s3_bucket, user_id, project_id,
        # file_size, content_type, checksum, storage_provider, etc.

        return UploadResponse(
            dataset_id=request.dataset_id,
            name=dataset_name,
            storage_path=request.s3_key,  # Legacy field
            s3_key=request.s3_key,
            size_bytes=obj_metadata["size"],
            status="uploaded",
            message="Dataset uploaded and metadata saved successfully",
        )

    async def get_download_url(
        self,
        dataset_id: str,
        user_id: str,
    ) -> DownloadUrlResponse:
        """
        Generate a presigned URL for downloading a dataset.
        
        Args:
            dataset_id: Dataset UUID
            user_id: User ID (for auth check)
            
        Returns:
            DownloadUrlResponse with presigned download URL
        """
        # TODO: Query Postgres for dataset metadata (s3_key, s3_bucket, etc.)
        # For now, assume we have the s3_key

        # Mock: retrieve from DB
        # dataset = await db.query(datasets).where(id=dataset_id, user_id=user_id).first()
        # if not dataset:
        #     raise NotFoundError("Dataset not found")

        # Generate presigned download URL
        s3_key = f"datasets/{user_id}/example_dataset.csv"  # TODO: Get from DB
        filename = "example_dataset.csv"  # TODO: Get from DB

        download_url = self.storage.get_presigned_download_url(
            object_key=s3_key,
            expiry=timedelta(hours=1),
            response_headers={
                "response-content-disposition": f'attachment; filename="{filename}"'
            },
        )

        return DownloadUrlResponse(
            download_url=download_url,
            filename=filename,
            content_type="text/csv",
            expires_in_seconds=3600,
        )

    # ===========================================
    # SERVER-SIDE UPLOAD (Legacy, Backward Compatible)
    # ===========================================

    async def upload_dataset(
        self,
        file: BinaryIO,
        filename: str,
        user_id: str,
        dataset_name: str,
        project_id: Optional[str] = None,
    ) -> UploadResponse:
        """
        Server-side upload (legacy method for backward compatibility).
        
        File is uploaded through the API server to S3.
        For large files, use presigned URL workflow instead.
        
        Args:
            file: File object to upload
            filename: Original filename
            user_id: ID of the user uploading
            dataset_name: Name for the dataset
            project_id: Optional project ID
            
        Returns:
            UploadResponse with upload details
        """
        # Validate file extension
        if not any(filename.endswith(ext) for ext in [".csv", ".json", ".parquet", ".xlsx", ".xls"]):
            raise ValidationError("Unsupported file format")

        # Generate S3 key
        s3_key = self.storage.generate_object_key(
            object_type="datasets",
            user_id=user_id,
            filename=filename,
            subfolder=project_id or "default",
        )

        # Upload to S3
        try:
            s3_key, file_size = await self.storage.upload_file(
                file=file,
                object_key=s3_key,
                content_type="application/octet-stream",
            )

            dataset_id = str(uuid.uuid4())

            # TODO: Insert metadata into Postgres

            return UploadResponse(
                dataset_id=dataset_id,
                name=dataset_name,
                storage_path=s3_key,
                s3_key=s3_key,
                size_bytes=file_size,
                status="uploaded",
                message="Dataset uploaded successfully",
            )

        except Exception as e:
            raise StorageError(f"Failed to upload dataset: {str(e)}")

    # ===========================================
    # DATA ACCESS & PROFILING
    # ===========================================

    async def download_dataset(self, s3_key: str) -> bytes:
        """Download dataset from S3 (for server-side processing)."""
        return await self.storage.download_file(s3_key)

    async def read_dataset_as_dataframe(
        self,
        s3_key: str,
        file_format: str,
    ) -> pd.DataFrame:
        """
        Read dataset from S3 as pandas DataFrame.
        
        Args:
            s3_key: S3 object key
            file_format: Format of the file (csv, json, parquet, xlsx)
            
        Returns:
            pandas DataFrame
        """
        data = await self.download_dataset(s3_key)
        
        try:
            if file_format == "csv":
                return pd.read_csv(io.BytesIO(data))
            elif file_format == "json":
                return pd.read_json(io.BytesIO(data))
            elif file_format == "parquet":
                return pd.read_parquet(io.BytesIO(data))
            elif file_format in ["xlsx", "xls"]:
                return pd.read_excel(io.BytesIO(data))
            else:
                raise ValidationError(f"Unsupported file format: {file_format}")

        except Exception as e:
            raise ValidationError(f"Failed to read dataset: {str(e)}")

    async def profile_dataset(
        self,
        s3_key: str,
        file_format: str,
        compute_correlations: bool = True,
    ) -> DatasetProfileResponse:
        """Generate comprehensive profile of a dataset."""
        df = await self.read_dataset_as_dataframe(s3_key, file_format)

        profile = {
            "shape": {"rows": len(df), "columns": len(df.columns)},
            "columns": list(df.columns),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "missing_values": df.isnull().sum().to_dict(),
            "missing_percentages": (df.isnull().sum() / len(df) * 100).to_dict(),
        }

        numeric_cols = df.select_dtypes(include=["number"]).columns
        if len(numeric_cols) > 0:
            profile["numeric_statistics"] = df[numeric_cols].describe().to_dict()

        correlations = None
        if compute_correlations and len(numeric_cols) > 1:
            correlations = df[numeric_cols].corr().to_dict()

        quality_score = self._calculate_quality_score(df)
        recommendations = self._generate_recommendations(df, profile)

        return DatasetProfileResponse(
            dataset_id=s3_key,
            profile=profile,
            correlations=correlations,
            quality_score=quality_score,
            recommendations=recommendations,
        )

    def _calculate_quality_score(self, df: pd.DataFrame) -> float:
        """Calculate dataset quality score (0-100)."""
        score = 100.0
        missing_percentage = (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
        score -= missing_percentage * 0.5
        duplicate_percentage = (df.duplicated().sum() / len(df)) * 100
        score -= duplicate_percentage * 0.3
        single_value_cols = sum(df.nunique() == 1)
        score -= (single_value_cols / len(df.columns)) * 10
        return max(0.0, min(100.0, score))

    def _generate_recommendations(self, df: pd.DataFrame, profile: Dict[str, Any]) -> List[str]:
        """Generate data quality recommendations."""
        recommendations = []
        missing_cols = [col for col, pct in profile["missing_percentages"].items() if pct > 5]
        if missing_cols:
            recommendations.append(f"Handle missing values in: {', '.join(missing_cols[:5])}")
        duplicate_count = df.duplicated().sum()
        if duplicate_count > 0:
            recommendations.append(f"Remove {duplicate_count} duplicate rows")
        if not recommendations:
            recommendations.append("Dataset quality is good!")
        return recommendations


async def get_data_service_refactored(storage_service: StorageService) -> DataServiceRefactored:
    """Factory function to get refactored data service instance."""
    return DataServiceRefactored(storage_service)
