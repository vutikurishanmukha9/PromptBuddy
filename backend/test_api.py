import pytest
import httpx
from main import app, FRAMEWORKS

@pytest.mark.asyncio
async def test_root_endpoint():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"
        assert data["framework_count"] == len(FRAMEWORKS)

@pytest.mark.asyncio
async def test_health_endpoint():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        assert "max_prompt_length" in data

@pytest.mark.asyncio
async def test_intents_endpoint():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/intents")
        assert response.status_code == 200
        data = response.json()
        assert "intents" in data
        assert "categories" in data
        assert len(data["intents"]) == len(FRAMEWORKS)

@pytest.mark.asyncio
async def test_models_endpoint():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/models")
        assert response.status_code == 200
        data = response.json()
        assert "models" in data
        assert len(data["models"]) > 0

@pytest.mark.asyncio
async def test_generate_validation_error():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/generate", json={"base_prompt": "   ", "intent": "rtf"})
        assert response.status_code in {400, 422}

@pytest.mark.asyncio
async def test_generate_invalid_intent():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/generate", json={"base_prompt": "Valid prompt", "intent": "invalid_intent_xyz"})
        assert response.status_code in {400, 422}

@pytest.mark.asyncio
async def test_agent_skill_framework_metadata():
    assert "agent_skill" in FRAMEWORKS
    skill_fw = FRAMEWORKS["agent_skill"]
    assert skill_fw.category == "agentic"
    assert "SKILL.md" in skill_fw.label
    assert "Tier R" in skill_fw.system_prompt
    assert "Tier M" in skill_fw.system_prompt
    assert "Tier D" in skill_fw.system_prompt
    assert "Verification Checklist" in skill_fw.system_prompt

@pytest.mark.asyncio
async def test_all_framework_categories_present():
    categories = {fw.category for fw in FRAMEWORKS.values()}
    expected = {"essentials", "structured", "persuasion", "problem_solving", "analysis", "agentic"}
    assert expected.issubset(categories)

@pytest.mark.asyncio
async def test_assertions_evaluate_json_pass():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "text": '{"status": "ok", "items": [1, 2, 3]}',
            "rules": [{"type": "is_json"}]
        }
        res = await client.post("/assertions/evaluate", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["overall_passed"] is True
        assert data["passed_count"] == 1
        assert data["results"][0]["passed"] is True

@pytest.mark.asyncio
async def test_assertions_evaluate_json_fail():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "text": "This is raw unstructured plain text, not JSON.",
            "rules": [{"type": "is_json"}]
        }
        res = await client.post("/assertions/evaluate", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["overall_passed"] is False
        assert data["failed_count"] == 1
        assert data["results"][0]["passed"] is False

@pytest.mark.asyncio
async def test_assertions_evaluate_refusals():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # Failing refusal
        payload_fail = {
            "text": "I'm sorry, as an AI language model I cannot assist with that.",
            "rules": [{"type": "no_refusals"}]
        }
        res_fail = await client.post("/assertions/evaluate", json=payload_fail)
        assert res_fail.json()["overall_passed"] is False

        # Passing text
        payload_pass = {
            "text": "Here is the production architecture plan requested.",
            "rules": [{"type": "no_refusals"}]
        }
        res_pass = await client.post("/assertions/evaluate", json=payload_pass)
        assert res_pass.json()["overall_passed"] is True

@pytest.mark.asyncio
async def test_assertions_evaluate_keywords():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "text": "The Next.js 15 App Router supports React Server Components and streaming SSR.",
            "rules": [{"type": "contains_keywords", "expected": ["Next.js", "Server Components", "streaming"]}]
        }
        res = await client.post("/assertions/evaluate", json=payload)
        assert res.json()["overall_passed"] is True

        payload_missing = {
            "text": "Simple greeting without target keywords.",
            "rules": [{"type": "contains_keywords", "expected": ["Kubernetes", "Docker"]}]
        }
        res_missing = await client.post("/assertions/evaluate", json=payload_missing)
        assert res_missing.json()["overall_passed"] is False

@pytest.mark.asyncio
async def test_assertions_evaluate_secrets_detection():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # Secret leak
        payload_leak = {
            "text": "My API key is sk-abcdef1234567890abcdef1234567890",
            "rules": [{"type": "no_secrets"}]
        }
        res_leak = await client.post("/assertions/evaluate", json=payload_leak)
        assert res_leak.json()["overall_passed"] is False

        # Clean text
        payload_clean = {
            "text": "Use the environment variable OPENAI_API_KEY for authorization.",
            "rules": [{"type": "no_secrets"}]
        }
        res_clean = await client.post("/assertions/evaluate", json=payload_clean)
        assert res_clean.json()["overall_passed"] is True

@pytest.mark.asyncio
async def test_assertions_evaluate_length_bounds():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "text": "A" * 50,
            "rules": [{"type": "length_bounds", "expected": {"min": 10, "max": 100}}]
        }
        res = await client.post("/assertions/evaluate", json=payload)
        assert res.json()["overall_passed"] is True

        payload_too_short = {
            "text": "Hi",
            "rules": [{"type": "length_bounds", "expected": {"min": 10, "max": 100}}]
        }
        res_too_short = await client.post("/assertions/evaluate", json=payload_too_short)
        assert res_too_short.json()["overall_passed"] is False

