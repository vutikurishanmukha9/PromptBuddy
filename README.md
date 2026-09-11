# PromptBuddy Studio - Enterprise Prompt & Skill Engineering

> **Version:** 4.2.0  
> **Tech Stack:** React 18, Vite 4, Tailwind CSS, FastAPI, Uvicorn, Pydantic v2  
> **Catalog:** 496 Production Domain Skills Across 15 Enterprise Categories  
> **Frameworks:** 22 Industrial Prompt Engineering Frameworks

**PromptBuddy** is an enterprise-grade **Prompt & Skill Engineering Studio**. It solves the single largest failure mode in production Generative AI: **LLM Output Degradation ("AI Slop")** caused by vague, under-constrained, hallucination-prone prompts and unstructured instructions.

PromptBuddy sits between raw human intention and AI execution. It systematically transforms fuzzy, single-sentence prompts into mathematically structured, defensively hardened, and model-tailored instructions. Furthermore, it compiles these instructions into standardized **Agent Skills (`SKILL.md`)** and production SDK code.

---

## Key Capabilities

### 1. 496-Skill Enterprise Domain Catalog
Browse, search, and import from **496 specialized domain skills** across 15 enterprise categories:
- **Cloud & Infra (113)**: Google Cloud, AWS, Azure, Kubernetes, Terraform, Alerting Policies.
- **Agentic Prompts (72)**: Subagent-Driven Development, Superpowers Discipline, Planning architectures, reflection loops, orchestration, tool contracts.
- **Backend (59)**: API & Interface Design, Deprecation & Migration, FastAPI, ASP.NET Core, Django, Express, Go, Microservices.
- **Workflow (53)**: Spec-Driven Development, Brainstorming, Planning Breakdown, Doubt-Driven Dev, Goal formulation (`define-goal`), ADR decision capture.
- **Developers (50)**: Gemini API Suite, Code Review & Quality, Code Simplification, Context Engineering, Systematic Debugging, Karpathy Clean Code, Claude API.
- **Frontend (42)**: Frontend UI Engineering (Addy Osmani), Performance Optimization, React, Next.js, Vue, Figma 1:1, design systems.
- **DevOps (26)**: Git Worktrees, CI/CD Automation, Git Workflow & Versioning, Shipping & Launch, Docker, Cloudflare Pages/Workers, Render, Vercel.
- **Security (19)**: Security & Hardening, AppSec Threat Modeling (STRIDE/DREAD), language defense guidelines (Python, JS, Go).
- **Data & AI (16)**: Jupyter Notebook formatting (`.ipynb`), RAG pipelines, Vector DB indexing.
- **Testing (15)**: Superpowers TDD, Addy Osmani TDD, Browser Testing with DevTools, Verification Before Completion, Playwright, Pytest, Jest.
- **Ads & Growth (14)**: Google Ads, Meta campaigns, SEO metadata, conversion rate optimization.
- **Mobile (9)**: Flutter, React Native, Swift iOS, Android Jetpack Compose.
- **Documents & Office (5)**: Official Anthropic document engines: Word (`docx`), PDF (`pdf`), Slides (`pptx`), Excel (`xlsx`), Co-authoring (`doc-coauthoring`).
- **Analytics (2) & Identity (1)**: BI metrics, telemetry pipelines, OAuth2/OIDC/SSO authentication.

### 2. Built-in Operational Safety Tiers
Every skill in PromptBuddy is classified with an explicit operational safety tier:
- **`Tier R (Read-Only)`** *(Emerald)*: Passive audits and code inspections requiring zero write permissions.
- **`Tier M (Mutation)`** *(Amber)*: Modifies local worktrees, edits files, or generates code; requires human review.
- **`Tier D (Destructive)`** *(Rose)*: External infrastructure changes or resource deletions requiring explicit multi-step authorization.

