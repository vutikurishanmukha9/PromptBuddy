"""Schemas for Agent Skills (SKILL.md) validation and generation."""

from typing import Any
from pydantic import BaseModel, Field


class SkillBuildRequest(BaseModel):
    task: str = Field(..., description="Task description or prompt to generate a SKILL.md for")
    name: str = Field(default="", description="Optional slug name (e.g. code-reviewer)")
    framework: str = Field(default="agent_skill")


class SkillBuildResponse(BaseModel):
    name: str
    version: str
    description: str
    skill_markdown: str
    installation_paths: dict[str, str]


class SkillValidateRequest(BaseModel):
    content: str = Field(..., description="Raw SKILL.md markdown text to validate")


class SkillValidateResponse(BaseModel):
    valid: bool
    name: str | None = None
    version: str | None = None
    description: str | None = None
    has_frontmatter: bool
    has_safety_tiers: bool
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
