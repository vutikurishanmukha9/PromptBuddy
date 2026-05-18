"""
PromptBuddy Backend - FastAPI + OpenRouter AI.

The backend owns the prompt framework contract and exposes enough metadata for
the frontend to render framework pickers without duplicating business rules.
"""

from __future__ import annotations

import logging
import os
import random
import time
from dataclasses import dataclass
from typing import Any
from uuid import uuid4

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

load_dotenv()

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO").upper())
logger = logging.getLogger("promptbuddy")

APP_VERSION = "4.1.0"
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
OPENROUTER_SITE_URL = os.getenv("OPENROUTER_SITE_URL", "https://promptbuddy.app")
OPENROUTER_APP_TITLE = os.getenv("OPENROUTER_APP_TITLE", "PromptBuddy")
DEFAULT_MODEL = os.getenv("OPENROUTER_DEFAULT_MODEL", "")
REQUEST_TIMEOUT_SECONDS = float(os.getenv("OPENROUTER_TIMEOUT_SECONDS", "60"))
MAX_PROMPT_LENGTH = int(os.getenv("MAX_PROMPT_LENGTH", "8000"))


@dataclass(frozen=True)
class Framework:
    value: str
    label: str
    category: str
    category_label: str
    description: str
    system_prompt: str


_ENGINE = (
    "You are PromptBuddy, an industrial-grade prompt optimization engine. "
    "Translate vague human input into precise, structured, machine-ready prompts.\n\n"
    "Rules:\n"
    "1. Output only the optimized prompt. No preamble, commentary, or meta-discussion.\n"
    "2. Assign a specific expert role.\n"
    "3. Define the task, audience, assumptions, constraints, and output format.\n"
    "4. Separate instructions from source content with clear delimiters.\n"
    "5. Preserve the user's intent and avoid verbosity inflation.\n"
    "6. Do not fabricate facts. If uncertainty matters, instruct the target model to say so.\n"
    "7. Never leave blank placeholders. Make practical assumptions and state them.\n"
    "8. Return a complete prompt that can be pasted directly into any LLM."
)


def _framework_prompt(name: str, details: str) -> str:
    return f"Apply the {name} framework to optimize this prompt.\n{details}\n\n{_ENGINE}"


