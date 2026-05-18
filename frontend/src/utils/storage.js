const STORAGE_KEYS = {
    SAVED_PROMPTS: 'promptbuddy_saved_prompts',
    PROMPT_HISTORY: 'promptbuddy_history',
    THEME: 'promptbuddy_theme',
    SETTINGS: 'promptbuddy_settings',
    WORKFLOWS: 'promptbuddy_workflows',
};

const DEFAULT_SETTINGS = {
    autoSaveHistory: true,
    defaultPromptType: 'rtf',
    showQualityScore: true,
    previewMode: 'default',
};

const hasStorage = () => {
    try {
        const key = '__promptbuddy_storage_test__';
        localStorage.setItem(key, key);
        localStorage.removeItem(key);
        return true;
    } catch {
        return false;
    }
};

const readJSON = (key, fallback) => {
    if (!hasStorage()) return fallback;
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch {
        return fallback;
    }
};

const writeJSON = (key, value) => {
    if (!hasStorage()) return false;
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
};

const createId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const getTheme = () => {
    if (!hasStorage()) return 'light';
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
};

export const setTheme = (theme) => {
    if (hasStorage()) localStorage.setItem(STORAGE_KEYS.THEME, theme);
    document.documentElement.setAttribute('data-theme', theme);
};

export const getSavedPrompts = () => readJSON(STORAGE_KEYS.SAVED_PROMPTS, []);

export const savePrompt = (prompt) => {
    const prompts = getSavedPrompts();
    const duplicateIndex = prompts.findIndex(p =>
        p.basePrompt === prompt.basePrompt &&
        p.promptType === prompt.promptType &&
        p.optimizedPrompt === prompt.optimizedPrompt
    );

    const newPrompt = {
        id: duplicateIndex >= 0 ? prompts[duplicateIndex].id : createId(),
        title: prompt.title || `Prompt ${prompts.length + 1}`,
        basePrompt: prompt.basePrompt,
        promptType: prompt.promptType,
        optimizedPrompt: prompt.optimizedPrompt,
        aiModel: prompt.aiModel,
        tags: prompt.tags || [],
        createdAt: duplicateIndex >= 0 ? prompts[duplicateIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const nextPrompts = duplicateIndex >= 0
        ? [newPrompt, ...prompts.filter((_, index) => index !== duplicateIndex)]
        : [newPrompt, ...prompts];
    writeJSON(STORAGE_KEYS.SAVED_PROMPTS, nextPrompts);
    return newPrompt;
};

export const deletePrompt = (id) => {
    writeJSON(STORAGE_KEYS.SAVED_PROMPTS, getSavedPrompts().filter(p => p.id !== id));
};

export const updatePrompt = (id, updates) => {
    const prompts = getSavedPrompts().map(p =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    writeJSON(STORAGE_KEYS.SAVED_PROMPTS, prompts);
    return prompts.find(p => p.id === id);
};

export const getPromptHistory = () => readJSON(STORAGE_KEYS.PROMPT_HISTORY, []);

export const addToHistory = (prompt) => {
    const history = getPromptHistory();
    const entry = {
        id: createId(),
        basePrompt: prompt.basePrompt,
        promptType: prompt.promptType,
        optimizedPrompt: prompt.optimizedPrompt,
        aiModel: prompt.aiModel,
        requestId: prompt.requestId,
        timestamp: new Date().toISOString(),
    };
    const deduped = history.filter(item =>
        item.basePrompt !== entry.basePrompt ||
        item.promptType !== entry.promptType ||
        item.optimizedPrompt !== entry.optimizedPrompt
    );
    writeJSON(STORAGE_KEYS.PROMPT_HISTORY, [entry, ...deduped].slice(0, 50));
    return entry;
};

export const clearHistory = () => writeJSON(STORAGE_KEYS.PROMPT_HISTORY, []);

export const getWorkflows = () => readJSON(STORAGE_KEYS.WORKFLOWS, []);

export const saveWorkflow = (workflow) => {
    const workflows = getWorkflows();
    const newWorkflow = {
        id: createId(),
        name: workflow.name,
        steps: workflow.steps || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    writeJSON(STORAGE_KEYS.WORKFLOWS, [newWorkflow, ...workflows]);
    return newWorkflow;
};

export const deleteWorkflow = (id) => {
    writeJSON(STORAGE_KEYS.WORKFLOWS, getWorkflows().filter(w => w.id !== id));
};

export const getSettings = () => {
    return { ...DEFAULT_SETTINGS, ...readJSON(STORAGE_KEYS.SETTINGS, {}) };
};

export const updateSettings = (updates) => {
    const settings = { ...getSettings(), ...updates };
    writeJSON(STORAGE_KEYS.SETTINGS, settings);
    return settings;
};
