"""Engines package exposing core capabilities."""

from app.engines.frameworks import (
    FRAMEWORKS,
    CATEGORIES,
    Framework,
    get_framework,
    list_frameworks,
    list_categories,
)
from app.engines.assertion_engine import (
    run_assertion,
    evaluate_all_assertions,
    RULE_DESCRIPTORS,
)
from app.engines.compiler_engine import (
    compile_pydantic_model,
    compile_json_schema,
    compile_dspy_signature,
    compile_promptfoo_yaml,
)
from app.engines.skill_engine import (
    build_skill_markdown,
    validate_skill_markdown,
)
from app.engines.quality_scorer import calculate_quality_score
from app.engines.telemetry import telemetry
from app.engines.skill_catalog import (
    list_catalog_skills,
    list_catalog_categories,
    get_catalog_skill,
    import_skill_to_prompt,
)
from app.engines.evolution_engine import (
    evolve_prompt,
    generate_prompt_variants,
)
from app.engines.eval_matrix_engine import (
    run_eval_matrix,
    run_redteam_audit,
)
from app.engines.guidance_engine import (
    compile_guidance_program,
    compile_schema_to_grammar,
)
from app.engines.observability_engine import (
    record_trace,
    get_traces,
    get_trace,
    clear_traces,
)

__all__ = [
    "FRAMEWORKS",
    "CATEGORIES",
    "Framework",
    "get_framework",
    "list_frameworks",
    "list_categories",
    "run_assertion",
    "evaluate_all_assertions",
    "RULE_DESCRIPTORS",
    "compile_pydantic_model",
    "compile_json_schema",
    "compile_dspy_signature",
    "compile_promptfoo_yaml",
    "build_skill_markdown",
    "validate_skill_markdown",
    "calculate_quality_score",
    "telemetry",
    "list_catalog_skills",
    "list_catalog_categories",
    "get_catalog_skill",
    "import_skill_to_prompt",
    "evolve_prompt",
    "generate_prompt_variants",
    "run_eval_matrix",
    "run_redteam_audit",
    "compile_guidance_program",
    "compile_schema_to_grammar",
    "record_trace",
    "get_traces",
    "get_trace",
    "clear_traces",
]
