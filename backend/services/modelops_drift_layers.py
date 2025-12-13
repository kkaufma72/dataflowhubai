"""ModelOps drift layer computations.

Implements three drift layers:
- Data drift: feature distribution changes (PSI, KS test, Jensen–Shannon divergence)
- Prediction drift: output distribution changes
- Performance drift: rolling metrics vs a reference window

This module avoids heavy dependencies (numpy/scipy) and operates on in-memory
samples extracted from TimescaleDB prediction logs / metrics.
"""

from __future__ import annotations

import math
from collections import Counter
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Tuple


EPS = 1e-12


def _clamp01(x: float) -> float:
    if x <= 0.0:
        return 0.0
    if x >= 1.0:
        return 1.0
    return x


def _is_number(value: Any) -> bool:
    if isinstance(value, bool):
        return False
    return isinstance(value, (int, float))


def _to_float(value: Any) -> Optional[float]:
    try:
        if value is None:
            return None
        if isinstance(value, bool):
            return None
        x = float(value)
        return x if math.isfinite(x) else None
    except Exception:
        return None


def _normalize_probs(counts: List[float]) -> List[float]:
    total = float(sum(counts))
    if total <= 0:
        return [0.0 for _ in counts]
    return [float(c) / total for c in counts]


def _psi_from_probs(p: List[float], q: List[float], eps: float = 1e-6) -> float:
    """Population Stability Index.

    PSI = Σ (p_i - q_i) * ln(p_i / q_i)

    Uses epsilon smoothing to avoid log(0).
    """

    if len(p) != len(q):
        raise ValueError("PSI requires vectors of same length")

    psi = 0.0
    for pi, qi in zip(p, q):
        pi2 = max(float(pi), eps)
        qi2 = max(float(qi), eps)
        psi += (pi2 - qi2) * math.log(pi2 / qi2)
    return float(psi)


def _kl_divergence(p: List[float], q: List[float], eps: float = 1e-12) -> float:
    if len(p) != len(q):
        raise ValueError("KL requires vectors of same length")

    total = 0.0
    for pi, qi in zip(p, q):
        pi2 = max(float(pi), eps)
        qi2 = max(float(qi), eps)
        total += pi2 * math.log(pi2 / qi2)
    return float(total)


def js_divergence(p: List[float], q: List[float]) -> float:
    """Jensen–Shannon divergence (natural log).

    Bounded in [0, ln(2)] for valid probability vectors.
    """

    if len(p) != len(q):
        raise ValueError("JS requires vectors of same length")

    m = [(float(pi) + float(qi)) / 2.0 for pi, qi in zip(p, q)]
    return 0.5 * _kl_divergence(p, m) + 0.5 * _kl_divergence(q, m)


def _histogram_numeric(values: List[float], *, bins: int = 10) -> Tuple[List[float], List[int]]:
    if not values:
        return [0.0, 1.0], [0]

    vmin = min(values)
    vmax = max(values)

    if not math.isfinite(vmin) or not math.isfinite(vmax):
        return [0.0, 1.0], [0]

    if vmin == vmax:
        return [vmin, vmax], [len(values)]

    step = (vmax - vmin) / float(bins)
    edges = [vmin + i * step for i in range(bins + 1)]
    counts = [0 for _ in range(bins)]

    for x in values:
        if x is None:
            continue
        if x <= vmin:
            idx = 0
        elif x >= vmax:
            idx = bins - 1
        else:
            idx = int((x - vmin) / step)
            idx = max(0, min(bins - 1, idx))
        counts[idx] += 1

    return edges, counts


def _align_histograms(
    ref_values: List[float],
    cur_values: List[float],
    *,
    bins: int = 10,
) -> Tuple[List[float], List[int], List[int]]:
    """Build aligned histograms by using bins from combined range."""

    all_values = [v for v in (ref_values + cur_values) if v is not None]
    if not all_values:
        edges, _ = _histogram_numeric([0.0], bins=bins)
        return edges, [0 for _ in range(bins)], [0 for _ in range(bins)]

    vmin = min(all_values)
    vmax = max(all_values)
    if vmin == vmax:
        edges = [vmin, vmax]
        return edges, [len([v for v in ref_values if v is not None])], [len([v for v in cur_values if v is not None])]

    step = (vmax - vmin) / float(bins)
    edges = [vmin + i * step for i in range(bins + 1)]

    def bin_counts(values: List[float]) -> List[int]:
        counts = [0 for _ in range(bins)]
        for x in values:
            if x is None:
                continue
            if x <= vmin:
                idx = 0
            elif x >= vmax:
                idx = bins - 1
            else:
                idx = int((x - vmin) / step)
                idx = max(0, min(bins - 1, idx))
            counts[idx] += 1
        return counts

    return edges, bin_counts(ref_values), bin_counts(cur_values)


