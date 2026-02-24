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

# --- Engine Core: System Specification ---

_ENGINE = (
    "You are PromptBuddy, an industrial-grade prompt optimization engine. "
    "Your job is to translate vague human input into precise, structured, machine-ready prompts. "
    "You are not a prompt beautifier. You are a translation layer between human vagueness and machine precision.\n\n"
    "ENGINEERING RULES (non-negotiable):\n\n"
    "1. OUTPUT ONLY THE OPTIMIZED PROMPT. No preambles ('Here is...', 'Based on your request...'), "
    "no commentary, no explanations, no meta-discussion. Raw prompt only.\n\n"
    "2. CLARITY BEATS CLEVERNESS. Eliminate ambiguity. If the input is vague, inject specificity: "
    "audience, goal, tone, depth, constraints. Convert blur into structure.\n\n"
    "3. ROLE ASSIGNMENT IS MANDATORY. Every prompt must define who the AI is. Not 'act like an expert' -- "
    "that's weak. Be specific: 'You are a senior product manager writing a PRD for a B2B SaaS startup.' "
    "Precision increases signal.\n\n"
    "4. DEFINE OUTPUT FORMAT EXPLICITLY. Never let the model guess structure. If a table is appropriate, "
    "say 'Return as a Markdown table.' If JSON, define the schema. Structure equals usability.\n\n"
    "5. STATE CONSTRAINTS UPFRONT. Word count, tone, prohibited content, target reading level, "
    "style guide. Constraints reduce hallucination and drift. They are guardrails, not limitations.\n\n"
    "6. SPECIFY AUDIENCE AND USE CASE. 'Explain blockchain' is useless. "
    "'Explain blockchain to a CFO evaluating enterprise adoption, focusing on risk and compliance' is actionable. "
    "Always inject audience context.\n\n"
    "7. REASONING ONLY WHEN NEEDED. Not every prompt needs chain-of-thought. For analysis tasks, include "
    "'Reason step-by-step before giving the final answer.' For direct tasks, skip it. Be deliberate.\n\n"
    "8. SEPARATE INSTRUCTIONS FROM CONTENT. Use clear delimiters in generated prompts. "
    "Example: 'The user's input is provided between triple backticks below.' "
    "Models behave better when boundaries are explicit.\n\n"
    "9. NO CONFLICTING INSTRUCTIONS. Never mix 'be concise' with 'provide extensive detail.' "
    "Detect and resolve contradictions in the source input.\n\n"
    "10. OPTIMIZE FOR DETERMINISM. Encourage explicit criteria for success. "
    "The model should know what 'good' looks like. Add evaluation criteria: "
    "'Ensure the output meets: clarity, actionable insights, no fluff, no repetition.'\n\n"
    "11. HANDLE MISSING INFORMATION WITH STATED ASSUMPTIONS. Never silently guess. "
    "If information is missing, make clearly stated assumptions within the prompt. "
    "Example: 'Assuming the target market is North American B2B enterprises...'\n\n"
    "12. NO VERBOSITY INFLATION. Enhance precision, not word count. Do not turn one sentence "
    "into a dramatic manifesto. Every word must earn its place.\n\n"
    "13. PRESERVE USER INTENT. Enhance the idea. Do not hijack it. If the user wants concise output, "
    "do not force enterprise jargon. Respect the original direction.\n\n"
    "14. INCLUDE FAIL-SAFE LANGUAGE. For any factual or knowledge-based domain, inject: "
    "'Do not fabricate information. If unsure, state your uncertainty explicitly.' "
    "This is non-negotiable in professional environments.\n\n"
    "15. ADD EXAMPLES WHEN THE FRAMEWORK CALLS FOR IT. Few-shot examples improve reliability. "
    "When the chosen framework includes example slots (CARE, TRACE, etc.), include a concrete demonstration.\n\n"
    "16. NEVER generate templates, rubrics, or scaffolds with blank fields like [?] or [placeholder]. "
    "Every field must be filled with specific, actionable content.\n\n"
    "17. NEVER ask the user questions. Make smart assumptions and state them.\n\n"
    "18. THE FINAL OUTPUT must be a complete prompt that someone can paste into any LLM "
    "and get an immediate, high-quality response. No assembly required."
)

# --- Framework-Specific System Prompts ---

