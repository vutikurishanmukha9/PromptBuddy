// Industry/Domain Presets
// Pre-configured prompts for specific domains

export const industryPresets = {
    software: {
        label: 'Software Development',
        icon: '',
        presets: [
            {
                id: 'code_review',
                name: 'Code Review',
                promptType: 'clear',
                basePrompt: 'Review this code for bugs, performance issues, and best practices',
                description: 'Expert code review with actionable feedback',
            },
            {
                id: 'debug_helper',
                name: 'Debug Helper',
                promptType: 'risen',
                basePrompt: 'Help me debug this issue step by step',
                description: 'Systematic debugging approach',
            },
            {
                id: 'architecture',
                name: 'System Architecture',
                promptType: 'grow',
                basePrompt: 'Design a scalable system architecture for',
                description: 'High-level system design',
            },
            {
                id: 'api_design',
                name: 'API Design',
                promptType: 'rtf',
                basePrompt: 'Design a RESTful API for',
                description: 'API endpoint design with schemas',
            },
        ],
    },
    marketing: {
        label: 'Marketing',
        icon: '',
        presets: [
            {
                id: 'ad_copy',
                name: 'Ad Copy Writer',
                promptType: 'pastor',
                basePrompt: 'Write compelling ad copy for',
                description: 'High-converting advertisement text',
            },
            {
                id: 'social_media',
                name: 'Social Media Post',
                promptType: 'aida',
                basePrompt: 'Create engaging social media content for',
                description: 'Platform-optimized social posts',
            },
            {
                id: 'email_campaign',
                name: 'Email Campaign',
                promptType: 'bab',
                basePrompt: 'Write an email marketing sequence for',
                description: 'Multi-step email campaigns',
            },
            {
                id: 'seo_content',
                name: 'SEO Content',
                promptType: 'smart',
                basePrompt: 'Create SEO-optimized content about',
                description: 'Search engine optimized articles',
            },
        ],
    },
    education: {
        label: 'Education',
        icon: '',
        presets: [
            {
                id: 'lesson_plan',
                name: 'Lesson Plan',
                promptType: 'risen',
                basePrompt: 'Create a comprehensive lesson plan for teaching',
                description: 'Structured educational content',
            },
            {
                id: 'quiz_maker',
                name: 'Quiz Generator',
                promptType: 'rtf',
                basePrompt: 'Generate quiz questions about',
                description: 'Assessment questions with answers',
            },
            {
                id: 'explainer',
                name: 'Simple Explainer',
                promptType: 'care',
                basePrompt: 'Explain this concept in simple terms',
                description: 'Clear, accessible explanations',
            },
            {
                id: 'study_guide',
                name: 'Study Guide',
                promptType: 'coast',
                basePrompt: 'Create a study guide for',
                description: 'Comprehensive study materials',
            },
        ],
    },
    business: {
        label: 'Business',
        icon: '',
        presets: [
            {
                id: 'business_plan',
                name: 'Business Plan',
                promptType: 'grow',
                basePrompt: 'Create a business plan for',
                description: 'Comprehensive business strategy',
            },
            {
                id: 'meeting_agenda',
                name: 'Meeting Agenda',
                promptType: 'rtf',
                basePrompt: 'Create a meeting agenda for discussing',
                description: 'Structured meeting plans',
            },
            {
                id: 'swot_analysis',
                name: 'SWOT Analysis',
                promptType: '5w1h',
                basePrompt: 'Perform a SWOT analysis for',
                description: 'Strategic analysis framework',
            },
            {
                id: 'proposal',
                name: 'Business Proposal',
                promptType: 'aida',
                basePrompt: 'Write a business proposal for',
                description: 'Professional proposals',
            },
        ],
    },
    legal: {
        label: 'Legal',
        icon: '',
        presets: [
            {
                id: 'contract_review',
                name: 'Contract Review',
                promptType: 'clear',
                basePrompt: 'Review this contract for potential issues',
                description: 'Legal document analysis',
            },
            {
                id: 'legal_summary',
                name: 'Legal Summary',
                promptType: 'scqa',
                basePrompt: 'Summarize the legal implications of',
                description: 'Plain-language legal summaries',
            },
            {
                id: 'policy_draft',
                name: 'Policy Draft',
                promptType: 'rtf',
                basePrompt: 'Draft a policy document for',
                description: 'Corporate policy templates',
            },
        ],
    },
    creative: {
        label: 'Creative Writing',
        icon: '',
        presets: [
            {
                id: 'story_starter',
                name: 'Story Starter',
                promptType: 'ice',
                basePrompt: 'Write a compelling story opening about',
                description: 'Engaging narrative beginnings',
            },
            {
                id: 'character_dev',
                name: 'Character Development',
                promptType: 'crispe',
                basePrompt: 'Create a detailed character profile for',
                description: 'Rich character backgrounds',
            },
            {
                id: 'world_building',
                name: 'World Building',
                promptType: 'coast',
                basePrompt: 'Build a detailed world/setting for',
                description: 'Immersive fictional worlds',
            },
            {
                id: 'dialogue_writer',
                name: 'Dialogue Writer',
                promptType: 'trace',
                basePrompt: 'Write realistic dialogue between characters discussing',
                description: 'Natural character conversations',
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
            });
        }
    }
    return all;
};

export const getPresetsByCategory = (category) => {
    return industryPresets[category]?.presets || [];
};
