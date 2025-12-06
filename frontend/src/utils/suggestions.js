// Smart prompt type suggestions based on user input keywords

const keywordMap = {
    // Chain-of-Thought triggers
    chain_of_thought: ['step by step', 'explain', 'how to', 'solve', 'calculate', 'debug', 'analyze', 'break down', 'reason', 'think through'],

    // Role-Based triggers
    role_based: ['expert', 'professional', 'specialist', 'developer', 'designer', 'writer', 'consultant', 'coach', 'teacher', 'mentor'],

    // Creative triggers
    creative: ['story', 'creative', 'imagine', 'write', 'poem', 'song', 'script', 'narrative', 'fiction', 'art', 'design', 'brainstorm', 'ideas'],

    // Few-Shot triggers
    few_shot: ['example', 'like this', 'similar to', 'pattern', 'format like', 'same style'],

    // Template triggers
    template: ['template', 'format', 'structure', 'schema', 'outline', 'framework'],

    // Goal-Oriented triggers
    goal_oriented: ['goal', 'objective', 'achieve', 'target', 'outcome', 'result', 'accomplish', 'success'],

    // Evaluation triggers  
    evaluation: ['evaluate', 'review', 'judge', 'score', 'rate', 'assess', 'compare', 'critique', 'feedback'],

    // Planning triggers
    planning: ['plan', 'strategy', 'roadmap', 'timeline', 'schedule', 'project', 'implement', 'execute'],

    // Transformation triggers
    transformation: ['convert', 'transform', 'translate', 'change', 'rewrite', 'adapt', 'modify', 'refactor'],

    // Multi-Agent triggers
    multi_agent: ['team', 'collaborate', 'multiple perspectives', 'different roles', 'debate', 'discuss'],

    // Delegation triggers
    delegation: ['break down', 'subtasks', 'divide', 'assign', 'components', 'parts'],

    // Meta-Prompt triggers
    meta_prompt: ['prompt', 'better prompt', 'improve prompt', 'optimize prompt', 'prompt engineering'],

    // Socratic triggers
    socratic: ['question', 'understand', 'why', 'what if', 'explore', 'discover', 'learn'],

    // Constraint-Based triggers
    constraint_based: ['limit', 'constraint', 'within', 'maximum', 'minimum', 'only', 'must', 'should not', 'avoid'],

    // Refinement triggers
    refinement: ['improve', 'refine', 'polish', 'enhance', 'better', 'iterate', 'revision'],

    // Self-Consistency triggers
    self_consistency: ['verify', 'double check', 'confirm', 'validate', 'multiple ways', 'cross-check'],

    // Retrieval-Augmented triggers
    retrieval_augmented: ['research', 'find', 'search', 'latest', 'current', 'source', 'cite', 'reference', 'data'],

    // Zero-Shot (default for direct requests)
    zero_shot: ['simple', 'direct', 'quick', 'just'],

    // One-Shot triggers
    one_shot: ['one example', 'single example', 'show me one'],

    // Contextual triggers
    contextual: ['context', 'background', 'situation', 'given that', 'considering', 'in the case of'],

    // Instruction (general)
    instruction: ['do', 'make', 'create', 'build', 'generate', 'write', 'produce'],
};

export const getSuggestions = (input, topN = 3) => {
    if (!input || input.trim().length < 3) {
        return [
            { type: 'instruction', score: 1, reason: 'Default - good for most tasks' }
        ];
    }

    const lowerInput = input.toLowerCase();
    const scores = {};

    // Calculate scores based on keyword matches
    for (const [promptType, keywords] of Object.entries(keywordMap)) {
        let score = 0;
        const matchedKeywords = [];

        for (const keyword of keywords) {
            if (lowerInput.includes(keyword)) {
                score += keyword.split(' ').length; // Longer phrases get more weight
                matchedKeywords.push(keyword);
            }
        }

        if (score > 0) {
            scores[promptType] = {
                type: promptType,
                score,
                matchedKeywords,
                reason: `Matched: "${matchedKeywords.slice(0, 2).join('", "')}"`,
            };
        }
    }

    // Sort by score and return top N
    const sorted = Object.values(scores)
        .sort((a, b) => b.score - a.score)
        .slice(0, topN);

    // If no matches, return defaults
    if (sorted.length === 0) {
        return [
            { type: 'instruction', score: 0.5, reason: 'General purpose' },
            { type: 'chain_of_thought', score: 0.3, reason: 'For complex tasks' },
            { type: 'role_based', score: 0.2, reason: 'For expert advice' },
        ];
    }

    return sorted;
};

// Get prompt type label from value
export const getPromptTypeLabel = (type) => {
    const labels = {
        instruction: 'Instruction',
        contextual: 'Contextual',
        role_based: 'Role-Based',
        zero_shot: 'Zero-Shot',
        one_shot: 'One-Shot',
        few_shot: 'Few-Shot',
        chain_of_thought: 'Chain-of-Thought',
        self_consistency: 'Self-Consistency',
        refinement: 'Refinement',
        goal_oriented: 'Goal-Oriented',
        constraint_based: 'Constraint-Based',
        template: 'Template',
        meta_prompt: 'Meta-Prompt',
        socratic: 'Socratic',
        evaluation: 'Evaluation',
        multi_agent: 'Multi-Agent',
        delegation: 'Delegation',
        planning: 'Planning',
        transformation: 'Transformation',
        creative: 'Creative',
        retrieval_augmented: 'RAG',
    };
    return labels[type] || type;
};
