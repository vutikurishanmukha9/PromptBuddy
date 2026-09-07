"""Enterprise prompt frameworks catalog and system prompts."""

from dataclasses import dataclass
from typing import Any


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
    "agent_skill": Framework(
        "agent_skill",
        "Agent SKILL.md",
        "agentic",
        "AI IDE & Agents",
        "Standardized SKILL.md specification for AI IDEs (Antigravity, Cursor, Claude Code, Windsurf)",
        (
            "You are PromptBuddy's AI IDE Skill Architect. Transform human prompts or task specifications into a production-grade, machine-executable SKILL.md document for autonomous AI coding agents (Google Antigravity, Cursor, Claude Code, Windsurf).\n\n"
            "Format Requirement: Standard SKILL.md with YAML frontmatter:\n"
            "---\n"
            "name: <short-slug-name-hyphenated>\n"
            "description: <Single comprehensive sentence starting with an imperative verb describing what the skill does and when to invoke it>\n"
            "version: 1.0.0\n"
            "---\n\n"
            "# <Skill Title>\n\n"
            "## When to Activate\n"
            "- Trigger conditions, user requests, keywords\n\n"
            "## Safety & Permission Boundaries\n"
            "- **Tier R (Read-Only)**: File views, directory listing, searches, log checks. Autonomous execution allowed.\n"
            "- **Tier M (Modify Worktree)**: Code edits, file creation, local tests, build runs. Allowed within working directory.\n"
            "- **Tier D (Destructive / External)**: Deletions, git push, production deployments, credential modifications. Explicit user approval required.\n\n"
            "## Core Workflow & Procedure\n"
            "1. Step-by-step phased instructions for the AI IDE agent\n\n"
            "## Operational Guardrails & Constraints\n"
            "- Non-breaking modifications, error handling, strict verification\n\n"
            "## Verification Checklist\n"
            "- [ ] Specific verifiable conditions before declaring success\n\n"
            "Rules:\n"
            "1. Output valid Markdown only. No conversational wrapper or markdown backticks around the whole file.\n"
            "2. Ensure YAML frontmatter is strictly formatted at the very top.\n"
            "3. Make workflows comprehensive, deterministic, and verifiable."
        ),
    ),
}

CATEGORIES = [
    {"key": "essentials", "label": "Essentials"},
    {"key": "structured", "label": "Structured"},
    {"key": "persuasion", "label": "Persuasion"},
    {"key": "problem_solving", "label": "Problem-Solving"},
    {"key": "analysis", "label": "Analysis"},
    {"key": "agentic", "label": "AI IDE & Agents"},
]


def get_framework(key: str) -> Framework | None:
    return FRAMEWORKS.get(key)


def list_frameworks() -> list[dict[str, Any]]:
    return [
        {
            "value": fw.value,
            "label": fw.label,
            "category": fw.category,
            "desc": fw.description,
        }
        for fw in FRAMEWORKS.values()
    ]


def list_categories() -> list[dict[str, str]]:
    return CATEGORIES