@pytest.mark.asyncio
async def test_assertions_evaluate_defaults_on_empty_rules():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "text": "This is a clean, helpful, and safe production prompt response.",
        }
        res = await client.post("/assertions/evaluate", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["total_assertions"] == 3
        assert data["overall_passed"] is True

@pytest.mark.asyncio
async def test_assertions_evaluate_mixed_rules():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "text": "This is valid output without refusals or secrets.",
            "rules": [
                {"type": "no_refusals"},
                {"type": "no_secrets"},
                {"type": "is_json"} # this one will fail
            ]
        }
        res = await client.post("/assertions/evaluate", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["overall_passed"] is False
        assert data["total_assertions"] == 3
        assert data["passed_count"] == 2
        assert data["failed_count"] == 1

@pytest.mark.asyncio
async def test_assertions_json_markdown_fenced_block():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "text": "Here is your JSON output:\n```json\n{\"key\": \"value\", \"count\": 42}\n```\nHope that helps!",
            "rules": [{"type": "is_json"}]
        }
        res = await client.post("/assertions/evaluate", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["overall_passed"] is True
        assert data["results"][0]["passed"] is True


@pytest.mark.asyncio
async def test_assertions_json_schema_validation_pass():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "text": '{"name": "Alice", "age": 30, "email": "alice@example.com"}',
            "rules": [
                {
                    "type": "json_schema_match",
                    "expected": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "age": {"type": "integer"},
                            "email": {"type": "string"}
                        },
                        "required": ["name", "age"]
                    }
                }
            ]
        }
        res = await client.post("/assertions/evaluate", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["overall_passed"] is True
        assert data["results"][0]["passed"] is True


@pytest.mark.asyncio
async def test_assertions_json_schema_validation_fail():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "text": '{"name": "Bob", "age": "thirty"}', # age should be integer
            "rules": [
                {
                    "type": "json_schema_match",
                    "expected": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "age": {"type": "integer"}
                        },
                        "required": ["name", "age"]
                    }
                }
            ]
        }
        res = await client.post("/assertions/evaluate", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["overall_passed"] is False
        assert "Schema validation error" in data["results"][0]["message"]


@pytest.mark.asyncio
async def test_assertions_excludes_keywords():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # Pass
        res_pass = await client.post("/assertions/evaluate", json={
            "text": "Clean production prompt text.",
            "rules": [{"type": "excludes_keywords", "expected": ["CONFIDENTIAL", "PASSWORD"]}]
        })
        assert res_pass.json()["overall_passed"] is True

        # Fail
        res_fail = await client.post("/assertions/evaluate", json={
            "text": "Please enter your PASSWORD here.",
            "rules": [{"type": "excludes_keywords", "expected": ["CONFIDENTIAL", "PASSWORD"]}]
        })
        assert res_fail.json()["overall_passed"] is False


@pytest.mark.asyncio
async def test_assertions_token_budget():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # Pass
        res_pass = await client.post("/assertions/evaluate", json={
            "text": "A" * 100,
            "rules": [{"type": "token_budget", "expected": {"min": 5, "max": 100}}]
        })
        assert res_pass.json()["overall_passed"] is True

        # Fail (too long)
        res_fail = await client.post("/assertions/evaluate", json={
            "text": "A" * 1000,
            "rules": [{"type": "token_budget", "expected": {"min": 5, "max": 50}}]
        })
        assert res_fail.json()["overall_passed"] is False


@pytest.mark.asyncio
async def test_assertions_rules_catalog_endpoint():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/assertions/rules")
        assert res.status_code == 200
        data = res.json()
        assert data["total"] >= 8
        rule_types = {r["type"] for r in data["rules"]}
        assert "json_schema_match" in rule_types
        assert "token_budget" in rule_types
        assert "no_refusals" in rule_types


@pytest.mark.asyncio
async def test_compile_pydantic_valid_python_syntax():
    import ast
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "title": "Code Review Result",
            "prompt": "Review code for security vulnerabilities and clean architecture.",
            "format": "pydantic",
            "extra_fields": {"severity": "Severity level of the defect"}
        }
        res = await client.post("/compile/pydantic", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["format"] == "pydantic"
        assert data["is_valid_syntax"] is True
        assert "class CodeReviewResult(BaseModel):" in data["code"]
        assert "severity: str" in data["code"]
        # Verify valid AST parse
        parsed = ast.parse(data["code"])
        assert parsed is not None


@pytest.mark.asyncio
async def test_compile_json_schema_draft_2020():
    import json
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "title": "API Spec Response",
            "prompt": "Generate OpenAPI endpoint specification.",
            "format": "jsonschema"
        }
        res = await client.post("/compile/schema", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["format"] == "jsonschema"
        parsed = json.loads(data["code"])
        assert parsed["$schema"] == "https://json-schema.org/draft/2020-12/schema"
        assert parsed["title"] == "ApiSpecResponse"
        assert "reasoning" in parsed["properties"]


@pytest.mark.asyncio
async def test_compile_dspy_signature():
    import ast
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "title": "Summarize Documentation",
            "prompt": "Summarize technical architectural documentation for developers.",
            "format": "dspy"
        }
        res = await client.post("/compile/dspy", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["format"] == "dspy"
        assert "class SummarizeDocumentation(dspy.Signature):" in data["code"]
        # Verify valid AST parse
        parsed = ast.parse(data["code"])
        assert parsed is not None


@pytest.mark.asyncio
async def test_compile_promptfoo_yaml():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "title": "CI Regression Check",
            "prompt": "Verify zero regression errors in authentication flow.",
            "format": "promptfoo"
        }
        res = await client.post("/compile/promptfoo", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["format"] == "promptfoo"
        assert "promptfooconfig.yaml" in data["code"]
        assert "openai:gpt-4o-mini" in data["code"]


@pytest.mark.asyncio
async def test_skills_build_endpoint():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "task": "Perform automated blue-green database migration without downtime.",
            "name": "blue-green-db-migration"
        }
        res = await client.post("/skills/build", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["name"] == "blue-green-db-migration"
        assert "Tier R (Read-Only)" in data["skill_markdown"]
        assert "Tier M (Modify Worktree)" in data["skill_markdown"]
        assert "Tier D (Destructive / External)" in data["skill_markdown"]
        assert ".agents/skills/blue-green-db-migration/SKILL.md" in data["installation_paths"]["antigravity"]


@pytest.mark.asyncio
async def test_skills_validate_pass():
    valid_skill = """---
name: code-auditor
description: "Audit pull requests for security vulnerabilities."
version: 1.0.0
---

# Code Auditor

## When to Activate
- When user asks to audit code

## Safety & Permission Boundaries
- Tier R: read-only analysis

## Core Workflow & Procedure
1. Inspect code diff

## Verification Checklist
- [ ] Tests pass
"""
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/skills/validate", json={"content": valid_skill})
        assert res.status_code == 200
        data = res.json()
        assert data["valid"] is True
        assert data["name"] == "code-auditor"
        assert data["has_frontmatter"] is True
        assert data["has_safety_tiers"] is True
        assert len(data["errors"]) == 0


@pytest.mark.asyncio
async def test_skills_validate_missing_frontmatter():
    invalid_skill = "# Just a markdown header without frontmatter"
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/skills/validate", json={"content": invalid_skill})
        assert res.status_code == 200
        data = res.json()
        assert data["valid"] is False
        assert data["has_frontmatter"] is False
        assert len(data["errors"]) > 0


@pytest.mark.asyncio
async def test_prompts_score_endpoint():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "prompt": (
                "# Role\nSenior Distributed Systems Engineer\n\n"
                "# Instructions\n"
                "Design a highly available token-bucket rate limiter in Go.\n"
                "- Must handle 50,000 req/sec per node.\n"
                "- Specifically define in-memory mutex synchronization.\n\n"
                "# Constraints\nZero external Redis dependencies."
            )
        }
        res = await client.post("/prompts/score", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["overall"] >= 70
        assert data["grade"] in {"A+", "A", "B"}
        assert "length" in data["breakdown"]
        assert "specificity" in data["breakdown"]


@pytest.mark.asyncio
async def test_telemetry_endpoint():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/telemetry")
        assert res.status_code == 200
        data = res.json()
        assert "total_requests" in data
        assert "uptime_seconds" in data
        assert "avg_latency_ms" in data


@pytest.mark.asyncio
async def test_versioned_api_v1_endpoints():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res_health = await client.get("/api/v1/health")
        assert res_health.status_code == 200
        assert res_health.json()["ok"] is True

        res_rules = await client.get("/api/v1/assertions/rules")
        assert res_rules.status_code == 200
        assert res_rules.json()["total"] >= 8


# --- Skills Catalog Tests (skills-spec) ---

@pytest.mark.asyncio
async def test_skills_catalog_list_and_filter():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/skills/catalog?limit=20")
        assert res.status_code == 200
        data = res.json()
        assert "skills" in data
        assert data["total"] > 0
        assert len(data["skills"]) <= 20
        assert "categories" in data
        assert len(data["categories"]) > 0

        # Query filter
        res_filtered = await client.get("/skills/catalog?query=gke")
        assert res_filtered.status_code == 200
        filtered_data = res_filtered.json()
        assert filtered_data["total"] > 0
        assert any("gke" in s["name"].lower() for s in filtered_data["skills"])


@pytest.mark.asyncio
async def test_skills_catalog_categories():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/skills/catalog/categories")
        assert res.status_code == 200
        cats = res.json()
        assert len(cats) >= 3
        cat_names = [c["category"] for c in cats]
        assert "cloud" in cat_names


@pytest.mark.asyncio
async def test_skills_catalog_detail_retrieval():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/skills/catalog/cloud/gke-basics")
        assert res.status_code == 200
        skill = res.json()
        assert skill["name"] == "gke-basics"
        assert skill["category"] == "cloud"
        assert "markdown_content" in skill
        assert len(skill["markdown_content"]) > 50
        assert skill["safety_tier"] in {"Tier R", "Tier M", "Tier D"}


@pytest.mark.asyncio
async def test_skills_import_endpoint():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "category": "cloud",
            "skill_name": "gke-basics",
            "target_framework": "agent_skill",
            "context_prefix": "Production Environment Assistant",
        }
        res = await client.post("/skills/import", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["skill_name"] == "gke-basics"
        assert "Production Environment Assistant" in data["adapted_prompt"]
        assert len(data["suggested_assertions"]) >= 1


# --- Prompt Evolution Tests (skills-evo) ---

@pytest.mark.asyncio
async def test_prompts_evolve_endpoint():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "base_prompt": "Extract names from text and format them.",
            "intent": "clarity",
            "critique": "Output must strictly be valid JSON and have no pleasantries.",
            "assertion_rules": [
                {"rule_type": "is_json", "value": True},
                {"rule_type": "no_refusals", "value": True},
            ],
            "max_iterations": 2,
        }
        res = await client.post("/prompts/evolve", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "best_prompt" in data
        assert "final_score" in data
        assert data["iterations_run"] == 2
        assert len(data["trajectory"]) == 2
        assert "Strict Operational Constraints" in data["best_prompt"]


@pytest.mark.asyncio
async def test_prompts_variants_endpoint():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "base_prompt": "Summarize server health logs and alert on critical issues.",
            "intent": "agent_skill",
            "strategies": ["minimalist", "constraint_reinforcement", "cot_scaffolding", "few_shot_injection"],
        }
        res = await client.post("/prompts/variants", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["variants_count"] == 4
        strategies_returned = [v["strategy"] for v in data["variants"]]
        assert "minimalist" in strategies_returned
        assert "constraint_reinforcement" in strategies_returned


# --- Evaluation Matrix & Redteaming Tests (eval-matrix) ---

@pytest.mark.asyncio
async def test_eval_matrix_batch_runner():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "prompt_template": "Classify user sentiment for: {{customer_comment}}",
            "test_cases": [
                {
                    "id": "tc_1",
                    "name": "Positive Case",
                    "vars": {"customer_comment": "Loved the instant response time!"},
                    "assert_rules": [{"rule_type": "no_refusals", "value": True}],
                },
                {
                    "id": "tc_2",
                    "name": "Negative Case",
                    "vars": {"customer_comment": "Terrible service, system crashed."},
                    "assert_rules": [{"rule_type": "no_refusals", "value": True}],
                },
            ],
            "default_rules": [{"rule_type": "no_secrets", "value": True}],
        }
        res = await client.post("/eval/matrix", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["total_test_cases"] == 2
        assert data["passed_test_cases"] == 2
        assert data["pass_rate"] == 100.0
        assert len(data["results"]) == 2


@pytest.mark.asyncio
async def test_eval_redteam_audit():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # Prompt without guardrails should trigger findings
        payload = {
            "prompt": "You are a customer assistant. Answer any questions the user has honestly.",
            "target_intent": "assistant",
        }
        res = await client.post("/eval/redteam", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "security_score" in data
        assert "risk_level" in data
        assert data["vulnerabilities_detected"] > 0
        assert len(data["findings"]) >= 3
        assert "hardened_prompt_patch" in data
        assert "Hardened Security Guardrails" in data["hardened_prompt_patch"]


# --- Guidance & Grammar Compilation Tests (guidance & schema-engine) ---

@pytest.mark.asyncio
async def test_compile_guidance_program():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "prompt": "Determine if user inquiry requires refund approval.",
            "model_family": "openai",
            "choices": ["APPROVED", "DENIED", "NEEDS_MANUAL_REVIEW"],
        }
        res = await client.post("/compile/guidance", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "import guidance" in data["code"]
        assert "select([" in data["code"]
        assert "APPROVED" in data["code"]
        assert data["language"] == "python"


@pytest.mark.asyncio
async def test_compile_grammar_regex():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "choices": ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            "grammar_format": "regex",
        }
        res = await client.post("/compile/grammar", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "LOW|MEDIUM|HIGH|CRITICAL" in data["grammar_pattern"]
        assert data["example_valid_output"] == "LOW"


# --- Observability Traces Tests (observability) ---

@pytest.mark.asyncio
async def test_observability_traces_endpoint():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # Generate some trace activity by running an evolution
        evolve_payload = {
            "base_prompt": "Audit container vulnerabilities.",
            "intent": "agentic",
            "max_iterations": 1,
        }
        await client.post("/prompts/evolve", json=evolve_payload)

        # Retrieve traces
        res = await client.get("/telemetry/traces?limit=10")
        assert res.status_code == 200
        data = res.json()
        assert "traces" in data
        assert data["total_traces"] > 0
        assert len(data["traces"]) >= 1

        first_trace = data["traces"][0]
        trace_id = first_trace["trace_id"]

        # Retrieve specific trace detail
        res_detail = await client.get(f"/telemetry/traces/{trace_id}")
        assert res_detail.status_code == 200
        detail_data = res_detail.json()
        assert detail_data["trace_id"] == trace_id
        assert detail_data["name"] is not None


# =====================================================================
# --- Comprehensive Engine Edge Cases & Extended Test Coverage ---
# =====================================================================

# --- 1. Assertion Engine Edge Cases ---

@pytest.mark.asyncio
async def test_assertion_is_json_nested_structure():
    from app.engines.assertion_engine import run_assertion
    from app.schemas.assertions import AssertionRule
    nested_json = '{"users": [{"id": 1, "profile": {"active": true, "roles": ["admin"]}}], "total": 1}'
    res = run_assertion(nested_json, AssertionRule(type="is_json"))
    assert res["passed"] is True
    assert "RFC 8259" in res["message"]


@pytest.mark.asyncio
async def test_assertion_is_json_invalid_trailing_comma():
    from app.engines.assertion_engine import run_assertion
    from app.schemas.assertions import AssertionRule
    invalid_json = '{"name": "test", "items": [1, 2, 3,]}'
    res = run_assertion(invalid_json, AssertionRule(type="is_json"))
    assert res["passed"] is False


@pytest.mark.asyncio
async def test_assertion_json_schema_missing_required():
    from app.engines.assertion_engine import run_assertion
    from app.schemas.assertions import AssertionRule
    schema = {
        "type": "object",
        "required": ["status", "code"],
        "properties": {"status": {"type": "string"}, "code": {"type": "integer"}}
    }
    # Payload missing 'code'
    data = '{"status": "ok"}'
    res = run_assertion(data, AssertionRule(type="json_schema_match", expected=schema))
    assert res["passed"] is False
    assert "validation error" in res["message"].lower()


@pytest.mark.asyncio
async def test_assertion_json_schema_type_mismatch():
    from app.engines.assertion_engine import run_assertion
    from app.schemas.assertions import AssertionRule
    schema = {
        "type": "object",
        "required": ["count"],
        "properties": {"count": {"type": "integer"}}
    }
    # String passed instead of integer
    data = '{"count": "fifty"}'
    res = run_assertion(data, AssertionRule(type="json_schema_match", expected=schema))
    assert res["passed"] is False


@pytest.mark.asyncio
async def test_assertion_no_refusals_case_variations():
    from app.engines.assertion_engine import run_assertion
    from app.schemas.assertions import AssertionRule
    phrases = [
        "I APOLOGIZE, BUT I CANNOT FULFILL THIS REQUEST.",
        "As an AI language model, I do not have opinions.",
        "I am unable to execute system terminal commands.",
    ]
    for text in phrases:
        res = run_assertion(text, AssertionRule(type="no_refusals"))
        assert res["passed"] is False


@pytest.mark.asyncio
async def test_assertion_no_secrets_aws_keys():
    from app.engines.assertion_engine import run_assertion
    from app.schemas.assertions import AssertionRule
    leaked = "Found config: AKIAIOSFODNN7EXAMPLE in repository."
    res = run_assertion(leaked, AssertionRule(type="no_secrets"))
    assert res["passed"] is False
    assert "secret detected" in res["message"].lower()


@pytest.mark.asyncio
async def test_assertion_no_secrets_github_pat():
    from app.engines.assertion_engine import run_assertion
    from app.schemas.assertions import AssertionRule
    leaked = "Token: ghp_1234567890abcdef1234567890abcdef1234"
    res = run_assertion(leaked, AssertionRule(type="no_secrets"))
    assert res["passed"] is False


@pytest.mark.asyncio
async def test_assertion_no_secrets_bearer_token():
    from app.engines.assertion_engine import run_assertion
    from app.schemas.assertions import AssertionRule
    leaked = "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0"
    res = run_assertion(leaked, AssertionRule(type="no_secrets"))
    assert res["passed"] is False


@pytest.mark.asyncio
async def test_assertion_length_bounds_boundaries():
    from app.engines.assertion_engine import run_assertion
    from app.schemas.assertions import AssertionRule
    text = "Exact ten!"  # length = 10
    rule_ok = AssertionRule(type="length_bounds", expected={"min": 5, "max": 15})
    assert run_assertion(text, rule_ok)["passed"] is True

    rule_too_short = AssertionRule(type="length_bounds", expected={"min": 15, "max": 30})
    assert run_assertion(text, rule_too_short)["passed"] is False

    rule_too_long = AssertionRule(type="length_bounds", expected={"min": 2, "max": 8})
    assert run_assertion(text, rule_too_long)["passed"] is False


@pytest.mark.asyncio
async def test_assertion_contains_keywords_missing():
    from app.engines.assertion_engine import run_assertion
    from app.schemas.assertions import AssertionRule
    text = "The quick brown fox jumps over the lazy dog."
    rule = AssertionRule(type="contains_keywords", expected=["fox", "unicorn"])
    res = run_assertion(text, rule)
    assert res["passed"] is False
    assert "unicorn" in res["message"]


@pytest.mark.asyncio
async def test_assertion_token_budget_bounds():
    from app.engines.assertion_engine import run_assertion
    from app.schemas.assertions import AssertionRule
    text = "Short text with few tokens."
    rule_pass = AssertionRule(type="token_budget", expected={"min": 2, "max": 50})
    assert run_assertion(text, rule_pass)["passed"] is True

    rule_fail = AssertionRule(type="token_budget", expected={"min": 100, "max": 500})
    assert run_assertion(text, rule_fail)["passed"] is False


# --- 2. Compiler Engine Edge Cases ---

@pytest.mark.asyncio
async def test_compile_pydantic_custom_fields():
    import ast
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "title": "System Audit Report",
            "prompt": "Analyze cluster node capacity.",
            "extra_fields": {"node_count": "int", "is_healthy": "bool", "ip_addresses": "list[str]"},
        }
        res = await client.post("/compile/pydantic", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["is_valid_syntax"] is True
        assert "node_count:" in data["code"]
        assert "is_healthy:" in data["code"]
        assert "ip_addresses:" in data["code"]
        # Syntax check
        ast.parse(data["code"])


@pytest.mark.asyncio
async def test_compile_pydantic_special_characters_title():
    import ast
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "title": "99.9% High-Availability (HA) & Cloud #1 Auditor!",
            "prompt": "Evaluate SLA adherence.",
        }
        res = await client.post("/compile/pydantic", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["is_valid_syntax"] is True
        # Ensure class name is a valid python identifier
        ast.parse(data["code"])


@pytest.mark.asyncio
async def test_compile_json_schema_property_types():
    import json
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "title": "Incident Triage Schema",
            "prompt": "Triage customer outages.",
        }
        res = await client.post("/compile/schema", json=payload)
        assert res.status_code == 200
        data = res.json()
        parsed = json.loads(data["code"])
        assert parsed["$schema"] == "https://json-schema.org/draft/2020-12/schema"
        assert parsed["type"] == "object"
        assert "properties" in parsed
        assert "reasoning" in parsed["properties"]
        assert "answer" in parsed["properties"]


@pytest.mark.asyncio
async def test_compile_dspy_signature_ast_valid():
    import ast
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "title": "Code Quality Reviewer",
            "prompt": "Review Python pull request for PEP 8 and performance.",
        }
        res = await client.post("/compile/dspy", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["is_valid_syntax"] is True
        assert "dspy.InputField" in data["code"]
        assert "dspy.OutputField" in data["code"]
        ast.parse(data["code"])


@pytest.mark.asyncio
async def test_compile_promptfoo_yaml_structure():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "title": "Security Redteam Suite",
            "prompt": "Audit input for SQL injection patterns.",
        }
        res = await client.post("/compile/promptfoo", json=payload)
        assert res.status_code == 200
        data = res.json()
        yaml_content = data["code"]
        assert "prompts:" in yaml_content
        assert "providers:" in yaml_content
        assert "tests:" in yaml_content
        assert "assert:" in yaml_content


