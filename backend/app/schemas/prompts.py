"""Schemas for prompt generation, testing, and quality scoring."""

from typing import Any
from pydantic import BaseModel, Field, field_validator
from app.schemas.assertions import AssertionRule, AssertionResult


class PromptRequest(BaseModel):
    base_prompt: str = Field(..., description="The user's raw prompt or goal")
    intent: str = Field(default="rtf", description="Framework key (e.g. rtf, risen, agent_skill)")
    model: str = Field(default="", description="OpenRouter model ID")
    temperature: float = Field(default=0.45, ge=0.0, le=2.0)
    max_tokens: int = Field(default=2048, ge=64, le=8192)

    @field_validator("base_prompt")
    @classmethod
    def validate_base_prompt(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Prompt cannot be blank or whitespace only")
        if len(trimmed) > 8000:
            raise ValueError("Prompt exceeds maximum length limit")
        return trimmed


class PromptResponse(BaseModel):
    original_prompt: str
    intent: str
    framework_name: str
    optimized_prompt: str
    ai_model: str
    latency_ms: int
    request_id: str
    quality_score: int = 90
    cached: bool = False


class TestPromptRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    user_input: str = Field(default="")
    model: str = Field(default="")
    assertions: list[AssertionRule] = Field(default_factory=list)


class TestPromptResponse(BaseModel):
    output: str
    model: str
    request_id: str
    latency_ms: int
    assertions: list[AssertionResult] = Field(default_factory=list)
    success: bool = True


class MetricScore(BaseModel):
    score: int
    weight: float
    feedback: str


class QualityScoreResponse(BaseModel):
    overall: int
    grade: str
    breakdown: dict[str, MetricScore]
    feedback: str
    readiness: str
