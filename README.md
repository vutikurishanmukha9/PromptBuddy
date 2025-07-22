🤖 PromptBuddy

PromptBuddy is a full-stack AI-powered platform that helps users generate optimized, intent-based prompts using multiple LLMs including OpenAI, Gemini, Claude, and Cohere. It supports prompt generation for various purposes like Code Generation, Image Generation, Research, and more — with backend logic that randomly selects one of the available APIs to generate a result.

---

## 🌐 Live Demo (Coming Soon)

🚀 Deployed Link: _to be added after deployment_

---

## 📂 Project Structure

```bash
PromptBuddy/
├── backend/           # Flask Backend
│   ├── flask_app.py   # Main Flask App
│   ├── .env           # Stores API keys
│   ├── requirements.txt
│   └── ...
├── frontend/          # React Frontend
│   ├── src/
│   │   ├── App.js
│   │   └── ...
│   └── package.json
├── .gitignore
└── README.md
🔧 Features
✅ Intent-based prompt optimization
✅ Random LLM API selection (OpenAI, Gemini, Claude, Cohere)
✅ Works with free or paid keys
✅ Supports 5 types of generation:
    • Image Generation
    • Code Generation
    • Research
    • General Knowledge
    • Latest Information
✅ Future-ready (add more LLMs easily)
✅ Cross-origin support enabled
✅ Frontend-backend fully connected

🚀 Getting Started
1. Clone the Repository
git clone https://github.com/<your-username>/PromptBuddy.git
cd PromptBuddy
2. Backend Setup (Flask)
⏬ Create a virtual environment
cd backend
python -m venv venv
.\venv\Scripts\activate      # Windows
📦 Install dependencies
pip install -r requirements.txt
🔐 Configure .env

Create a .env file inside /backend and add your API keys:

OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
CLAUDE_API_KEY=your-claude-key
COHERE_API_KEY=your-cohere-key
Note: .env is already ignored via .gitignore

▶️ Run the backend server
flask run --host=0.0.0.0 --port=5000
It will run at: http://localhost:5000

3. Frontend Setup (React)
cd ../frontend
npm install
npm start
It will open at: http://localhost:3000

🔄 API Endpoint
POST /generate
Request JSON:


{
  "base_prompt": "I want a code to build a weather app",
  "intent": "code_generation"
}
Response JSON:


{
  "original_prompt": "...",
  "refined_prompt": "...",
  "model_used": "OpenAI",  // or Claude/Gemini/Cohere
  "success": true
}
📦 Future Features
 Prompt history

 User login & personalization

 Add Anthropic, Mistral, and other APIs

 Deployment on Render/Vercel

🧠 Tech Stack
Frontend	Backend	LLMs	Infra
React	Flask	OpenAI	Node.js
Tailwind	Python	Claude	Git/GitHub
Axios	CORS	Gemini	.env
dotenv	Cohere	

📃 License
This project is licensed under the MIT License.

🙋‍♂️ Author
Shanmukha Vutikuri
💼 Building AI tools & platforms
📬 Feel free to reach out for collaboration!