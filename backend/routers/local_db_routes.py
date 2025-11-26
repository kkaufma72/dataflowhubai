"""
Local PostgreSQL database routes for development.
These routes directly interact with the local PostgreSQL instance.
"""

import os
from datetime import datetime
from typing import List, Optional
from uuid import uuid4

import asyncpg
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter()

# Database configuration from environment
DB_CONFIG = {
    "host": os.getenv("POSTGRES_HOST", "localhost"),
    "port": int(os.getenv("POSTGRES_PORT", "5432")),
    "database": os.getenv("POSTGRES_DB", "dataflow_hub"),
    "user": os.getenv("POSTGRES_USER", "dataflow_user"),
    "password": os.getenv("POSTGRES_PASSWORD", "dataflow_secure_password"),
}


# Pydantic models
class DatasetCreate(BaseModel):
    name: str
    description: Optional[str] = None
    file_type: str = "json"
    file_size: str = "0 KB"
    rows: int = 0
    columns: int = 0
    preview_data: Optional[dict] = {}
    project_id: Optional[str] = None
    user_id: Optional[str] = None
    source: str = "upload"
    metadata: Optional[dict] = {}
    tags: Optional[List[str]] = []
    size_mb: Optional[str] = None


class DatasetResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    file_type: str
    file_size: str
    rows: int
    columns: int
    preview_data: Optional[dict]
    project_id: Optional[str]
    user_id: Optional[str]
    source: str
    metadata: Optional[dict]
    tags: Optional[List[str]]
    size_mb: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    user_id: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    user_id: Optional[str]
    created_at: datetime
    updated_at: datetime