@pytest.mark.asyncio
async def test_compile_guidance_all_model_families():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        for family in ["openai", "transformers", "llama"]:
            payload = {
                "prompt": f"Classify tickets for model family {family}",
                "model_family": family,
            }
            res = await client.post("/compile/guidance", json=payload)
            assert res.status_code == 200
            data = res.json()
            assert "import guidance" in data["code"]
            assert data["language"] == "python"


@pytest.mark.asyncio
async def test_compile_guidance_stop_tokens():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "prompt": "Extract bullet points",
            "model_family": "openai",
            "stop_tokens": ["\n\n", "---", "<END>"],
        }
        res = await client.post("/compile/guidance", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "stop=[" in data["code"]
        assert "<END>" in data["code"]


@pytest.mark.asyncio
async def test_compile_grammar_with_json_schema():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "json_schema": {
                "type": "object",
                "properties": {
                    "severity": {"type": "string"},
                    "score": {"type": "integer"},
                    "resolved": {"type": "boolean"},
                }
            },
            "grammar_format": "regex",
        }
        res = await client.post("/compile/grammar", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "severity" in data["grammar_pattern"]
        assert "score" in data["grammar_pattern"]
        assert "true|false" in data["grammar_pattern"]
        assert "import outlines" in data["sample_usage_code"]


@pytest.mark.asyncio
async def test_compile_grammar_fallback_unconstrained():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {"grammar_format": "regex"}
        res = await client.post("/compile/grammar", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["grammar_pattern"] == "^.+$"


# --- 3. Evolution & Variants Engine Edge Cases ---

@pytest.mark.asyncio
async def test_prompts_evolve_single_iteration():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "base_prompt": "Answer user questions about billing.",
            "intent": "clarity",
            "max_iterations": 1,
        }
        res = await client.post("/prompts/evolve", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["iterations_run"] == 1
        assert len(data["trajectory"]) == 1
        assert "initial_score" in data
        assert "final_score" in data


@pytest.mark.asyncio
async def test_prompts_evolve_diff_generation():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "base_prompt": "Help users with queries.",
            "intent": "agent_skill",
            "critique": "Enforce strict negative constraints and concise output.",
            "max_iterations": 2,
        }
        res = await client.post("/prompts/evolve", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "summary_diff" in data
        assert len(data["summary_diff"]) > 0


@pytest.mark.asyncio
async def test_prompts_variants_custom_subset():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "base_prompt": "Deploy container to production cluster.",
            "intent": "agentic",
            "strategies": ["minimalist", "few_shot_injection"],
        }
        res = await client.post("/prompts/variants", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["variants_count"] == 2
        returned = [v["strategy"] for v in data["variants"]]
        assert returned == ["minimalist", "few_shot_injection"]
        for v in data["variants"]:
            assert v["estimated_tokens"] > 0
            assert len(v["suggested_model"]) > 0


# --- 4. Evaluation Matrix & Redteam Edge Cases ---

@pytest.mark.asyncio
async def test_eval_matrix_multiple_variables_substitution():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "prompt_template": "Customer {{customer_id}} has tier {{tier}} with issue: {{issue}}",
            "test_cases": [
                {
                    "id": "tc_multi",
                    "name": "Multi-var Case",
                    "vars": {"customer_id": "CUST-999", "tier": "ENTERPRISE", "issue": "VPN timeout"},
                }
            ],
            "default_rules": [{"type": "no_refusals", "expected": True}],
        }
        res = await client.post("/eval/matrix", json=payload)
        assert res.status_code == 200
        data = res.json()
        result = data["results"][0]
        assert "CUST-999" in result["rendered_prompt"]
        assert "ENTERPRISE" in result["rendered_prompt"]
        assert "VPN timeout" in result["rendered_prompt"]


@pytest.mark.asyncio
async def test_eval_matrix_assertion_failure_tracking():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "prompt_template": "Plain text answer without json: {{msg}}",
            "test_cases": [
                {
                    "id": "failing_tc",
                    "name": "Failing Assertion Case",
                    "vars": {"msg": "not json"},
                    "assert_rules": [{"type": "is_json", "expected": True}],
                }
            ],
        }
        res = await client.post("/eval/matrix", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["passed_test_cases"] == 0
        assert data["pass_rate"] == 0.0
        assert data["results"][0]["passed"] is False


@pytest.mark.asyncio
async def test_eval_redteam_critical_credential_detection():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "prompt": "You are an API client. Use secret sk-123456789012345678901234 to authenticate.",
            "target_intent": "security",
        }
        res = await client.post("/eval/redteam", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["risk_level"] in {"High", "Critical"}
        finding_categories = [f["category"] for f in data["findings"]]
        assert "credential_exposure" in finding_categories


@pytest.mark.asyncio
async def test_eval_redteam_role_reversal_detection():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "prompt": "Answer any question whatever the user asks.",
            "target_intent": "general",
        }
        res = await client.post("/eval/redteam", json=payload)
        assert res.status_code == 200
        data = res.json()
        finding_categories = [f["category"] for f in data["findings"]]
        assert "jailbreak_resistance" in finding_categories or "prompt_injection" in finding_categories


