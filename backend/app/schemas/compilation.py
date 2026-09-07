"""Schemas for code, schema, and signature compilation."""

from typing import Any
from pydantic import BaseModel, Field


class CompileRequest(BaseModel):
    title: str = Field(default="PromptResponse")
    prompt: str = Field(..., description="Prompt or task specification to compile from")
    format: str = Field(default="pydantic", description="pydantic | jsonschema | dspy | promptfoo")
    extra_fields: dict[str, str] = Field(default_factory=dict)


class CompileResponse(BaseModel):
    format: str
    code: str
    is_valid_syntax: bool = True
    metadata: dict[str, Any] = Field(default_factory=dict)
