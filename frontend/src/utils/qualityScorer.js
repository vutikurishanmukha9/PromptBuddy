// Prompt Quality Scorer
// Analyzes prompts and provides a quality score with breakdown

const analyzeLength = (text) => {
    const length = text.length;
    if (length < 50) return { score: 30, feedback: 'Too short - add more detail' };
    if (length < 100) return { score: 50, feedback: 'Brief - consider adding context' };
    if (length < 300) return { score: 70, feedback: 'Good length' };
    if (length < 600) return { score: 90, feedback: 'Detailed and comprehensive' };
    if (length < 1000) return { score: 100, feedback: 'Excellent depth' };
    return { score: 85, feedback: 'Very long - ensure focus is maintained' };
};

const analyzeSpecificity = (text) => {
    const specificIndicators = [
        'specifically', 'exactly', 'precisely', 'must', 'should', 'required',
        'including', 'such as', 'for example', 'e.g.', 'i.e.', 'namely',
        'step 1', 'step 2', 'first', 'second', 'third', 'finally',
        'format:', 'output:', 'requirements:', 'constraints:',
    ];

    const lowerText = text.toLowerCase();
    let matches = 0;

    for (const indicator of specificIndicators) {
        if (lowerText.includes(indicator)) matches++;
    }

    if (matches >= 5) return { score: 100, feedback: 'Highly specific with clear requirements' };
    if (matches >= 3) return { score: 80, feedback: 'Good specificity' };
    if (matches >= 1) return { score: 60, feedback: 'Some specific elements' };
    return { score: 40, feedback: 'Could be more specific' };
};

const analyzeStructure = (text) => {
    const structureIndicators = [
        /\n-\s/g,           // Bullet points
        /\n\d+\.\s/g,       // Numbered lists
        /#+\s/g,            // Headers (markdown)
        /\*\*[^*]+\*\*/g,   // Bold text
        /\n\n/g,            // Paragraphs
        /:\n/g,             // Sections
    ];

    let structureScore = 0;
    for (const pattern of structureIndicators) {
        const matches = text.match(pattern);
        if (matches) structureScore += Math.min(matches.length * 10, 20);
    }

    if (structureScore >= 60) return { score: 100, feedback: 'Well-structured with clear formatting' };
    if (structureScore >= 40) return { score: 80, feedback: 'Good structure' };
    if (structureScore >= 20) return { score: 60, feedback: 'Some structure present' };
    return { score: 40, feedback: 'Consider adding structure (lists, headers)' };
};

const analyzeActionability = (text) => {
    const actionWords = [
        'create', 'build', 'write', 'generate', 'analyze', 'explain',
        'provide', 'list', 'describe', 'compare', 'evaluate', 'design',
        'implement', 'develop', 'solve', 'calculate', 'summarize',
        'suggest', 'recommend', 'identify', 'outline', 'define',
    ];

    const lowerText = text.toLowerCase();
    let actionCount = 0;

    for (const word of actionWords) {
        if (lowerText.includes(word)) actionCount++;
    }

    if (actionCount >= 4) return { score: 100, feedback: 'Clear actionable requests' };
    if (actionCount >= 2) return { score: 75, feedback: 'Good action clarity' };
    if (actionCount >= 1) return { score: 50, feedback: 'Action could be clearer' };
    return { score: 30, feedback: 'Add clear action verbs' };
};

const analyzeClarity = (text) => {
    // Check for common clarity issues
    const issues = [];

    if (text.includes('etc.') || text.includes('and so on')) {
        issues.push('Avoid "etc." - be explicit');
    }
    if ((text.match(/\?/g) || []).length > 3) {
        issues.push('Too many questions - focus on one');
    }
    if (text.length > 100 && !text.includes('\n')) {
        issues.push('Long text without line breaks');
    }

    const score = Math.max(100 - issues.length * 20, 40);

    return {
        score,
        feedback: issues.length === 0 ? 'Clear and focused' : issues[0],
    };
};

const analyzeCompleteness = (text) => {
    const lowerText = text.toLowerCase();
    const checks = [
        { key: 'role', terms: ['you are', 'act as', 'role:'] },
        { key: 'audience', terms: ['audience', 'for a', 'for an', 'stakeholder', 'reader'] },
        { key: 'format', terms: ['format', 'return as', 'markdown', 'json', 'table', 'sections'] },
        { key: 'constraints', terms: ['constraint', 'limit', 'must', 'do not', 'avoid', 'include'] },
        { key: 'success', terms: ['success', 'criteria', 'ensure', 'quality', 'meets'] },
    ];
    const hits = checks.filter(check => check.terms.some(term => lowerText.includes(term)));
    const score = Math.min(100, 35 + hits.length * 13);
    return {
        score,
        feedback: hits.length >= 4 ? 'Covers core prompt ingredients' : 'Add role, audience, format, constraints, and success criteria',
    };
};

export const calculateQualityScore = (promptText) => {
    if (!promptText || promptText.trim().length === 0) {
        return {
            overall: 0,
            breakdown: {},
            grade: 'N/A',
            feedback: 'No prompt to analyze',
        };
    }

    const length = analyzeLength(promptText);
    const specificity = analyzeSpecificity(promptText);
    const structure = analyzeStructure(promptText);
    const actionability = analyzeActionability(promptText);
    const clarity = analyzeClarity(promptText);
    const completeness = analyzeCompleteness(promptText);

    const weights = {
        length: 0.10,
        specificity: 0.22,
        structure: 0.18,
        actionability: 0.20,
        clarity: 0.15,
        completeness: 0.15,
    };

    const overall = Math.round(
        length.score * weights.length +
        specificity.score * weights.specificity +
        structure.score * weights.structure +
        actionability.score * weights.actionability +
        clarity.score * weights.clarity +
        completeness.score * weights.completeness
    );

    let grade, gradeColor;
    if (overall >= 90) { grade = 'A+'; gradeColor = 'text-green-600'; }
    else if (overall >= 80) { grade = 'A'; gradeColor = 'text-green-500'; }
    else if (overall >= 70) { grade = 'B'; gradeColor = 'text-blue-500'; }
    else if (overall >= 60) { grade = 'C'; gradeColor = 'text-yellow-500'; }
    else if (overall >= 50) { grade = 'D'; gradeColor = 'text-orange-500'; }
    else { grade = 'F'; gradeColor = 'text-red-500'; }

    return {
        overall,
        grade,
        gradeColor,
        breakdown: {
            length: { ...length, weight: '10%' },
            specificity: { ...specificity, weight: '22%' },
            structure: { ...structure, weight: '18%' },
            actionability: { ...actionability, weight: '20%' },
            clarity: { ...clarity, weight: '15%' },
            completeness: { ...completeness, weight: '15%' },
        },
        feedback: overall >= 70
            ? 'Good quality prompt!'
            : 'Consider improving: ' + [specificity, actionability, structure, completeness]
                .filter(m => m.score < 70)
                .map(m => m.feedback)
                .slice(0, 2)
                .join(', '),
    };
};
