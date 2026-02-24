// Storage utility for PromptBuddy
// Handles localStorage persistence for prompts, settings, and history

const STORAGE_KEYS = {
    SAVED_PROMPTS: 'promptbuddy_saved_prompts',
    PROMPT_HISTORY: 'promptbuddy_history',
    THEME: 'promptbuddy_theme',
    SETTINGS: 'promptbuddy_settings',
    WORKFLOWS: 'promptbuddy_workflows',
};

// Theme management
export const getTheme = () => {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
};

export const setTheme = (theme) => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    document.documentElement.setAttribute('data-theme', theme);
};

// Saved Prompts (Library)
export const getSavedPrompts = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.SAVED_PROMPTS);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

export const savePrompt = (prompt) => {
    const prompts = getSavedPrompts();
    const newPrompt = {
        id: Date.now().toString(),
        title: prompt.title || `Prompt ${prompts.length + 1}`,
        basePrompt: prompt.basePrompt,
        promptType: prompt.promptType,
        optimizedPrompt: prompt.optimizedPrompt,
        tags: prompt.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    prompts.unshift(newPrompt);
    localStorage.setItem(STORAGE_KEYS.SAVED_PROMPTS, JSON.stringify(prompts));
    return newPrompt;
};

export const deletePrompt = (id) => {
    const prompts = getSavedPrompts().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.SAVED_PROMPTS, JSON.stringify(prompts));
};

export const updatePrompt = (id, updates) => {
    const prompts = getSavedPrompts().map(p =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    localStorage.setItem(STORAGE_KEYS.SAVED_PROMPTS, JSON.stringify(prompts));
};

// Prompt History (for version control)
export const getPromptHistory = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.PROMPT_HISTORY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

export const addToHistory = (prompt) => {
    const history = getPromptHistory();
    const entry = {
        id: Date.now().toString(),
        basePrompt: prompt.basePrompt,
        promptType: prompt.promptType,
        optimizedPrompt: prompt.optimizedPrompt,
        timestamp: new Date().toISOString(),
    };
    history.unshift(entry);
    // Keep only last 50 entries
    const trimmed = history.slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.PROMPT_HISTORY, JSON.stringify(trimmed));
    return entry;
};

export const clearHistory = () => {
    localStorage.setItem(STORAGE_KEYS.PROMPT_HISTORY, JSON.stringify([]));
};

// Workflows
export const getWorkflows = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.WORKFLOWS);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

export const saveWorkflow = (workflow) => {
    const workflows = getWorkflows();
    const newWorkflow = {
        id: Date.now().toString(),
        name: workflow.name,
        steps: workflow.steps,
        createdAt: new Date().toISOString(),
    };
    workflows.unshift(newWorkflow);
    localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(workflows));
    return newWorkflow;
};

export const deleteWorkflow = (id) => {
    const workflows = getWorkflows().filter(w => w.id !== id);
    localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(workflows));
};

// Settings
export const getSettings = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        return data ? JSON.parse(data) : {
            autoSaveHistory: true,
            defaultPromptType: 'rtf',
            showQualityScore: true,
            previewMode: 'default',
        };
    } catch {
        return {};
    }
};

export const updateSettings = (updates) => {
    const settings = { ...getSettings(), ...updates };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return settings;
};