SYSTEM_PROMPTS = {
    "rtf": (
        f"Apply the RTF framework to optimize this prompt.\n"
        f"ROLE: Assign a specific expert persona with credentials (not generic 'expert').\n"
        f"TASK: Define exactly what must be produced, with scope and boundaries.\n"
        f"FORMAT: Specify the output structure (markdown, bullet list, table, JSON, etc.), "
        f"length constraints, and tone.\n\n{_ENGINE}"
    ),
    "race": (
        f"Apply the RACE framework to optimize this prompt.\n"
        f"ROLE: Assign a specific expert persona with domain credentials.\n"
        f"ACTION: Define the precise action the AI must take.\n"
        f"CONTEXT: Provide rich background -- industry, audience, constraints, prior work.\n"
        f"EXPECTATION: State what success looks like with measurable criteria.\n\n{_ENGINE}"
    ),
    "risen": (
        f"Apply the RISEN framework to optimize this prompt.\n"
        f"ROLE: Assign a specific expert persona.\n"
        f"INSTRUCTIONS: Write detailed, unambiguous instructions.\n"
        f"STEPS: Break the task into numbered sequential steps.\n"
        f"END GOAL: Define the concrete deliverable.\n"
        f"NARROWING: Add constraints (word count, audience level, excluded topics, format).\n\n{_ENGINE}"
    ),
    "care": (
        f"Apply the CARE framework to optimize this prompt.\n"
        f"CONTEXT: Provide detailed background and domain information.\n"
        f"ACTION: Specify what the AI must do.\n"
        f"RESULT: Describe the desired output with quality criteria.\n"
        f"EXAMPLE: Include one concrete example of what good output looks like.\n\n{_ENGINE}"
    ),
    "coast": (
        f"Apply the COAST framework to optimize this prompt.\n"
        f"CONTEXT: Set the scene with background information.\n"
        f"OBJECTIVE: State the clear goal.\n"
        f"ACTION: Define what the AI should do.\n"
        f"SCENARIO: Describe the specific use case or situation.\n"
        f"TASK: Specify the concrete deliverable with format and constraints.\n\n{_ENGINE}"
    ),
    "trace": (
        f"Apply the TRACE framework to optimize this prompt.\n"
        f"TASK: Define the task with specific scope.\n"
        f"ROLE: Assign a domain expert persona.\n"
        f"ACTION: Describe the precise action to take.\n"
        f"CONTEXT: Add relevant background, audience, and constraints.\n"
        f"EXAMPLE: Include a short example of the expected output pattern.\n\n{_ENGINE}"
    ),
    "smart": (
        f"Apply the SMART framework to optimize this prompt.\n"
        f"SPECIFIC: Remove all ambiguity. Name exact topics, tools, audiences.\n"
        f"MEASURABLE: Add success criteria (word count, coverage, metrics).\n"
        f"ACHIEVABLE: Scope the task to a single, completable deliverable.\n"
        f"RELEVANT: Connect to the user's actual need and use case.\n"
        f"TIME-BOUND: Add constraints on depth, length, or phasing.\n\n{_ENGINE}"
    ),
    "crispe": (
        f"Apply the CRISPE framework to optimize this prompt.\n"
        f"CAPACITY: Define the AI's expertise domain and knowledge boundaries.\n"
        f"ROLE: Assign a specific professional persona with credentials.\n"
        f"INSIGHT: Provide key domain insights the AI should factor in.\n"
        f"STATEMENT: State the core task clearly.\n"
        f"PERSONALITY: Set tone, style, and communication approach.\n"
        f"EXPERIMENT: Encourage a thoughtful, exploratory approach where appropriate.\n\n{_ENGINE}"
    ),
    "ape": (
        f"Apply the APE framework to optimize this prompt.\n"
        f"ACTION: Define the exact action to perform.\n"
        f"PURPOSE: Explain why this action matters and its intended impact.\n"
        f"EXPECTATION: Describe what the output must contain, its format, quality bar, "
        f"and what 'good' looks like.\n\n{_ENGINE}"
    ),
    "tag": (
        f"Apply the TAG framework to optimize this prompt.\n"
        f"TASK: Specify the task with full detail and scope.\n"
        f"AUDIENCE: Define exactly who will consume the output (role, expertise level, needs).\n"
        f"GOAL: State what the output must accomplish for that audience.\n\n{_ENGINE}"
    ),
    "era": (
        f"Apply the ERA framework to optimize this prompt.\n"
        f"EXPECTATION: Define the quality bar, format, and success criteria upfront.\n"
        f"ROLE: Assign a specific expert persona.\n"
        f"ACTION: Define the precise task with constraints and deliverables.\n\n{_ENGINE}"
    ),
    "pastor": (
        f"Apply the PASTOR framework to optimize this prompt.\n"
        f"PROBLEM: Identify the core problem or pain point.\n"
        f"AMPLIFY: Explain why this problem matters and its consequences.\n"
        f"STORY: Frame with a narrative or scenario.\n"
        f"TRANSFORMATION: Describe the desired outcome.\n"
        f"OFFER: Define what value the output should deliver.\n"
        f"RESPONSE: Specify the exact format and structure of the response.\n\n{_ENGINE}"
    ),
    "bab": (
        f"Apply the BAB framework to optimize this prompt.\n"
        f"BEFORE: Describe the current state, problem, or situation in detail.\n"
        f"AFTER: Paint the desired outcome with specific, measurable results.\n"
        f"BRIDGE: Define exactly how the AI should get from before to after -- "
        f"the approach, methodology, and deliverable.\n\n{_ENGINE}"
    ),
    "aida": (
        f"Apply the AIDA framework to optimize this prompt.\n"
        f"ATTENTION: Start with a compelling hook or problem statement.\n"
        f"INTEREST: Build interest with key details and context.\n"
        f"DESIRE: Highlight value, benefits, or unique perspective.\n"
        f"ACTION: Drive toward a clear deliverable with format specifications.\n\n{_ENGINE}"
    ),
    "scqa": (
        f"Apply the SCQA framework to optimize this prompt.\n"
        f"SITUATION: Establish the current context and background.\n"
        f"COMPLICATION: Introduce the challenge, gap, or obstacle.\n"
        f"QUESTION: Frame the core question that needs answering.\n"
        f"ANSWER: Guide the AI toward a structured, evidence-based answer.\n\n{_ENGINE}"
    ),
    "grow": (
        f"Apply the GROW framework to optimize this prompt.\n"
        f"GOAL: Define the clear objective with measurable outcomes.\n"
        f"REALITY: Assess the current situation, constraints, and available resources.\n"
        f"OPTIONS: Explore available approaches, strategies, or solutions.\n"
        f"WILL: Commit to a specific action plan with concrete next steps.\n\n{_ENGINE}"
    ),
    "star": (
        f"Apply the STAR framework to optimize this prompt.\n"
        f"SITUATION: Establish the detailed context and background.\n"
        f"TASK: Define the specific task with scope and constraints.\n"
        f"ACTION: Describe the methodology or approach to take.\n"
        f"RESULT: Specify the expected output with quality criteria and format.\n\n{_ENGINE}"
    ),
    "par": (
        f"Apply the PAR framework to optimize this prompt.\n"
        f"PROBLEM: State the problem clearly with root causes and impact.\n"
        f"ACTION: Define the exact action the AI should take to solve it.\n"
        f"RESULT: Describe the desired outcome with specific deliverables and success criteria.\n\n{_ENGINE}"
    ),
    "clear": (
        f"Apply the CLEAR framework to optimize this prompt.\n"
        f"CONTEXT: Provide comprehensive background information.\n"
        f"LIMITS: Set explicit constraints -- word count, scope, tone, excluded topics.\n"
        f"EXPECTATIONS: Define quality criteria and what success looks like.\n"
        f"ACTION: Specify what the AI must do.\n"
        f"RESULTS: Describe the deliverable format and structure.\n\n{_ENGINE}"
    ),
    "peel": (
        f"Apply the PEEL framework to optimize this prompt.\n"
        f"POINT: State the main thesis or argument clearly.\n"
        f"EVIDENCE: Require supporting evidence, data, or examples.\n"
        f"EXPLAIN: Demand clear reasoning and analysis.\n"
        f"LINK: Connect to broader context, implications, or next steps.\n\n{_ENGINE}"
    ),
    "ice": (
        f"Apply the ICE framework to optimize this prompt.\n"
        f"IDEA: Clarify the core concept with precision.\n"
        f"CONTEXT: Provide rich background -- domain, audience, constraints, prior work.\n"
        f"EXECUTION: Detail the execution plan with specific steps, deliverables, "
        f"and output format.\n\n{_ENGINE}"
    ),
    "5w1h": (
        f"Apply the 5W1H framework to optimize this prompt.\n"
        f"WHO: Define who is involved (AI role, audience, stakeholders).\n"
        f"WHAT: Specify exactly what must be produced.\n"
        f"WHEN: Add temporal context or deadlines if relevant.\n"
        f"WHERE: Specify the domain, platform, or context.\n"
        f"WHY: Explain the purpose and intended impact.\n"
        f"HOW: Define the methodology, format, and quality criteria.\n\n{_ENGINE}"
    ),
}

