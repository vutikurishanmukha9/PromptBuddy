"""Agent Skills (SKILL.md) generation and validation routes."""

from fastapi import APIRouter
from app.schemas.skills import (
    SkillBuildRequest,
    SkillBuildResponse,
    SkillValidateRequest,
    SkillValidateResponse,
)
from app.engines.skill_engine import (
    build_skill_markdown,
    validate_skill_markdown,
)

router = APIRouter(prefix="/skills", tags=["Agent Skills Engine"])


@router.post("/build", response_model=SkillBuildResponse)
async def build_skill(req: SkillBuildRequest) -> SkillBuildResponse:
    md, meta = build_skill_markdown(req.task, req.name, req.framework)
    return SkillBuildResponse(
        name=meta["name"],
        version=meta["version"],
        description=meta["description"],
        skill_markdown=md,
        installation_paths=meta["installation_paths"],
    )


@router.post("/validate", response_model=SkillValidateResponse)
async def validate_skill(req: SkillValidateRequest) -> SkillValidateResponse:
    res = validate_skill_markdown(req.content)
    return SkillValidateResponse(**res)


# --- Standard Agent Skills Catalog (skills-spec) ---

from typing import List, Optional
from fastapi import Query, HTTPException
from app.schemas.skills_catalog import (
    SkillCategorySummary,
    SkillCatalogResponse,
    SkillDetailResponse,
    SkillImportRequest,
    SkillImportResponse,
)
from app.engines.skill_catalog import (
    list_catalog_skills,
    list_catalog_categories,
    get_catalog_skill,
    import_skill_to_prompt,
)


@router.get("/catalog", response_model=SkillCatalogResponse)
async def get_skills_catalog(
    category: Optional[str] = Query(None, description="Category filter (e.g. cloud, ads, developers)"),
    query: Optional[str] = Query(None, description="Keyword search query"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=500, description="Items per page"),
) -> SkillCatalogResponse:
    """Retrieve indexed agent skills from the standard catalog with search and pagination."""
    return list_catalog_skills(category=category, query=query, page=page, limit=limit)


@router.get("/catalog/categories", response_model=List[SkillCategorySummary])
async def get_catalog_categories() -> List[SkillCategorySummary]:
    """List all categories available in the skills catalog with counts."""
    return list_catalog_categories()


@router.get("/catalog/{category}/{skill_name}", response_model=SkillDetailResponse)
@router.get("/{category}/{skill_name}", response_model=SkillDetailResponse)
async def get_catalog_skill_detail(category: str, skill_name: str) -> SkillDetailResponse:
    """Retrieve full detail, instructions, and safety tier for an enterprise skill."""
    try:
        return get_catalog_skill(category, skill_name)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/import", response_model=SkillImportResponse)
async def import_skill(req: SkillImportRequest) -> SkillImportResponse:
    """Import and adapt a catalog skill into a prompt template with safety boundaries."""
    try:
        return import_skill_to_prompt(req)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
