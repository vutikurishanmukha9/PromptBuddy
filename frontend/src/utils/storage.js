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

    const existingVersions = duplicateIndex >= 0 ? (prompts[duplicateIndex].versions || []) : [];

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
        // Versioning fields (Langfuse-inspired)
        version: prompt.version || '1.0.0',
        releaseTag: prompt.releaseTag || 'draft',
        versions: existingVersions.length > 0 ? existingVersions : [{
            version: '1.0.0',
            prompt: prompt.optimizedPrompt,
            timestamp: new Date().toISOString(),
            note: 'Initial version',
        }],
        activeVersion: prompt.version || '1.0.0',
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

export const createVersion = (id, note = '') => {
    const prompts = getSavedPrompts();
    const prompt = prompts.find(p => p.id === id);
    if (!prompt) return null;

    const versions = prompt.versions || [];
    const lastVersion = versions.length > 0 ? versions[versions.length - 1].version : '0.0.0';
    const parts = lastVersion.split('.').map(Number);
    parts[2] = (parts[2] || 0) + 1;
    const newVersion = parts.join('.');

    const newEntry = {
        version: newVersion,
        prompt: prompt.optimizedPrompt,
        timestamp: new Date().toISOString(),
        note: note || `Version ${newVersion}`,
    };

    return updatePrompt(id, {
        version: newVersion,
        activeVersion: newVersion,
        versions: [...versions, newEntry],
    });
};

export const setReleaseTag = (id, tag) => {
    if (!['production', 'staging', 'draft'].includes(tag)) return null;
    return updatePrompt(id, { releaseTag: tag });
};

export const restoreVersion = (id, targetVersion) => {
    const prompts = getSavedPrompts();
    const prompt = prompts.find(p => p.id === id);
    if (!prompt) return null;

    const entry = (prompt.versions || []).find(v => v.version === targetVersion);
    if (!entry) return null;

    return updatePrompt(id, {
        optimizedPrompt: entry.prompt,
        activeVersion: targetVersion,
    });
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

export const exportFullLibraryJSON = () => {
    const library = getSavedPrompts();
    const history = getPromptHistory();
    const payload = {
        version: '4.1.0',
        exportedAt: new Date().toISOString(),
        savedPrompts: library,
        history: history,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promptbuddy_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const importFullLibraryJSON = (jsonText) => {
    try {
        const parsed = JSON.parse(jsonText);
        if (Array.isArray(parsed.savedPrompts)) {
            const existing = getSavedPrompts();
            const merged = [...parsed.savedPrompts, ...existing];
            const unique = Array.from(new Map(merged.map(p => [p.id, p])).values());
            writeJSON(STORAGE_KEYS.SAVED_PROMPTS, unique);
        }
        return true;
    } catch {
        return false;
    }
};
