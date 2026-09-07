"""
PromptBuddy Backend - Enterprise Architecture (FastAPI + OpenRouter AI).

Exposes modular REST & SSE streaming APIs, assertion evaluation matrices,
code and schema compilation engines, and AI IDE Agent Skills (SKILL.md) support.
"""

from __future__ import annotations

import logging
import os
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.routes import api_router
from app.engines.frameworks import FRAMEWORKS, Framework
from app.engines.assertion_engine import run_assertion, evaluate_all_assertions
from app.api.routes.prompts import call_openrouter, OPENROUTER_MODELS
from app.schemas.assertions import AssertionRequest, AssertionRule

logging.basicConfig(level=settings.log_level.upper())
logger = logging.getLogger("promptbuddy")

APP_VERSION = settings.app_version
OPENROUTER_API_KEY = settings.openrouter_api_key
MAX_PROMPT_LENGTH = settings.max_prompt_length

# Instantiate FastAPI application
app = FastAPI(
    title=settings.app_title,
    version=settings.app_version,
    description="Enterprise Prompt Engineering & AI IDE Agent Skills Workbench",
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ValueError)
async def value_error_handler(_: Request, exc: ValueError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"detail": str(exc), "success": False})


# Mount both root routes (for full backward compatibility) and /api/v1 prefix
app.include_router(api_router)
app.include_router(api_router, prefix="/api/v1")

# Mount static assets if frontend dist directory is present (for unified single-container deployments)
from pathlib import Path
dist_path = Path(__file__).resolve().parent / "dist"
if dist_path.exists():
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=str(dist_path), html=True), name="static")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