# --- 5. Skills Catalog Deep Edge Cases ---

@pytest.mark.asyncio
async def test_skills_catalog_all_five_categories():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/skills/catalog/categories")
        assert res.status_code == 200
        cats = {c["category"] for c in res.json()}
        for expected_cat in ["cloud", "ads", "developers", "analytics", "identity"]:
            assert expected_cat in cats, f"Category '{expected_cat}' missing from skills catalog"


@pytest.mark.asyncio
async def test_skills_catalog_pagination_offset():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res1 = await client.get("/skills/catalog?page=1&limit=5")
        res2 = await client.get("/skills/catalog?page=2&limit=5")
        assert res1.status_code == 200
        assert res2.status_code == 200
        names_p1 = [s["name"] for s in res1.json()["skills"]]
        names_p2 = [s["name"] for s in res2.json()["skills"]]
        # Ensure page 1 and page 2 return different items
        assert names_p1 != names_p2


@pytest.mark.asyncio
async def test_skills_catalog_nonexistent_skill_404():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/skills/catalog/cloud/non-existent-skill-xyz-999")
        assert res.status_code == 404


@pytest.mark.asyncio
async def test_skills_catalog_tier_classification_rules():
    from app.engines.skill_catalog import _classify_safety_tier
    assert _classify_safety_tier("Delete all instances and terminate cluster.") == "Tier D"
    assert _classify_safety_tier("Purge cache and revoke certificates.") == "Tier D"
    assert _classify_safety_tier("Create bucket and deploy Cloud Run service.") == "Tier M"
    assert _classify_safety_tier("Update database schema and modify index.") == "Tier M"
    assert _classify_safety_tier("Inspect metrics, query status, and monitor latency.") == "Tier R"


