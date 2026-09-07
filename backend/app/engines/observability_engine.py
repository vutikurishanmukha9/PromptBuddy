"""Observability Tracing Engine (Langfuse pattern).

Maintains a thread-safe in-memory store of execution traces, spans, latency,
token usage, quality scores, and assertion outcomes for complete system observability.
"""

from __future__ import annotations

import collections
import datetime
import threading
import uuid
from typing import Any, Dict, List, Optional

from app.schemas.observability import (
    TraceSpan,
    TraceRecord,
    TraceListResponse,
)

_MAX_TRACES = 500
_TRACE_STORE: collections.deque[TraceRecord] = collections.deque(maxlen=_MAX_TRACES)
_TRACE_INDEX: Dict[str, TraceRecord] = {}
_LOCK = threading.Lock()


def record_trace(
    name: str,
    model: Optional[str] = None,
    latency_ms: float = 0.0,
    prompt_tokens: int = 0,
    completion_tokens: int = 0,
    cost_usd: float = 0.0,
    status: str = "success",
    quality_score: Optional[float] = None,
    assertions_passed: Optional[int] = None,
    assertions_total: Optional[int] = None,
    tags: Optional[List[str]] = None,
    metadata: Optional[Dict[str, Any]] = None,
    spans: Optional[List[TraceSpan]] = None,
) -> TraceRecord:
    """Record an execution trace into the circular buffer and index."""
    trace_id = f"trc_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    total_tokens = prompt_tokens + completion_tokens

    record = TraceRecord(
        trace_id=trace_id,
        name=name,
        timestamp=now_iso,
        model=model,
        latency_ms=round(latency_ms, 2),
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
        cost_usd=round(cost_usd, 6),
        status=status,
        quality_score=quality_score,
        assertions_passed=assertions_passed,
        assertions_total=assertions_total,
        tags=tags or [],
        metadata=metadata or {},
        spans=spans or [],
    )

    with _LOCK:
        # If queue is full, remove oldest from index
        if len(_TRACE_STORE) == _MAX_TRACES:
            oldest = _TRACE_STORE[0]
            _TRACE_INDEX.pop(oldest.trace_id, None)

        _TRACE_STORE.append(record)
        _TRACE_INDEX[trace_id] = record

    return record


def get_traces(
    model: Optional[str] = None,
    status: Optional[str] = None,
    tag: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
) -> TraceListResponse:
    """Retrieve filtered and paginated traces from memory."""
    with _LOCK:
        traces_list = list(_TRACE_STORE)

    # Reverse chronological
    traces_list.reverse()

    if model:
        traces_list = [t for t in traces_list if t.model and model.lower() in t.model.lower()]
    if status:
        traces_list = [t for t in traces_list if t.status.lower() == status.lower()]
    if tag:
        traces_list = [t for t in traces_list if tag.lower() in [x.lower() for x in t.tags]]

    total = len(traces_list)
    page = max(1, page)
    limit = max(1, min(limit, 100))
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit

    return TraceListResponse(
        total_traces=total,
        page=page,
        limit=limit,
        traces=traces_list[start_idx:end_idx],
    )


def get_trace(trace_id: str) -> Optional[TraceRecord]:
    """Retrieve a single trace by ID."""
    with _LOCK:
        return _TRACE_INDEX.get(trace_id)


def clear_traces() -> None:
    """Clear all traces (primarily used for test teardown)."""
    with _LOCK:
        _TRACE_STORE.clear()
        _TRACE_INDEX.clear()
