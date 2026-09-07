"""Schemas for the live assertion matrix & evaluation engine."""

from typing import Any
from pydantic import BaseModel, Field, model_validator


class AssertionRule(BaseModel):
    type: str = Field(..., description="Assertion rule type (e.g. is_json, no_refusals, json_schema_match)")
    expected: Any = Field(default=None, description="Expected value, keyword list, schema, or bounds")

    @model_validator(mode="before")
    @classmethod
    def harmonize_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "rule_type" in data and "type" not in data:
                data["type"] = data["rule_type"]
            if "value" in data and "expected" not in data:
                data["expected"] = data["value"]
        return data


class AssertionResult(BaseModel):
    type: str
    passed: bool
    message: str


class AssertionRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Target text to evaluate assertions on")
    rules: list[AssertionRule] = Field(default_factory=list, description="Rules to execute. Defaults to standard safety rules if empty.")


class AssertionResponse(BaseModel):
    overall_passed: bool
    total_assertions: int
    passed_count: int
    failed_count: int
    results: list[AssertionResult]


class RuleDescriptor(BaseModel):
    type: str
    name: str
    description: str
    example_expected: Any = None


class RulesCatalogResponse(BaseModel):
    rules: list[RuleDescriptor]
    total: int
