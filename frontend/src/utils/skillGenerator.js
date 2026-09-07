/**
 * AI IDE Skill Generator & Formatter
 * Converts prompts or task specifications into standardized SKILL.md documents
 * compatible with modern AI IDEs (Google Antigravity, Cursor, Claude Code, Windsurf).
 */

export const extractSkillMetadata = (content) => {
  if (!content) return { name: 'custom-skill', description: '', version: '1.0.0' };

  const frontmatterMatch = content.match(/^---\s*([\s\S]*?)\s*---/);
  if (!frontmatterMatch) {
    return { name: 'custom-agent-skill', description: 'Domain execution skill', version: '1.0.0' };
  }

  const yamlBlock = frontmatterMatch[1];
  const nameMatch = yamlBlock.match(/name:\s*([^\n\r]+)/);
  const descMatch = yamlBlock.match(/description:\s*["']?([^"'\n\r]+)["']?/);
  const verMatch = yamlBlock.match(/version:\s*([^\n\r]+)/);

  return {
    name: nameMatch ? nameMatch[1].trim() : 'custom-agent-skill',
    description: descMatch ? descMatch[1].trim() : '',
    version: verMatch ? verMatch[1].trim() : '1.0.0',
  };
};

export const getInstallationGuides = (skillName = 'custom-skill') => {
  const cleanName = skillName.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

  return [
    {
      id: 'antigravity',
      ide: 'Google Antigravity',
      path: `.agents/skills/${cleanName}/SKILL.md`,
      scope: 'Workspace Customization Root',
      instruction: 'Place in workspace .agents/skills/ directory or ~/.gemini/antigravity-ide/skills/',
      bashCmd: `mkdir -p .agents/skills/${cleanName} && cp SKILL.md .agents/skills/${cleanName}/SKILL.md`,
      powershellCmd: `New-Item -ItemType Directory -Force .agents/skills/${cleanName}; Copy-Item SKILL.md .agents/skills/${cleanName}\\SKILL.md`,
    },
    {
      id: 'cursor',
      ide: 'Cursor',
      path: `.cursor/rules/${cleanName}.mdc`,
      scope: 'Project Rules',
      instruction: 'Add as a project rule inside .cursor/rules/ for automatic agent invocation',
      bashCmd: `mkdir -p .cursor/rules && cp SKILL.md .cursor/rules/${cleanName}.mdc`,
      powershellCmd: `New-Item -ItemType Directory -Force .cursor/rules; Copy-Item SKILL.md .cursor/rules\\${cleanName}.mdc`,
    },
    {
      id: 'claude',
      ide: 'Claude Code',
      path: `.claude/skills/${cleanName}/SKILL.md`,
      scope: 'Agent Directory',
      instruction: 'Place inside .claude/skills/ directory in your project root',
      bashCmd: `mkdir -p .claude/skills/${cleanName} && cp SKILL.md .claude/skills/${cleanName}/SKILL.md`,
      powershellCmd: `New-Item -ItemType Directory -Force .claude/skills/${cleanName}; Copy-Item SKILL.md .claude/skills/${cleanName}\\SKILL.md`,
    },
    {
      id: 'windsurf',
      ide: 'Windsurf / Cascade',
      path: `.windsurfrules`,
      scope: 'Workspace Root',
      instruction: 'Append to or create .windsurfrules in your repository root',
      bashCmd: `cat SKILL.md >> .windsurfrules`,
      powershellCmd: `Get-Content SKILL.md | Add-Content .windsurfrules`,
    },
  ];
};

export const generateSkillMarkdown = (basePrompt, optimizedPrompt, frameworkLabel = 'AI Skill') => {
  // If the optimized prompt already contains YAML frontmatter, return it directly
  if (optimizedPrompt && optimizedPrompt.trim().startsWith('---')) {
    return optimizedPrompt.trim();
  }

  // Derive a slug from basePrompt
  const slug = basePrompt
    ? basePrompt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 32) || 'custom-agent-skill'
    : 'custom-agent-skill';

  const title = basePrompt
    ? basePrompt.slice(0, 60).replace(/\n/g, ' ')
    : 'Custom Agent Skill';

  // Parse sections from optimizedPrompt if available
  const cleanPrompt = optimizedPrompt || basePrompt || 'Execute the requested domain workflow';

  return `---
name: ${slug}
description: "Activates when the user requests to: ${title.replace(/"/g, "'")}. Use for automated execution, verification, and code generation."
version: 1.0.0
---

# ${title}

## When to Activate
- When the user asks to: "${title}"
- Keywords & Triggers: \`${slug.split('-').slice(0, 4).join('`, `')}\`
- File associations: Active project files, tests, and documentation

## Core Workflow & Procedure
1. **Analyze Requirements & Inspect Codebase**
   - Inspect existing architecture, configuration files, and dependencies.
   - Verify non-breaking conditions before making structural changes.

2. **Execute Primary Task**
   - Apply the domain specification below:
${cleanPrompt.split('\n').map(line => `     ${line}`).join('\n')}

3. **Verify & Validate Changes**
   - Run unit/integration tests or lint validations.
   - Confirm zero regression errors across touched files.

## Safety & Permission Boundaries
- **Tier R (Read-Only)**: File views, directory listing, searches, log checks. Autonomous execution allowed.
- **Tier M (Modify Worktree)**: Code edits, file creation, local tests, build runs. Allowed within working directory.
- **Tier D (Destructive / External)**: Deletions, git push, production deployments, credential modifications. Explicit user approval required.

## Operational Guardrails & Constraints
- **Preserve Conventions**: Follow existing repository naming and code conventions.
- **Safety First**: Never perform irreversible or destructive actions without confirmation.
- **Strict Verification**: Ensure all code changes compile and tests pass before concluding.

## Verification Checklist
- [ ] Requirements fully inspected and validated against project context
- [ ] Task executed according to specification
- [ ] Unit tests and build pass with 0 errors
- [ ] Documentation updated to reflect changes
`;
};

export const downloadSkillFile = (content, filename = 'SKILL.md') => {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
