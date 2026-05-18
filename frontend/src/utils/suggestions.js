// Smart prompt framework suggestions based on user input keywords
import { getFrameworkLabel } from './frameworks';

const keywordMap = {
    // RTF - general purpose, role-based tasks
    rtf: ['create', 'make', 'build', 'generate', 'write', 'produce', 'design', 'develop'],

    // RACE - when context and expectations matter
    race: ['expect', 'context', 'background', 'given that', 'considering'],

    // RISEN - detailed step-by-step tasks
    risen: ['step by step', 'how to', 'guide', 'instructions', 'process', 'procedure', 'walkthrough'],

    // CARE - when examples help
    care: ['example', 'like this', 'similar to', 'pattern', 'format like', 'same style', 'show me'],

    // COAST - scenario-based tasks
    coast: ['scenario', 'situation', 'use case', 'what if', 'imagine'],

    // TRACE - action-oriented with examples
    trace: ['trace', 'follow', 'replicate', 'reproduce'],

    // SMART - goal-driven tasks
    smart: ['goal', 'objective', 'achieve', 'target', 'outcome', 'result', 'accomplish', 'success', 'measure'],

    // CRISPE - complex, personality-driven
    crispe: ['expert', 'professional', 'specialist', 'consultant', 'coach', 'teacher', 'mentor', 'personality'],

    // APE - simple, direct actions
    ape: ['simple', 'direct', 'quick', 'just', 'do'],

    // TAG - audience-focused
    tag: ['audience', 'readers', 'users', 'customers', 'students', 'beginners', 'advanced'],

    // ERA - expectation-first
    era: ['quality', 'standard', 'level', 'professional'],

    // PASTOR - persuasion and marketing
    pastor: ['marketing', 'sell', 'persuade', 'convince', 'campaign', 'brand', 'advertisement', 'pitch'],

    // BAB - transformation stories
    bab: ['before', 'after', 'transform', 'change', 'improve', 'upgrade'],

    // AIDA - attention-grabbing content
    aida: ['attention', 'hook', 'engage', 'interest', 'desire', 'call to action', 'landing page'],

    // SCQA - problem analysis
    scqa: ['problem', 'challenge', 'issue', 'complication', 'question', 'answer', 'solve'],

    // GROW - coaching and planning
    grow: ['plan', 'strategy', 'roadmap', 'timeline', 'options', 'decision'],

    // STAR - structured responses
    star: ['situation', 'task', 'action', 'result', 'case study'],

    // PAR - problem-solution
    par: ['fix', 'resolve', 'debug', 'troubleshoot', 'solution'],

    // CLEAR - constrained tasks
    clear: ['limit', 'constraint', 'within', 'maximum', 'minimum', 'boundary', 'scope'],

    // PEEL - argumentative/analytical
    peel: ['argue', 'evidence', 'explain', 'analyze', 'essay', 'article', 'blog'],

    // ICE - idea development
    ice: ['idea', 'concept', 'brainstorm', 'creative', 'story', 'fiction', 'art', 'imagine'],

    // 5W1H - comprehensive coverage
    '5w1h': ['who', 'what', 'when', 'where', 'why', 'how', 'research', 'investigate', 'report'],
};

export const getSuggestions = (input, topN = 3) => {
    if (!input || input.trim().length < 3) {
        return [
            { type: 'rtf', score: 1, reason: 'Default - works great for most tasks' }
        ];
    }

    const lowerInput = input.toLowerCase();
    const scores = {};

    for (const [promptType, keywords] of Object.entries(keywordMap)) {
        let score = 0;
        const matchedKeywords = [];

        for (const keyword of keywords) {
            if (lowerInput.includes(keyword)) {
                score += keyword.split(' ').length;
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

    const sorted = Object.values(scores)
        .sort((a, b) => b.score - a.score)
        .slice(0, topN);

    if (sorted.length === 0) {
        return [
            { type: 'rtf', score: 0.5, reason: 'General purpose' },
            { type: 'risen', score: 0.3, reason: 'For detailed tasks' },
            { type: 'crispe', score: 0.2, reason: 'For expert advice' },
        ];
    }

    return sorted;
};

export const getPromptTypeLabel = (type) => {
    return getFrameworkLabel(type);
};
