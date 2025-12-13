"""ModelOps drift report computation.

This is a lightweight implementation that can run with only summary stats.
It is not intended to replace full distributional drift detection (PSI/KS/etc).
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Tuple

from schemas.modelops import FeatureStats


def _clamp01(x: float) -> float:
    if x < 0.0:
        return 0.0
    if x > 1.0:
        return 1.0
    return x


def _severity_from_score(score: float, warning: float, critical: float) -> str:
    if score >= critical:
        return "critical"
    if score >= warning:
        return "warning"
    return "info"


def _feature_score(reference: FeatureStats, current: FeatureStats) -> Tuple[float, Dict[str, Any]]:
    signals: Dict[str, Any] = {}

    # Mean shift normalized by reference std.
    mean_score = 0.0
    if reference.mean is not None and current.mean is not None:
        ref_std = reference.std if (reference.std is not None and reference.std > 0) else None
        if ref_std:
            z = abs(current.mean - reference.mean) / (ref_std + 1e-9)
            # 3 std shift ~ 1.0
            mean_score = _clamp01(z / 3.0)
            signals["mean_z"] = z
        else:
            # If std is missing/zero, fallback to absolute mean delta.
            delta = abs(current.mean - reference.mean)
            mean_score = _clamp01(delta)
            signals["mean_abs_delta"] = delta

    # Missing rate shift.
    missing_score = 0.0
    if reference.missing_rate is not None and current.missing_rate is not None:
        delta = abs(current.missing_rate - reference.missing_rate)
        # 20% delta ~ 1.0
        missing_score = _clamp01(delta / 0.20)
        signals["missing_rate_delta"] = delta

    # Unique count shift (very coarse signal).
    unique_score = 0.0
    if reference.unique_count is not None and current.unique_count is not None:
        if reference.unique_count > 0:
            ratio = current.unique_count / reference.unique_count
            unique_score = _clamp01(abs(1.0 - ratio))
            signals["unique_ratio"] = ratio

    score = max(mean_score, missing_score, unique_score)
    return score, signals


def compute_drift_report(
    *,
    model_id: str,
    reference_stats: Dict[str, FeatureStats],
    current_stats: Dict[str, FeatureStats],
    policy_threshold_warning: float = 0.20,
    policy_threshold_critical: float = 0.40,
    context: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    """Compute a JSON drift report.

    Inputs are keyed by feature name and contain basic summary stats.
    """

    ctx = context or {}

    feature_names = sorted(set(reference_stats.keys()) | set(current_stats.keys()))

    missing_in_current = sorted(set(reference_stats.keys()) - set(current_stats.keys()))
    new_in_current = sorted(set(current_stats.keys()) - set(reference_stats.keys()))

    drifted_features: list[Dict[str, Any]] = []
    feature_scores: Dict[str, float] = {}

    for feature_name in feature_names:
        ref = reference_stats.get(feature_name, FeatureStats())
        cur = current_stats.get(feature_name, FeatureStats())
        score, signals = _feature_score(ref, cur)
        feature_scores[feature_name] = score

        if score > 0:
            drifted_features.append(
                {
                    "feature": feature_name,
                    "score": score,
                    "severity": _severity_from_score(
                        score, policy_threshold_warning, policy_threshold_critical
                    ),
                    "signals": signals,
                    "reference": ref.model_dump(mode="json"),
                    "current": cur.model_dump(mode="json"),
                }
            )

    drifted_features.sort(key=lambda x: x["score"], reverse=True)

    overall_score = max(feature_scores.values()) if feature_scores else 0.0
    severity = _severity_from_score(overall_score, policy_threshold_warning, policy_threshold_critical)

    has_drift = overall_score >= policy_threshold_warning

    suspected_causes: list[Dict[str, Any]] = []

    # 1) Upstream schema change (missing/new features, or sharp missing-rate shifts)
    if missing_in_current or new_in_current:
        magnitude = _clamp01(0.2 + 0.15 * (len(missing_in_current) + len(new_in_current)))
        suspected_causes.append(
            {
                "cause": "Upstream schema change",
                "cause_type": "schema_change",
                "confidence": magnitude,
                "evidence": {
                    "missing_features": missing_in_current[:50],
                    "new_features": new_in_current[:50],
                },
            }
        )

    # 2) New category introduced (large unique-count ratio shift on top categorical-like feature)
    if drifted_features:
        top = drifted_features[0]
        unique_ratio = None
        try:
            unique_ratio = float((top.get("signals") or {}).get("unique_ratio"))
        except Exception:
            unique_ratio = None

        if unique_ratio is not None and (unique_ratio >= 1.25 or unique_ratio <= 0.80):
            suspected_causes.append(
                {
                    "cause": "New category distribution (category drift)",
                    "cause_type": "new_category",
                    "confidence": _clamp01(0.55 + 0.45 * float(top["score"])),
                    "evidence": {
                        "feature": top["feature"],
                        "unique_ratio": unique_ratio,
                        "feature_score": top["score"],
                    },
                }
            )

        # 3) Seasonality (only when caller provides a hint in context)
        if bool(ctx.get("suspect_seasonality") or ctx.get("seasonality")):
            suspected_causes.append(
                {
                    "cause": "Seasonality / calendar-driven shift",
                    "cause_type": "seasonality",
                    "confidence": _clamp01(0.40 + 0.40 * float(top["score"])),
                    "evidence": {
                        "hint": "Provided by context",
                        "top_feature": top["feature"],
                        "top_feature_score": top["score"],
                        "context": ctx,
                    },
                }
            )

        # Always include a general distribution-shift hypothesis
        suspected_causes.append(
            {
                "cause": "Upstream data distribution shift",
                "cause_type": "distribution_shift",
                "confidence": _clamp01(0.5 + 0.5 * float(top["score"])),
                "evidence": {
                    "top_feature": top["feature"],
                    "top_feature_score": top["score"],
                },
            }
        )

    recommended_actions: list[str] = []
    if severity == "critical":
        recommended_actions = [
            "Open incident and investigate upstream data changes",
            "Validate model inputs and data quality checks",
            "Consider rollback/canary reduction if performance is degraded",
        ]
    elif severity == "warning":
        recommended_actions = [
            "Monitor closely and validate feature pipelines",
            "Review recent dataset/transform changes affecting top drifted features",
        ]
    else:
        recommended_actions = ["No significant drift detected"]

    report: Dict[str, Any] = {
        "model_id": model_id,
        "generated_at": datetime.utcnow().isoformat(),
        "has_drift": has_drift,
        "drift_score": overall_score,
        "severity": severity,
        # Primary requested output: affected features ranked by severity/score
        "affected_features": drifted_features[:25],
        # Back-compat alias
        "drifted_features": drifted_features[:25],
        "suspected_cause_hypotheses": suspected_causes,
        # Back-compat alias
        "suspected_root_causes": suspected_causes,
        "recommended_actions": recommended_actions,
        "context": ctx,
    }

    return report
