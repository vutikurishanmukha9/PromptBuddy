"""Pydantic schemas for Prompt Evolution and Variant Generation (skills-evo)."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.assertions import AssertionRule


class MutationStrategy(str):
    """Supported prompt mutation strategies."""

    CONSTRAINT_REINFORCEMENT = "constraint_reinforcement"
    ROLE_SHARPENING = "role_sharpening"
    FEW_SHOT_INJECTION = "few_shot_injection"
    COT_SCAFFOLDING = "cot_scaffolding"
    MINIMALIST = "minimalist"


class EvolutionStep(BaseModel):
    """Record of a single feedback descent iteration."""

    iteration: int
    strategy: str
    rationale: str
    prompt_candidate: str
    quality_score: float
    assertions_passed: int
    assertions_total: int
    preference_accepted: bool


class PromptEvolveRequest(BaseModel):
    """Request to iteratively evolve and optimize a prompt."""

    base_prompt: str = Field(..., min_length=5, description="Initial prompt to optimize")
    intent: str = Field("clarity", description="Target framework intent or optimization goal")
    critique: Optional[str] = Field(None, description="Human critique, failure log, or specific instruction to fix")
    assertion_rules: Optional[List[AssertionRule]] = Field(None, description="Assertion rules to test against")
    max_iterations: int = Field(3, ge=1, le=8, description="Maximum iterations of feedback descent")


class PromptEvolveResponse(BaseModel):
    """Response containing the evolved prompt and optimization trajectory."""

    initial_prompt: str
    best_prompt: str
    initial_score: float
    final_score: float
    iterations_run: int
    improved: bool
    summary_diff: str
    trajectory: List[EvolutionStep]


class PromptVariantsRequest(BaseModel):
    """Request to synthesize diverse prompt variants across multiple strategies."""

    base_prompt: str = Field(..., min_length=5, description="Source prompt to derive variants from")
    intent: str = Field("clarity", description="Target framework intent")
    strategies: Optional[List[str]] = Field(
        None,
        description="List of strategies to generate (defaults to: minimalist, strict_guardrails, few_shot, cot_scaffolding)",
    )


class PromptVariant(BaseModel):
    """A generated candidate variant of a prompt."""

    strategy: str
    label: str
    prompt: str
    description: str
    estimated_tokens: int
    suggested_model: str


class PromptVariantsResponse(BaseModel):
    """Response containing generated multi-strategy variants."""

    base_prompt: str
    variants_count: int
    variants: List[PromptVariant]
