"""Pydantic schemas for Observability Traces and Spans (Langfuse pattern)."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TraceSpan(BaseModel):
    """A discrete execution span within an observability trace."""

    span_id: str
    name: str
    start_time: str
    end_time: Optional[str] = None
    latency_ms: float = 0.0
    input_data: Optional[Any] = None
    output_data: Optional[Any] = None
    status: str = "ok"
    attributes: Dict[str, Any] = Field(default_factory=dict)


class TraceRecord(BaseModel):
    """Full execution trace record."""

    trace_id: str
    name: str
    timestamp: str
    model: Optional[str] = None
    latency_ms: float = 0.0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    cost_usd: float = 0.0
    status: str = "success"
    quality_score: Optional[float] = None
    assertions_passed: Optional[int] = None
    assertions_total: Optional[int] = None
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    spans: List[TraceSpan] = Field(default_factory=list)


class TraceListResponse(BaseModel):
    """Paginated list of observability traces."""

    total_traces: int
    page: int
    limit: int
    traces: List[TraceRecord]
