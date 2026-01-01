"""
Dataset and data management schemas.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class DatasetMetadata(BaseModel):
    """Dataset metadata information."""

    row_count: int = 0
    column_count: int = 0
    size_bytes: int = 0
    file_format: str
    columns: List[Dict[str, Any]] = Field(default_factory=list)
    dtypes: Dict[str, str] = Field(default_factory=dict)
    missing_values: Dict[str, int] = Field(default_factory=dict)
    statistics: Optional[Dict[str, Any]] = None


class DatasetCreate(BaseModel):
    """Schema for creating a new dataset."""

    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    project_id: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    is_public: bool = False

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate dataset name."""
        if not v.strip():
            raise ValueError("Dataset name cannot be empty")
        return v.strip()


class DatasetUpdate(BaseModel):
    """Schema for updating dataset information."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None


class Dataset(BaseModel):
    """Complete dataset schema."""

    id: str
    name: str
    description: Optional[str] = None
    user_id: str
    project_id: Optional[str] = None
    storage_path: str
    file_format: str
    metadata: DatasetMetadata
    tags: List[str] = Field(default_factory=list)
    is_public: bool = False
    created_at: datetime
    updated_at: datetime
    
    # S3 Storage fields
    s3_key: Optional[str] = None
    s3_bucket: str = "datasets"
    storage_provider: str = "minio"
    content_type: Optional[str] = None
    checksum: Optional[str] = None
    storage_metadata_dict: Dict[str, Any] = Field(default_factory=dict, alias="storage_metadata")

    model_config = {"from_attributes": True, "populate_by_name": True}


class DatasetProfileRequest(BaseModel):
    """Request for dataset profiling."""

    dataset_id: str
    compute_correlations: bool = True
    compute_statistics: bool = True
    sample_size: Optional[int] = None


class DatasetProfileResponse(BaseModel):
    """Dataset profiling results."""

    dataset_id: str
    profile: Dict[str, Any]
    correlations: Optional[Dict[str, Any]] = None
    quality_score: float
    recommendations: List[str] = Field(default_factory=list)


class DataTransformationRequest(BaseModel):
    """Request for data transformation."""

    dataset_id: str
    transformations: List[Dict[str, Any]]
    save_as_new: bool = False
    new_dataset_name: Optional[str] = None

    @field_validator("transformations")
    @classmethod
    def validate_transformations(cls, v: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Validate transformations list is not empty."""
        if not v:
            raise ValueError("At least one transformation required")
        return v


class UploadResponse(BaseModel):
    """Response after uploading a dataset."""

    dataset_id: str
    name: str
    storage_path: str
    size_bytes: int
    status: str = "uploaded"
    message: str = "Dataset uploaded successfully"
    
    # Presigned URL for direct upload (if using client-side upload)
    upload_url: Optional[str] = None
    s3_key: Optional[str] = None


class PresignedUploadRequest(BaseModel):
    """Request for presigned upload URL."""

    filename: str
    content_type: Optional[str] = None
    dataset_name: str
    description: Optional[str] = None
    project_id: Optional[str] = None


class PresignedUploadResponse(BaseModel):
    """Response with presigned upload URL."""

    upload_url: str
    s3_key: str
    s3_bucket: str
    expires_in_seconds: int = 3600
    dataset_id: str
    message: str = "Upload to this URL, then call /confirm-upload"


class ConfirmUploadRequest(BaseModel):
    """Confirm successful upload and store metadata."""

    dataset_id: str
    s3_key: str
    file_size: int
    checksum: Optional[str] = None


class DownloadUrlResponse(BaseModel):
    """Response with presigned download URL."""

    download_url: str
    filename: str
    content_type: Optional[str] = None
    expires_in_seconds: int = 3600
