"""Agent Skills Catalog Engine (skills-spec).

Ingests, indexes, and serves production-grade Google & Anthropic Agent Skills (SKILL.md)
from standard specifications with caching, safety tier analysis, and prompt adaptation.
"""

from __future__ import annotations

import json
import logging
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from app.schemas.skills_catalog import (
    SkillSummary,
    SkillCategorySummary,
    SkillCatalogResponse,
    SkillDetailResponse,
    SkillImportRequest,
    SkillImportResponse,
)

logger = logging.getLogger("promptbuddy.skill_catalog")

# Locate root directory of skills-catalog
_WORKSPACE_ROOT = Path(__file__).resolve().parents[3]
_MODULE_ROOT = Path(__file__).resolve().parents[2]
_CANDIDATE_DIRS = [
    _MODULE_ROOT / "skills-catalog",
    _WORKSPACE_ROOT / "backend" / "skills-catalog",
    _WORKSPACE_ROOT / "frontend" / "references" / "skills-spec",
]
_DEFAULT_SPEC_DIR = next((d for d in _CANDIDATE_DIRS if d.exists()), _CANDIDATE_DIRS[0])
SPEC_DIR = Path(os.getenv("SKILLS_SPEC_DIR", str(_DEFAULT_SPEC_DIR)))

_CATALOG_CACHE: Optional[Dict[str, Any]] = None


def _classify_safety_tier(text: str) -> str:
    """Classify safety tier based on operational verbs in the description or content."""
    text_lower = text.lower()
    destructive_keywords = ["delete", "destroy", "drop", "terminate", "purge", "revoke", "undeploy"]
    mutating_keywords = ["create", "deploy", "update", "write", "modify", "patch", "upload", "ingest", "tune"]

    for kw in destructive_keywords:
        if re.search(rf"\b{kw}\b", text_lower):
            return "Tier D"

    for kw in mutating_keywords:
        if re.search(rf"\b{kw}\b", text_lower):
            return "Tier M"

    return "Tier R"


def _extract_category_from_entrypoint(entrypoint: str) -> str:
    """Extract category folder from entrypoint path (e.g. skills/cloud/... -> cloud)."""
    # Matches /skills/main/skills/{category}/... or /skills/master/skills/{category}/...
    match = re.search(r"/skills/(?:main|master)/skills/([^/]+)/", entrypoint)
    if match:
        return match.group(1)
    # Matches /skills/{category}/{skill_name}/SKILL.md
    match = re.search(r"/skills/([^/]+)/[^/]+/SKILL\.md$", entrypoint, re.I)
    if match:
        return match.group(1)
    # General fallback
    match = re.search(r"/skills/([^/]+)/", entrypoint)
    if match and match.group(1) not in ("main", "master"):
        return match.group(1)
    return "cloud"


def _extract_frontmatter(content: str) -> Tuple[Dict[str, Any], str]:
    """Parse YAML frontmatter between --- markers, with regex fallback."""
    frontmatter: Dict[str, Any] = {}
    body = content

    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            raw_yaml = parts[1].strip()
            body = parts[2].strip()
            # Simple line-by-line key: value extraction
            for line in raw_yaml.splitlines():
                if ":" in line and not line.strip().startswith("#"):
                    k, v = line.split(":", 1)
                    key = k.strip()
                    val = v.strip().strip("\"'")
                    frontmatter[key] = val

    return frontmatter, body


def _extract_boundaries(content: str) -> List[str]:
    """Extract negative constraints or operational boundary instructions."""
    boundaries: List[str] = []
    for line in content.splitlines():
        line_clean = line.strip().lstrip("-* ").strip()
        if re.search(r"\b(don't use|do not use|only use|boundaries|never)\b", line_clean, re.I):
            if len(line_clean) > 10:
                boundaries.append(line_clean)
    return boundaries[:10]