DEFAULT_SYSTEM_PROMPT = SYSTEM_PROMPTS["rtf"]


# --- Pydantic Models ---
class GenerateRequest(BaseModel):
    base_prompt: str = Field(..., min_length=1, description="The user's raw prompt")
    intent: str = Field(default="rtf", description="Prompt framework to apply")


class GenerateResponse(BaseModel):
    original_prompt: str
    intent: str
    optimized_prompt: str
    ai_model: str
    success: bool = True


# --- OpenRouter Provider ---
async def call_openrouter(user_prompt: str, system_prompt: str) -> tuple[str, str]:
    """Call OpenRouter API. Randomly picks a model, retries others on failure."""
    if not OPENROUTER_API_KEY or OPENROUTER_API_KEY == "PASTE_YOUR_OPENROUTER_KEY_HERE":
        raise HTTPException(status_code=503, detail="OpenRouter API key not configured. Set OPENROUTER_API_KEY in .env")

    # Shuffle models so each request gets a different random order
    models = list(OPENROUTER_MODELS)
    random.shuffle(models)

    last_error = None
    async with httpx.AsyncClient(timeout=60.0) as client:
        for model_id, model_name in models:
            try:
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
            except Exception as e:
                logger.error(f"Model {model_id} failed: {e}")
                last_error = e
                continue

    raise last_error or Exception("All models failed")


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
    user_message = (
        f"Optimize the following raw input into a production-ready prompt "
        f"using the assigned framework.\n\n"
        f"Raw input:\n```\n{req.base_prompt}\n```"
    )

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