async def get_db_connection():
    """Get database connection."""
    try:
        conn = await asyncpg.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection failed: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Check if local database is available."""
    try:
        conn = await get_db_connection()
        await conn.execute("SELECT 1")
        await conn.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


# ============ DATASETS ============

@router.post("/datasets", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
async def create_dataset(dataset: DatasetCreate):
    """Create a new dataset."""
    conn = await get_db_connection()
    try:
        dataset_id = str(uuid4())
        now = datetime.utcnow()
        
        # Ensure we have a project_id (create default if needed)
        project_id = dataset.project_id
        if not project_id:
            # Check for existing default project
            existing = await conn.fetchrow(
                "SELECT id FROM projects WHERE name = 'Default Project' LIMIT 1"
            )
            if existing:
                project_id = str(existing["id"])
            else:
                # Create default project
                project_id = str(uuid4())
                await conn.execute(
                    """
                    INSERT INTO projects (id, name, description, user_id, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    """,
                    project_id, "Default Project", "Auto-created default project",
                    dataset.user_id, now, now
                )
        
        # Insert dataset
        await conn.execute(
            """
            INSERT INTO datasets (
                id, name, description, file_type, file_size, 
                rows, columns, row_count, column_count,
                preview_data, project_id, user_id, source, 
                metadata, tags, size_mb, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            """,
            dataset_id, dataset.name, dataset.description, dataset.file_type,
            dataset.file_size, dataset.rows, dataset.columns, 
            dataset.rows, dataset.columns,  # row_count, column_count
            dataset.preview_data, project_id, dataset.user_id,
            dataset.source, dataset.metadata, dataset.tags,
            dataset.size_mb, now, now
        )
        
        return DatasetResponse(
            id=dataset_id,
            name=dataset.name,
            description=dataset.description,
            file_type=dataset.file_type,
            file_size=dataset.file_size,
            rows=dataset.rows,
            columns=dataset.columns,
            preview_data=dataset.preview_data,
            project_id=project_id,
            user_id=dataset.user_id,
            source=dataset.source,
            metadata=dataset.metadata,
            tags=dataset.tags,
            size_mb=dataset.size_mb,
            created_at=now,
            updated_at=now
        )
    finally:
        await conn.close()


@router.get("/datasets", response_model=List[DatasetResponse])
async def list_datasets(user_id: Optional[str] = None, project_id: Optional[str] = None):
    """List all datasets, optionally filtered by user_id or project_id."""
    conn = await get_db_connection()
    try:
        query = "SELECT * FROM datasets WHERE 1=1"
        params = []
        param_idx = 1
        
        if user_id:
            query += f" AND user_id = ${param_idx}"
            params.append(user_id)
            param_idx += 1
            
        if project_id:
            query += f" AND project_id = ${param_idx}"
            params.append(project_id)
            param_idx += 1
            
        query += " ORDER BY created_at DESC"
        
        rows = await conn.fetch(query, *params)
        
        return [
            DatasetResponse(
                id=str(row["id"]),
                name=row["name"],
                description=row["description"],
                file_type=row["file_type"],
                file_size=row["file_size"] or "0 KB",
                rows=row["rows"] or row["row_count"] or 0,
                columns=row["columns"] or row["column_count"] or 0,
                preview_data=row["preview_data"] or {},
                project_id=str(row["project_id"]) if row["project_id"] else None,
                user_id=str(row["user_id"]) if row["user_id"] else None,
                source=row["source"] or "upload",
                metadata=row["metadata"] or {},
                tags=row["tags"] or [],
                size_mb=row["size_mb"],
                created_at=row["created_at"],
                updated_at=row["updated_at"]
            )
            for row in rows
        ]
    finally:
        await conn.close()


@router.get("/datasets/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(dataset_id: str):
    """Get a specific dataset by ID."""
    conn = await get_db_connection()
    try:
        row = await conn.fetchrow(
            "SELECT * FROM datasets WHERE id = $1",
            dataset_id
        )
        
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset not found"
            )
        
        return DatasetResponse(
            id=str(row["id"]),
            name=row["name"],
            description=row["description"],
            file_type=row["file_type"],
            file_size=row["file_size"] or "0 KB",
            rows=row["rows"] or row["row_count"] or 0,
            columns=row["columns"] or row["column_count"] or 0,
            preview_data=row["preview_data"] or {},
            project_id=str(row["project_id"]) if row["project_id"] else None,
            user_id=str(row["user_id"]) if row["user_id"] else None,
            source=row["source"] or "upload",
            metadata=row["metadata"] or {},
            tags=row["tags"] or [],
            size_mb=row["size_mb"],
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )
    finally:
        await conn.close()


@router.patch("/datasets/{dataset_id}", response_model=DatasetResponse)
async def update_dataset(dataset_id: str, updates: dict):
    """Update a dataset."""
    conn = await get_db_connection()
    try:
        # Build update query dynamically
        allowed_fields = [
            "name", "description", "file_type", "file_size", "rows", "columns",
            "preview_data", "source", "metadata", "tags", "size_mb"
        ]
        
        set_clauses = []
        params = [dataset_id]
        param_idx = 2
        
        for field, value in updates.items():
            if field in allowed_fields:
                set_clauses.append(f"{field} = ${param_idx}")
                params.append(value)
                param_idx += 1
        
        if not set_clauses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields to update"
            )
        
        set_clauses.append(f"updated_at = ${param_idx}")
        params.append(datetime.utcnow())
        
        query = f"UPDATE datasets SET {', '.join(set_clauses)} WHERE id = $1 RETURNING *"
        
        row = await conn.fetchrow(query, *params)
        
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset not found"
            )
        
        return DatasetResponse(
            id=str(row["id"]),
            name=row["name"],
            description=row["description"],
            file_type=row["file_type"],
            file_size=row["file_size"] or "0 KB",
            rows=row["rows"] or row["row_count"] or 0,
            columns=row["columns"] or row["column_count"] or 0,
            preview_data=row["preview_data"] or {},
            project_id=str(row["project_id"]) if row["project_id"] else None,
            user_id=str(row["user_id"]) if row["user_id"] else None,
            source=row["source"] or "upload",
            metadata=row["metadata"] or {},
            tags=row["tags"] or [],
            size_mb=row["size_mb"],
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )
    finally:
        await conn.close()


@router.delete("/datasets/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dataset(dataset_id: str):
    """Delete a dataset."""
    conn = await get_db_connection()
    try:
        result = await conn.execute(
            "DELETE FROM datasets WHERE id = $1",
            dataset_id
        )
        
        if result == "DELETE 0":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset not found"
            )
    finally:
        await conn.close()


# ============ PROJECTS ============

@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(project: ProjectCreate):
    """Create a new project."""
    conn = await get_db_connection()
    try:
        project_id = str(uuid4())
        now = datetime.utcnow()
        
        await conn.execute(
            """
            INSERT INTO projects (id, name, description, user_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            """,
            project_id, project.name, project.description, project.user_id, now, now
        )
        
        return ProjectResponse(
            id=project_id,
            name=project.name,
            description=project.description,
            user_id=project.user_id,
            created_at=now,
            updated_at=now
        )
    finally:
        await conn.close()


@router.get("/projects", response_model=List[ProjectResponse])
async def list_projects(user_id: Optional[str] = None):
    """List all projects, optionally filtered by user_id."""
    conn = await get_db_connection()
    try:
        if user_id:
            rows = await conn.fetch(
                "SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC",
                user_id
            )
        else:
            rows = await conn.fetch("SELECT * FROM projects ORDER BY created_at DESC")
        
        return [
            ProjectResponse(
                id=str(row["id"]),
                name=row["name"],
                description=row["description"],
                user_id=str(row["user_id"]) if row["user_id"] else None,
                created_at=row["created_at"],
                updated_at=row["updated_at"]
            )
            for row in rows
        ]
    finally:
        await conn.close()


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    """Get a specific project by ID."""
    conn = await get_db_connection()
    try:
        row = await conn.fetchrow(
            "SELECT * FROM projects WHERE id = $1",
            project_id
        )
        
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        return ProjectResponse(
            id=str(row["id"]),
            name=row["name"],
            description=row["description"],
            user_id=str(row["user_id"]) if row["user_id"] else None,
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )
    finally:
        await conn.close()