FRAMEWORKS: dict[str, Framework] = {
    "rtf": Framework("rtf", "RTF", "essentials", "Essentials", "Role, Task, Format", _framework_prompt("RTF", "ROLE: Assign a specific persona.\nTASK: Define the deliverable.\nFORMAT: Specify structure, tone, and length.")),
    "race": Framework("race", "RACE", "essentials", "Essentials", "Role, Action, Context, Expectation", _framework_prompt("RACE", "ROLE: Assign domain expertise.\nACTION: Define the action.\nCONTEXT: Add background and constraints.\nEXPECTATION: State success criteria.")),
    "ape": Framework("ape", "APE", "essentials", "Essentials", "Action, Purpose, Expectation", _framework_prompt("APE", "ACTION: Define the exact action.\nPURPOSE: Explain why it matters.\nEXPECTATION: Define quality, format, and coverage.")),
    "tag": Framework("tag", "TAG", "essentials", "Essentials", "Task, Audience, Goal", _framework_prompt("TAG", "TASK: Specify the task.\nAUDIENCE: Define who consumes it.\nGOAL: State the intended outcome.")),
    "era": Framework("era", "ERA", "essentials", "Essentials", "Expectation, Role, Action", _framework_prompt("ERA", "EXPECTATION: Define quality and format first.\nROLE: Assign an expert persona.\nACTION: Define the deliverable.")),
    "risen": Framework("risen", "RISEN", "structured", "Structured", "Role, Instructions, Steps, End Goal, Narrowing", _framework_prompt("RISEN", "ROLE: Assign a persona.\nINSTRUCTIONS: Be unambiguous.\nSTEPS: Break into sequence.\nEND GOAL: Define deliverable.\nNARROWING: Add constraints.")),
    "coast": Framework("coast", "COAST", "structured", "Structured", "Context, Objective, Action, Scenario, Task", _framework_prompt("COAST", "CONTEXT: Set the scene.\nOBJECTIVE: State the goal.\nACTION: Define what to do.\nSCENARIO: Explain use case.\nTASK: Specify deliverable.")),
    "trace": Framework("trace", "TRACE", "structured", "Structured", "Task, Role, Action, Context, Example", _framework_prompt("TRACE", "TASK: Define scope.\nROLE: Assign expertise.\nACTION: Describe action.\nCONTEXT: Add background.\nEXAMPLE: Include a short expected pattern.")),
    "crispe": Framework("crispe", "CRISPE", "structured", "Structured", "Capacity, Role, Insight, Statement, Personality, Experiment", _framework_prompt("CRISPE", "CAPACITY: Define knowledge boundaries.\nROLE: Assign persona.\nINSIGHT: Include key domain lens.\nSTATEMENT: State the task.\nPERSONALITY: Set tone.\nEXPERIMENT: Encourage exploration when useful.")),
    "clear": Framework("clear", "CLEAR", "structured", "Structured", "Context, Limits, Expectations, Action, Results", _framework_prompt("CLEAR", "CONTEXT: Add background.\nLIMITS: Set constraints.\nEXPECTATIONS: Define quality.\nACTION: Specify work.\nRESULTS: Define format.")),
    "pastor": Framework("pastor", "PASTOR", "persuasion", "Persuasion", "Problem, Amplify, Story, Transformation, Offer, Response", _framework_prompt("PASTOR", "PROBLEM: Identify pain.\nAMPLIFY: Explain stakes.\nSTORY: Add scenario.\nTRANSFORMATION: Define desired change.\nOFFER: Clarify value.\nRESPONSE: Specify CTA and format.")),
    "bab": Framework("bab", "BAB", "persuasion", "Persuasion", "Before, After, Bridge", _framework_prompt("BAB", "BEFORE: Describe current state.\nAFTER: Describe desired state.\nBRIDGE: Define how the AI gets there.")),
    "aida": Framework("aida", "AIDA", "persuasion", "Persuasion", "Attention, Interest, Desire, Action", _framework_prompt("AIDA", "ATTENTION: Create a hook.\nINTEREST: Build relevance.\nDESIRE: Show value.\nACTION: Define deliverable or CTA.")),
    "peel": Framework("peel", "PEEL", "persuasion", "Persuasion", "Point, Evidence, Explain, Link", _framework_prompt("PEEL", "POINT: State thesis.\nEVIDENCE: Require support.\nEXPLAIN: Demand reasoning.\nLINK: Connect implications.")),
    "scqa": Framework("scqa", "SCQA", "problem_solving", "Problem-Solving", "Situation, Complication, Question, Answer", _framework_prompt("SCQA", "SITUATION: Establish context.\nCOMPLICATION: Identify challenge.\nQUESTION: Frame the core question.\nANSWER: Guide the response.")),
    "grow": Framework("grow", "GROW", "problem_solving", "Problem-Solving", "Goal, Reality, Options, Will", _framework_prompt("GROW", "GOAL: Define objective.\nREALITY: Assess current state.\nOPTIONS: Explore paths.\nWILL: Commit to next actions.")),
    "star": Framework("star", "STAR", "problem_solving", "Problem-Solving", "Situation, Task, Action, Result", _framework_prompt("STAR", "SITUATION: Add context.\nTASK: Define responsibility.\nACTION: Describe method.\nRESULT: Specify outcome.")),
    "par": Framework("par", "PAR", "problem_solving", "Problem-Solving", "Problem, Action, Result", _framework_prompt("PAR", "PROBLEM: State issue and impact.\nACTION: Define solution path.\nRESULT: Define deliverable and success.")),
    "care": Framework("care", "CARE", "problem_solving", "Problem-Solving", "Context, Action, Result, Example", _framework_prompt("CARE", "CONTEXT: Add background.\nACTION: Specify task.\nRESULT: Describe output.\nEXAMPLE: Include one concrete example.")),
    "smart": Framework("smart", "SMART", "analysis", "Analysis", "Specific, Measurable, Achievable, Relevant, Time-bound", _framework_prompt("SMART", "SPECIFIC: Remove ambiguity.\nMEASURABLE: Add success criteria.\nACHIEVABLE: Scope clearly.\nRELEVANT: Connect to user need.\nTIME-BOUND: Add phase/depth constraints.")),
    "ice": Framework("ice", "ICE", "analysis", "Analysis", "Idea, Context, Execution", _framework_prompt("ICE", "IDEA: Clarify concept.\nCONTEXT: Add domain and audience.\nEXECUTION: Define steps and output format.")),
    "5w1h": Framework("5w1h", "5W1H", "analysis", "Analysis", "Who, What, When, Where, Why, How", _framework_prompt("5W1H", "WHO: Define roles and audience.\nWHAT: Specify deliverable.\nWHEN: Add temporal context.\nWHERE: Define platform/domain.\nWHY: Explain purpose.\nHOW: Define method and format.")),
}

OPENROUTER_MODELS = [
    ("openai/gpt-4o-mini", "GPT-4o Mini"),
    ("google/gemini-2.0-flash-001", "Gemini 2.0 Flash"),
    ("mistralai/mistral-small", "Mistral Small"),
]

app = FastAPI(title="PromptBuddy API", description="AI-powered prompt optimizer", version=APP_VERSION)