### 3. Automated Redteam Security Scanner (6 Adversarial Vectors)
Evaluates prompt robustness against 6 critical vulnerability classes:
1. Direct Prompt Injection & Instruction Overrides
2. Roleplay & Persona Hijacking Jailbreaks
3. Delimiter & Syntax Escapes (`</system>`, `"""`)
4. System Prompt & Secret Exfiltration
5. Tool Escalation & Unauthorized Command Execution
6. Sensitive Data Exfiltration via Beacons
- **1-Click Hardening**: Instantly injects defensive boundaries, delimiter encapsulation, and refusal guardrails.

### 4. Feedback Descent Evolution & 4 Architectural Variants
- **Feedback Descent**: Iteratively refines prompts across 3 stages against an optional user critique, charting a visual ascent trajectory (e.g., `72%` → `85%` → `94%`).
- **Multi-Strategy Variants**: Generates 4 distinct structural versions of any prompt on demand:
  1. *Minimalist High-Density* (token-optimized)
  2. *Strict Defense Guardrails* (negative constraints)
  3. *Few-Shot Exemplars* (input/output pairs)
  4. *Chain-of-Thought* (step-by-step reasoning)

### 5. Universal SDK Code Compilers & Exporters
Export directly to:
- **Microsoft Guidance (`.py`)**: Constrained generation script.
- **Outlines Grammar (`.py`)**: Regex-guided and Lark grammar.
- **DSPy Signature (`.py`)**: Declarative prompt module definition.
- **Pydantic Model (`.py`)**: Python `BaseModel` schema with type validations.
- **JSON Schema (`.json`)**: Universal JSON schema for OpenAI Structured Outputs.
- **Promptfoo Config (`.yaml`)**: CI/CD evaluation matrix with assertions.
- **Langfuse JSON (`.json`)**: Observability-tagged prompt payload.

### 6. Anti-AI-Slop Clean Code Presets
Pre-configured 1-click engineering standards:
- **`Karpathy Clean Code`**: Andrej Karpathy's 4 surgical rules (*Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution*).
- **`Measurable Goal & Spec Definer`**: Quantifiable binary and threshold targets (*p95 latency, exact test passes, scope boundaries*).
- **`AppSec Threat Modeling`**: Evidence-grounded STRIDE/DREAD abuse paths with Mermaid diagrams.

---

## Architecture

```
PromptBuddy/
├── backend/
│   ├── app/
│   │   ├── api/routes/       # Endpoints: /skills, /prompts, /eval, /compile, /observability
│   │   ├── engines/          # Engines: Catalog, Evolution, Redteam, Compilers, Assertions
│   │   ├── schemas/          # Pydantic v2 data models
│   │   └── core/             # Configuration and logging
│   ├── skills-catalog/       # 454 Skills specifications & index.json
│   ├── main.py               # FastAPI application entrypoint
│   └── test_api.py           # 91 automated pytest regression tests (100% passing)
├── frontend/
│   ├── src/
│   │   ├── components/       # Workbench, Inspector, Catalog, Presets, Palette
│   │   ├── utils/            # api.js client, presets.js, frameworks.js, exporters.js
│   │   └── App.jsx           # Main Studio shell
│   └── test_utils.js         # Frontend utility test suite (60+ assertions)
├── Dockerfile                # Multi-stage container build
├── docker-compose.yml        # Multi-service staging orchestration
├── render.yaml               # Render Cloud multi-service blueprint
└── vercel.json               # Vercel Edge SPA deployment
```

---

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate

# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 5000
```

Run tests:
```bash
python -m pytest
# 91 passed in ~4s
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Run tests & build:
```bash
node test_utils.js
npm run build
```

---

## Verification & Quality Bar

| Suite | Status | Metric |
| :--- | :---: | :--- |
| **Backend Pytest** | ✅ PASS | 91/91 tests (100% pass rate) |
| **Frontend Tests** | ✅ PASS | 60+ assertions passed (`test_utils.js`) |
| **Production Build** | ✅ PASS | Zero errors in `npm run build` (Vite) |
| **Catalog Integrity** | ✅ PASS | 454 skills verified with JSON schema |
| **Security Audit** | ✅ PASS | 6 attack vectors validated |
| **Deployment Ready** | ✅ PASS | Docker, Vercel, Render configs tested |

---

*PromptBuddy Studio — Built for Precision, Security, and Anti-AI-Slop Engineering.*