def ks_2samp(ref: List[float], cur: List[float]) -> Dict[str, Any]:
    """Two-sample Kolmogorov–Smirnov test (approximate p-value).

    Returns D statistic and a rough p-value using an asymptotic approximation.
    """

    x = sorted([v for v in ref if v is not None])
    y = sorted([v for v in cur if v is not None])
    n1 = len(x)
    n2 = len(y)

    if n1 == 0 or n2 == 0:
        return {"statistic": 0.0, "p_value": None, "n_ref": n1, "n_cur": n2}

    i = 0
    j = 0
    d = 0.0

    while i < n1 and j < n2:
        if x[i] <= y[j]:
            i += 1
        else:
            j += 1
        cdf1 = i / n1
        cdf2 = j / n2
        d = max(d, abs(cdf1 - cdf2))

    # asymptotic p-value approximation
    n_eff = (n1 * n2) / (n1 + n2)
    p = 2.0 * math.exp(-2.0 * (d**2) * n_eff)
    p = float(min(max(p, 0.0), 1.0))

    return {"statistic": float(d), "p_value": p, "n_ref": n1, "n_cur": n2}


@dataclass
class DriftThresholds:
    warning: float = 0.20
    critical: float = 0.40


def severity_from_score(score: float, thresholds: DriftThresholds) -> str:
    if score >= thresholds.critical:
        return "critical"
    if score >= thresholds.warning:
        return "warning"
    return "info"


def data_drift_from_samples(
    ref_inputs: List[Dict[str, Any]],
    cur_inputs: List[Dict[str, Any]],
    *,
    thresholds: DriftThresholds,
    bins: int = 10,
    top_k_categories: int = 50,
) -> Dict[str, Any]:
    """Compute data drift per feature from raw input_data samples."""

    feature_names = sorted(set().union(*(d.keys() for d in (ref_inputs + cur_inputs) if isinstance(d, dict))))

    affected: List[Dict[str, Any]] = []
    overall = 0.0

    for feature in feature_names:
        ref_vals_raw = [(d.get(feature) if isinstance(d, dict) else None) for d in ref_inputs]
        cur_vals_raw = [(d.get(feature) if isinstance(d, dict) else None) for d in cur_inputs]

        # Determine type
        ref_num = [_to_float(v) for v in ref_vals_raw]
        cur_num = [_to_float(v) for v in cur_vals_raw]

        numeric_ratio = 0.0
        denom = max(1, len(ref_vals_raw) + len(cur_vals_raw))
        numeric_ratio = (
            sum(1 for v in ref_num if v is not None) + sum(1 for v in cur_num if v is not None)
        ) / denom

        metrics: Dict[str, Any] = {}
        score = 0.0

        if numeric_ratio >= 0.6:
            edges, ref_counts, cur_counts = _align_histograms(ref_num, cur_num, bins=bins)
            p = _normalize_probs([float(c) for c in ref_counts])
            q = _normalize_probs([float(c) for c in cur_counts])

            psi = _psi_from_probs(p, q)
            js = js_divergence(p, q)
            ks = ks_2samp(ref_num, cur_num)

            metrics = {
                "type": "numeric",
                "psi": psi,
                "js_divergence": js,
                "ks": ks,
                "histogram": {"edges": edges, "ref_counts": ref_counts, "cur_counts": cur_counts},
            }

            # Normalize into [0,1] score
            score = max(
                _clamp01(psi / 0.25),
                _clamp01(js / 0.10),
                _clamp01(float(ks.get("statistic") or 0.0) / 0.25),
            )
        else:
            # Treat as categorical
            def normalize_cat(values: List[Any]) -> Tuple[List[str], List[float]]:
                cleaned = ["__NULL__" if v is None else str(v) for v in values]
                counts = Counter(cleaned)
                most_common = counts.most_common(top_k_categories)
                kept = {k for k, _ in most_common}
                other = sum(v for k, v in counts.items() if k not in kept)

                labels = [k for k, _ in most_common]
                probs = [float(counts[k]) for k in labels]
                if other > 0:
                    labels.append("__OTHER__")
                    probs.append(float(other))

                return labels, _normalize_probs(probs)

            ref_labels, p = normalize_cat(ref_vals_raw)
            cur_labels, q = normalize_cat(cur_vals_raw)

            # Align labels
            labels = sorted(set(ref_labels) | set(cur_labels))
            p_map = dict(zip(ref_labels, p))
            q_map = dict(zip(cur_labels, q))
            p2 = [float(p_map.get(lbl, 0.0)) for lbl in labels]
            q2 = [float(q_map.get(lbl, 0.0)) for lbl in labels]

            psi = _psi_from_probs(p2, q2)
            js = js_divergence(p2, q2)

            metrics = {
                "type": "categorical",
                "psi": psi,
                "js_divergence": js,
                "labels": labels[:200],
            }

            score = max(_clamp01(psi / 0.25), _clamp01(js / 0.10))

        if score > 0:
            severity = severity_from_score(score, thresholds)
            affected.append(
                {
                    "feature": feature,
                    "score": float(score),
                    "severity": severity,
                    "metrics": metrics,
                }
            )

        overall = max(overall, float(score))

    affected.sort(key=lambda x: x["score"], reverse=True)

    return {
        "layer": "data_drift",
        "score": float(overall),
        "severity": severity_from_score(overall, thresholds),
        "affected_features": affected[:50],
        "tests": ["psi", "ks", "js_divergence"],
    }


