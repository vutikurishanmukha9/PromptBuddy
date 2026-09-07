"""Metadata, health, and system telemetry routes."""

from fastapi import APIRouter
from app.core.config import settings
from app.engines.frameworks import list_frameworks, list_categories, FRAMEWORKS
from app.engines.telemetry import telemetry
from app.schemas.common import HealthResponse, IntentsResponse, ModelsResponse, ModelOption

router = APIRouter(tags=["Metadata"])

OPENROUTER_MODELS = [
    ("anthropic/claude-3.5-sonnet", "Claude 3.5 Sonnet (Recommended)"),
    ("openai/gpt-4o", "GPT-4o (OpenAI)"),
    ("google/gemini-2.5-pro", "Gemini 2.5 Pro"),
    ("deepseek/deepseek-r1", "DeepSeek R1 (Reasoning)"),
    ("meta-llama/llama-3.3-70b-instruct", "Llama 3.3 70B"),
    ("mistralai/mistral-large-2411", "Mistral Large"),
]


@router.get("/", tags=["System"])
async def root():
    return {
        "status": "online",
        "app": settings.app_title,
        "version": settings.app_version,
        "framework_count": len(FRAMEWORKS),
    }


@router.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        ok=True,
        app="PromptBuddy",
        version=settings.app_version,
        framework_count=len(FRAMEWORKS),
        max_prompt_length=settings.max_prompt_length,
    )


@router.get("/intents", response_model=IntentsResponse)
async def get_intents():
    items = list_frameworks()
    cats = list_categories()
    return IntentsResponse(
        intents=items,
        categories=cats,
        total=len(items),
    )


@router.get("/models", response_model=ModelsResponse)
async def get_models():
    models = [
        ModelOption(
            id=model_id,
            name=name,
            recommended="Recommended" in name,
        )
        for model_id, name in OPENROUTER_MODELS
    ]
    return ModelsResponse(
        models=models,
        default_model=OPENROUTER_MODELS[0][0],
    )


@router.get("/telemetry", tags=["Observability"])
async def get_telemetry():
    return telemetry.get_stats()


# --- Observability Traces (Langfuse pattern) ---

from typing import Optional
from fastapi import Query, HTTPException
from app.schemas.observability import TraceListResponse, TraceRecord
from app.engines.observability_engine import get_traces, get_trace


@router.get("/telemetry/traces", response_model=TraceListResponse, tags=["Observability"])
@router.get("/observability/traces", response_model=TraceListResponse, tags=["Observability"])
async def list_telemetry_traces(
    model: Optional[str] = Query(None, description="Filter by model"),
    status: Optional[str] = Query(None, description="Filter by status (success/error)"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
) -> TraceListResponse:
    """Retrieve execution traces, token usage, latency, and assertion pass rates."""
    return get_traces(model=model, status=status, tag=tag, page=page, limit=limit)


@router.get("/telemetry/traces/{trace_id}", response_model=TraceRecord, tags=["Observability"])
@router.get("/observability/traces/{trace_id}", response_model=TraceRecord, tags=["Observability"])
async def get_telemetry_trace_detail(trace_id: str) -> TraceRecord:
    """Retrieve detailed execution trace with step-level telemetry."""
    trace = get_trace(trace_id)
    if not trace:
        raise HTTPException(status_code=404, detail=f"Trace '{trace_id}' not found")
    return trace
