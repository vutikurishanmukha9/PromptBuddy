import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PromptOutput from './PromptOutput';
import PromptLibrary from './PromptLibrary';
import PresetSelector from './PresetSelector';
import { getSuggestions } from '../utils/suggestions';
import { addToHistory, getSettings } from '../utils/storage';
import {
  frameworkCategories,
  frameworkOptions,
  getFrameworkCategory,
  getFrameworkDescription,
  getFrameworkLabel,
} from '../utils/frameworks';

const examplePrompts = [
  'Turn these rough meeting notes into an executive-ready action plan',
  'Create a launch email for a new productivity app aimed at founders',
  'Review this React component for performance, accessibility, and maintainability',
];

const workflowSteps = [
  'Paste a rough request',
  'Choose optimization settings',
  'Generate structured prompt',
  'Copy or export',
];

const trustSignals = [
  'Structured prompt generation',
  'Multi-model compatible',
  'Built for ChatGPT, Claude, and Gemini',
  'Cleaner outputs with fewer retries',
];

const promptModes = [
  { label: 'Developer', intent: 'clear', audience: 'Software engineer', tone: 'Technical', format: 'Step-by-step' },
  { label: 'Marketing', intent: 'aida', audience: 'Growth team', tone: 'Persuasive', format: 'Markdown' },
  { label: 'Research', intent: '5w1h', audience: 'Research lead', tone: 'Clear', format: 'Table' },
  { label: 'Resume', intent: 'star', audience: 'Hiring manager', tone: 'Professional', format: 'Checklist' },
  { label: 'Startup Idea', intent: 'scqa', audience: 'Founder', tone: 'Executive', format: 'Step-by-step' },
  { label: 'UX/UI', intent: 'race', audience: 'Product designer', tone: 'Clear', format: 'Checklist' },
  { label: 'Coding Agent', intent: 'clear', audience: 'AI coding agent', tone: 'Technical', format: 'JSON' },
];

const outputFormats = ['Markdown', 'Table', 'Checklist', 'JSON', 'Step-by-step'];
const toneOptions = ['Clear', 'Executive', 'Technical', 'Persuasive', 'Friendly', 'Professional'];
const depthOptions = ['Concise', 'Balanced', 'Detailed'];

