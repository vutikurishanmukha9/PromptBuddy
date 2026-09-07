"""Server-side Prompt Quality Scorer."""

from __future__ import annotations

import re
from typing import Any


def calculate_quality_score(text: str) -> dict[str, Any]:
    text = text or ""
    length = len(text)

    # 1. Length analysis
    if length < 50:
        len_score, len_msg = 30, "Too short — lacks necessary context."
    elif length < 100:
        len_score, len_msg = 55, "Brief — consider adding background context."
    elif length < 300:
        len_score, len_msg = 75, "Good length for targeted tasks."
    elif length < 1000:
        len_score, len_msg = 95, "Detailed and comprehensive depth."
    else:
        len_score, len_msg = 90, "Deeply detailed prompt."

    # 2. Specificity
    indicators = [
        "specifically", "exactly", "must", "should", "required",
        "including", "for example", "step 1", "step 2", "constraints:",
        "output:", "format:", "rules:", "deliverable"
    ]
    lower = text.lower()
    matches = sum(1 for ind in indicators if ind in lower)
    if matches >= 5:
        spec_score, spec_msg = 100, "Highly specific with clear operational requirements."
    elif matches >= 3:
        spec_score, spec_msg = 80, "Good specificity."
    elif matches >= 1:
        spec_score, spec_msg = 65, "Contains some specific elements."
    else:
        spec_score, spec_msg = 45, "Lacks specific constraints and directives."

    # 3. Structure
    has_headers = bool(re.search(r"#+\s+", text))
    has_bullets = bool(re.search(r"(?:^|\n)\s*[-*]\s+", text))
    has_numbers = bool(re.search(r"(?:^|\n)\s*\d+\.\s+", text))
    has_bold = bool(re.search(r"\*\*[^*]+\*\*", text))

    struct_points = sum([has_headers * 30, has_bullets * 25, has_numbers * 25, has_bold * 20])
    struct_score = min(100, struct_points or 40)
    struct_msg = "Well-structured formatting." if struct_score >= 70 else "Consider adding markdown sections or lists."

    # 4. Actionability
    action_words = [
        "create", "build", "write", "generate", "analyze", "explain",
        "design", "implement", "develop", "audit", "verify", "inspect"
    ]
    action_matches = sum(1 for w in action_words if w in lower)
    if action_matches >= 3:
        act_score, act_msg = 95, "Clear imperative action directives."
    elif action_matches >= 1:
        act_score, act_msg = 75, "Actionable goal stated."
    else:
        act_score, act_msg = 40, "Add clearer action verbs."

    # 5. Safety & Constraints
    has_safety = bool(re.search(r"(?:tier|safety|constraint|guardrail|do not|never|boundary)", lower))
    safety_score = 95 if has_safety else 65
    safety_msg = "Explicit safety or constraint boundaries present." if has_safety else "No explicit negative constraints or safety boundaries."

    # Weighted overall
    overall = int(
        len_score * 0.20
        + spec_score * 0.25
        + struct_score * 0.20
        + act_score * 0.20
        + safety_score * 0.15
    )

    if overall >= 90:
        grade = "A+"
        readiness = "Production Ready"
    elif overall >= 80:
        grade = "A"
        readiness = "Production Ready"
    elif overall >= 70:
        grade = "B"
        readiness = "Acceptable"
    else:
        grade = "C"
        readiness = "Needs Refinement"

    breakdown = {
        "length": {"score": len_score, "weight": 0.20, "feedback": len_msg},
        "specificity": {"score": spec_score, "weight": 0.25, "feedback": spec_msg},
        "structure": {"score": struct_score, "weight": 0.20, "feedback": struct_msg},
        "actionability": {"score": act_score, "weight": 0.20, "feedback": act_msg},
        "safety": {"score": safety_score, "weight": 0.15, "feedback": safety_msg},
    }

    feedback = f"Quality Grade {grade} ({overall}%). {readiness}."

    return {
        "overall": overall,
        "grade": grade,
        "readiness": readiness,
        "feedback": feedback,
        "breakdown": breakdown,
    }
