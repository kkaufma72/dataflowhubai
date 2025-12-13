"""ModelOps / Autopilot schemas.

These schemas are intentionally minimal and JSON-friendly so we can evolve
server-side drift/incident logic without frequent breaking changes.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class FeatureStats(BaseModel):
    """Compact numeric stats for a single feature."""

    mean: Optional[float] = None
    std: Optional[float] = None
    missing_rate: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    unique_count: Optional[int] = Field(default=None, ge=0)


class DriftAnalyzeRequest(BaseModel):
    """Request body for analyzing drift for a model."""

    reference_stats: Dict[str, FeatureStats] = Field(default_factory=dict)
    current_stats: Dict[str, FeatureStats] = Field(default_factory=dict)
    context: Dict[str, Any] = Field(default_factory=dict)


class DriftAnalyzeResponse(BaseModel):
    model_id: str
    created_at: datetime
    drift_report: Dict[str, Any]


class IncidentResponse(BaseModel):
    incident_id: str
    model_id: str
    status: str
    severity: str
    title: str
    summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class IncidentRCAResponse(BaseModel):
    """Lineage-based root cause analysis payload for a ModelOps incident."""

    incident_id: str
    feature: Optional[str] = None
    lineage_found: bool = False
    transformation_step: Dict[str, Any] = Field(default_factory=dict)
    dataset: Dict[str, Any] = Field(default_factory=dict)
    dataset_version: Dict[str, Any] = Field(default_factory=dict)
    filters: List[Dict[str, Any]] = Field(default_factory=list)
    upstream_columns: List[Dict[str, Any]] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class IncidentAutoResolveCheckResponse(BaseModel):
    """Response for incident auto-resolve checks."""

    resolved: bool
    reason: Optional[str] = None
    incident: IncidentResponse


class AutopilotRunRequest(BaseModel):
    """Request body for running the ModelOps Autopilot demo flow.

    If `simulate` is True, the server may override/augment provided stats with
    drift-inducing values to ensure an incident is opened for the demo.
    """

    reference_stats: Dict[str, FeatureStats] = Field(default_factory=dict)
    current_stats: Dict[str, FeatureStats] = Field(default_factory=dict)
    context: Dict[str, Any] = Field(default_factory=dict)
    simulate: bool = True


class AutopilotRunResponse(BaseModel):
    """Response payload for the ModelOps Autopilot demo flow."""

    model_id: str
    drift_report: Dict[str, Any] = Field(default_factory=dict)
    incident: Optional[IncidentResponse] = None
    rca: Optional[IncidentRCAResponse] = None
    actions: List[Dict[str, Any]] = Field(default_factory=list)
    postmortem: Dict[str, Any] = Field(default_factory=dict)
