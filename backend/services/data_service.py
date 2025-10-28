"""
Data management service for dataset operations.
"""

import io
from datetime import datetime
from typing import Any, BinaryIO, Dict, List, Optional

import pandas as pd
from minio import Minio

from schemas.dataset import (
    Dataset,
    DatasetMetadata,
    DatasetProfileResponse,
    UploadResponse,
)
from utils.errors import NotFoundError, StorageError, ValidationError


class DataService:
    """Service for managing datasets and data operations."""

    def __init__(self, minio_client: Minio, bucket_name: str):
        self.minio = minio_client
        self.bucket = bucket_name

    async def upload_dataset(
        self,
        file: BinaryIO,
        filename: str,
        user_id: str,
        dataset_name: str,
    ) -> UploadResponse:
        """
        Upload a dataset file to object storage.
        
        Args:
            file: File object to upload
            filename: Original filename
            user_id: ID of the user uploading
            dataset_name: Name for the dataset
            
        Returns:
            UploadResponse with upload details
        """
        # Validate file extension
        if not any(filename.endswith(ext) for ext in [".csv", ".json", ".parquet", ".xlsx"]):
            raise ValidationError("Unsupported file format")

        # Generate storage path
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        storage_path = f"datasets/{user_id}/{timestamp}_{filename}"

        try:
            # Get file size
            file.seek(0, 2)  # Seek to end
            file_size = file.tell()
            file.seek(0)  # Seek back to start

            # Upload to MinIO
            self.minio.put_object(
                bucket_name=self.bucket,
                object_name=storage_path,
                data=file,
                length=file_size,
            )

            return UploadResponse(
                dataset_id=f"ds_{timestamp}_{user_id}",
                name=dataset_name,
                storage_path=storage_path,
                size_bytes=file_size,
                status="uploaded",
                message="Dataset uploaded successfully",
            )

        except Exception as e:
            raise StorageError(f"Failed to upload dataset: {str(e)}")

    async def download_dataset(self, storage_path: str) -> bytes:
        """
        Download a dataset from object storage.
        
        Args:
            storage_path: Path to the dataset in storage
            
        Returns:
            Dataset file content as bytes
        """
        try:
            response = self.minio.get_object(
                bucket_name=self.bucket,
                object_name=storage_path,
            )
            return response.read()

        except Exception as e:
            raise StorageError(f"Failed to download dataset: {str(e)}")

    async def read_dataset_as_dataframe(
        self,
        storage_path: str,
        file_format: str,
    ) -> pd.DataFrame:
        """
        Read dataset from storage as pandas DataFrame.
        
        Args:
            storage_path: Path to the dataset in storage
            file_format: Format of the file (csv, json, parquet, xlsx)
            
        Returns:
            pandas DataFrame
        """
        data = await self.download_dataset(storage_path)
        
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
        storage_path: str,
        file_format: str,
        compute_correlations: bool = True,
    ) -> DatasetProfileResponse:
        """
        Generate comprehensive profile of a dataset.
        
        Args:
            storage_path: Path to the dataset in storage
            file_format: Format of the file
            compute_correlations: Whether to compute correlations
            
        Returns:
            DatasetProfileResponse with profiling results
        """
        df = await self.read_dataset_as_dataframe(storage_path, file_format)

        # Basic statistics
        profile = {
            "shape": {"rows": len(df), "columns": len(df.columns)},
            "columns": list(df.columns),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "missing_values": df.isnull().sum().to_dict(),
            "missing_percentages": (df.isnull().sum() / len(df) * 100).to_dict(),
        }

        # Numeric column statistics
        numeric_cols = df.select_dtypes(include=["number"]).columns
        if len(numeric_cols) > 0:
            profile["numeric_statistics"] = df[numeric_cols].describe().to_dict()

        # Correlations
        correlations = None
        if compute_correlations and len(numeric_cols) > 1:
            correlations = df[numeric_cols].corr().to_dict()

        # Calculate quality score
        quality_score = self._calculate_quality_score(df)

        # Generate recommendations
        recommendations = self._generate_recommendations(df, profile)

        return DatasetProfileResponse(
            dataset_id=storage_path,
            profile=profile,
            correlations=correlations,
            quality_score=quality_score,
            recommendations=recommendations,
        )

    def _calculate_quality_score(self, df: pd.DataFrame) -> float:
        """Calculate dataset quality score (0-100)."""
        score = 100.0

        # Penalize missing values
        missing_percentage = (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
        score -= missing_percentage * 0.5

        # Penalize duplicate rows
        duplicate_percentage = (df.duplicated().sum() / len(df)) * 100
        score -= duplicate_percentage * 0.3

        # Penalize columns with single unique value
        single_value_cols = sum(df.nunique() == 1)
        score -= (single_value_cols / len(df.columns)) * 10

        return max(0.0, min(100.0, score))

    def _generate_recommendations(
        self,
        df: pd.DataFrame,
        profile: Dict[str, Any],
    ) -> List[str]:
        """Generate data quality recommendations."""
        recommendations = []

        # Check for missing values
        missing_cols = [
            col for col, pct in profile["missing_percentages"].items() if pct > 5
        ]
        if missing_cols:
            recommendations.append(
                f"Handle missing values in columns: {', '.join(missing_cols[:5])}"
            )

        # Check for duplicate rows
        duplicate_count = df.duplicated().sum()
        if duplicate_count > 0:
            recommendations.append(f"Remove {duplicate_count} duplicate rows")

        # Check for low variance columns
        numeric_cols = df.select_dtypes(include=["number"]).columns
        low_variance = [col for col in numeric_cols if df[col].std() < 0.01]
        if low_variance:
            recommendations.append(
                f"Consider removing low variance columns: {', '.join(low_variance[:5])}"
            )

        # Check for high cardinality categorical columns
        categorical_cols = df.select_dtypes(include=["object"]).columns
        high_cardinality = [
            col for col in categorical_cols if df[col].nunique() > len(df) * 0.5
        ]
        if high_cardinality:
            recommendations.append(
                f"High cardinality in columns: {', '.join(high_cardinality[:5])}"
            )

        if not recommendations:
            recommendations.append("Dataset quality is good!")

        return recommendations

    async def apply_transformations(
        self,
        storage_path: str,
        file_format: str,
        transformations: List[Dict[str, Any]],
    ) -> pd.DataFrame:
        """
        Apply transformations to a dataset.
        
        Args:
            storage_path: Path to the dataset in storage
            file_format: Format of the file
            transformations: List of transformation operations
            
        Returns:
            Transformed pandas DataFrame
        """
        df = await self.read_dataset_as_dataframe(storage_path, file_format)

        for transform in transformations:
            operation = transform.get("operation")
            params = transform.get("params", {})

            if operation == "drop_columns":
                columns = params.get("columns", [])
                df = df.drop(columns=columns, errors="ignore")

            elif operation == "fill_missing":
                column = params.get("column")
                strategy = params.get("strategy", "mean")
                if strategy == "mean":
                    df[column].fillna(df[column].mean(), inplace=True)
                elif strategy == "median":
                    df[column].fillna(df[column].median(), inplace=True)
                elif strategy == "mode":
                    df[column].fillna(df[column].mode()[0], inplace=True)
                elif strategy == "constant":
                    value = params.get("value", 0)
                    df[column].fillna(value, inplace=True)

            elif operation == "drop_duplicates":
                df = df.drop_duplicates()

            elif operation == "filter_rows":
                condition = params.get("condition")
                # Simple filtering - extend as needed
                df = df.query(condition)

            elif operation == "rename_column":
                old_name = params.get("old_name")
                new_name = params.get("new_name")
                df = df.rename(columns={old_name: new_name})

        return df


async def get_data_service(minio_client: Minio, bucket_name: str) -> DataService:
    """Factory function to get data service instance."""
    return DataService(minio_client, bucket_name)


