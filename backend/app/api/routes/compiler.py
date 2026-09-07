"""Code, Schema, and Signature Compilation routes."""

from fastapi import APIRouter
from app.schemas.compilation import CompileRequest, CompileResponse
from app.engines.compiler_engine import (
    compile_pydantic_model,
    compile_json_schema,
    compile_dspy_signature,
    compile_promptfoo_yaml,
)

router = APIRouter(prefix="/compile", tags=["Compilation Engine"])


@router.post("/pydantic", response_model=CompileResponse)
async def compile_to_pydantic(req: CompileRequest) -> CompileResponse:
    code, is_valid = compile_pydantic_model(req.title, req.prompt, req.extra_fields)
    return CompileResponse(
        format="pydantic",
        code=code,
        is_valid_syntax=is_valid,
        metadata={"generator": "PromptBuddy Compiler", "syntax_checked": True},
    )


@router.post("/schema", response_model=CompileResponse)
async def compile_to_schema(req: CompileRequest) -> CompileResponse:
    schema_str = compile_json_schema(req.title, req.prompt)
    return CompileResponse(
        format="jsonschema",
        code=schema_str,
        is_valid_syntax=True,
        metadata={"draft": "2020-12", "strict": True},
    )


@router.post("/dspy", response_model=CompileResponse)
async def compile_to_dspy(req: CompileRequest) -> CompileResponse:
    code, is_valid = compile_dspy_signature(req.title, req.prompt)
    return CompileResponse(
        format="dspy",
        code=code,
        is_valid_syntax=is_valid,
        metadata={"type": "dspy.Signature", "syntax_checked": True},
    )


@router.post("/promptfoo", response_model=CompileResponse)
async def compile_to_promptfoo(req: CompileRequest) -> CompileResponse:
    yaml_str = compile_promptfoo_yaml(req.title, req.prompt)
    return CompileResponse(
        format="promptfoo",
        code=yaml_str,
        is_valid_syntax=True,
        metadata={"target": "promptfooconfig.yaml"},
    )


# --- Microsoft Guidance & Outlines Grammar Compilation ---

from app.schemas.guidance import (
    GuidanceCompileRequest,
    GuidanceCompileResponse,
    GrammarCompileRequest,
    GrammarCompileResponse,
)
from app.engines.guidance_engine import (
    compile_guidance_program,
    compile_schema_to_grammar,
)


@router.post("/guidance", response_model=GuidanceCompileResponse)
async def compile_to_guidance(req: GuidanceCompileRequest) -> GuidanceCompileResponse:
    """Compile prompt and constraints into a Microsoft Guidance program."""
    return compile_guidance_program(req)


@router.post("/grammar", response_model=GrammarCompileResponse)
async def compile_to_grammar(req: GrammarCompileRequest) -> GrammarCompileResponse:
    """Derive regular expression or GBNF grammar from JSON Schema / discrete choices."""
    return compile_schema_to_grammar(req)
