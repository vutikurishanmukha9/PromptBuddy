"""Pydantic schemas for Evaluation Matrix and Redteaming Security Audits (eval-matrix)."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.assertions import AssertionRule, AssertionResult


class EvalTestCase(BaseModel):
    """A test case in an evaluation matrix."""

    id: Optional[str] = Field(None, description="Optional unique identifier")
    name: Optional[str] = Field(None, description="Descriptive test case title")
    vars: Dict[str, Any] = Field(default_factory=dict, description="Variables to substitute into prompt (e.g. {{input}})")
    assert_rules: Optional[List[AssertionRule]] = Field(None, description="Test-case specific assertion rules")
    description: Optional[str] = None


class EvalTestCaseResult(BaseModel):
    """Execution and evaluation result for a single test case."""

    test_case_id: str
    name: str
    rendered_prompt: str
    output_text: str
    passed: bool
    score: float
    latency_ms: float
    assertion_results: List[AssertionResult]


class EvalMatrixRequest(BaseModel):
    """Request to evaluate a prompt against a batch test case matrix."""

    prompt_template: str = Field(..., min_length=5, description="Prompt template with optional {{variable}} placeholders")
    test_cases: List[EvalTestCase] = Field(..., min_length=1, description="List of test cases to run")
    default_rules: Optional[List[AssertionRule]] = Field(None, description="Default assertion rules applied to all test cases")
    model: Optional[str] = Field(None, description="Optional model to execute inference")


class EvalMatrixResponse(BaseModel):
    """Summary of batch evaluation matrix run."""

    total_test_cases: int
    passed_test_cases: int
    pass_rate: float
    average_score: float
    average_latency_ms: float
    results: List[EvalTestCaseResult]


class RedteamFinding(BaseModel):
    """A detected vulnerability or security weakness in a prompt."""

    category: str = Field(..., description="Vulnerability category (e.g. prompt_injection, system_leak, jailbreak, secrets)")
    severity: str = Field(..., description="Severity level: info, low, medium, high, critical")
    title: str
    description: str
    attack_payload_example: str
    vulnerable: bool
    mitigation_recommendation: str


class RedteamAuditRequest(BaseModel):
    """Request to scan a prompt for security and injection vulnerabilities."""

    prompt: str = Field(..., min_length=5, description="Prompt to audit for adversarial vulnerabilities")
    target_intent: Optional[str] = Field("general", description="Operational intent or domain")


class RedteamAuditResponse(BaseModel):
    """Comprehensive Redteam Security Audit report."""

    prompt_preview: str
    security_score: int = Field(..., description="Security score from 0 (most vulnerable) to 100 (hardened)")
    risk_level: str = Field(..., description="Overall risk level: Low, Medium, High, Critical")
    vulnerabilities_detected: int
    findings: List[RedteamFinding]
    hardened_prompt_patch: str = Field(..., description="Recommended hardened prompt incorporating defensive guardrails")
