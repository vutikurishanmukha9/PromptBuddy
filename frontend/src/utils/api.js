// PromptBuddy Enterprise API Client
// Connects frontend workbench directly to backend engines

const getApiBaseUrl = () => {
  // 1. Vite build-time static replacement
  const viteUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ? import.meta.env.VITE_API_URL : null;
  if (viteUrl) {
    return viteUrl.replace(/\/+$/, '');
  }

  // 2. Node/SSR fallback
  if (typeof process !== 'undefined' && process?.env?.VITE_API_URL) {
    return process.env.VITE_API_URL.replace(/\/+$/, '');
  }

  // 3. Browser runtime fallback: On any remote hosted domain (e.g. Vercel), default directly to live Render backend
  if (typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://promptbuddy-api.onrender.com';
  }

  // 4. Localhost development fallback
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Generic JSON fetcher with error normalization
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.detail || data.error || `HTTP ${response.status} from ${endpoint}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

/**
 * Health check
 */
export async function checkBackendHealth() {
  return request('/health');
}

/**
 * Skills Catalog API
 */
export async function fetchSkillsCatalog({ category = '', query = '', page = 1, limit = 50 } = {}) {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.append('category', category);
  if (query) params.append('query', query);
  if (page) params.append('page', String(page));
  if (limit) params.append('limit', String(limit));

  const qs = params.toString() ? `?${params.toString()}` : '';
  return request(`/skills/catalog${qs}`);
}

export async function fetchSkillDetail(category, skillName) {
  if (!category || !skillName) throw new Error('Category and skill name are required');
  return request(`/skills/${encodeURIComponent(category)}/${encodeURIComponent(skillName)}`);
}

export async function importCatalogSkill({ category, skillName, contextPrefix = '' }) {
  return request('/skills/import', {
    method: 'POST',
    body: JSON.stringify({
      category,
      skill_name: skillName,
      context_prefix: contextPrefix,
    }),
  });
}

/**
 * Prompt Evolution & Multi-Strategy Variants API
 */
export async function evolvePrompt({ basePrompt, intent = 'general', critique = '', maxIterations = 3 }) {
  return request('/prompts/evolve', {
    method: 'POST',
    body: JSON.stringify({
      base_prompt: basePrompt,
      intent,
      critique,
      max_iterations: maxIterations,
    }),
  });
}

export async function generatePromptVariants({ basePrompt, intent = 'general', strategies = null }) {
  const payload = {
    base_prompt: basePrompt,
    intent,
  };
  if (strategies && Array.isArray(strategies)) {
    payload.strategies = strategies;
  }

  return request('/prompts/variants', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Redteam & Security Evaluation API
 */
export async function runRedteamAudit({ prompt, targetIntent = 'general' }) {
  return request('/eval/redteam', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      target_intent: targetIntent,
    }),
  });
}

export async function runBatchEvalMatrix({ testCases, prompt, model = 'gpt-4o' }) {
  return request('/eval/matrix', {
    method: 'POST',
    body: JSON.stringify({
      test_cases: testCases,
      prompt,
      model,
    }),
  });
}

/**
 * Guidance & Grammar Compilers API
 */
export async function compileGuidance({ prompt, modelFamily = 'openai', choices = null }) {
  const payload = {
    prompt,
    model_family: modelFamily,
  };
  if (choices && Array.isArray(choices)) {
    payload.choices = choices;
  }

  return request('/compile/guidance', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function compileGrammar({ jsonSchema = null, choices = null, grammarFormat = 'regex' }) {
  const payload = {
    grammar_format: grammarFormat,
  };
  if (jsonSchema) payload.json_schema = jsonSchema;
  if (choices) payload.choices = choices;

  return request('/compile/grammar', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Telemetry & Observability Traces API
 */
export async function fetchTelemetryTraces({ model = '', status = '', tag = '', limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (model) params.append('model', model);
  if (status) params.append('status', status);
  if (tag) params.append('tag', tag);
  if (limit) params.append('limit', String(limit));

  const qs = params.toString() ? `?${params.toString()}` : '';
  return request(`/observability/traces${qs}`);
}

/**
 * Interactive Playground Execution & Assertions
 */
export async function testPromptExecution({ prompt, userInput = '' }) {
  return request('/test-prompt', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      user_input: userInput,
    }),
  });
}

export async function evaluateAssertions({ text, rules }) {
  return request('/assertions/evaluate', {
    method: 'POST',
    body: JSON.stringify({
      text,
      rules,
    }),
  });
}
