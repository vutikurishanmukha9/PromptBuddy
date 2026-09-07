"""Pydantic schemas for Microsoft Guidance and Outlines Grammar compilation."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class GuidanceCompileRequest(BaseModel):
    """Request to compile a prompt and parameters into a Microsoft Guidance program."""

    prompt: str = Field(..., min_length=3, description="Base prompt or task description")
    model_family: str = Field("openai", description="Model family: openai, transformers, llama, anthropic")
    choices: Optional[List[str]] = Field(None, description="Optional set of discrete choices for select() blocks")
    json_schema: Optional[Dict[str, Any]] = Field(None, description="Optional target JSON schema")
    stop_tokens: Optional[List[str]] = Field(None, description="Stop tokens for generation")


class GuidanceCompileResponse(BaseModel):
    """Compiled Microsoft Guidance program."""

    language: str = "python"
    guidance_version: str = "0.1.15+"
    code: str
    explanation: str


class GrammarCompileRequest(BaseModel):
    """Request to derive Outlines/GBNF regex grammar from JSON Schema or choices."""

    json_schema: Optional[Dict[str, Any]] = Field(None, description="JSON Schema to extract grammar for")
    choices: Optional[List[str]] = Field(None, description="Discrete choice enumeration")
    grammar_format: str = Field("regex", description="Output grammar format: regex, gbnf, outlines")


class GrammarCompileResponse(BaseModel):
    """Compiled grammar representation."""

    grammar_format: str
    grammar_pattern: str
    example_valid_output: str
    sample_usage_code: str
