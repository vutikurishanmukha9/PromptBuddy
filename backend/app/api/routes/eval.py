"""Evaluation Matrix and Redteaming Security Audit routes (eval-matrix)."""

from __future__ import annotations

import time
from fastapi import APIRouter

from app.schemas.eval import (
    EvalMatrixRequest,
    EvalMatrixResponse,
    RedteamAuditRequest,
    RedteamAuditResponse,
)
from app.engines.eval_matrix_engine import (
    run_eval_matrix,
    run_redteam_audit,
)
from app.engines.observability_engine import record_trace

router = APIRouter(prefix="/eval", tags=["Evaluation & Redteaming Matrix"])


@router.post("/matrix", response_model=EvalMatrixResponse)
async def evaluate_matrix(req: EvalMatrixRequest) -> EvalMatrixResponse:
    """Run batch test case matrix evaluation against assertion rules."""
    started_at = time.perf_counter()
    res = run_eval_matrix(req)
    latency_ms = (time.perf_counter() - started_at) * 1000

    # Record trace
    record_trace(
        name="eval_matrix_batch",
        latency_ms=latency_ms,
        tags=["eval", "matrix", "promptfoo"],
        metadata={
            "total_test_cases": res.total_test_cases,
            "passed_test_cases": res.passed_test_cases,
            "pass_rate": res.pass_rate,
            "average_score": res.average_score,
        },
    )
    return res


@router.post("/redteam", response_model=RedteamAuditResponse)
async def redteam_audit(req: RedteamAuditRequest) -> RedteamAuditResponse:
    """Audit a prompt for security vulnerabilities (injection, jailbreak, leaks, DoS)."""
    started_at = time.perf_counter()
    res = run_redteam_audit(req)
    latency_ms = (time.perf_counter() - started_at) * 1000

    # Record trace
    record_trace(
        name=f"redteam_audit:{req.target_intent}",
        latency_ms=latency_ms,
        tags=["redteam", "security", res.risk_level.lower()],
        metadata={
            "security_score": res.security_score,
            "risk_level": res.risk_level,
            "vulnerabilities": res.vulnerabilities_detected,
        },
    )
    return res