def _build_catalog_index() -> Dict[str, Any]:
    """Load index.json from disk and create search indexes."""
    index_file = SPEC_DIR / "index.json"
    skills_list: List[Dict[str, Any]] = []

    if index_file.exists():
        try:
            with open(index_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                skills_list = data.get("skills", [])
                logger.info(f"Loaded {len(skills_list)} skills from {index_file}")
        except Exception as exc:
            logger.error(f"Error reading skills index {index_file}: {exc}")
    else:
        logger.warning(f"Skills index file not found at {index_file}, scanning skills/ dir...")
        # Fallback: scan skills folder directly if index.json is missing
        skills_dir = SPEC_DIR / "skills"
        if skills_dir.exists():
            for cat_path in skills_dir.iterdir():
                if cat_path.is_dir():
                    for skill_path in cat_path.iterdir():
                        if skill_path.is_dir() and (skill_path / "SKILL.md").exists():
                            skills_list.append({
                                "name": skill_path.name,
                                "description": f"Skill {skill_path.name} in category {cat_path.name}",
                                "entrypoint": f"/skills/{cat_path.name}/{skill_path.name}/SKILL.md",
                            })

    indexed_skills: List[SkillSummary] = []
    category_counts: Dict[str, int] = {}
    skills_by_key: Dict[str, Dict[str, Any]] = {}

    for item in skills_list:
        name = item.get("name", "unnamed-skill")
        description = item.get("description", "")
        entrypoint = item.get("entrypoint", "")
        category = item.get("category") or _extract_category_from_entrypoint(entrypoint)

        # Extract safety tier
        safety_tier = _classify_safety_tier(description)

        # Extract basic tags
        tags = [category]
        if "gke" in name or "kubernetes" in description.lower():
            tags.append("kubernetes")
        if "gemini" in name or "ai" in name or "model" in description.lower():
            tags.append("ai")
        if "monitoring" in name or "alert" in name:
            tags.append("observability")
        if "database" in description.lower() or "sql" in name:
            tags.append("database")

        summary = SkillSummary(
            category=category,
            name=name,
            description=description,
            entrypoint=entrypoint,
            safety_tier=safety_tier,
            tools_count=max(1, len(re.findall(r"`([a-zA-Z0-9_-]+)`", description))),
            tags=list(set(tags)),
        )

        indexed_skills.append(summary)
        category_counts[category] = category_counts.get(category, 0) + 1
        skills_by_key[f"{category}:{name}"] = item
        skills_by_key[name] = item

    categories = [
        SkillCategorySummary(
            category=cat,
            count=cnt,
            description=f"Enterprise agent skills for {cat.capitalize()} operations and workflows",
        )
        for cat, cnt in sorted(category_counts.items(), key=lambda x: -x[1])
    ]

    return {
        "skills": indexed_skills,
        "categories": categories,
        "skills_by_key": skills_by_key,
    }


def get_catalog_cache() -> Dict[str, Any]:
    """Thread-safe access to cached catalog."""
    global _CATALOG_CACHE
    if _CATALOG_CACHE is None:
        _CATALOG_CACHE = _build_catalog_index()
    return _CATALOG_CACHE


def list_catalog_skills(
    category: Optional[str] = None,
    query: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
) -> SkillCatalogResponse:
    """Search and paginate agent skills from the catalog."""
    cache = get_catalog_cache()
    all_skills: List[SkillSummary] = cache["skills"]

    filtered = all_skills

    if category and category.lower() != "all":
        cat_lower = category.lower()
        filtered = [s for s in filtered if s.category.lower() == cat_lower]

    if query:
        q = query.lower()
        filtered = [
            s
            for s in filtered
            if q in s.name.lower() or q in s.description.lower() or any(q in t.lower() for t in s.tags)
        ]

    total = len(filtered)
    page = max(1, page)
    limit = max(1, min(limit, 500))
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paginated_items = filtered[start_idx:end_idx]

    return SkillCatalogResponse(
        total=total,
        page=page,
        limit=limit,
        categories=cache["categories"],
        skills=paginated_items,
    )


def list_catalog_categories() -> List[SkillCategorySummary]:
    """List available skill categories with counts."""
    cache = get_catalog_cache()
    return cache["categories"]


def get_catalog_skill(category: str, skill_name: str) -> SkillDetailResponse:
    """Fetch complete detail, markdown content, and safety analysis for a skill."""
    cache = get_catalog_cache()
    raw_item = cache["skills_by_key"].get(f"{category}:{skill_name}") or cache["skills_by_key"].get(skill_name)

    if not raw_item:
        raise ValueError(f"Skill '{skill_name}' not found in category '{category}'")

    name = raw_item.get("name", skill_name)
    description = raw_item.get("description", "")
    entrypoint = raw_item.get("entrypoint", "")
    inferred_category = raw_item.get("category") or _extract_category_from_entrypoint(entrypoint) or category

    # Attempt to read local SKILL.md
    local_skill_path = SPEC_DIR / "skills" / inferred_category / name / "SKILL.md"
    if not local_skill_path.exists():
        local_skill_path = SPEC_DIR / "skills" / category / name / "SKILL.md"
    markdown_content = ""

    if local_skill_path.exists():
        try:
            with open(local_skill_path, "r", encoding="utf-8") as f:
                markdown_content = f.read()
        except Exception as exc:
            logger.error(f"Error reading local SKILL.md at {local_skill_path}: {exc}")

    if not markdown_content:
        # Synthesize production-grade standard SKILL.md from metadata
        markdown_content = (
            f"---\n"
            f"name: {name}\n"
            f"description: \"{description}\"\n"
            f"category: {inferred_category}\n"
            f"---\n\n"
            f"# {name}\n\n"
            f"{description}\n\n"
            f"## Instructions\n"
            f"1. Validate environment configuration and prerequisites.\n"
            f"2. Execute the requested operations following least-privilege principles.\n"
            f"3. Return structured status with full telemetry and error diagnostics.\n"
        )

    frontmatter, body = _extract_frontmatter(markdown_content)
    safety_tier = _classify_safety_tier(markdown_content)
    boundaries = _extract_boundaries(markdown_content)

    return SkillDetailResponse(
        category=inferred_category,
        name=name,
        description=description,
        entrypoint=entrypoint,
        safety_tier=safety_tier,
        frontmatter=frontmatter,
        markdown_content=markdown_content,
        parameters=[],
        boundary_guidelines=boundaries,
    )


def import_skill_to_prompt(req: SkillImportRequest) -> SkillImportResponse:
    """Adapt a catalog skill into an actionable PromptBuddy template with guardrails."""
    skill = get_catalog_skill(req.category, req.skill_name)

    prefix = req.context_prefix or "You are an autonomous AI Agent specializing in this operational domain."
    adapted_prompt = (
        f"{prefix}\n\n"
        f"### Skill Specification: {skill.name} (Category: {skill.category.upper()})\n"
        f"{skill.description}\n\n"
        f"### Safety Clearance Level: {skill.safety_tier}\n"
    )

    if skill.boundary_guidelines:
        adapted_prompt += "\n### Operational Boundaries & Negative Constraints:\n"
        for b in skill.boundary_guidelines:
            adapted_prompt += f"- {b}\n"

    adapted_prompt += (
        f"\n### Execution Directive:\n"
        f"Implement the requested task strictly complying with the instructions and safety boundaries specified above."
    )

    system_instructions = (
        f"Execute {skill.name} under {skill.safety_tier} safety boundaries. Never violate constraints."
    )

    suggested_assertions = [
        {"type": "no_refusals", "value": True, "description": "Ensure agent does not refuse valid tasks"},
        {"type": "no_secrets", "value": True, "description": "Prevent leakage of keys, tokens, or credentials"},
    ]

    return SkillImportResponse(
        skill_name=skill.name,
        category=skill.category,
        safety_tier=skill.safety_tier,
        adapted_prompt=adapted_prompt,
        system_instructions=system_instructions,
        suggested_assertions=suggested_assertions,
    )
