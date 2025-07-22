import os
import random
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import openai
import requests

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize LLM API keys
llm_apis = {
    "openai": os.getenv("OPENAI_API_KEY"),
    "gemini": os.getenv("GEMINI_API_KEY"),
    "claude": os.getenv("CLAUDE_API_KEY"),
    "cohere": os.getenv("COHERE_API_KEY")
}

# Templates
intent_templates = {
    "image_generation": {
        "prefix": "Create a detailed image prompt for AI generation: ",
        "suffix": "\n\nAdditional requirements:\n- Specify artistic style, lighting, composition\n- Include technical details like camera angle, resolution preferences\n- Mention color palette and mood\n- Be specific about subject details and environment"
    },
    "code_generation": {
        "prefix": "Generate clean, well-documented code for: ",
        "suffix": "\n\nRequirements:\n- Include proper error handling\n- Add comprehensive comments\n- Follow best practices and conventions\n- Provide usage examples\n- Consider edge cases and validation"
    },
    "research": {
        "prefix": "Conduct thorough research on: ",
        "suffix": "\n\nResearch guidelines:\n- Provide credible sources and citations\n- Include multiple perspectives\n- Analyze current trends and developments\n- Present factual, unbiased information\n- Structure findings logically"
    },
    "general_knowledge": {
        "prefix": "Provide comprehensive information about: ",
        "suffix": "\n\nResponse format:\n- Start with a clear definition or overview\n- Include relevant examples and context\n- Explain key concepts and relationships\n- Use accessible language\n- Provide practical applications where relevant"
    },
    "latest_info": {
        "prefix": "Find the most current information about: ",
        "suffix": "\n\nInformation requirements:\n- Focus on recent developments and updates\n- Include dates and timeline context\n- Verify information from multiple sources\n- Highlight what's new or changed\n- Provide context for recent events"
    }
}

# Refine prompt
def refine_prompt(base_prompt, intent):
    template = intent_templates.get(intent)
    if not template:
        return base_prompt
    return f"{template['prefix']}{base_prompt}{template['suffix']}"

# Randomly choose and route to one LLM
def call_random_llm(prompt):
    available_llms = [key for key, val in llm_apis.items() if val]
    if not available_llms:
        return {"error": "No LLM APIs configured or available."}

    selected_llm = random.choice(available_llms)

    if selected_llm == "openai":
        openai.api_key = llm_apis["openai"]
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        return response.choices[0].message.content

    elif selected_llm == "gemini":
        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        params = {"key": llm_apis["gemini"]}
        response = requests.post(url, json=payload, headers=headers, params=params)
        return response.json()['candidates'][0]['content']['parts'][0]['text']

    elif selected_llm == "claude":
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": llm_apis["claude"],
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }
        data = {
            "model": "claude-3-opus-20240229",
            "max_tokens": 500,
            "messages": [{"role": "user", "content": prompt}]
        }
        response = requests.post(url, headers=headers, json=data)
        return response.json()['content'][0]['text']

    elif selected_llm == "cohere":
        url = "https://api.cohere.ai/v1/chat"
        headers = {
            "Authorization": f"Bearer {llm_apis['cohere']}",
            "Content-Type": "application/json"
        }
        data = {
            "message": prompt,
            "model": "command-r-plus"
        }
        response = requests.post(url, headers=headers, json=data)
        return response.json()['text']

    return "Error: No valid LLM handler."

# Main endpoint
@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()
    base_prompt = data.get("base_prompt", "").strip()
    intent = data.get("intent", "").strip()

    if not base_prompt or not intent:
        return jsonify({"error": "base_prompt and intent are required"}), 400

    refined = refine_prompt(base_prompt, intent)

    try:
        llm_response = call_random_llm(refined)
        return jsonify({
            "original_prompt": base_prompt,
            "intent": intent,
            "refined_prompt": refined,
            "llm_output": llm_response,
            "success": True
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy"})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
