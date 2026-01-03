"""ModelOps / Autopilot API routes.

This router provides a minimal persistence layer for drift reports and incidents.
"""

from __future__ import annotations

import json
import math
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from neo4j import AsyncDriver
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies.auth import get_current_user
from dependencies.database import get_neo4j_driver, get_postgres_session, get_timescaledb_session
from schemas.auth import User
from schemas.modelops import (
    AutopilotRunRequest,
    AutopilotRunResponse,
    DriftAnalyzeRequest,
    DriftAnalyzeResponse,
    IncidentAutoResolveCheckResponse,
    IncidentRCAResponse,
    IncidentResponse,
)
from services.modelops_drift import compute_drift_report
from services.modelops_drift_layers import (
    DriftThresholds,
    data_drift_from_samples,
    performance_drift_from_metrics,
    prediction_drift_from_samples,
    severity_from_score,
)
from services.timescale_service import TimescaleService
from services.lineage_rca import feature_lineage_rca
from utils.config import settings


router = APIRouter()


def _db_unavailable(detail: str, *, exc: Exception | None = None) -> HTTPException:
    if settings.DEBUG and exc is not None:
        return HTTPException(status_code=503, detail=f"{detail}: {exc}")
    return HTTPException(status_code=503, detail=detail)


def _json_sanitize(value: Any) -> Any:
    """Make a structure safe for JSON/JSONB.

    - Replaces NaN/Infinity with None
    - Recursively sanitizes dict/list values
    """

    if isinstance(value, float):
        return value if math.isfinite(value) else None
    if isinstance(value, dict):
        return {str(k): _json_sanitize(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_json_sanitize(v) for v in value]
    return value


def _to_jsonb_param(value: Any) -> str:
    """Serialize a value for use with `:param::jsonb` in SQL text queries."""

    sanitized = _json_sanitize(value)
    return json.dumps(sanitized, ensure_ascii=False, separators=(",", ":"), allow_nan=False)


def _avg(values: List[float]) -> Optional[float]:
    if not values:
        return None
    return float(sum(values) / len(values))


async def _ensure_ml_models_table(db: AsyncSession) -> None:
    """Ensure `ml_models` exists (dev/non-production only).

    ModelOps tables reference `ml_models` via FK; if the init SQL didn't run
    (common with persistent Postgres volumes), ModelOps endpoints should not
    explode with a 500.
    """

    try:
        result = await db.execute(text("SELECT to_regclass('public.ml_models') AS ml_models"))
        row = result.first()
    except SQLAlchemyError as exc:
        raise _db_unavailable("Database unavailable", exc=exc)

    exists = bool(row and row.ml_models is not None)
    if exists:
        return

    if (not settings.DEBUG) and settings.ENVIRONMENT.lower() == "production":
        raise HTTPException(
            status_code=503,
            detail="Database schema is not initialized (missing: ml_models). Run migrations.",
        )

    try:
        await db.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
        await db.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS ml_models (
                  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                  name TEXT NOT NULL,
                  model_type TEXT NOT NULL DEFAULT 'demo',
                  status TEXT NOT NULL DEFAULT 'trained',
                  user_id UUID,
                  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );

                CREATE INDEX IF NOT EXISTS idx_ml_models_user_id ON ml_models(user_id);
                CREATE INDEX IF NOT EXISTS idx_ml_models_created_at ON ml_models(created_at DESC);
                """
            )
        )
        await db.commit()
    except SQLAlchemyError as exc:
        await db.rollback()
        raise _db_unavailable("Failed to initialize ml_models table", exc=exc)


async def _ensure_ml_model_row(
    db: AsyncSession,
    *,
    model_id: UUID,
    user_id: Optional[UUID],
    name: str = "Model",
    model_type: str = "demo",
    status_value: str = "trained",
) -> None:
    """Ensure a row exists in `ml_models` for a given model_id.

    The frontend frequently generates UUIDs client-side; ModelOps tables enforce
    an FK to `ml_models`. In dev/demo environments, auto-register missing models
    to keep the experience seamless.
    """

    await _ensure_ml_models_table(db)

    try:
        result = await db.execute(
            text(
                """
                SELECT id
                FROM ml_models
                WHERE id = :model_id
                LIMIT 1
                """
            ),
            {"model_id": model_id},
        )
        row = result.first()
        if row:
            return
    except SQLAlchemyError as exc:
        raise _db_unavailable("Failed to check model existence", exc=exc)

    if (not settings.DEBUG) and settings.ENVIRONMENT.lower() == "production":
        # In production we should not silently create models behind the scenes.
        raise HTTPException(status_code=404, detail="Model not found")

    try:
        await db.execute(
            text(
                """
                INSERT INTO ml_models (id, name, model_type, status, user_id, created_at, updated_at)
                VALUES (:id, :name, :model_type, :status, :user_id, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
                """
            ),
            {
                "id": model_id,
                "name": name,
                "model_type": model_type,
                "status": status_value,
                "user_id": user_id,
            },
        )
    except SQLAlchemyError as exc:
        await db.rollback()
        raise _db_unavailable("Failed to auto-register model", exc=exc)


async def _ensure_modelops_tables(db: AsyncSession) -> None:
    """Ensure ModelOps tables exist.

    Local dev frequently uses a persistent Postgres volume; init SQL only runs
    on first boot. This function bootstraps missing tables on-demand in
    non-production environments.
    """

    await _ensure_ml_models_table(db)

    try:
        result = await db.execute(
            text(
                """
                SELECT
                  to_regclass('public.model_drift_reports') as drift_reports,
                  to_regclass('public.model_incidents') as incidents,
                  to_regclass('public.autopilot_policies') as policies
                """
            )
        )
        row = result.first()
    except SQLAlchemyError as exc:
        raise _db_unavailable("Database unavailable", exc=exc)
    if not row:
        return

    missing = [
        name
        for name, val in {
            "model_drift_reports": row.drift_reports,
            "model_incidents": row.incidents,
            "autopilot_policies": row.policies,
        }.items()
        if val is None
    ]

    if not missing:
        return

    # In strict production (DEBUG=False + ENVIRONMENT=production), do not auto-migrate
    # Railway and similar platforms typically use DEBUG=True, so allow auto-creation there
    if (not settings.DEBUG) and settings.ENVIRONMENT.lower() == "production":
        raise HTTPException(
            status_code=503,
            detail=(
                "ModelOps schema is not initialized (missing: "
                + ", ".join(missing)
                + "). Run DB migrations or reinitialize the database."
            ),
        )

    # Bootstrap schema (idempotent) - safe in dev and Railway deployments
        try:
                await db.execute(
                        text(
                                """
                                CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

                                CREATE TABLE IF NOT EXISTS model_drift_reports (
                                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                    model_id UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
                                    user_id UUID,
                                    has_drift BOOLEAN NOT NULL DEFAULT FALSE,
                                    drift_score DOUBLE PRECISION NOT NULL DEFAULT 0,
                                    severity TEXT NOT NULL DEFAULT 'info',
                                    report JSONB NOT NULL DEFAULT '{}',
                                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                                );

                                CREATE TABLE IF NOT EXISTS model_incidents (
                                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                    model_id UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
                                    drift_report_id UUID REFERENCES model_drift_reports(id) ON DELETE SET NULL,
                                    status TEXT NOT NULL DEFAULT 'open',
                                    severity TEXT NOT NULL DEFAULT 'warning',
                                    title TEXT NOT NULL,
                                    summary TEXT,
                                    metadata JSONB NOT NULL DEFAULT '{}',
                                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                    resolved_at TIMESTAMPTZ
                                );

                                CREATE TABLE IF NOT EXISTS autopilot_policies (
                                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                    user_id UUID,
                                    name TEXT NOT NULL,
                                    enabled BOOLEAN NOT NULL DEFAULT TRUE,
                                    config JSONB NOT NULL DEFAULT '{}',
                                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                                );

                                CREATE INDEX IF NOT EXISTS idx_model_drift_reports_model_id ON model_drift_reports(model_id);
                                CREATE INDEX IF NOT EXISTS idx_model_drift_reports_created_at ON model_drift_reports(created_at DESC);
                                CREATE INDEX IF NOT EXISTS idx_model_incidents_model_id ON model_incidents(model_id);
                                CREATE INDEX IF NOT EXISTS idx_model_incidents_status ON model_incidents(status);
                                CREATE INDEX IF NOT EXISTS idx_autopilot_policies_user_id ON autopilot_policies(user_id);

                                INSERT INTO autopilot_policies (user_id, name, enabled, config)
                                SELECT
                                    NULL,
                                    'Default Autopilot Policy',
                                    TRUE,
                                    '{"thresholds": {"warning": 0.20, "critical": 0.40}, "auto_open_incident": true}'::jsonb
                                WHERE NOT EXISTS (SELECT 1 FROM autopilot_policies);
                                """
                        )
                )
                await db.commit()
        except SQLAlchemyError as exc:
                await db.rollback()
                raise _db_unavailable("Failed to initialize ModelOps schema", exc=exc)


def _safe_uuid(value: str) -> Optional[UUID]:
    try:
        return UUID(value)
    except Exception:
        return None


def _extract_top_feature_from_drift_report(drift_report: Any) -> Optional[str]:
    if not isinstance(drift_report, dict):
        return None
    drifted_features = drift_report.get("drifted_features") or []
    if isinstance(drifted_features, list) and drifted_features:
        first = drifted_features[0]
        if isinstance(first, dict):
            top_feature = first.get("feature")
            if top_feature:
                return str(top_feature)
    return None


def _root_cause_narrative_from_stats(
    *,
    feature_name: str,
    reference_stats: Dict[str, Any],
    current_stats: Dict[str, Any],
) -> str:
    """Generate a recruiter-friendly RCA sentence from simple feature stats."""

    ref = (reference_stats or {}).get(feature_name) or {}
    cur = (current_stats or {}).get(feature_name) or {}

    ref_missing = ref.get("missing_rate")
    cur_missing = cur.get("missing_rate")
    ref_unique = ref.get("unique_count")
    cur_unique = cur.get("unique_count")

    parts: list[str] = []

    try:
        if ref_unique is not None and cur_unique is not None and int(cur_unique) > int(ref_unique):
            parts.append("new category levels appeared")
    except Exception:
        pass

    try:
        if ref_missing is not None and cur_missing is not None and float(cur_missing) > float(ref_missing):
            parts.append("missing values increased")
    except Exception:
        pass

    if not parts:
        return f"Top drifted feature `{feature_name}` shifted between reference and current windows."

    joined = " + ".join(parts)
    return f"Top drifted feature `{feature_name}`: {joined}."


@router.get("/incidents/{incident_id}/rca", response_model=IncidentRCAResponse)
async def incident_root_cause_analysis(
    incident_id: UUID,
    db: AsyncSession = Depends(get_postgres_session),
    neo4j_driver: Optional[AsyncDriver] = Depends(get_neo4j_driver),
    current_user: User = Depends(get_current_user),
) -> IncidentRCAResponse:
    """Lineage-based RCA for an incident.

    This is the "wow moment": connects ModelOps incidents/drift to feature
    provenance and upstream data changes via the Neo4j knowledge graph.
    """

    await _ensure_modelops_tables(db)

    warnings: List[str] = []

    # Fetch incident + optional drift_report_id
    try:
        result = await db.execute(
            text(
                """
                SELECT id, model_id, drift_report_id, metadata
                FROM model_incidents
                WHERE id = :incident_id
                LIMIT 1
                """
            ),
            {"incident_id": incident_id},
        )
        incident_row = result.first()
    except SQLAlchemyError as exc:
        raise _db_unavailable("Failed to load incident", exc=exc)

    if not incident_row:
        raise HTTPException(status_code=404, detail="Incident not found")

    top_feature: Optional[str] = None

    # Prefer incident.metadata.drift_report (autopilot)
    metadata = incident_row.metadata or {}
    if isinstance(metadata, dict):
        drift_report = metadata.get("drift_report")
        top_feature = _extract_top_feature_from_drift_report(drift_report)

    # Fallback: join drift report table if linked
    if not top_feature and incident_row.drift_report_id is not None:
        try:
            report_result = await db.execute(
                text(
                    """
                    SELECT report
                    FROM model_drift_reports
                    WHERE id = :drift_report_id
                    LIMIT 1
                    """
                ),
                {"drift_report_id": incident_row.drift_report_id},
            )
            report_row = report_result.first()
        except SQLAlchemyError as exc:
            raise _db_unavailable("Failed to load linked drift report", exc=exc)

        if report_row and report_row.report:
            top_feature = _extract_top_feature_from_drift_report(report_row.report)

    if not top_feature:
        warnings.append(
            "No top feature found for this incident (missing drift_report drifted_features)."
        )
        return IncidentRCAResponse(
            incident_id=str(incident_id),
            feature=None,
            lineage_found=False,
            transformation_step={},
            dataset={},
            dataset_version={},
            filters=[],
            upstream_columns=[],
            warnings=warnings,
        )

    # Neo4j lineage RCA query
    if neo4j_driver is None:
        warnings.append("Neo4j not available (knowledge graph disabled)")
        rca = {
            "lineage_found": False,
            "feature": top_feature,
            "transformation_step": {},
            "dataset": {},
            "dataset_version": {},
            "filters": [],
            "upstream_columns": [],
        }
    else:
        try:
            rca = await feature_lineage_rca(
                neo4j_driver=neo4j_driver,
                user_id=str(current_user.id),
                feature_name=top_feature,
            )
        except Exception as exc:
            if settings.DEBUG:
                warnings.append(f"Neo4j lineage lookup failed: {exc}")
            else:
                warnings.append("Neo4j lineage lookup failed")
            rca = {
                "lineage_found": False,
                "feature": top_feature,
                "transformation_step": {},
                "dataset": {},
                "dataset_version": {},
                "filters": [],
                "upstream_columns": [],
            }

    return IncidentRCAResponse(
        incident_id=str(incident_id),
        feature=rca.get("feature"),
        lineage_found=bool(rca.get("lineage_found", False)),
        transformation_step=rca.get("transformation_step") or {},
        dataset=rca.get("dataset") or {},
        dataset_version=rca.get("dataset_version") or {},
        filters=rca.get("filters") or [],
        upstream_columns=rca.get("upstream_columns") or [],
        warnings=warnings,
    )


@router.post("/dev/models", response_model=dict, status_code=status.HTTP_201_CREATED)
async def dev_create_test_model(
    payload: Dict[str, Any] | None = None,
    db: AsyncSession = Depends(get_postgres_session),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Create a minimal `ml_models` row for local/demo usage.

    This endpoint is intended for development only.
    """

    if not settings.DEBUG and settings.ENVIRONMENT.lower() == "production":
        raise HTTPException(status_code=404, detail="Not found")

    body = payload or {}
    name = str(body.get("name") or "Test Model")
    model_type = str(body.get("model_type") or "demo")
    status_value = str(body.get("status") or "trained")

    await _ensure_ml_models_table(db)

    user_uuid = _safe_uuid(current_user.id)

    try:
        result = await db.execute(
            text(
                """
                INSERT INTO ml_models (name, model_type, status, user_id, created_at, updated_at)
                VALUES (:name, :model_type, :status, :user_id, NOW(), NOW())
                RETURNING id
                """
            ),
            {
                "name": name,
                "model_type": model_type,
                "status": status_value,
                "user_id": user_uuid,
            },
        )
        row = result.first()
        if not row:
            raise HTTPException(status_code=500, detail="Failed to create model")

        await db.commit()
        return {"model_id": str(row.id)}
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        await db.rollback()
        raise _db_unavailable("Failed to create model (database unavailable)", exc=exc)


async def _get_policy_thresholds(
    db: AsyncSession, *, user_id: Optional[UUID]
) -> tuple[float, float, bool]:
    """Return (warning_threshold, critical_threshold, auto_open_incident)."""

    await _ensure_modelops_tables(db)

    # Prefer user-scoped policy; fallback to any enabled policy.
    if user_id is not None:
        result = await db.execute(
            text(
                """
                SELECT config
                FROM autopilot_policies
                WHERE enabled = TRUE AND user_id = :user_id
                ORDER BY updated_at DESC
                LIMIT 1
                """
            ),
            {"user_id": user_id},
        )
        row = result.first()
        if row and row[0]:
            config = row[0]
            thresholds = (config or {}).get("thresholds", {})
            return (
                float(thresholds.get("warning", 0.20)),
                float(thresholds.get("critical", 0.40)),
                bool((config or {}).get("auto_open_incident", True)),
            )

    result = await db.execute(
        text(
            """
            SELECT config
            FROM autopilot_policies
            WHERE enabled = TRUE
            ORDER BY updated_at DESC
            LIMIT 1
            """
        )
    )
    row = result.first()
    if row and row[0]:
        config = row[0]
        thresholds = (config or {}).get("thresholds", {})
        return (
            float(thresholds.get("warning", 0.20)),
            float(thresholds.get("critical", 0.40)),
            bool((config or {}).get("auto_open_incident", True)),
        )

    return 0.20, 0.40, True


async def _maybe_open_incident(
    db: AsyncSession,
    *,
    model_id: UUID,
    user_id: Optional[UUID],
    drift_report_id: UUID,
    drift_report: Dict[str, Any],
    auto_open_incident: bool,
) -> Optional[IncidentResponse]:
    if not auto_open_incident:
        return None

    severity = str(drift_report.get("severity", "info"))
    has_drift = bool(drift_report.get("has_drift", False))

    if not has_drift or severity == "info":
        return None

    title = f"Model drift detected ({severity})"
    top_feature = None
    drifted_features = drift_report.get("drifted_features") or []
    if isinstance(drifted_features, list) and drifted_features:
        top_feature = drifted_features[0].get("feature")

    summary = "Automated drift analysis detected significant drift."
    if top_feature:
        summary += f" Top drifted feature: {top_feature}."

    try:
        metadata_json = _to_jsonb_param({"source": "autopilot", "drift_report": drift_report})
        result = await db.execute(
            text(
                """
                INSERT INTO model_incidents (
                  model_id, drift_report_id, status, severity, title, summary, metadata, created_at, updated_at
                )
                                VALUES (
                                    :model_id, :drift_report_id, 'open', :severity, :title, :summary, CAST(:metadata AS JSONB), NOW(), NOW()
                                )
                RETURNING id, model_id, status, severity, title, summary, created_at, updated_at, resolved_at, metadata
                """
            ),
            {
                "model_id": model_id,
                "drift_report_id": drift_report_id,
                "severity": severity,
                "title": title,
                "summary": summary,
                "metadata": metadata_json,
            },
        )
        row = result.first()
        if not row:
            return None
    except SQLAlchemyError as exc:
        raise _db_unavailable("Failed to open incident", exc=exc)

    return IncidentResponse(
        incident_id=str(row.id),
        model_id=str(row.model_id),
        status=row.status,
        severity=row.severity,
        title=row.title,
        summary=row.summary,
        created_at=row.created_at,
        updated_at=row.updated_at,
        resolved_at=row.resolved_at,
        metadata=row.metadata or {},
    )


async def _maybe_autoresolve_incidents(
    db: AsyncSession,
    *,
    model_id: UUID,
    user_id: Optional[UUID],
    drift_report_id: UUID,
    drift_report_created_at: datetime,
    drift_report: Dict[str, Any],
) -> List[str]:
    """Resolve open/ack incidents for a model when drift clears.

    This is an internal helper used by drift report generation endpoints.
    It is intentionally conservative:
    - Only resolves incidents that predate the new drift report
    - Only resolves when `has_drift` is false OR `severity` is 'info'
    - Scopes to the current user when a UUID user_id is available

    Returns a list of incident UUID strings that were resolved.
    """

    has_drift = bool(drift_report.get("has_drift", False))
    severity = str(drift_report.get("severity", "info"))
    cleared = (not has_drift) or (severity == "info")
    if not cleared:
        return []

    autoresolve_payload = {
        "source": "autopilot",
        "checked_at": datetime.utcnow().isoformat(),
        "reason": "Drift cleared in latest report",
        "evidence": {
            "drift_report_id": str(drift_report_id),
            "has_drift": has_drift,
            "severity": severity,
            "drift_score": drift_report.get("drift_score"),
        },
    }

    try:
        autoresolve_json = _to_jsonb_param(autoresolve_payload)
        result = await db.execute(
            text(
                """
                UPDATE model_incidents
                SET
                  status = 'resolved',
                  resolved_at = NOW(),
                  updated_at = NOW(),
                  metadata = jsonb_set(
                    COALESCE(metadata, '{}'::jsonb),
                    '{autoresolve}',
                    CAST(:autoresolve AS JSONB),
                    TRUE
                  )
                WHERE model_id = :model_id
                  AND status IN ('open', 'acknowledged')
                  AND created_at < :report_created_at
                  AND (
                    :user_id IS NULL
                    OR drift_report_id IS NULL
                    OR drift_report_id IN (
                      SELECT id FROM model_drift_reports WHERE user_id = :user_id
                    )
                  )
                RETURNING id
                """
            ),
            {
                "model_id": model_id,
                "report_created_at": drift_report_created_at,
                "user_id": user_id,
                "autoresolve": autoresolve_json,
            },
        )
        rows = result.fetchall()
        return [str(r.id) for r in rows]
    except SQLAlchemyError as exc:
        # Best-effort: do not fail drift endpoints if autoresolve fails.
        if settings.DEBUG:
            logger = __import__("logging").getLogger(__name__)
            logger.warning(f"Auto-resolve failed: {exc}")
        return []


@router.post(
    "/models/{model_id}/drift/analyze",
    response_model=DriftAnalyzeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def analyze_drift(
    model_id: UUID,
    request: DriftAnalyzeRequest,
    db: AsyncSession = Depends(get_postgres_session),
    current_user: User = Depends(get_current_user),
) -> DriftAnalyzeResponse:
    await _ensure_modelops_tables(db)

    user_uuid = _safe_uuid(current_user.id)

    # Prevent FK failures when the UI provides a client-side UUID.
    await _ensure_ml_model_row(
        db,
        model_id=model_id,
        user_id=user_uuid,
        name="Demo Model",
        model_type="demo",
        status_value="trained",
    )

    warning_th, critical_th, auto_open = await _get_policy_thresholds(db, user_id=user_uuid)

    drift_report = compute_drift_report(
        model_id=str(model_id),
        reference_stats=request.reference_stats,
        current_stats=request.current_stats,
        policy_threshold_warning=warning_th,
        policy_threshold_critical=critical_th,
        context=request.context,
    )

    try:
        report_json = _to_jsonb_param(drift_report)
        result = await db.execute(
            text(
                """
                INSERT INTO model_drift_reports (model_id, user_id, has_drift, drift_score, severity, report, created_at)
                VALUES (:model_id, :user_id, :has_drift, :drift_score, :severity, CAST(:report AS JSONB), NOW())
                RETURNING id, created_at
                """
            ),
            {
                "model_id": model_id,
                "user_id": user_uuid,
                "has_drift": bool(drift_report.get("has_drift", False)),
                "drift_score": float(drift_report.get("drift_score", 0.0)),
                "severity": str(drift_report.get("severity", "info")),
                "report": report_json,
            },
        )
        row = result.first()
        if not row:
            raise HTTPException(status_code=500, detail="Failed to persist drift report")
    except HTTPException:
        raise
    except (ValueError, TypeError) as exc:
        # JSON serialization / allow_nan=False failures
        raise HTTPException(status_code=422, detail=f"Invalid drift report payload: {exc}")
    except SQLAlchemyError as exc:
        await db.rollback()
        raise _db_unavailable("Failed to persist drift report", exc=exc)

    # Optionally open an incident
    incident = await _maybe_open_incident(
        db,
        model_id=model_id,
        user_id=user_uuid,
        drift_report_id=row.id,
        drift_report=drift_report,
        auto_open_incident=auto_open,
    )

    await db.commit()

    # Fully automatic: if drift clears, resolve any prior open incidents.
    resolved_ids = await _maybe_autoresolve_incidents(
        db,
        model_id=model_id,
        user_id=user_uuid,
        drift_report_id=row.id,
        drift_report_created_at=row.created_at,
        drift_report=drift_report,
    )
    if resolved_ids:
        try:
            await db.commit()
        except Exception:
            pass

    # Include incident id in report for convenience
    if incident:
        drift_report.setdefault("incident", {})
        drift_report["incident"] = {"id": incident.incident_id, "status": incident.status}

    if resolved_ids:
        drift_report["autoresolved_incidents"] = resolved_ids

    # Ensure response is JSON-safe
    drift_report = _json_sanitize(drift_report)

    return DriftAnalyzeResponse(model_id=str(model_id), created_at=row.created_at, drift_report=drift_report)


@router.post("/models/{model_id}/autopilot/run", response_model=AutopilotRunResponse)
async def run_autopilot_demo(
    model_id: UUID,
    request: AutopilotRunRequest,
    db: AsyncSession = Depends(get_postgres_session),
    neo4j_driver: Optional[AsyncDriver] = Depends(get_neo4j_driver),
    current_user: User = Depends(get_current_user),
) -> AutopilotRunResponse:
    """Run the full Autopilot demo sequence for recruiters.

    Sequence:
    1) Simulate drift (or use provided stats) and persist a drift report.
    2) Auto-open a ModelOps incident.
    3) Run lineage-based RCA via Neo4j (best-effort).
    4) "Retrain" a new model version (mock persistence).
    5) "Canary deploy" then "promote" (mock deployment metadata).
    6) Generate a concise postmortem.
    """

    await _ensure_modelops_tables(db)

    user_uuid = _safe_uuid(current_user.id)

    # Prevent FK failures when the UI provides a client-side UUID.
    await _ensure_ml_model_row(
        db,
        model_id=model_id,
        user_id=user_uuid,
        name="Demo Model",
        model_type="demo",
        status_value="trained",
    )
    warning_th, critical_th, auto_open = await _get_policy_thresholds(db, user_id=user_uuid)

    reference_stats: Dict[str, Any] = dict(request.reference_stats or {})
    current_stats: Dict[str, Any] = dict(request.current_stats or {})

    # Ensure we can reliably trigger an incident for the demo.
    if request.simulate:
        reference_stats.setdefault(
            "income_bucket", {"mean": 10, "std": 1, "missing_rate": 0.01, "unique_count": 5}
        )
        current_stats.setdefault(
            "income_bucket", {"mean": 50, "std": 10, "missing_rate": 0.2, "unique_count": 20}
        )

    context: Dict[str, Any] = dict(request.context or {})
    context.setdefault("source", "autopilot_demo")

    drift_report = compute_drift_report(
        model_id=str(model_id),
        reference_stats=reference_stats,
        current_stats=current_stats,
        policy_threshold_warning=warning_th,
        policy_threshold_critical=critical_th,
        context=context,
    )

    # Persist drift report
    try:
        report_json = _to_jsonb_param(drift_report)
        result = await db.execute(
            text(
                """
                INSERT INTO model_drift_reports (model_id, user_id, has_drift, drift_score, severity, report, created_at)
                VALUES (:model_id, :user_id, :has_drift, :drift_score, :severity, CAST(:report AS JSONB), NOW())
                RETURNING id, created_at
                """
            ),
            {
                "model_id": model_id,
                "user_id": user_uuid,
                "has_drift": bool(drift_report.get("has_drift", False)),
                "drift_score": float(drift_report.get("drift_score", 0.0)),
                "severity": str(drift_report.get("severity", "info")),
                "report": report_json,
            },
        )
        drift_row = result.first()
        if not drift_row:
            raise HTTPException(status_code=500, detail="Failed to persist drift report")
    except HTTPException:
        raise
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=422, detail=f"Invalid drift report payload: {exc}")
    except SQLAlchemyError as exc:
        await db.rollback()
        raise _db_unavailable("Failed to persist drift report", exc=exc)

    # Always auto-open for demo if drift is present.
    incident = await _maybe_open_incident(
        db,
        model_id=model_id,
        user_id=user_uuid,
        drift_report_id=drift_row.id,
        drift_report=drift_report,
        auto_open_incident=(auto_open or request.simulate),
    )
    await db.commit()

    # RCA (best-effort; Neo4j may be down)
    rca_payload: Optional[IncidentRCAResponse] = None
    warnings: list[str] = []
    top_feature = _extract_top_feature_from_drift_report(drift_report) or "income_bucket"

    if incident:
        if neo4j_driver is None:
            warnings.append("Neo4j not available (knowledge graph disabled)")
        else:
            try:
                lineage = await feature_lineage_rca(
                    neo4j_driver=neo4j_driver,
                    user_id=str(current_user.id),
                    feature_name=str(top_feature),
                )
                rca_payload = IncidentRCAResponse(
                    incident_id=incident.incident_id,
                    feature=lineage.get("feature"),
                    lineage_found=bool(lineage.get("lineage_found", False)),
                    transformation_step=lineage.get("transformation_step") or {},
                    dataset=lineage.get("dataset") or {},
                    dataset_version=lineage.get("dataset_version") or {},
                    filters=lineage.get("filters") or [],
                    upstream_columns=lineage.get("upstream_columns") or [],
                    warnings=[],
                )
            except Exception as exc:
                if settings.DEBUG:
                    warnings.append(f"Neo4j lineage lookup failed: {exc}")
                else:
                    warnings.append("Neo4j lineage lookup failed)")

    # "Retrain" (mock): create a new model row as the new version.
    retrained_model_id: Optional[str] = None
    try:
        await _ensure_ml_models_table(db)
        res = await db.execute(
            text(
                """
                INSERT INTO ml_models (name, model_type, status, user_id, created_at, updated_at)
                VALUES (:name, 'demo', 'trained', :user_id, NOW(), NOW())
                RETURNING id
                """
            ),
            {
                "name": f"Autopilot Retrain ({str(model_id)[:8]})",
                "user_id": user_uuid,
            },
        )
        row = res.first()
        if row:
            retrained_model_id = str(row.id)
        await db.commit()
    except Exception:
        try:
            await db.rollback()
        except Exception:
            pass

    actions: list[dict[str, Any]] = []

    actions.append(
        {
            "step": "incident_opened",
            "status": "ok" if incident else "skipped",
            "incident_id": incident.incident_id if incident else None,
        }
    )
    actions.append(
        {
            "step": "root_cause_analysis",
            "status": "ok" if rca_payload else "degraded",
            "summary": _root_cause_narrative_from_stats(
                feature_name=str(top_feature),
                reference_stats=reference_stats,
                current_stats=current_stats,
            ),
            "warnings": warnings,
        }
    )
    actions.append(
        {
            "step": "retrain",
            "status": "ok" if retrained_model_id else "mocked",
            "new_model_id": retrained_model_id,
        }
    )

    # Mock canary + promote metadata.
    endpoint = "/api/deploy/predict"
    actions.append(
        {
            "step": "canary_deploy",
            "status": "ok",
            "endpoint": endpoint,
            "traffic_percent": 10,
            "model_id": retrained_model_id or str(model_id),
        }
    )
    actions.append(
        {
            "step": "promote",
            "status": "ok",
            "endpoint": endpoint,
            "traffic_percent": 100,
            "model_id": retrained_model_id or str(model_id),
        }
    )

    postmortem: dict[str, Any] = {
        "incident_id": incident.incident_id if incident else None,
        "model_id": str(model_id),
        "retrained_model_id": retrained_model_id,
        "summary": "Autopilot detected drift, opened an incident, diagnosed likely data issues, retrained, and safely rolled out a new version.",
        "root_cause": {
            "top_feature": str(top_feature),
            "narrative": _root_cause_narrative_from_stats(
                feature_name=str(top_feature),
                reference_stats=reference_stats,
                current_stats=current_stats,
            ),
        },
        "remediation": [
            "Backfill missing values and add validation on required fields",
            "Update category mapping / encoding to handle new categories",
            "Monitor drift + performance during canary before promotion",
        ],
        "rollout": {
            "strategy": "canary",
            "canary_percent": 10,
            "endpoint": endpoint,
        },
        "generated_at": datetime.utcnow().isoformat(),
    }

    # Persist autopilot output into incident.metadata (best-effort)
    if incident:
        try:
            metadata_update = {
                "autopilot": {
                    "ran_at": datetime.utcnow().isoformat(),
                    "actions": actions,
                    "postmortem": postmortem,
                }
            }
            meta_json = _to_jsonb_param(metadata_update)
            await db.execute(
                text(
                    """
                    UPDATE model_incidents
                    SET metadata = COALESCE(metadata, '{}'::jsonb) || CAST(:patch AS jsonb), updated_at = NOW()
                    WHERE id = :incident_id
                    """
                ),
                {"incident_id": UUID(incident.incident_id), "patch": meta_json},
            )
            await db.commit()
        except Exception:
            try:
                await db.rollback()
            except Exception:
                pass

    # Ensure JSON-safe
    drift_report = _json_sanitize(drift_report)

    return AutopilotRunResponse(
        model_id=str(model_id),
        drift_report=drift_report,
        incident=incident,
        rca=rca_payload,
        actions=_json_sanitize(actions),
        postmortem=_json_sanitize(postmortem),
    )


@router.get("/models/{model_id}/drift/layers", response_model=Dict[str, Any])
async def get_drift_layers(
    model_id: UUID,
    window_hours: int = Query(24, ge=1, le=24 * 30, description="Current window size in hours"),
    sample_limit: int = Query(2000, ge=50, le=20000, description="Max prediction logs sampled per window"),
    persist: bool = Query(True, description="Persist computed report into model_drift_reports"),
    db: AsyncSession = Depends(get_postgres_session),
    tsdb: AsyncSession = Depends(get_timescaledb_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Compute 3-layer drift for a deployed/serving model.

    Layers:
    - Data drift: PSI, KS, Jensen–Shannon divergence over feature distributions
    - Prediction drift: output distribution drift (classification priors or regression distribution)
    - Performance drift: rolling metrics vs previous window

    Reference window defaults to the previous window of the same size.
    """

    await _ensure_modelops_tables(db)

    user_uuid = _safe_uuid(current_user.id)
    warning_th, critical_th, auto_open = await _get_policy_thresholds(db, user_id=user_uuid)
    thresholds = DriftThresholds(warning=warning_th, critical=critical_th)

    now = datetime.utcnow()
    cur_start = now - timedelta(hours=window_hours)
    ref_end = cur_start
    ref_start = ref_end - timedelta(hours=window_hours)

    svc = TimescaleService(tsdb)

    ref_logs = await svc.get_prediction_logs(model_id=model_id, start_time=ref_start, end_time=ref_end, limit=sample_limit)
    cur_logs = await svc.get_prediction_logs(model_id=model_id, start_time=cur_start, end_time=now, limit=sample_limit)

    ref_inputs = [getattr(l, "input_data", None) for l in ref_logs]
    cur_inputs = [getattr(l, "input_data", None) for l in cur_logs]
    ref_preds = [getattr(l, "prediction", None) for l in ref_logs]
    cur_preds = [getattr(l, "prediction", None) for l in cur_logs]

    data_layer = data_drift_from_samples(
        [d for d in ref_inputs if isinstance(d, dict)],
        [d for d in cur_inputs if isinstance(d, dict)],
        thresholds=thresholds,
    )
    pred_layer = prediction_drift_from_samples(ref_preds, cur_preds, thresholds=thresholds)

    # Performance drift from Timescale model_metrics (requires someone to log metrics when labels arrive)
    metric_names = ["accuracy", "precision", "recall", "f1", "f1_score", "loss"]

    async def avg_metric(start: datetime, end: datetime) -> Dict[str, float]:
        out: Dict[str, float] = {}
        for name in metric_names:
            rows = await svc.get_model_metrics(model_id=model_id, metric_name=name, start_time=start, end_time=end, limit=5000)
            vals = []
            for r in rows:
                try:
                    vals.append(float(r.metric_value))
                except Exception:
                    continue
            a = _avg(vals)
            if a is not None:
                out[name] = a
        return out

    ref_metrics = await avg_metric(ref_start, ref_end)
    cur_metrics = await avg_metric(cur_start, now)
    perf_layer = performance_drift_from_metrics(ref_metrics, cur_metrics, thresholds=thresholds)

    overall_score = max(
        float(data_layer.get("score") or 0.0),
        float(pred_layer.get("score") or 0.0),
        float(perf_layer.get("score") or 0.0),
    )
    severity = severity_from_score(overall_score, thresholds)

    recommended_actions: list[str] = []
    if severity == "critical":
        recommended_actions = [
            "Open incident and investigate upstream data changes",
            "Inspect feature pipeline and serving inputs",
            "Check live performance metrics; consider rollback/canary reduction",
        ]
    elif severity == "warning":
        recommended_actions = [
            "Monitor closely and validate feature pipelines",
            "Review input feature distributions and predicted output shifts",
        ]
    else:
        recommended_actions = ["No significant drift detected"]

    report: Dict[str, Any] = {
        "model_id": str(model_id),
        "generated_at": now.isoformat(),
        "reference_window": {"start": ref_start.isoformat(), "end": ref_end.isoformat()},
        "current_window": {"start": cur_start.isoformat(), "end": now.isoformat()},
        "samples": {
            "reference_predictions": len(ref_logs),
            "current_predictions": len(cur_logs),
        },
        "has_drift": overall_score >= thresholds.warning,
        "drift_score": overall_score,
        "severity": severity,
        "layers": {
            "data_drift": data_layer,
            "prediction_drift": pred_layer,
            "performance_drift": perf_layer,
        },
        "recommended_actions": recommended_actions,
    }

    # Persist for audit / incidents
    if persist:
        try:
            report_json = _to_jsonb_param(report)
            result = await db.execute(
                text(
                    """
                    INSERT INTO model_drift_reports (model_id, user_id, has_drift, drift_score, severity, report, created_at)
                    VALUES (:model_id, :user_id, :has_drift, :drift_score, :severity, CAST(:report AS JSONB), NOW())
                    RETURNING id, created_at
                    """
                ),
                {
                    "model_id": model_id,
                    "user_id": user_uuid,
                    "has_drift": bool(report.get("has_drift", False)),
                    "drift_score": float(report.get("drift_score", 0.0)),
                    "severity": str(report.get("severity", "info")),
                    "report": report_json,
                },
            )
            row = result.first()
            await db.commit()

            if row and auto_open:
                incident = await _maybe_open_incident(
                    db,
                    model_id=model_id,
                    user_id=user_uuid,
                    drift_report_id=row.id,
                    drift_report=report,
                    auto_open_incident=auto_open,
                )
                if incident:
                    report["incident"] = {"id": incident.incident_id, "status": incident.status}
                    await db.commit()

            # Fully automatic: if drift clears, resolve any prior open incidents.
            if row:
                resolved_ids = await _maybe_autoresolve_incidents(
                    db,
                    model_id=model_id,
                    user_id=user_uuid,
                    drift_report_id=row.id,
                    drift_report_created_at=row.created_at,
                    drift_report=report,
                )
                if resolved_ids:
                    report["autoresolved_incidents"] = resolved_ids
                    await db.commit()
        except SQLAlchemyError as exc:
            await db.rollback()
            raise _db_unavailable("Failed to persist drift layers report", exc=exc)

    return _json_sanitize(report)


@router.get("/models/{model_id}/drift/latest", response_model=Dict[str, Any])
async def get_latest_drift_report(
    model_id: UUID,
    db: AsyncSession = Depends(get_postgres_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    await _ensure_modelops_tables(db)

    _ = current_user  # authentication gate

    result = await db.execute(
        text(
            """
            SELECT id, created_at, has_drift, drift_score, severity, report
            FROM model_drift_reports
            WHERE model_id = :model_id
            ORDER BY created_at DESC
            LIMIT 1
            """
        ),
        {"model_id": model_id},
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="No drift reports found for model")

    return {
        "id": str(row.id),
        "model_id": str(model_id),
        "created_at": row.created_at.isoformat(),
        "has_drift": row.has_drift,
        "drift_score": float(row.drift_score),
        "severity": row.severity,
        "report": row.report or {},
    }


@router.get("/incidents", response_model=List[IncidentResponse])
async def list_incidents(
    db: AsyncSession = Depends(get_postgres_session),
    current_user: User = Depends(get_current_user),
    status_filter: Optional[str] = Query(None, alias="status"),
    model_id: Optional[UUID] = Query(None),
    limit: int = Query(50, ge=1, le=500),
) -> List[IncidentResponse]:
    await _ensure_modelops_tables(db)

    user_uuid = _safe_uuid(current_user.id)

    where = ["1=1"]
    params: Dict[str, Any] = {"limit": limit}

    if status_filter:
        where.append("status = :status")
        params["status"] = status_filter

    if model_id:
        where.append("model_id = :model_id")
        params["model_id"] = model_id

    # If we have a UUID user, filter to user-owned reports/incidents.
    # (Incidents currently don't store user_id; use drift_report linkage when possible.)
    if user_uuid is not None:
        where.append(
            "(drift_report_id IS NULL OR drift_report_id IN (SELECT id FROM model_drift_reports WHERE user_id = :user_id))"
        )
        params["user_id"] = user_uuid

    result = await db.execute(
        text(
            f"""
            SELECT id, model_id, status, severity, title, summary, created_at, updated_at, resolved_at, metadata
            FROM model_incidents
            WHERE {' AND '.join(where)}
            ORDER BY created_at DESC
            LIMIT :limit
            """
        ),
        params,
    )

    rows = result.fetchall()
    return [
        IncidentResponse(
            incident_id=str(r.id),
            model_id=str(r.model_id),
            status=r.status,
            severity=r.severity,
            title=r.title,
            summary=r.summary,
            created_at=r.created_at,
            updated_at=r.updated_at,
            resolved_at=r.resolved_at,
            metadata=r.metadata or {},
        )
        for r in rows
    ]


@router.post("/incidents/{incident_id}/ack", response_model=IncidentResponse)
async def acknowledge_incident(
    incident_id: UUID,
    db: AsyncSession = Depends(get_postgres_session),
    current_user: User = Depends(get_current_user),
) -> IncidentResponse:
    await _ensure_modelops_tables(db)

    _ = current_user

    result = await db.execute(
        text(
            """
            UPDATE model_incidents
            SET status = 'acknowledged', updated_at = NOW()
            WHERE id = :incident_id
            RETURNING id, model_id, status, severity, title, summary, created_at, updated_at, resolved_at, metadata
            """
        ),
        {"incident_id": incident_id},
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Incident not found")

    await db.commit()

    return IncidentResponse(
        incident_id=str(row.id),
        model_id=str(row.model_id),
        status=row.status,
        severity=row.severity,
        title=row.title,
        summary=row.summary,
        created_at=row.created_at,
        updated_at=row.updated_at,
        resolved_at=row.resolved_at,
        metadata=row.metadata or {},
    )


@router.post("/incidents/{incident_id}/resolve", response_model=IncidentResponse)
async def resolve_incident(
    incident_id: UUID,
    db: AsyncSession = Depends(get_postgres_session),
    current_user: User = Depends(get_current_user),
) -> IncidentResponse:
    await _ensure_modelops_tables(db)

    _ = current_user

    result = await db.execute(
        text(
            """
            UPDATE model_incidents
            SET status = 'resolved', resolved_at = NOW(), updated_at = NOW()
            WHERE id = :incident_id
            RETURNING id, model_id, status, severity, title, summary, created_at, updated_at, resolved_at, metadata
            """
        ),
        {"incident_id": incident_id},
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Incident not found")

    await db.commit()

    return IncidentResponse(
        incident_id=str(row.id),
        model_id=str(row.model_id),
        status=row.status,
        severity=row.severity,
        title=row.title,
        summary=row.summary,
        created_at=row.created_at,
        updated_at=row.updated_at,
        resolved_at=row.resolved_at,
        metadata=row.metadata or {},
    )


@router.post("/incidents/{incident_id}/autoresolve-check", response_model=IncidentAutoResolveCheckResponse)
async def autoresolve_check_incident(
    incident_id: UUID,
    db: AsyncSession = Depends(get_postgres_session),
    current_user: User = Depends(get_current_user),
) -> IncidentAutoResolveCheckResponse:
    """Auto-resolve an incident if drift appears to be cleared.

    Criteria (minimal / MVP):
    - Incident exists and is not already resolved
    - There is a newer drift report for the same model (created after the incident)
    - Latest drift report indicates no drift: `has_drift=false` OR `severity='info'`

    Intended usage: called from UI or a cron/job.
    """

    await _ensure_modelops_tables(db)

    _ = current_user  # auth gate

    try:
        result = await db.execute(
            text(
                """
                SELECT id, model_id, status, severity, title, summary, created_at, updated_at, resolved_at, metadata
                FROM model_incidents
                WHERE id = :incident_id
                LIMIT 1
                """
            ),
            {"incident_id": incident_id},
        )
        incident_row = result.first()
    except SQLAlchemyError as exc:
        raise _db_unavailable("Failed to load incident", exc=exc)

    if not incident_row:
        raise HTTPException(status_code=404, detail="Incident not found")

    # If already resolved, no-op.
    if str(incident_row.status) == "resolved":
        return IncidentAutoResolveCheckResponse(
            resolved=False,
            reason="Incident already resolved",
            incident=IncidentResponse(
                incident_id=str(incident_row.id),
                model_id=str(incident_row.model_id),
                status=incident_row.status,
                severity=incident_row.severity,
                title=incident_row.title,
                summary=incident_row.summary,
                created_at=incident_row.created_at,
                updated_at=incident_row.updated_at,
                resolved_at=incident_row.resolved_at,
                metadata=incident_row.metadata or {},
            ),
        )

    # Find the latest drift report for the same model.
    try:
        report_result = await db.execute(
            text(
                """
                SELECT id, created_at, has_drift, severity, drift_score
                FROM model_drift_reports
                WHERE model_id = :model_id
                ORDER BY created_at DESC
                LIMIT 1
                """
            ),
            {"model_id": incident_row.model_id},
        )
        report_row = report_result.first()
    except SQLAlchemyError as exc:
        raise _db_unavailable("Failed to load latest drift report", exc=exc)

    if not report_row:
        return IncidentAutoResolveCheckResponse(
            resolved=False,
            reason="No drift reports found for model",
            incident=IncidentResponse(
                incident_id=str(incident_row.id),
                model_id=str(incident_row.model_id),
                status=incident_row.status,
                severity=incident_row.severity,
                title=incident_row.title,
                summary=incident_row.summary,
                created_at=incident_row.created_at,
                updated_at=incident_row.updated_at,
                resolved_at=incident_row.resolved_at,
                metadata=incident_row.metadata or {},
            ),
        )

    # Avoid resolving based on the same-time report that opened the incident.
    # Require the latest report to be strictly newer than the incident timestamp.
    try:
        if report_row.created_at <= incident_row.created_at:
            return IncidentAutoResolveCheckResponse(
                resolved=False,
                reason="Latest drift report is not newer than incident",
                incident=IncidentResponse(
                    incident_id=str(incident_row.id),
                    model_id=str(incident_row.model_id),
                    status=incident_row.status,
                    severity=incident_row.severity,
                    title=incident_row.title,
                    summary=incident_row.summary,
                    created_at=incident_row.created_at,
                    updated_at=incident_row.updated_at,
                    resolved_at=incident_row.resolved_at,
                    metadata=incident_row.metadata or {},
                ),
            )
    except Exception:
        # If timestamps are missing/unexpected, proceed with best-effort criteria.
        pass

    latest_has_drift = bool(report_row.has_drift)
    latest_severity = str(report_row.severity or "info")

    cleared = (not latest_has_drift) or (latest_severity == "info")
    if not cleared:
        return IncidentAutoResolveCheckResponse(
            resolved=False,
            reason="Drift still present in latest report",
            incident=IncidentResponse(
                incident_id=str(incident_row.id),
                model_id=str(incident_row.model_id),
                status=incident_row.status,
                severity=incident_row.severity,
                title=incident_row.title,
                summary=incident_row.summary,
                created_at=incident_row.created_at,
                updated_at=incident_row.updated_at,
                resolved_at=incident_row.resolved_at,
                metadata=incident_row.metadata or {},
            ),
        )

    # Resolve and annotate metadata.
    meta = incident_row.metadata or {}
    if not isinstance(meta, dict):
        meta = {"previous_metadata": meta}

    meta["autoresolve"] = {
        "source": "autopilot",
        "checked_at": datetime.utcnow().isoformat(),
        "evidence": {
            "latest_drift_report_id": str(report_row.id),
            "latest_has_drift": latest_has_drift,
            "latest_severity": latest_severity,
            "latest_drift_score": float(report_row.drift_score) if report_row.drift_score is not None else None,
        },
    }

    try:
        meta_json = _to_jsonb_param(meta)
        update_result = await db.execute(
            text(
                """
                UPDATE model_incidents
                SET status = 'resolved', resolved_at = NOW(), updated_at = NOW(), metadata = CAST(:metadata AS JSONB)
                WHERE id = :incident_id
                RETURNING id, model_id, status, severity, title, summary, created_at, updated_at, resolved_at, metadata
                """
            ),
            {"incident_id": incident_id, "metadata": meta_json},
        )
        updated = update_result.first()
        if not updated:
            raise HTTPException(status_code=500, detail="Failed to resolve incident")
        await db.commit()
    except HTTPException:
        raise
    except (ValueError, TypeError) as exc:
        await db.rollback()
        raise HTTPException(status_code=422, detail=f"Invalid metadata payload: {exc}")
    except SQLAlchemyError as exc:
        await db.rollback()
        raise _db_unavailable("Failed to resolve incident", exc=exc)

    return IncidentAutoResolveCheckResponse(
        resolved=True,
        reason="Drift cleared in latest report",
        incident=IncidentResponse(
            incident_id=str(updated.id),
            model_id=str(updated.model_id),
            status=updated.status,
            severity=updated.severity,
            title=updated.title,
            summary=updated.summary,
            created_at=updated.created_at,
            updated_at=updated.updated_at,
            resolved_at=updated.resolved_at,
            metadata=updated.metadata or {},
        ),
    )
