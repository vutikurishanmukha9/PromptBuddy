"""
PromptBuddy Backend - FastAPI + OpenRouter AI
"""

import os
import random
import logging

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("promptbuddy")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

# --- FastAPI App ---
app = FastAPI(
    title="PromptBuddy API",
    description="AI-Powered Prompt Optimizer",
    version="4.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models (randomly selected per request) ---
OPENROUTER_MODELS = [
    ("openai/gpt-4o-mini", "GPT-4o Mini"),
    ("google/gemini-2.0-flash-001", "Gemini 2.0 Flash"),
    ("mistralai/mistral-small", "Mistral Small"),
]

# --- System Prompts per Intent ---

_RULES = (
    "STRICT RULES: "
    "1) Output ONLY the final optimized prompt text. "
    "2) NEVER ask the user questions. NEVER seek clarification. "
    "3) NEVER explain what you are doing. No commentary, no preamble, no meta-discussion. "
    "4) Make reasonable assumptions for any missing details. "
    "5) The output must be a complete, copy-paste-ready prompt that a user can send directly to any AI."
)

SYSTEM_PROMPTS = {
    "instruction": (
        f"You are an expert prompt engineer. Transform the user's rough idea into a clear, "
        f"actionable, well-structured prompt with specific instructions, constraints, format "
        f"requirements, and success criteria. {_RULES}"
    ),
    "contextual": (
        f"You are a context-aware prompt engineer. Transform the user's request into a rich prompt "
        f"that adds relevant background context, specifies the target audience, defines the purpose, "
        f"and includes domain-specific considerations. Fill in any gaps with smart defaults. {_RULES}"
    ),
    "role_based": (
        f"You are a role-casting prompt engineer. Transform the user's request into a prompt that "
        f"assigns the AI an expert persona with credentials, methodology, and a specific response "
        f"format. Choose the most appropriate expert role for the topic. {_RULES}"
    ),
    "zero_shot": (
        f"Transform the user's request into a zero-shot prompt: a direct, no-examples instruction "
        f"that is crystal clear and specific. Rely purely on the AI's knowledge. {_RULES}"
    ),
    "one_shot": (
        f"Transform the user's request into a one-shot prompt that includes one high-quality "
        f"example demonstrating the expected output format and quality level. {_RULES}"
    ),
    "few_shot": (
        f"Transform the user's request into a few-shot prompt with 2-3 diverse examples that "
        f"demonstrate the pattern, followed by the actual task. {_RULES}"
    ),
    "chain_of_thought": (
        f"Transform the user's request into a chain-of-thought prompt that guides the AI to "
        f"reason step-by-step through logical stages with visible reasoning. {_RULES}"
    ),
    "self_consistency": (
        f"Transform the user's request into a self-consistency prompt: solve via multiple "
        f"independent reasoning paths, then synthesize the most consistent answer. {_RULES}"
    ),
    "refinement": (
        f"Transform the user's request into an iterative refinement prompt: draft, self-critique, "
        f"identify weaknesses, then produce an improved final version. {_RULES}"
    ),
    "goal_oriented": (
        f"Transform the user's request into a goal-oriented prompt with clear objectives, "
        f"measurable success metrics, sub-goals, and a concrete action plan. {_RULES}"
    ),
    "constraint_based": (
        f"Transform the user's request into a constraint-based prompt with explicit format, "
        f"length, tone, scope, and technical constraints clearly defined. {_RULES}"
    ),
    "template": (
        f"Transform the user's request into a structured template prompt with clear sections: "
        f"overview, detailed requirements, expected deliverables, and success criteria. {_RULES}"
    ),
    "meta_prompt": (
        f"Create a meta-prompt that designs the ideal prompt architecture for the user's request: "
        f"persona, context, task decomposition, format specs, and quality constraints. {_RULES}"
    ),
    "socratic": (
        f"Transform the user's request into a Socratic-method prompt that guides the AI through "
        f"foundational analysis, probing questions, and synthesis to reach a thorough answer. "
        f"The questions should be embedded IN the prompt for the AI to answer, not asked to the user. {_RULES}"
    ),
    "evaluation": (
        f"Transform the user's request into an evaluation prompt with a scoring rubric, "
        f"weighted criteria, strengths/weaknesses analysis, and a final verdict. {_RULES}"
    ),
    "multi_agent": (
        f"Transform the user's request into a multi-perspective prompt where different expert "
        f"roles (e.g., strategist, engineer, designer, analyst) each contribute their perspective, "
        f"then synthesize into a unified recommendation. {_RULES}"
    ),
    "delegation": (
        f"Transform the user's request into a delegation prompt that breaks the task into "
        f"subtasks with assigned roles, deliverables, timelines, and an integration plan. {_RULES}"
    ),
    "planning": (
        f"Transform the user's request into a strategic planning prompt with phases "
        f"(discovery, strategy, execution, monitoring), timelines, and KPIs. {_RULES}"
    ),
    "transformation": (
        f"Transform the user's request into a data/content transformation prompt with clear "
        f"source input, target output format, transformation rules, and verification steps. {_RULES}"
    ),
    "creative": (
        f"Transform the user's request into a creative prompt with inspiration seeds, "
        f"mood/style/theme parameters, creative constraints, and ideation methodology. {_RULES}"
    ),
    "retrieval_augmented": (
        f"Transform the user's request into a retrieval-augmented prompt that instructs the AI "
        f"to search its knowledge, cite sources, synthesize information, and provide a "
        f"well-grounded, evidence-based answer. {_RULES}"
    ),
}

DEFAULT_SYSTEM_PROMPT = SYSTEM_PROMPTS["instruction"]


# --- Pydantic Models ---
class GenerateRequest(BaseModel):
    base_prompt: str = Field(..., min_length=1, description="The user's raw prompt")
    intent: str = Field(default="instruction", description="Prompt structure type")


class GenerateResponse(BaseModel):
    original_prompt: str
    intent: str
    optimized_prompt: str
    ai_model: str
    success: bool = True


# --- OpenRouter Provider ---
async def call_openrouter(user_prompt: str, system_prompt: str) -> tuple[str, str]:
    """Call OpenRouter API. Randomly picks a model. Raises on failure."""
    if not OPENROUTER_API_KEY or OPENROUTER_API_KEY == "PASTE_YOUR_OPENROUTER_KEY_HERE":
        raise HTTPException(status_code=503, detail="OpenRouter API key not configured. Set OPENROUTER_API_KEY in .env")

    model_id, model_name = random.choice(OPENROUTER_MODELS)

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://promptbuddy.app",
                "X-Title": "PromptBuddy",
            },
            json={
                "model": model_id,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.7,
                "max_tokens": 2048,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"], model_name


# --- Routes ---
@app.get("/")
async def root():
    return {"status": "online", "version": "4.0"}


@app.get("/intents")
async def list_intents():
    return {"intents": list(SYSTEM_PROMPTS.keys())}


@app.post("/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    """Generate an AI-optimized prompt via OpenRouter."""
    system_prompt = SYSTEM_PROMPTS.get(req.intent, DEFAULT_SYSTEM_PROMPT)
    user_message = f"Transform this into an optimized, high-quality prompt:\n\n{req.base_prompt}"

    try:
        text, model_name = await call_openrouter(user_message, system_prompt)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generation failed: {e}")
        raise HTTPException(status_code=502, detail="AI generation failed. Please try again.")

    return GenerateResponse(
        original_prompt=req.base_prompt,
        intent=req.intent,
        optimized_prompt=text.strip(),
        ai_model=model_name,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
