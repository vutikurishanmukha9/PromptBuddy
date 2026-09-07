"""API routes aggregation package."""

from fastapi import APIRouter
from app.api.routes.meta import router as meta_router
from app.api.routes.prompts import router as prompts_router
from app.api.routes.assertions import router as assertions_router
from app.api.routes.compiler import router as compiler_router
from app.api.routes.skills import router as skills_router
from app.api.routes.eval import router as eval_router

api_router = APIRouter()

# Mount all modules
api_router.include_router(meta_router)
api_router.include_router(prompts_router)
api_router.include_router(assertions_router)
api_router.include_router(compiler_router)
api_router.include_router(skills_router)
api_router.include_router(eval_router)

__all__ = ["api_router"]
