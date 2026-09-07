"""Pydantic schemas for the Agent Skills Catalog (skills-spec)."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SkillSummary(BaseModel):
    """Summary representation of a catalog skill."""

    category: str = Field(..., description="Category folder (e.g. cloud, ads, developers)")
    name: str = Field(..., description="Unique slug name of the skill")
    description: str = Field(..., description="Short summary of the skill's purpose and boundaries")
    entrypoint: Optional[str] = Field(None, description="Remote entrypoint URL or repository path")
    safety_tier: str = Field("Tier R", description="Safety rating tier: Tier R (Read-Only), Tier M (Mutating), Tier D (Destructive)")
    tools_count: int = Field(0, description="Estimated number of tools referenced")
    tags: List[str] = Field(default_factory=list, description="Extracted category and keyword tags")


class SkillCategorySummary(BaseModel):
    """Category breakdown with item counts."""

    category: str
    count: int
    description: str


class SkillCatalogResponse(BaseModel):
    """Response model for paginated catalog listing."""

    total: int
    page: int
    limit: int
    categories: List[SkillCategorySummary]
    skills: List[SkillSummary]


class SkillDetailResponse(BaseModel):
    """Full detail of a catalog skill including markdown instructions and frontmatter."""

    category: str
    name: str
    description: str
    entrypoint: Optional[str] = None
    safety_tier: str = "Tier R"
    frontmatter: Dict[str, Any] = Field(default_factory=dict)
    markdown_content: str
    parameters: List[Dict[str, Any]] = Field(default_factory=list)
    boundary_guidelines: List[str] = Field(default_factory=list)


class SkillImportRequest(BaseModel):
    """Request to import and adapt a catalog skill into a prompt template."""

    category: str
    skill_name: str
    target_framework: str = Field("agent_skill", description="Target framework to adapt the skill into")
    context_prefix: Optional[str] = Field(None, description="Optional system role or environment context")


class SkillImportResponse(BaseModel):
    """Adapted skill ready for immediate execution or editing."""

    skill_name: str
    category: str
    safety_tier: str
    adapted_prompt: str
    system_instructions: str
    suggested_assertions: List[Dict[str, Any]] = Field(default_factory=list)
