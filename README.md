# PromptBuddy - AI-Powered Prompt Optimizer

> **Version:** 4.1.0  
> **Tech Stack:** FastAPI, OpenRouter AI (Server-Sent Events), React 18, Vite 4, Tailwind CSS

**PromptBuddy** is an industrial-grade AI prompt optimization platform. It translates informal, messy human input into structured, high-performing prompts formatted for modern Large Language Models (LLMs) such as ChatGPT, Claude, Gemini, and DeepSeek.

---

## Features

- **Real-Time Token Streaming (SSE)**: Streams optimized prompts token-by-token live as they generate.
- **22 Prompt Frameworks**: Categorized into *Essentials* (RTF, RACE, APE, TAG, ERA), *Structured* (RISEN, COAST, TRACE, CRISPE, CLEAR), *Persuasion* (PASTOR, BAB, AIDA, PEEL), *Problem-Solving* (SCQA, GROW, STAR, PAR, CARE), and *Analysis* (SMART, ICE, 5W1H).
- **Interactive LLM Test Playground**: Execute your newly optimized prompt live against OpenRouter with sample test inputs directly inside PromptBuddy.
- **Side-by-Side Visual Diff Viewer**: Inspect structural improvements, role assignments, and added constraints side-by-side.
- **Dynamic Variable Engine (`{{variable}}`)**: Automatically parses `{{variable_name}}` placeholders in prompt text and renders interactive form fields for live substitution.
- **Token Count & Cost Estimator**: Calculates estimated token counts and API execution costs across top model families.
- **Smart Framework Suggestion Engine**: Real-time keyword matching algorithm recommending the top 3 frameworks for any prompt.
- **Quality Scoring Matrix**: Multi-dimensional quality evaluation (Length, Specificity, Structure, Actionability, Clarity, Completeness) with grades (A+ to F).
- **Library & Folder Management**: Save prompts, organize by category/folder, and filter history.
- **Full Library JSON Backup & Restore**: One-click JSON backup export and file restore onto any device.
- **Multi-Format Exporters**: Instant downloads in Markdown (`.md`), JSON (`.json`), and Plain Text (`.txt`).
- **Automated Pytest Backend Suite**: 100% test coverage over API endpoints.

---

## Architecture & Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite 4, Tailwind CSS, Tokenized CSS Design System |
| **Backend** | FastAPI, Uvicorn, Async HTTPX, Pydantic v2, Pytest |
| **AI Provider** | OpenRouter API (Server-Sent Events streaming & dynamic models) |
| **Storage** | Resilience-wrapped browser `localStorage` + JSON Import/Export |

---

## Project Structure

```text
PromptBuddy/
  backend/      # FastAPI server, SSE streaming engine & Pytest suite
  frontend/     # React 18, Vite & Tailwind CSS workbench UI
  railway.json  # Railway deployment config
  render.yaml   # Render web service specification
```

---

## Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
CORS_ALLOW_ORIGINS=http://localhost:3000
OPENROUTER_TIMEOUT_SECONDS=60
MAX_PROMPT_LENGTH=8000
```

Run the FastAPI backend server:

```bash
uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

Run automated backend tests:

```bash
pytest test_api.py
```

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:3000` with API proxying to `http://localhost:5000`.

Optional `.env` configuration:

```env
VITE_API_URL=http://localhost:5000
```

---

## API Reference

### `GET /health`
Returns backend health status, provider readiness, and max prompt length limit.

### `GET /models`
Returns available LLM models (from OpenRouter live API or curated fallback tier) with context length and provider metadata.

### `GET /intents`
Returns all 22 prompt framework metadata definitions and categories.

### `POST /generate/stream` (SSE Token Streaming)
Streams prompt optimization tokens in real time.

**Request:**
```json
{
  "base_prompt": "Create a REST API for user management with {{database_type}}",
  "intent": "rtf",
  "model": "openai/gpt-4o-mini"
}
```

**Response Stream (`text/event-stream`):**
```text
data: {"token": "ROLE: ", "request_id": "...", "model": "GPT-4o Mini"}
data: {"token": "Senior ", "request_id": "...", "model": "GPT-4o Mini"}
...
data: {"done": true, "request_id": "...", "model": "GPT-4o Mini", "latency_ms": 1120}
```

### `POST /test-prompt`
Executes an optimized prompt live against an LLM with sample test input in the Playground.

**Request:**
```json
{
  "prompt": "ROLE: Senior Backend Engineer...\nTASK: Write a user login route...",
  "user_input": "Use FastAPI and JWT tokens"
}
```

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl` + `Enter` | Generate / Optimize prompt |
| `Ctrl` + `Shift` + `C` | Copy output to clipboard |
| `Ctrl` + `S` | Save prompt to local library |
| `Ctrl` + `E` | Export prompt as Markdown file |
| `Ctrl` + `D` | Toggle Light / Dark mode |
| `Ctrl` + `/` | Open shortcuts help modal |
| `Esc` | Close open modals |

---

## Deployment

- **Railway**: Deploy using the root `railway.json` configuration.
- **Render**: Web service environment configuration in `render.yaml`.
- **Production Server Entrypoint**: `web: uvicorn main:app --host 0.0.0.0 --port $PORT` (configured in `backend/Procfile`).

---

## License

Crafted for AI. Distributed under the MIT License.