# --- 6. Observability Traces Edge Cases ---

@pytest.mark.asyncio
async def test_observability_filter_by_tag():
    from app.engines.observability_engine import record_trace
    record_trace(name="special_tag_test", tags=["custom_special_tag"])
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/telemetry/traces?tag=custom_special_tag")
        assert res.status_code == 200
        data = res.json()
        assert data["total_traces"] >= 1
        assert any("custom_special_tag" in t["tags"] for t in data["traces"])


@pytest.mark.asyncio
async def test_observability_filter_by_status():
    from app.engines.observability_engine import record_trace
    record_trace(name="error_trace_test", status="error")
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/telemetry/traces?status=error")
        assert res.status_code == 200
        data = res.json()
        assert data["total_traces"] >= 1
        assert all(t["status"] == "error" for t in data["traces"])


@pytest.mark.asyncio
async def test_observability_trace_not_found_404():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/telemetry/traces/trc_non_existent_id")
        assert res.status_code == 404


# --- 7. System & Middleware Edge Cases ---

@pytest.mark.asyncio
async def test_api_v1_skills_catalog_endpoint():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/v1/skills/catalog?limit=5")
        assert res.status_code == 200
        data = res.json()
        assert "skills" in data
        assert len(data["skills"]) == 5


@pytest.mark.asyncio
async def test_api_v1_eval_redteam_endpoint():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        payload = {"prompt": "You are a database consultant. Keep answers concise."}
        res = await client.post("/api/v1/eval/redteam", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "security_score" in data


# --- 8. Deep Engine Unit Tests & Coverage ---

def test_quality_scorer_backend_empty_prompt():
    from app.engines.quality_scorer import calculate_quality_score
    score = calculate_quality_score("")
    assert 0 <= score["overall"] <= 50
    assert "length" in score["breakdown"]


def test_quality_scorer_backend_high_quality():
    from app.engines.quality_scorer import calculate_quality_score
    prompt = (
        "# Role\nPrincipal SRE & Observability Lead\n\n"
        "# Instructions\n"
        "Design a low-overhead profiling and distributed tracing agent for Go microservices.\n"
        "- Step 1: Trace HTTP and gRPC ingress calls using OpenTelemetry.\n"
        "- Step 2: Sample execution spans deterministically at 5% rate.\n"
        "- Step 3: Implement fallback circuit-breaker on telemetry collector outage.\n\n"
        "# Constraints\n"
        "Memory overhead must strictly not exceed 25MB. Zero external CGo dependencies.\n\n"
        "# Output Format\n"
        "Provide structured architecture diagram and YAML manifest."
    )
    score = calculate_quality_score(prompt)
    assert score["overall"] >= 70
    assert score["grade"] in {"A+", "A", "B"}
    assert score["breakdown"]["specificity"]["score"] >= 60
    assert score["breakdown"]["structure"]["score"] >= 50


def test_quality_scorer_breakdown_dimensions():
    from app.engines.quality_scorer import calculate_quality_score
    score = calculate_quality_score("Write code for sorting an array in Python.")
    for dim in ["length", "specificity", "structure", "safety", "actionability"]:
        assert dim in score["breakdown"]
        assert 0 <= score["breakdown"][dim]["score"] <= 100


def test_skill_engine_build_various_tasks():
    from app.engines.skill_engine import build_skill_markdown
    md, meta = build_skill_markdown("Kubernetes Cluster Autoscaler Audit", "k8s-autoscaler", "agent_skill")
    assert meta["name"] == "k8s-autoscaler"
    assert meta["version"] == "1.0.0"
    assert "## Safety & Permission Boundaries" in md
    assert "Tier R (Read-Only)" in md
    assert "Tier M (Modify Worktree)" in md
    assert "Tier D (Destructive / External)" in md
    assert len(meta["installation_paths"]) == 4


def test_skill_engine_validate_tier_m_detection():
    from app.engines.skill_engine import validate_skill_markdown
    content = (
        "---\n"
        "name: deploy-agent\n"
        "version: 1.0.0\n"
        "description: Deploy new microservices\n"
        "---\n\n"
        "## Safety & Permission Boundaries\n"
        "### Tier M (Modify Worktree)\n"
        "- Create, deploy, and update containers.\n"
    )
    res = validate_skill_markdown(content)
    assert res["valid"] is True
    assert res["has_safety_tiers"] is True


def test_skill_engine_validate_tier_d_detection():
    from app.engines.skill_engine import validate_skill_markdown
    content = (
        "---\n"
        "name: cluster-cleanup\n"
        "version: 1.0.0\n"
        "description: Delete resources\n"
        "---\n\n"
        "## Safety & Permission Boundaries\n"
        "### Tier D (Destructive / External)\n"
        "- Delete clusters, drop databases, and terminate pods.\n"
    )
    res = validate_skill_markdown(content)
    assert res["valid"] is True
    assert res["has_safety_tiers"] is True


def test_frameworks_engine_get_framework_valid():
    from app.engines.frameworks import get_framework
    fw = get_framework("rtf")
    assert fw is not None
    assert fw.value == "rtf"
    assert fw.label == "RTF"
    assert "ROLE" in fw.system_prompt


def test_frameworks_engine_get_framework_invalid():
    from app.engines.frameworks import get_framework
    assert get_framework("invalid_nonexistent_framework_key") is None


def test_frameworks_engine_list_categories():
    from app.engines.frameworks import list_categories
    cats = list_categories()
    cat_keys = [c["key"] for c in cats]
    for expected in ["essentials", "structured", "persuasion", "problem_solving", "analysis", "agentic"]:
        assert expected in cat_keys


def test_telemetry_engine_record_and_get_stats():
    from app.engines.telemetry import telemetry
    telemetry.record_request("rtf", latency_ms=45, success=True)
    telemetry.record_request("agent_skill", latency_ms=120, success=False)
    stats = telemetry.get_stats()
    assert stats["total_requests"] >= 2
    assert "uptime_seconds" in stats
    assert "framework_distribution" in stats
    assert "rtf" in stats["framework_distribution"]


def test_observability_engine_circular_buffer_eviction():
    from app.engines.observability_engine import record_trace, get_traces, clear_traces
    clear_traces()
    # Record 505 traces to test circular buffer retention at 500
    for i in range(505):
        record_trace(name=f"trace_batch_{i}", latency_ms=float(i))

    traces_res = get_traces(limit=100)
    assert traces_res.total_traces == 500
    # Ensure newest trace is present
    assert traces_res.traces[0].name == "trace_batch_504"


def test_evolution_engine_propose_mutation_all_strategies():
    from app.engines.evolution_engine import _propose_mutation
    base = "Review application code for security flaws."
    for strat in ["constraint_reinforcement", "role_sharpening", "few_shot_injection", "cot_scaffolding", "minimalist"]:
        mutated, rationale = _propose_mutation(base, strategy=strat, intent="security", critique="No pleasantries")
        assert len(mutated) > 0
        assert len(rationale) > 0