def prediction_drift_from_samples(
    ref_preds: List[Any],
    cur_preds: List[Any],
    *,
    thresholds: DriftThresholds,
    bins: int = 10,
) -> Dict[str, Any]:
    """Compute prediction drift.

    - Classification: drift on predicted label distribution
    - Regression: drift on predicted value distribution (PSI/KS/JS)
    """

    def extract_scalar(p: Any) -> Any:
        if isinstance(p, dict):
            for key in ("label", "class", "prediction", "pred", "value", "y"):
                if key in p:
                    return p.get(key)
            # if dict of probabilities, take argmax key
            if p:
                try:
                    best = max(p.items(), key=lambda kv: float(kv[1]))
                    return best[0]
                except Exception:
                    return str(p)
        if isinstance(p, list) and len(p) == 1:
            return p[0]
        return p

    ref_s = [extract_scalar(p) for p in ref_preds]
    cur_s = [extract_scalar(p) for p in cur_preds]

    ref_num = [_to_float(v) for v in ref_s]
    cur_num = [_to_float(v) for v in cur_s]

    numeric_ratio = (
        sum(1 for v in ref_num if v is not None) + sum(1 for v in cur_num if v is not None)
    ) / max(1, len(ref_s) + len(cur_s))

    if numeric_ratio >= 0.6:
        # Regression-style drift
        edges, ref_counts, cur_counts = _align_histograms(ref_num, cur_num, bins=bins)
        p = _normalize_probs([float(c) for c in ref_counts])
        q = _normalize_probs([float(c) for c in cur_counts])

        psi = _psi_from_probs(p, q)
        js = js_divergence(p, q)
        ks = ks_2samp(ref_num, cur_num)

        score = max(
            _clamp01(psi / 0.25),
            _clamp01(js / 0.10),
            _clamp01(float(ks.get("statistic") or 0.0) / 0.25),
        )

        return {
            "layer": "prediction_drift",
            "type": "regression",
            "score": float(score),
            "severity": severity_from_score(score, thresholds),
            "metrics": {
                "psi": psi,
                "js_divergence": js,
                "ks": ks,
                "histogram": {"edges": edges, "ref_counts": ref_counts, "cur_counts": cur_counts},
            },
        }

    # Classification-style drift
    ref_labels = ["__NULL__" if v is None else str(v) for v in ref_s]
    cur_labels = ["__NULL__" if v is None else str(v) for v in cur_s]

    c1 = Counter(ref_labels)
    c2 = Counter(cur_labels)
    labels = sorted(set(c1.keys()) | set(c2.keys()))

    p = _normalize_probs([float(c1.get(lbl, 0)) for lbl in labels])
    q = _normalize_probs([float(c2.get(lbl, 0)) for lbl in labels])

    psi = _psi_from_probs(p, q)
    js = js_divergence(p, q)

    score = max(_clamp01(psi / 0.25), _clamp01(js / 0.10))

    return {
        "layer": "prediction_drift",
        "type": "classification",
        "score": float(score),
        "severity": severity_from_score(score, thresholds),
        "metrics": {
            "psi": psi,
            "js_divergence": js,
            "labels": labels[:200],
        },
    }


def performance_drift_from_metrics(
    ref_metrics: Dict[str, float],
    cur_metrics: Dict[str, float],
    *,
    thresholds: DriftThresholds,
) -> Dict[str, Any]:
    """Compute performance drift from rolling metrics.

    Uses relative degradation vs reference window where possible.
    """

    tracked = sorted(set(ref_metrics.keys()) | set(cur_metrics.keys()))
    degradations: List[Dict[str, Any]] = []
    worst = 0.0

    for metric in tracked:
        ref = ref_metrics.get(metric)
        cur = cur_metrics.get(metric)
        if ref is None or cur is None:
            continue

        # For loss-like metrics, higher is worse; for accuracy-like, lower is worse.
        is_loss = "loss" in metric.lower() or "error" in metric.lower()

        if is_loss:
            # increase in loss is degradation
            delta = float(cur - ref)
        else:
            # drop in metric is degradation
            delta = float(ref - cur)

        if ref != 0:
            rel = delta / abs(ref)
        else:
            rel = delta

        degradation = max(0.0, rel)
        worst = max(worst, degradation)

        degradations.append(
            {
                "metric": metric,
                "reference": float(ref),
                "current": float(cur),
                "relative_degradation": float(degradation),
            }
        )

    degradations.sort(key=lambda x: x["relative_degradation"], reverse=True)

    # Normalize: 10% degradation -> score 1.0
    score = _clamp01(worst / 0.10)

    return {
        "layer": "performance_drift",
        "score": float(score),
        "severity": severity_from_score(score, thresholds),
        "degradations": degradations[:25],
    }
