"""Neo4j lineage-based root cause analysis (RCA) helpers.

This module powers the "wow moment" feature:
Given a drift/incident feature name, it traces back to the transformation
step, dataset version + filters used, and upstream column change signals.

The graph model is intentionally minimal and demo-friendly:
- (:Feature {name, user_id})
- (:TransformationStep {name, user_id})-[:PRODUCES]->(:Feature)
- (:Dataset {dataset_id, user_id})-[:HAS_VERSION]->(:DatasetVersion {version_id, user_id})
- (:DatasetVersion)-[:FED_INTO]->(:TransformationStep)
- (:DatasetVersion)-[:APPLIED_FILTER]->(:Filter {expr, user_id})
- (:Feature)-[:DEPENDS_ON]->(:ColumnProfile {column, baseline_type, current_type, baseline_null_rate, current_null_rate, user_id})

All nodes are scoped by `user_id` (string).
"""

from __future__ import annotations

from datetime import date, datetime, time, timedelta
from typing import Any, Dict, List, Optional

from neo4j import AsyncDriver


def _jsonify_neo4j_value(value: Any) -> Any:
    """Convert Neo4j driver values to JSON-friendly primitives.

    The Neo4j Python driver may return temporal types like `neo4j.time.DateTime`
    which are not directly JSON-serializable.
    """

    if value is None:
        return None

    if isinstance(value, (str, int, float, bool)):
        return value

    if isinstance(value, (datetime, date, time)):
        return value.isoformat()

    if isinstance(value, timedelta):
        return value.total_seconds()

    if isinstance(value, bytes):
        try:
            return value.decode("utf-8")
        except Exception:
            return value.hex()

    if isinstance(value, dict):
        return {str(k): _jsonify_neo4j_value(v) for k, v in value.items()}

    if isinstance(value, (list, tuple)):
        return [_jsonify_neo4j_value(v) for v in value]

    # Neo4j temporal/spatial types often provide `.to_native()`.
    to_native = getattr(value, "to_native", None)
    if callable(to_native):
        try:
            native = to_native()
            return _jsonify_neo4j_value(native)
        except Exception:
            pass

    # Fall back to string representation.
    try:
        return str(value)
    except Exception:
        return None


def _node_to_dict(node: Any) -> Dict[str, Any]:
    if node is None:
        return {}
    try:
        return _jsonify_neo4j_value(dict(node))
    except Exception:
        return {}


def _column_signal(profile: Dict[str, Any]) -> Dict[str, Any]:
    baseline_type = profile.get("baseline_type")
    current_type = profile.get("current_type")

    baseline_null_rate = profile.get("baseline_null_rate")
    current_null_rate = profile.get("current_null_rate")

    null_rate_delta = None
    try:
        if baseline_null_rate is not None and current_null_rate is not None:
            null_rate_delta = float(current_null_rate) - float(baseline_null_rate)
    except Exception:
        null_rate_delta = None

    return {
        **profile,
        "type_changed": (
            baseline_type is not None
            and current_type is not None
            and str(baseline_type) != str(current_type)
        ),
        "null_rate_delta": null_rate_delta,
    }


async def feature_lineage_rca(
    *,
    neo4j_driver: AsyncDriver,
    user_id: str,
    feature_name: str,
    max_columns: int = 25,
) -> Dict[str, Any]:
    """Return lineage RCA payload for a feature.

    Returns a JSON-friendly dict. If the feature is not found, returns empty
    lineage fields with `lineage_found=False`.
    """

    cypher = """
    MATCH (f:Feature {name: $feature_name, user_id: $user_id})
    OPTIONAL MATCH (t:TransformationStep {user_id: $user_id})-[:PRODUCES]->(f)
    OPTIONAL MATCH (dv:DatasetVersion {user_id: $user_id})-[:FED_INTO]->(t)
    OPTIONAL MATCH (d:Dataset {user_id: $user_id})-[:HAS_VERSION]->(dv)
    OPTIONAL MATCH (dv)-[:APPLIED_FILTER]->(fil:Filter {user_id: $user_id})
    WITH f, t, dv, d, collect(DISTINCT fil) as filters
    OPTIONAL MATCH (f)-[:DEPENDS_ON]->(cp:ColumnProfile {user_id: $user_id})
    RETURN
      id(f) as feature_node_id,
      f as feature,
      id(t) as step_node_id,
      t as step,
      id(d) as dataset_node_id,
      d as dataset,
      id(dv) as version_node_id,
      dv as version,
      filters as filters,
            collect(DISTINCT cp) as columns
    """

    async with neo4j_driver.session() as session:
        result = await session.run(
            cypher,
            feature_name=feature_name,
            user_id=user_id,
        )
        record = await result.single()

    if not record or record.get("feature") is None:
        return {
            "lineage_found": False,
            "feature": feature_name,
            "transformation_step": {},
            "dataset": {},
            "dataset_version": {},
            "filters": [],
            "upstream_columns": [],
        }

    step = _node_to_dict(record.get("step"))
    dataset = _node_to_dict(record.get("dataset"))
    version = _node_to_dict(record.get("version"))

    filters: List[Dict[str, Any]] = []
    for f in record.get("filters") or []:
        filters.append(_node_to_dict(f))

    upstream_columns: List[Dict[str, Any]] = []
    for cp in (record.get("columns") or [])[: max(0, int(max_columns))]:
        upstream_columns.append(_column_signal(_node_to_dict(cp)))

    # Sort most suspicious first: type changes, then null-rate delta magnitude.
    def _sort_key(item: Dict[str, Any]) -> tuple[int, float]:
        type_changed = 1 if item.get("type_changed") else 0
        delta = item.get("null_rate_delta")
        delta_abs = abs(float(delta)) if delta is not None else 0.0
        return (-type_changed, -delta_abs)

    upstream_columns.sort(key=_sort_key)

    payload: Dict[str, Any] = {
        "lineage_found": True,
        "feature": feature_name,
        "transformation_step": step,
        "dataset": dataset,
        "dataset_version": version,
        "filters": filters,
        "upstream_columns": upstream_columns,
    }

    # Include Neo4j internal IDs when available (useful for graph UI/debugging)
    if record.get("feature_node_id") is not None:
        payload["feature_node_id"] = int(record["feature_node_id"])
    if record.get("step_node_id") is not None:
        payload["step_node_id"] = int(record["step_node_id"])
    if record.get("dataset_node_id") is not None:
        payload["dataset_node_id"] = int(record["dataset_node_id"])
    if record.get("version_node_id") is not None:
        payload["version_node_id"] = int(record["version_node_id"])

    return payload
