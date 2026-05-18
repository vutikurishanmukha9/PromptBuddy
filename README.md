# PromptBuddy

AI-powered prompt optimization app built with FastAPI, OpenRouter, React, Vite, and Tailwind CSS.

PromptBuddy turns rough user input into structured, production-ready prompts using prompt frameworks such as RTF, RACE, RISEN, CARE, AIDA, SCQA, SMART, and 5W1H.

## Features

- 22 prompt frameworks grouped by use case
- OpenRouter-backed AI prompt optimization
- Smart framework suggestions from user input
- Prompt quality scoring with actionable dimensions
- Local prompt library and generation history
- Industry presets
- Markdown, JSON, and text exports
- Dark mode and keyboard shortcuts
- FastAPI health and framework metadata endpoints

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS |
| Backend | FastAPI, Uvicorn, Pydantic |
| AI Provider | OpenRouter |
| Storage | Browser localStorage |

## Project Structure

```text
PromptBuddy/
  backend/
    main.py
    requirements.txt
    Procfile
    runtime.txt
  frontend/
    src/
      components/
      utils/
      App.jsx
      main.jsx
      index.css
    package.json
  railway.json
  render.yaml
```

## Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
OPENROUTER_API_KEY=your_openrouter_key
CORS_ALLOW_ORIGINS=http://localhost:3000
OPENROUTER_TIMEOUT_SECONDS=60
MAX_PROMPT_LENGTH=8000
```

Run the API:

```bash
uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Optional frontend env:

```env
VITE_API_URL=http://localhost:5000
```

## API

### `GET /health`

Returns backend health, version, provider configuration status, and prompt length limits.

### `GET /intents`

Returns all prompt framework metadata and categories.

### `POST /generate`

Request:

```json
{
  "base_prompt": "Create a REST API for user management",
  "intent": "rtf"
}
```

Response:

```json
{
  "original_prompt": "Create a REST API for user management",
  "intent": "rtf",
  "optimized_prompt": "...",
  "ai_model": "GPT-4o Mini",
  "request_id": "...",
  "latency_ms": 1200,
  "success": true
}
```

## Keyboard Shortcuts

- `Ctrl+Enter`: generate prompt
- `Ctrl+Shift+C`: copy output
- `Ctrl+S`: save output
- `Ctrl+E`: export output as Markdown
- `Ctrl+/`: toggle shortcut help
- `Ctrl+D`: toggle theme
- `Esc`: close dialogs

## Deployment Notes

- Do not commit `frontend/node_modules`, `backend/venv`, `.env`, `dist`, or build outputs.
- Configure `OPENROUTER_API_KEY` in the deployment platform secret manager.
- Set `CORS_ALLOW_ORIGINS` to the deployed frontend URL in production.