allow_origins = [origin.strip() for origin in os.getenv("CORS_ALLOW_ORIGINS", "*").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_origins != ["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    base_prompt: str = Field(..., min_length=1, max_length=MAX_PROMPT_LENGTH)
    intent: str = Field(default="rtf")

    @field_validator("base_prompt")
    @classmethod
    def clean_prompt(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("base_prompt cannot be blank")
        return cleaned

    @field_validator("intent")
    @classmethod
    def validate_intent(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in FRAMEWORKS:
            raise ValueError(f"Unsupported intent '{value}'")
        return normalized


class GenerateResponse(BaseModel):
    original_prompt: str
    intent: str
    optimized_prompt: str
    ai_model: str
    request_id: str
    latency_ms: int
    success: bool = True


def _provider_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": OPENROUTER_SITE_URL,
        "X-Title": OPENROUTER_APP_TITLE,
    }


def _ordered_models() -> list[tuple[str, str]]:
    models = list(OPENROUTER_MODELS)
    if DEFAULT_MODEL:
        models.sort(key=lambda item: item[0] != DEFAULT_MODEL)
        return models
    random.shuffle(models)
    return models


def _extract_completion(payload: dict[str, Any]) -> str:
    try:
        content = payload["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise ValueError("OpenRouter returned an unexpected response shape") from exc
    if not isinstance(content, str) or not content.strip():
        raise ValueError("OpenRouter returned an empty completion")
    return content.strip()


async def call_openrouter(user_prompt: str, system_prompt: str, request_id: str) -> tuple[str, str]:
    if not OPENROUTER_API_KEY or OPENROUTER_API_KEY == "PASTE_YOUR_OPENROUTER_KEY_HERE":
        raise HTTPException(status_code=503, detail="OpenRouter API key is not configured")

    last_error: Exception | None = None
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
        for model_id, model_name in _ordered_models():
            try:
                response = await client.post(
                    f"{OPENROUTER_BASE_URL}/chat/completions",
                    headers=_provider_headers(),
                    json={
                        "model": model_id,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        "temperature": 0.45,
                        "max_tokens": 2048,
                    },
                )
                response.raise_for_status()
                return _extract_completion(response.json()), model_name
            except httpx.HTTPStatusError as exc:
                status_code = exc.response.status_code
                logger.warning("request_id=%s model=%s status=%s", request_id, model_id, status_code)
                last_error = exc
                if status_code in {400, 401, 403}:
                    break
            except (httpx.RequestError, ValueError) as exc:
                logger.warning("request_id=%s model=%s error=%s", request_id, model_id, exc)
                last_error = exc

    logger.error("request_id=%s all provider attempts failed: %s", request_id, last_error)
    raise HTTPException(status_code=502, detail="AI provider failed. Please try again.")


def _framework_payload(framework: Framework) -> dict[str, str]:
    return {
        "value": framework.value,
        "label": framework.label,
        "category": framework.category,
        "category_label": framework.category_label,
        "description": framework.description,
    }


@app.exception_handler(ValueError)
async def value_error_handler(_: Request, exc: ValueError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"detail": str(exc), "success": False})


@app.get("/")
async def root() -> dict[str, Any]:
    return {
        "status": "online",
        "version": APP_VERSION,
        "provider": "openrouter",
        "provider_configured": bool(OPENROUTER_API_KEY),
        "framework_count": len(FRAMEWORKS),
    }


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "ok": True,
        "version": APP_VERSION,
        "provider_configured": bool(OPENROUTER_API_KEY),
        "max_prompt_length": MAX_PROMPT_LENGTH,
    }


@app.get("/intents")
async def list_intents() -> dict[str, Any]:
    categories: dict[str, dict[str, Any]] = {}
    for framework in FRAMEWORKS.values():
        categories.setdefault(
            framework.category,
            {"key": framework.category, "label": framework.category_label, "types": []},
        )["types"].append(_framework_payload(framework))
    return {"intents": [_framework_payload(item) for item in FRAMEWORKS.values()], "categories": list(categories.values())}


@app.post("/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest) -> GenerateResponse:
    request_id = str(uuid4())
    started_at = time.perf_counter()
    framework = FRAMEWORKS[req.intent]
    user_message = (
        "Optimize the following raw input into a production-ready prompt using the assigned framework.\n\n"
        f"Raw input:\n```\n{req.base_prompt}\n```"
    )

    text, model_name = await call_openrouter(user_message, framework.system_prompt, request_id)
    latency_ms = int((time.perf_counter() - started_at) * 1000)

    logger.info("request_id=%s intent=%s model=%s latency_ms=%s", request_id, req.intent, model_name, latency_ms)
    return GenerateResponse(
        original_prompt=req.base_prompt,
        intent=req.intent,
        optimized_prompt=text,
        ai_model=model_name,
        request_id=request_id,
        latency_ms=latency_ms,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
