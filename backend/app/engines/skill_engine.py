"""Agent Skills Engine: Generates, validates, and inspects SKILL.md documents."""

from __future__ import annotations

import re
from typing import Any
import yaml


def build_skill_markdown(task: str, name: str = "", framework: str = "agent_skill") -> tuple[str, dict[str, Any]]:
    clean_name = re.sub(r"[^a-z0-9_-]", "-", (name or task).lower()).strip("-")[:32] or "custom-agent-skill"
    title = task.strip().splitlines()[0][:60] if task.strip() else "Custom Agent Skill"

    frontmatter = {
        "name": clean_name,
        "description": f"Activates when the user requests to: {title}. Use for automated execution, verification, and code generation.",
        "version": "1.0.0",
    }
    yaml_header = yaml.dump(frontmatter, sort_keys=False).strip()

    md = f"""---
{yaml_header}
---

# {title}

## When to Activate
- When the user asks to: "{title}"
- Keywords: `{clean_name.replace('-', '`, `')}`
- Active project files, tests, and configuration

## Safety & Permission Boundaries
- **Tier R (Read-Only)**: File views, directory listing, searches, log checks. Autonomous execution allowed.
- **Tier M (Modify Worktree)**: Code edits, file creation, local tests, build runs. Allowed within working directory.
- **Tier D (Destructive / External)**: Deletions, git push, production deployments, credential modifications. Explicit user approval required.

## Core Workflow & Procedure
1. **Analyze Requirements & Inspect Codebase**
   - Inspect existing architecture, configuration files, and dependencies.
   - Verify non-breaking conditions before making changes.

2. **Execute Primary Task**
   - Apply domain instructions:
{chr(10).join(f'     {line}' for line in task.splitlines())}

3. **Verify & Validate Changes**
   - Run unit/integration tests or lint validations.
   - Confirm zero regression errors across touched files.

## Operational Guardrails & Constraints
- **Preserve Conventions**: Follow existing repository naming and code conventions.
- **Safety First**: Never perform irreversible or destructive actions without confirmation.
- **Strict Verification**: Ensure all code changes compile and tests pass before concluding.

## Verification Checklist
- [ ] Requirements fully inspected and validated against project context
- [ ] Task executed according to specification
- [ ] Unit tests and build pass with 0 errors
- [ ] Documentation updated to reflect changes
"""
    installation_paths = {
        "antigravity": f".agents/skills/{clean_name}/SKILL.md",
        "cursor": f".cursor/rules/{clean_name}.mdc",
        "claude": f".claude/skills/{clean_name}/SKILL.md",
        "windsurf": ".windsurfrules",
    }

    return md, {
        "name": clean_name,
        "version": "1.0.0",
        "description": frontmatter["description"],
        "installation_paths": installation_paths,
    }


def validate_skill_markdown(content: str) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []

    if not content or not content.strip():
        return {
            "valid": False,
            "has_frontmatter": False,
            "has_safety_tiers": False,
            "errors": ["Document is empty"],
            "warnings": [],
        }

    # 1. Frontmatter check
    fm_match = re.match(r"^---\s*\n([\s\S]*?)\n---\s*\n", content)
    has_frontmatter = bool(fm_match)
    meta: dict[str, Any] = {}

    if not has_frontmatter:
        errors.append("Missing YAML frontmatter at the top of the document (must start with '---')")
    else:
        try:
            parsed = yaml.safe_load(fm_match.group(1))
            if isinstance(parsed, dict):
                meta = parsed
            else:
                errors.append("YAML frontmatter must be a key-value mapping")
        except Exception as exc:
            errors.append(f"Invalid YAML frontmatter syntax: {exc}")

    name = meta.get("name")
    if not name:
        errors.append("Frontmatter must declare 'name' field")
    elif not re.match(r"^[a-z0-9_-]+$", str(name)):
        warnings.append(f"Skill name '{name}' should use lowercase alphanumeric characters and hyphens")

    version = meta.get("version")
    if not version:
        warnings.append("Frontmatter missing 'version' field (recommended: '1.0.0')")

    description = meta.get("description")
    if not description:
        warnings.append("Frontmatter missing 'description' field")

    # 2. Safety Tiers check
    has_safety_tiers = bool(re.search(r"Tier\s+[RMD]", content, re.IGNORECASE))
    if not has_safety_tiers:
        warnings.append("Document lacks explicit Safety & Permission Boundaries (Tier R, M, D)")

    # 3. Required sections check
    if not re.search(r"#+\s*When to Activate", content, re.IGNORECASE):
        warnings.append("Recommended section 'When to Activate' is missing")
    if not re.search(r"#+\s*(?:Core\s+)?Workflow", content, re.IGNORECASE):
        warnings.append("Recommended section 'Core Workflow & Procedure' is missing")
    if not re.search(r"#+\s*(?:Verification\s+)?Checklist", content, re.IGNORECASE):
        warnings.append("Recommended section 'Verification Checklist' is missing")

    is_valid = len(errors) == 0

    return {
        "valid": is_valid,
        "name": str(name) if name else None,
        "version": str(version) if version else None,
        "description": str(description) if description else None,
        "has_frontmatter": has_frontmatter,
        "has_safety_tiers": has_safety_tiers,
        "errors": errors,
        "warnings": warnings,
    }
