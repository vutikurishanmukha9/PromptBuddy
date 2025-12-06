# PromptBuddy

**AI-Powered Prompt Template Generator** - A full-stack application that helps you create optimized, intent-based prompts using 21 specialized prompt structure types.

---

## Overview

PromptBuddy transforms your basic prompts into structured, AI-optimized templates. Unlike traditional prompt generators, PromptBuddy uses intelligent template matching to select the best prompt structure for your use case - all without requiring external API keys.

---

## Features

### Core Functionality

- **21 Prompt Structure Types** - Organized across 7 categories:
  - **Basic**: Instruction, Contextual, Role-Based
  - **Shot-Based**: Zero-Shot, One-Shot, Few-Shot
  - **Reasoning**: Chain-of-Thought, Self-Consistency, Socratic
  - **Structured**: Template, Goal-Oriented, Constraint-Based
  - **Advanced**: Meta-Prompt, Refinement, Evaluation
  - **Collaborative**: Multi-Agent, Delegation, Planning
  - **Creative**: Creative, Transformation, RAG

- **Smart Prompt Suggestions** - Keyword analysis recommends the best prompt types based on your input

- **Prompt Quality Score** - 5-dimension analysis (Length, Specificity, Structure, Actionability, Clarity) with letter grades

### Productivity Features

- **Prompt Library** - Save and organize your prompts with search functionality
- **History Tracking** - Access your last 50 generated prompts
- **Industry Presets** - Pre-configured prompts for 6 domains:
  - Software Development
  - Marketing
  - Education
  - Business
  - Legal
  - Creative Writing

- **Export Options** - Download prompts in Markdown, JSON, or Plain Text format

- **Preview Modes** - View prompts in Default, ChatGPT-style, Claude-style, or Raw format

### User Experience

- **Dark Mode** - Full theme support with persistent preference
- **Keyboard Shortcuts**:
  - `Ctrl+Enter` - Generate prompt
  - `Ctrl+D` - Toggle dark mode
  - `Ctrl+/` - Show shortcuts help
  - `Esc` - Close dialogs

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Tailwind CSS, Vite |
| Backend | Flask, Python |
| Storage | localStorage (client-side) |

---

## Getting Started

### Prerequisites

- Node.js (v16+)
- Python (v3.8+)

### Installation

**1. Clone the Repository**
```bash
git clone https://github.com/your-username/PromptBuddy.git
cd PromptBuddy
```

**2. Backend Setup**
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate      # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
python flask_app.py
```
Backend runs at: http://localhost:5000

**3. Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: http://localhost:3000

---

## API Reference

### POST /generate

Generate an optimized prompt from a base prompt.

**Request:**
```json
{
  "base_prompt": "Create a REST API for user management",
  "intent": "chain_of_thought"
}
```

**Response:**
```json
{
  "original_prompt": "Create a REST API for user management",
  "optimized_prompt": "...(structured prompt template)...",
  "intent": "chain_of_thought",
  "success": true
}
```

---

## Project Structure

```
PromptBuddy/
├── backend/
│   ├── flask_app.py          # Flask server with 21 prompt templates
│   ├── requirements.txt
│   └── venv/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PromptGenerator.jsx
│   │   │   ├── PromptOutput.jsx
│   │   │   ├── PromptLibrary.jsx
│   │   │   ├── PresetSelector.jsx
│   │   │   ├── ShortcutsHelp.jsx
│   │   │   ├── ThemeToggle.jsx
│   │   │   └── VersionHistory.jsx
│   │   ├── utils/
│   │   │   ├── storage.js        # localStorage persistence
│   │   │   ├── exporters.js      # Export functionality
│   │   │   ├── suggestions.js    # Smart suggestions engine
│   │   │   ├── qualityScorer.js  # Quality scoring algorithm
│   │   │   └── presets.js        # Industry presets data
│   │   ├── App.jsx
│   │   └── index.css
│   └── package.json
└── README.md
```

---

## Roadmap

### Coming Soon

- **Prompt Variables** - Support for `{{variable}}` placeholder syntax with dynamic input forms
- **Workflow Builder** - Chain multiple prompts together for complex multi-step workflows
- **Version Comparison** - Side-by-side diff view for prompt versions

### Under Consideration

- Cloud sync for prompt library
- Team collaboration features
- Custom prompt template creation
- API integration with LLM providers

---

## License

This project is licensed under the MIT License.

---

## Author

**Shanmukha Vutikuri**

Building AI tools and platforms for enhanced productivity.