const PromptGenerator = () => {
  const settings = getSettings();
  const [basePrompt, setBasePrompt] = useState('');
  const [audience, setAudience] = useState('');
  const [constraints, setConstraints] = useState('');
  const [format, setFormat] = useState('Markdown');
  const [tone, setTone] = useState('Clear');
  const [depth, setDepth] = useState('Balanced');
  const [intent, setIntent] = useState(settings.defaultPromptType || 'rtf');
  const [selectedMode, setSelectedMode] = useState('Developer');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState(getFrameworkCategory(intent));
  const [suggestions, setSuggestions] = useState([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const abortRef = useRef(null);

  const selectedFramework = useMemo(() => ({
    label: getFrameworkLabel(intent),
    description: getFrameworkDescription(intent),
  }), [intent]);

  const composedPrompt = useMemo(() => {
    const parts = [basePrompt.trim()];
    if (audience.trim()) parts.push(`Target audience: ${audience.trim()}`);
    if (format) parts.push(`Preferred output format: ${format}`);
    if (tone) parts.push(`Tone: ${tone}`);
    if (depth) parts.push(`Depth: ${depth}`);
    if (constraints.trim()) parts.push(`Constraints: ${constraints.trim()}`);
    return parts.filter(Boolean).join('\n');
  }, [audience, basePrompt, constraints, depth, format, tone]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSuggestions(basePrompt.trim().length >= 5 ? getSuggestions(basePrompt, 3) : []);
    }, 250);
    return () => clearTimeout(timer);
  }, [basePrompt]);

  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    const trimmedPrompt = composedPrompt.trim();
    if (!basePrompt.trim()) {
      setError('Start with a rough prompt or choose an example.');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_prompt: trimmedPrompt, intent }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Failed to generate prompt');
      }

      setResult(data);
      if (getSettings().autoSaveHistory !== false) {
        addToHistory({
          basePrompt: data.original_prompt,
          promptType: data.intent,
          optimizedPrompt: data.optimized_prompt,
          aiModel: data.ai_model,
          requestId: data.request_id,
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to connect to the server');
      }
    } finally {
      if (abortRef.current === controller) {
        setIsLoading(false);
        abortRef.current = null;
      }
    }
  }, [basePrompt, composedPrompt, intent]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'Enter' && basePrompt.trim()) {
        handleSubmit();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [basePrompt, handleSubmit]);

  const selectFramework = (type) => {
    setIntent(type);
    setActiveCategory(getFrameworkCategory(type));
  };

  const applyMode = (mode) => {
    setSelectedMode(mode.label);
    setAudience(mode.audience);
    setTone(mode.tone);
    setFormat(mode.format);
    selectFramework(mode.intent);
  };

  const handleClear = () => {
    abortRef.current?.abort();
    setBasePrompt('');
    setAudience('');
    setConstraints('');
    setFormat('Markdown');
    setTone('Clear');
    setDepth('Balanced');
    setSelectedMode('Developer');
    setResult(null);
    setError('');
  };

  const handleLoadPrompt = (prompt) => {
    setBasePrompt(prompt.basePrompt || '');
    setAudience('');
    setConstraints('');
    setSelectedMode('Developer');
    if (prompt.promptType) selectFramework(prompt.promptType);
    if (prompt.optimizedPrompt) {
      setResult({
        original_prompt: prompt.basePrompt,
        intent: prompt.promptType,
        optimized_prompt: prompt.optimizedPrompt,
        ai_model: prompt.aiModel,
      });
    }
  };

  const handleApplyPreset = (preset) => {
    setBasePrompt(preset.basePrompt);
    setSelectedMode('Developer');
    selectFramework(preset.promptType);
  };

  return (
    <section className="workspace-shell">
      <div className="workspace-toolbar">
        <div>
          <p className="eyebrow">Prompt workbench</p>
          <h1 className="workspace-title">Turn messy requests into production-ready AI prompts.</h1>
          <p className="workspace-subtitle">
            Generate structured prompts that produce clearer, more reliable AI responses with fewer retries.
          </p>
        </div>
        <div className="workspace-actions">
          <button type="button" onClick={() => setShowLibrary(true)} className="btn-secondary toolbar-btn">
            Library
          </button>
          <button type="button" onClick={() => setShowPresets(true)} className="btn-secondary toolbar-btn">
            Presets
          </button>
        </div>
      </div>

      <div className="workflow-strip" aria-label="PromptBuddy workflow">
        {workflowSteps.map((step, index) => (
          <div className="workflow-step" key={step}>
            <span>{index + 1}</span>
            <p>{step}</p>
          </div>
        ))}
      </div>

      <div className="trust-strip" aria-label="PromptBuddy capabilities">
        {trustSignals.map((signal) => (
          <span key={signal}>{signal}</span>
        ))}
      </div>

      <div className="workspace-grid">
        <form className="composer-panel" onSubmit={handleSubmit}>
          <div className="panel-section">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Input</p>
                <h2>Source request</h2>
              </div>
              <span className={`char-meter ${composedPrompt.length > 7200 ? 'char-meter--warning' : ''}`}>
                {composedPrompt.length}/8000
              </span>
            </div>

            <textarea
              id="base-prompt"
              value={basePrompt}
              onChange={(e) => setBasePrompt(e.target.value)}
              placeholder="Paste a rough request, draft, ticket, brief, or idea..."
              className="prompt-textarea prompt-textarea--workbench"
              rows="8"
              required
            />

            {!basePrompt && (
              <div className="example-row">
                {examplePrompts.map((example) => (
                  <button key={example} type="button" onClick={() => setBasePrompt(example)} className="example-chip">
                    {example}
                  </button>
                ))}
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="suggestion-panel">
                <span>Suggested frameworks</span>
                <div>
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.type}
                      type="button"
                      onClick={() => selectFramework(suggestion.type)}
                      className={`suggestion-chip ${intent === suggestion.type ? 'suggestion-chip--active' : ''}`}
                      title={suggestion.reason}
                    >
                      {getFrameworkLabel(suggestion.type)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="panel-section">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Context</p>
                <h2>Execution controls</h2>
              </div>
            </div>

            <div className="mode-rail" aria-label="Smart prompt modes">
              {promptModes.map((mode) => (
                <button
                  key={mode.label}
                  type="button"
                  className={`mode-chip ${selectedMode === mode.label ? 'mode-chip--active' : ''}`}
                  onClick={() => applyMode(mode)}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="control-grid">
              <label className="field-group">
                <span>Audience</span>
                <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g., CTO, first-time founder" />
              </label>
              <label className="field-group">
                <span>Output format</span>
                <select value={format} onChange={(e) => setFormat(e.target.value)}>
                  {outputFormats.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label className="field-group">
                <span>Tone</span>
                <select value={tone} onChange={(e) => setTone(e.target.value)}>
                  {toneOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label className="field-group">
                <span>Depth</span>
                <select value={depth} onChange={(e) => setDepth(e.target.value)}>
                  {depthOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
            </div>

            <label className="field-group">
              <span>Constraints</span>
              <input value={constraints} onChange={(e) => setConstraints(e.target.value)} placeholder="e.g., no fluff, include risks, cite uncertainty" />
            </label>
          </div>

          <div className="panel-section">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Framework</p>
                <h2>{selectedFramework.label}</h2>
                <p>{selectedFramework.description}</p>
              </div>
            </div>

            <div className="category-tabs">
              {Object.entries(frameworkCategories).map(([key, category]) => (
                <button key={key} type="button" onClick={() => setActiveCategory(key)} className={`category-tab ${activeCategory === key ? 'category-tab--active' : ''}`}>
                  {category.label}
                </button>
              ))}
            </div>

            <div className="framework-grid">
              {frameworkCategories[activeCategory].types.map((option) => (
                <label key={option.value} className={`framework-card ${intent === option.value ? 'framework-card--active' : ''}`}>
                  <input type="radio" name="intent" value={option.value} checked={intent === option.value} onChange={(e) => selectFramework(e.target.value)} className="sr-only" />
                  <span className="framework-card__top">
                    <span className="framework-card__mark" aria-hidden="true">{option.label.slice(0, 1)}</span>
                    <span className="framework-card__label">{option.label}</span>
                  </span>
                  <span className="framework-card__desc">{option.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {error && <div className="error-box"><span className="error-box__text">{error}</span></div>}

          <div className="composer-actions">
            <button type="submit" disabled={isLoading || !basePrompt.trim()} className="btn-primary primary-action">
              <svg className="primary-action__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {isLoading ? 'Optimizing...' : 'Optimize prompt'}
            </button>
            <button type="button" onClick={handleClear} className="btn-secondary secondary-action">
              Reset
            </button>
          </div>
        </form>

        <aside className="result-panel">
          {isLoading ? (
            <div className="output-skeleton" aria-live="polite">
              <p className="section-kicker">Optimizing</p>
              <h2>Building a structured prompt...</h2>
              <div className="skeleton-line skeleton-line--wide" />
              <div className="skeleton-block" />
              <div className="skeleton-grid">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : result ? (
            <PromptOutput result={result} intentOptions={frameworkOptions} />
          ) : (
            <div className="empty-preview">
              <div className="preview-header">
                <div>
                  <p className="section-kicker">Example output</p>
                  <h2>Structured prompt preview</h2>
                  <p>This is the kind of structure PromptBuddy creates before you copy it into your AI tool.</p>
                </div>
              </div>

              <div className="sample-output">
                <div>
                  <span>Role</span>
                  <p>You are an expert UX copywriter improving landing page clarity for a SaaS product.</p>
                </div>
                <div>
                  <span>Task</span>
                  <p>Rewrite the page message so a first-time visitor understands the product, outcome, and next action.</p>
                </div>
                <div>
                  <span>Constraints</span>
                  <ul>
                    <li>Keep the tone professional and direct.</li>
                    <li>Avoid vague AI marketing language.</li>
                    <li>Return concise sections with clear labels.</li>
                  </ul>
                </div>
                <div>
                  <span>Output format</span>
                  <p>Markdown with headline, subhead, CTA, and three supporting bullets.</p>
                </div>
              </div>

              <div className="empty-preview__checks">
                <span><strong>92%</strong> Role clarity</span>
                <span><strong>Excellent</strong> Structure</span>
                <span><strong>Strong</strong> Constraint coverage</span>
                <span><strong>High</strong> Readability</span>
              </div>
            </div>
          )}
        </aside>
      </div>

      <PromptLibrary isOpen={showLibrary} onClose={() => setShowLibrary(false)} onLoadPrompt={handleLoadPrompt} />
      {showPresets && <PresetSelector onSelectPreset={handleApplyPreset} onClose={() => setShowPresets(false)} />}
    </section>
  );
};

export default PromptGenerator;
