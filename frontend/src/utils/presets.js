// Industry/Domain Presets
// Pre-configured prompts for specific domains with categories & icons

export const industryPresets = {
    software: {
        label: 'Software Development',
        icon: 'code',
        description: 'Code reviews, architecture designs, API specs & debugging',
        presets: [
            {
                id: 'code_review',
                name: 'Code Reviewer',
                promptType: 'clear',
                basePrompt: 'Review the following code for security vulnerabilities, memory leaks, performance bottlenecks, and adherence to clean code principles.',
                description: 'Comprehensive code audit with security & performance feedback',
            },
            {
                id: 'debug_helper',
                name: 'Debug & Error Resolver',
                promptType: 'risen',
                basePrompt: 'I am encountering the following runtime exception/error. Help me diagnose the root cause step-by-step and provide a patch.',
                description: 'Systematic root-cause diagnosis & code fix',
            },
            {
                id: 'architecture',
                name: 'System Architecture Design',
                promptType: 'grow',
                basePrompt: 'Design a microservice system architecture for high concurrency. Include database choices, caching layers, and load balancing.',
                description: 'High-level distributed system design & tech stack',
            },
            {
                id: 'api_design',
                name: 'REST / GraphQL API Spec',
                promptType: 'rtf',
                basePrompt: 'Design a production-ready REST API spec with endpoints, HTTP methods, JSON request/response bodies, and status codes.',
                description: 'API endpoint spec with request & response schemas',
            },
        ],
    },
    marketing: {
        label: 'Marketing & Copywriting',
        icon: 'marketing',
        description: 'High-converting ad copy, social posts, emails & SEO articles',
        presets: [
            {
                id: 'ad_copy',
                name: 'Ad Copy Writer',
                promptType: 'pastor',
                basePrompt: 'Write high-converting ad copy using the PASTOR framework. Target Pain points, Amplification, Solution, Transformation, Offer, and Response.',
                description: 'High-converting advertisement copy based on PASTOR',
            },
            {
                id: 'social_media',
                name: 'Viral Social Media Post',
                promptType: 'aida',
                basePrompt: 'Create engaging social media content designed for high engagement using Attention, Interest, Desire, and Action.',
                description: 'Platform-optimized post with hook & call-to-action',
            },
            {
                id: 'email_campaign',
                name: 'Drip Email Campaign',
                promptType: 'bab',
                basePrompt: 'Draft a 3-part email nurture sequence introducing our product using the Before-After-Bridge sales framework.',
                description: 'Multi-step sales sequence using Before-After-Bridge',
            },
            {
                id: 'seo_content',
                name: 'SEO Article Brief',
                promptType: 'smart',
                basePrompt: 'Create an SEO-optimized blog article brief targeting high-intent keywords. Include H2/H3 outline, meta description, and internal link ideas.',
                description: 'Comprehensive SEO content brief & structural outline',
            },
        ],
    },
    education: {
        label: 'Education & Learning',
        icon: 'education',
        description: 'Lesson plans, quizzes, ELI5 explainers & study guides',
        presets: [
            {
                id: 'lesson_plan',
                name: 'Interactive Lesson Plan',
                promptType: 'risen',
                basePrompt: 'Create a 60-minute interactive lesson plan with learning objectives, discussion prompts, student activities, and assessment.',
                description: 'Structured 60-min curriculum plan with activities',
            },
            {
                id: 'quiz_maker',
                name: 'Quiz & Exam Generator',
                promptType: 'rtf',
                basePrompt: 'Generate a 10-question multiple choice & short answer quiz testing comprehension, complete with answer key and explanations.',
                description: 'Assessment questions with detailed answer keys',
            },
            {
                id: 'explainer',
                name: 'Explain Like I am 5 (ELI5)',
                promptType: 'care',
                basePrompt: 'Explain this complex scientific concept using clear analogies, simple vocabulary, and real-world examples suitable for a beginner.',
                description: 'Clear, jargon-free explanations with analogies',
            },
            {
                id: 'study_guide',
                name: 'Comprehensive Study Guide',
                promptType: 'coast',
                basePrompt: 'Create a structured study guide with key terms, formulas, core concepts, practice problems, and summary bullet points.',
                description: 'Exam preparation guide with summary bullets',
            },
        ],
    },
    business: {
        label: 'Business & Strategy',
        icon: 'business',
        description: 'Business plans, meeting agendas, SWOT analysis & proposals',
        presets: [
            {
                id: 'business_plan',
                name: 'Executive Business Plan',
                promptType: 'grow',
                basePrompt: 'Draft an executive business summary detailing value proposition, target market analysis, revenue model, competitor strategy, and financial projections.',
                description: 'Comprehensive business model & market analysis',
            },
            {
                id: 'meeting_agenda',
                name: 'Executive Meeting Agenda',
                promptType: 'rtf',
                basePrompt: 'Draft a 45-minute executive meeting agenda with action items, time allocations, discussion leaders, and expected outcomes.',
                description: 'Time-allocated agenda with clear action items',
            },
            {
                id: 'swot_analysis',
                name: 'Strategic SWOT Analysis',
                promptType: '5w1h',
                basePrompt: 'Perform a comprehensive SWOT analysis evaluating Strengths, Weaknesses, Opportunities, and Threats for this business initiative.',
                description: 'Matrix analysis of internal & external strategic factors',
            },
            {
                id: 'proposal',
                name: 'Client Business Proposal',
                promptType: 'aida',
                basePrompt: 'Draft a client-facing project proposal outlining problem statement, proposed solution, scope of work, timeline milestones, and pricing tier.',
                description: 'Persuasive client pitch with milestones & pricing',
            },
        ],
    },
    legal: {
        label: 'Legal & Regulatory',
        icon: 'legal',
        description: 'Contract reviews, compliance summaries & policy drafting',
        presets: [
            {
                id: 'contract_review',
                name: 'Contract Risk Analysis',
                promptType: 'clear',
                basePrompt: 'Audit the following agreement clause by clause. Highlight ambiguous terms, liability risks, indemnification gaps, and unusual obligations.',
                description: 'Risk assessment & clause-by-clause audit',
            },
            {
                id: 'legal_summary',
                name: 'Plain-Language Legal Summary',
                promptType: 'scqa',
                basePrompt: 'Translate this dense legal ruling or contract into a plain-language executive summary highlighting key rights and obligations.',
                description: 'Executive legal summary stripped of legalese',
            },
            {
                id: 'policy_draft',
                name: 'Corporate Policy Draft',
                promptType: 'rtf',
                basePrompt: 'Draft an internal corporate policy document detailing purpose, scope, mandatory compliance rules, violation penalties, and reporting procedures.',
                description: 'Standardized policy template & compliance rules',
            },
        ],
    },
    creative: {
        label: 'Creative Writing & Fiction',
        icon: 'creative',
        description: 'Story starters, character arcs, world building & dialogue',
        presets: [
            {
                id: 'story_starter',
                name: 'Narrative Story Hook',
                promptType: 'ice',
                basePrompt: 'Write a gripping story opening with vivid sensory details, immediate conflict, and an intriguing protagonist hook.',
                description: 'Atmospheric story opening with sensory hooks',
            },
            {
                id: 'character_dev',
                name: 'Character Profile & Arc',
                promptType: 'crispe',
                basePrompt: 'Create a deep character profile including backstory trauma, secret desires, flaws, vocal mannerisms, and character growth arc.',
                description: 'Deep psychological profile & growth arc',
            },
            {
                id: 'world_building',
                name: 'Fictional World Building',
                promptType: 'coast',
                basePrompt: 'Design a rich fantasy/sci-fi setting detailing magic/tech systems, political factions, climate, history, and social taboos.',
                description: 'Detailed world setting, lore & magic systems',
            },
            {
                id: 'dialogue_writer',
                name: 'Subtext-Rich Dialogue',
                promptType: 'trace',
                basePrompt: 'Write a tense dialogue scene between two characters with opposing agendas. Embed subtext, non-verbal cues, and realistic pacing.',
                description: 'Natural, multi-layered character conversations',
            },
        ],
    },
};

export const getAllPresets = () => {
    const all = [];
    for (const [category, data] of Object.entries(industryPresets)) {
        for (const preset of data.presets) {
            all.push({
                ...preset,
                category,
                categoryLabel: data.label,
                categoryIcon: data.icon,
            });
        }
    }
    return all;
};

export const getPresetsByCategory = (category) => {
    return industryPresets[category]?.presets || [];
};
