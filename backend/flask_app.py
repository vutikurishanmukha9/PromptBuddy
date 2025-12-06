import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Comprehensive Prompt Structure Templates
# Each type optimizes the user's base prompt using different methodologies
prompt_templates = {
    
    # === BASIC PROMPT TYPES ===
    
    "instruction": '''Based on your request: "{base_prompt}"

Here is a clear, actionable instruction prompt:

**INSTRUCTION:**
[Provide a direct, specific instruction to accomplish the following task]

Task: {base_prompt}

Requirements:
- Be specific about the expected output format
- Include any constraints or limitations
- Specify quality standards
- Define success criteria

Please execute this task step by step, ensuring accuracy and completeness.''',

    "contextual": '''Based on your request: "{base_prompt}"

Here is a context-enriched prompt:

**CONTEXT:**
[Background information and relevant context]

**SITUATION:**
You are working on: {base_prompt}

**ADDITIONAL CONTEXT TO CONSIDER:**
- The target audience and their knowledge level
- The purpose and intended use of the output
- Any relevant domain-specific information
- Time constraints or urgency factors
- Related precedents or examples

**REQUEST:**
Given this context, please provide a comprehensive response that addresses the core need while considering all contextual factors.''',

    "role_based": '''Based on your request: "{base_prompt}"

Here is a role-based expert prompt:

**ASSUME THE ROLE:**
You are a world-class expert in this field with 20+ years of experience. You have:
- Deep technical knowledge
- Practical real-world experience
- Industry recognition and credibility
- A talent for clear communication

**YOUR TASK:**
As this expert, address the following: {base_prompt}

**EXPERT APPROACH:**
- Draw from your extensive experience
- Reference best practices and industry standards
- Anticipate potential pitfalls and address them
- Provide actionable, professional-grade advice

Respond as this expert would, with confidence and depth.''',

    # === SHOT-BASED PROMPTS ===

    "zero_shot": '''Based on your request: "{base_prompt}"

Here is a zero-shot prompt (no examples provided):

**DIRECT TASK:**
{base_prompt}

**INSTRUCTIONS:**
Complete this task using your knowledge and reasoning abilities. No examples are provided - rely on your understanding to deliver the best possible output.

**EXPECTED OUTPUT:**
Provide a complete, well-structured response that fully addresses the request.''',

    "one_shot": '''Based on your request: "{base_prompt}"

Here is a one-shot prompt with a single example:

**TASK:** {base_prompt}

**EXAMPLE:**
Input: [Similar example input]
Output: [High-quality example output demonstrating the expected format and quality]

**YOUR TURN:**
Following the pattern shown in the example above, now complete the task for: {base_prompt}

Maintain the same quality, format, and attention to detail as the example.''',

    "few_shot": '''Based on your request: "{base_prompt}"

Here is a few-shot prompt with multiple examples:

**TASK:** {base_prompt}

**EXAMPLE 1:**
Input: [First example input]
Output: [First example output]

**EXAMPLE 2:**
Input: [Second example input]
Output: [Second example output]

**EXAMPLE 3:**
Input: [Third example input]
Output: [Third example output]

**PATTERN OBSERVED:**
- [Key pattern 1]
- [Key pattern 2]
- [Key pattern 3]

**YOUR TURN:**
Following the patterns demonstrated above, now complete: {base_prompt}''',

    # === REASONING PROMPTS ===

    "chain_of_thought": '''Based on your request: "{base_prompt}"

Here is a Chain-of-Thought (CoT) prompt:

**PROBLEM:** {base_prompt}

**THINK STEP BY STEP:**

Step 1: [Understand the core problem]
- What exactly is being asked?
- What are the key components?

Step 2: [Break down into sub-problems]
- What smaller parts make up this challenge?
- What dependencies exist?

Step 3: [Analyze each component]
- Work through each part systematically
- Show your reasoning at each stage

Step 4: [Synthesize the solution]
- Combine insights from previous steps
- Verify the solution makes sense

Step 5: [Validate and refine]
- Check for errors or gaps
- Optimize the final answer

**FINAL ANSWER:**
[Present the complete, reasoned solution]''',

    "self_consistency": '''Based on your request: "{base_prompt}"

Here is a Self-Consistency prompt (multiple reasoning paths):

**PROBLEM:** {base_prompt}

**APPROACH 1: [First reasoning method]**
- [Step-by-step reasoning using approach 1]
- Conclusion from Approach 1: [Result]

**APPROACH 2: [Second reasoning method]**
- [Step-by-step reasoning using approach 2]
- Conclusion from Approach 2: [Result]

**APPROACH 3: [Third reasoning method]**
- [Step-by-step reasoning using approach 3]
- Conclusion from Approach 3: [Result]

**CONSENSUS ANALYSIS:**
- Compare results from all approaches
- Identify the most consistent answer
- Note any discrepancies and their causes

**FINAL VERIFIED ANSWER:**
[The answer that appears most consistently across approaches]''',

    # === ITERATIVE & REFINEMENT ===

    "refinement": '''Based on your request: "{base_prompt}"

Here is an Iterative Refinement prompt:

**INITIAL REQUEST:** {base_prompt}

**ITERATION 1 - FIRST DRAFT:**
[Generate initial response]

**SELF-CRITIQUE:**
- What could be improved?
- What's missing?
- What's unclear?

**ITERATION 2 - REFINED VERSION:**
[Improved version addressing the critique]

**ADDITIONAL REFINEMENTS:**
- Enhance clarity and precision
- Add missing details
- Optimize structure and flow

**FINAL POLISHED OUTPUT:**
[The refined, polished final version]''',

    # === GOAL & CONSTRAINT PROMPTS ===

    "goal_oriented": '''Based on your request: "{base_prompt}"

Here is a Goal-Oriented prompt:

**PRIMARY GOAL:** {base_prompt}

**SUCCESS METRICS:**
- How will we measure success?
- What does "done" look like?
- What quality standards apply?

**SUB-GOALS:**
1. [First milestone toward the goal]
2. [Second milestone]
3. [Third milestone]

**ACTION PLAN:**
- Specific steps to achieve each sub-goal
- Resources needed
- Potential obstacles and solutions

**DELIVERABLE:**
Provide output that clearly achieves the stated goal with measurable results.''',

    "constraint_based": '''Based on your request: "{base_prompt}"

Here is a Constraint-Based prompt:

**OBJECTIVE:** {base_prompt}

**CONSTRAINTS TO FOLLOW:**
1. **Format:** [Specific format requirements]
2. **Length:** [Word/character limits]
3. **Tone:** [Required tone/style]
4. **Scope:** [What to include/exclude]
5. **Technical:** [Technical limitations]

**MUST INCLUDE:**
- [Required element 1]
- [Required element 2]

**MUST AVOID:**
- [Prohibited element 1]
- [Prohibited element 2]

**OUTPUT:**
Provide a response that strictly adheres to all constraints while fully addressing the objective.''',

    # === STRUCTURED PROMPTS ===

    "template": '''Based on your request: "{base_prompt}"

Here is a Template/Schema prompt:

**TASK:** {base_prompt}

**USE THIS TEMPLATE:**

```
## [Title]

### Overview
[Brief summary]

### Details
- **Point 1:** [Explanation]
- **Point 2:** [Explanation]
- **Point 3:** [Explanation]

### Key Findings
1. [Finding 1]
2. [Finding 2]
3. [Finding 3]

### Recommendations
- [Recommendation 1]
- [Recommendation 2]

### Conclusion
[Final thoughts]
```

Fill in this template completely for: {base_prompt}''',

    "meta_prompt": '''Based on your request: "{base_prompt}"

Here is a Meta-Prompt (a prompt about prompts):

**OBJECTIVE:** Create the optimal prompt for: {base_prompt}

**PROMPT ENGINEERING ANALYSIS:**
1. What type of prompt would work best for this task?
2. What context is essential to include?
3. What examples would be helpful?
4. What constraints should be specified?
5. What output format is ideal?

**OPTIMIZED PROMPT DESIGN:**
[Generate the ideal prompt that would produce the best results for this task]

**PROMPT QUALITY CHECKLIST:**
- ✓ Clear and specific
- ✓ Properly scoped
- ✓ Contains necessary context
- ✓ Specifies output format
- ✓ Includes success criteria''',

    # === QUESTIONING & ANALYSIS ===

    "socratic": '''Based on your request: "{base_prompt}"

Here is a Socratic prompt (guided questioning):

**TOPIC TO EXPLORE:** {base_prompt}

**GUIDING QUESTIONS:**

1. **Foundational:** What is the core concept here? How would you define it?

2. **Clarifying:** Can you explain that in simpler terms? What do you mean by...?

3. **Probing:** Why is this important? What are the underlying causes?

4. **Perspective:** How would someone with a different viewpoint see this?

5. **Implications:** What are the consequences of this? What follows from this logic?

6. **Evidence:** What evidence supports this? How do we know this is true?

7. **Synthesis:** How does this connect to other concepts? What's the bigger picture?

**DISCOVERY:**
Through answering these questions, arrive at a deeper understanding of: {base_prompt}''',

    "evaluation": '''Based on your request: "{base_prompt}"

Here is an Evaluation prompt:

**SUBJECT TO EVALUATE:** {base_prompt}

**EVALUATION CRITERIA:**

| Criterion | Weight | Score (1-10) | Notes |
|-----------|--------|--------------|-------|
| Quality | 25% | [?] | [Assessment] |
| Completeness | 25% | [?] | [Assessment] |
| Accuracy | 20% | [?] | [Assessment] |
| Clarity | 15% | [?] | [Assessment] |
| Practicality | 15% | [?] | [Assessment] |

**STRENGTHS:**
- [Strength 1]
- [Strength 2]

**WEAKNESSES:**
- [Weakness 1]  
- [Weakness 2]

**RECOMMENDATIONS:**
- [Improvement 1]
- [Improvement 2]

**OVERALL SCORE:** [X/10]
**VERDICT:** [Pass/Fail/Needs Improvement]''',

    # === ADVANCED PROMPT TYPES ===

    "multi_agent": '''Based on your request: "{base_prompt}"

Here is a Multi-Agent prompt (AI-as-team roles):

**PROJECT:** {base_prompt}

**TEAM ROLES:**

🎯 **PROJECT MANAGER:**
"Let me coordinate this effort and ensure we meet our objectives..."

💡 **CREATIVE DIRECTOR:**
"From a creative standpoint, I suggest..."

🔧 **TECHNICAL LEAD:**
"The technical implementation should consider..."

📊 **ANALYST:**
"Based on data and research, I recommend..."

✅ **QUALITY ASSURANCE:**
"To ensure quality, we must verify..."

**TEAM DISCUSSION:**
[Each role contributes their expertise]

**CONSENSUS DECISION:**
[Synthesized recommendation from all perspectives]''',

    "delegation": '''Based on your request: "{base_prompt}"

Here is a Delegation prompt (subtask breakdown):

**MAIN TASK:** {base_prompt}

**SUBTASK BREAKDOWN:**

📦 **SUBTASK 1:** [First component]
- Assigned to: [Role/Agent]
- Deliverable: [Expected output]
- Deadline: [Timeframe]

📦 **SUBTASK 2:** [Second component]
- Assigned to: [Role/Agent]
- Deliverable: [Expected output]
- Deadline: [Timeframe]

📦 **SUBTASK 3:** [Third component]
- Assigned to: [Role/Agent]
- Deliverable: [Expected output]
- Deadline: [Timeframe]

**DEPENDENCIES:**
- Subtask 2 depends on Subtask 1
- [Other dependencies]

**INTEGRATION PLAN:**
How to combine all subtask outputs into final deliverable.''',

    "planning": '''Based on your request: "{base_prompt}"

Here is a Planning prompt (strategy-first structure):

**OBJECTIVE:** {base_prompt}

**PHASE 1: DISCOVERY**
- Current state assessment
- Resource inventory
- Constraint identification

**PHASE 2: STRATEGY**
- Goal definition (SMART format)
- Approach selection
- Risk assessment

**PHASE 3: PLANNING**
- Detailed action items
- Timeline with milestones
- Resource allocation

**PHASE 4: EXECUTION ROADMAP**
| Week | Action Items | Owner | Status |
|------|-------------|-------|--------|
| 1 | [Tasks] | [Who] | [ ] |
| 2 | [Tasks] | [Who] | [ ] |

**PHASE 5: MONITORING**
- KPIs to track
- Review checkpoints
- Contingency plans''',

    "transformation": '''Based on your request: "{base_prompt}"

Here is a Transformation prompt (convert X → Y):

**TRANSFORMATION TASK:** {base_prompt}

**SOURCE INPUT (X):**
[Original content/format to transform]

**TARGET OUTPUT (Y):**
[Desired content/format]

**TRANSFORMATION RULES:**
1. [Rule 1: How to convert element A]
2. [Rule 2: How to handle element B]
3. [Rule 3: Special cases]

**PROCESS:**
1. Parse the input
2. Apply transformation rules
3. Validate the output
4. Format appropriately

**TRANSFORMED OUTPUT:**
[The converted result in target format]

**VERIFICATION:**
Confirm the transformation preserves essential information while achieving the target format.''',

    "creative": '''Based on your request: "{base_prompt}"

Here is a Creative prompt (story, art, ideation):

**CREATIVE BRIEF:** {base_prompt}

**INSPIRATION SEEDS:**
- Theme: [Core theme to explore]
- Mood: [Emotional tone]
- Style: [Artistic/writing style]

**CREATIVE CONSTRAINTS (for focus):**
- [Constraint that sparks creativity]
- [Interesting limitation to work within]

**IDEATION:**
💡 Idea 1: [Bold concept]
💡 Idea 2: [Unexpected angle]
💡 Idea 3: [Fusion of concepts]

**DEVELOPMENT:**
[Expand on the strongest idea with vivid details, unique elements, and creative flourishes]

**CREATIVE OUTPUT:**
[The final creative piece - story, concept, design, etc.]''',

    "retrieval_augmented": '''Based on your request: "{base_prompt}"

Here is a Retrieval-Augmented prompt (with external data):

**QUERY:** {base_prompt}

**KNOWLEDGE RETRIEVAL:**
[Instructions to search and retrieve relevant information]

**SOURCES TO CONSULT:**
1. [Primary authoritative source]
2. [Secondary reference]
3. [Recent updates/news]

**RETRIEVED INFORMATION:**
> Source 1: "[Relevant excerpt]"
> Source 2: "[Relevant excerpt]"

**SYNTHESIS:**
Combining the retrieved information with reasoning:
- [Key insight 1]
- [Key insight 2]
- [Key insight 3]

**GROUNDED RESPONSE:**
[Answer that is grounded in the retrieved information, with citations]

**SOURCES CITED:**
[1] [Source reference]
[2] [Source reference]'''
}

def construct_optimized_prompt(base_prompt, prompt_type):
    """Construct an optimized prompt based on user input and prompt type."""
    template = prompt_templates.get(prompt_type, prompt_templates["instruction"])
    return template.format(base_prompt=base_prompt)

@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()
    base_prompt = data.get("base_prompt", "").strip()
    prompt_type = data.get("intent", "instruction").strip()

    if not base_prompt:
        return jsonify({"error": "base_prompt is required"}), 400

    # Construct the optimized prompt
    optimized_prompt = construct_optimized_prompt(base_prompt, prompt_type)

    logger.info(f"Generated prompt using type: {prompt_type}")

    return jsonify({
        "original_prompt": base_prompt,
        "intent": prompt_type,
        "optimized_prompt": optimized_prompt,
        "success": True
    })

@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "message": "Welcome to the PromptBuddy API 🚀",
        "status": "online",
        "version": "3.0",
        "available_types": list(prompt_templates.keys())
    }), 200

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
