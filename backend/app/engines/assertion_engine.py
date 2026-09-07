"""Enhanced Live Assertion Matrix Engine for prompt safety & quality evaluation."""

from __future__ import annotations

import json
import re
from typing import Any
import jsonschema

from app.schemas.assertions import AssertionRule, AssertionResult, RuleDescriptor

REFUSAL_PATTERNS = [
    r"\bas an ai\b",
    r"\bi cannot\b",
    r"\bi am unable to\b",
    r"\bi'm sorry\b",
    r"\bas a language model\b",
    r"\bi apologize\b",
]

SECRET_PATTERNS = [
    r"sk-[a-zA-Z0-9]{20,}",
    r"ghp_[a-zA-Z0-9]{20,}",
    r"Bearer\s+[a-zA-Z0-9_\-\.]{25,}",
    r"AKIA[0-9A-Z]{16}",
    r"(?i)password\s*[:=]\s*['\"][^\n'\"]+['\"]",
]

RULE_DESCRIPTORS: list[RuleDescriptor] = [
    RuleDescriptor(type="is_json", name="Valid JSON Structure", description="Asserts that output is RFC 8259 JSON or markdown-fenced JSON block"),
    RuleDescriptor(type="json_schema_match", name="JSON Schema Conformance", description="Asserts that output conforms to an expected JSON Schema", example_expected={"type": "object", "required": ["status"]}),
    RuleDescriptor(type="no_refusals", name="Zero Model Refusals", description="Asserts output contains no AI refusal/apology patterns"),
    RuleDescriptor(type="no_secrets", name="Zero Credential Leaks", description="Asserts output contains no leaked API keys, tokens, or credentials"),
    RuleDescriptor(type="length_bounds", name="Character Length Bounds", description="Asserts output length is within bounds", example_expected={"min": 10, "max": 10000}),
    RuleDescriptor(type="contains_keywords", name="Must Contain Keywords", description="Asserts output contains all mandatory keywords", example_expected=["required", "keyword"]),
    RuleDescriptor(type="excludes_keywords", name="Must Exclude Keywords", description="Asserts output does not contain any forbidden terms", example_expected=["confidential", "forbidden"]),
    RuleDescriptor(type="token_budget", name="Token Budget Constraints", description="Asserts estimated token usage is within budget bounds", example_expected={"min": 5, "max": 2000}),
]


def run_assertion(text: str, rule: AssertionRule) -> dict[str, Any]:
    rtype = rule.type

    if rtype == "is_json":
        try:
            json.loads(text.strip())
            return {"type": rtype, "passed": True, "message": "Text conforms to valid RFC 8259 JSON"}
        except Exception:
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
            if match:
                try:
                    json.loads(match.group(1).strip())
                    return {"type": rtype, "passed": True, "message": "Fenced block conforms to valid JSON"}
                except Exception:
                    pass
            return {"type": rtype, "passed": False, "message": "Output is not valid JSON"}

    elif rtype == "json_schema_match":
        parsed_data = None
        try:
            parsed_data = json.loads(text.strip())
        except Exception:
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
            if match:
                try:
                    parsed_data = json.loads(match.group(1).strip())
                except Exception:
                    pass
        if parsed_data is None:
            return {"type": rtype, "passed": False, "message": "Failed to parse JSON for schema validation"}
        schema = rule.expected or {}
        try:
            jsonschema.validate(instance=parsed_data, schema=schema)
            return {"type": rtype, "passed": True, "message": "JSON strictly conforms to specified JSON Schema"}
        except jsonschema.ValidationError as err:
            return {"type": rtype, "passed": False, "message": f"Schema validation error: {err.message}"}
        except Exception as e:
            return {"type": rtype, "passed": False, "message": f"Invalid schema definition: {str(e)}"}

    elif rtype == "no_refusals":
        for pat in REFUSAL_PATTERNS:
            if re.search(pat, text, re.IGNORECASE):
                return {"type": rtype, "passed": False, "message": f"Detected model refusal pattern: '{pat}'"}
        return {"type": rtype, "passed": True, "message": "Zero AI refusal phrases detected"}

    elif rtype == "no_secrets":
        for pat in SECRET_PATTERNS:
            if re.search(pat, text):
                return {"type": rtype, "passed": False, "message": "Potential API credential or secret detected"}
        return {"type": rtype, "passed": True, "message": "Zero credential or secret leakages detected"}

    elif rtype == "length_bounds":
        min_len = 10
        max_len = 100000
        if isinstance(rule.expected, dict):
            min_len = rule.expected.get("min", min_len)
            max_len = rule.expected.get("max", max_len)
        l = len(text)
        if l < min_len:
            return {"type": rtype, "passed": False, "message": f"Length ({l} chars) is below minimum {min_len}"}
        if l > max_len:
            return {"type": rtype, "passed": False, "message": f"Length ({l} chars) exceeds maximum {max_len}"}
        return {"type": rtype, "passed": True, "message": f"Length ({l} chars) within bounds [{min_len}, {max_len}]"}

    elif rtype == "contains_keywords":
        keywords = rule.expected if isinstance(rule.expected, list) else [str(rule.expected or "")]
        missing = [kw for kw in keywords if kw and kw.lower() not in text.lower()]
        if missing:
            return {"type": rtype, "passed": False, "message": f"Missing expected keywords: {', '.join(missing)}"}
        return {"type": rtype, "passed": True, "message": f"All {len(keywords)} required keywords present"}

    elif rtype == "excludes_keywords":
        keywords = rule.expected if isinstance(rule.expected, list) else [str(rule.expected or "")]
        present = [kw for kw in keywords if kw and kw.lower() in text.lower()]
        if present:
            return {"type": rtype, "passed": False, "message": f"Forbidden keywords detected: {', '.join(present)}"}
        return {"type": rtype, "passed": True, "message": "Zero forbidden keywords found"}

    elif rtype == "token_budget":
        est_tokens = max(1, len(text) // 4)
        min_tokens = 1
        max_tokens = 10000
        if isinstance(rule.expected, dict):
            min_tokens = rule.expected.get("min", min_tokens)
            max_tokens = rule.expected.get("max", max_tokens)
        if est_tokens < min_tokens:
            return {"type": rtype, "passed": False, "message": f"Estimated tokens ({est_tokens}) below minimum {min_tokens}"}
        if est_tokens > max_tokens:
            return {"type": rtype, "passed": False, "message": f"Estimated tokens ({est_tokens}) exceeds maximum {max_tokens}"}
        return {"type": rtype, "passed": True, "message": f"Estimated token budget ({est_tokens}) within bounds [{min_tokens}, {max_tokens}]"}

    return {"type": rtype, "passed": True, "message": f"Assertion '{rtype}' verified"}


def evaluate_all_assertions(text: str, rules: list[AssertionRule] | None = None) -> dict[str, Any]:
    active_rules = rules or [
        AssertionRule(type="no_refusals"),
        AssertionRule(type="no_secrets"),
        AssertionRule(type="length_bounds", expected={"min": 5, "max": 50000})
    ]
    results = [run_assertion(text, r) for r in active_rules]
    passed_count = sum(1 for r in results if r["passed"])
    return {
        "overall_passed": passed_count == len(results),
        "total_assertions": len(results),
        "passed_count": passed_count,
        "failed_count": len(results) - passed_count,
        "results": results,
    }
