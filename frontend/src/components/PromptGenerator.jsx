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
import {
  Code2,
  Sliders,
  Play,
  RotateCcw,
  SlidersHorizontal,
  FolderArchive,
  Variable,
  AlertCircle,
  Cpu,
  Terminal,
  FileCode
} from 'lucide-react';

const examplePrompts = [
  'Turn these rough meeting notes into an executive action plan with owners, milestones, and risk factors',
  'Draft a high-converting enterprise B2B sales email sequence introducing an automated compliance auditing platform',
  'Audit this React TypeScript component for performance bottlenecks, accessibility WCAG compliance, and edge cases',
];

const exampleSkillPrompts = [
  'Create a Next.js 15 App Router architecture auditor skill that validates server actions, client boundaries, and streaming boundaries',
  'Architect a FastAPI production testing skill that generates pytest test suites with async fixtures and 100% branch coverage',
  'Build an automated security code reviewer skill that scans git diffs for injection flaws, auth leakage, and missing sanitization',
  'Design a PostgreSQL migration skill that verifies zero-downtime schema changes, index safety, and rollback procedures',
];

const outputFormats = ['Markdown', 'JSON Schema', 'Step-by-step', 'Checklist', 'Table', 'Python Dict'];
const toneOptions = ['Direct & Executive', 'Technical & Precise', 'Analytical', 'Persuasive', 'Objective & Neutral'];
const depthOptions = ['Concise & High-Signal', 'Balanced', 'Exhaustive & Detailed'];

const PromptGenerator = ({ externalCommand }) => {
  const settings = getSettings();
  const [studioMode, setStudioMode] = useState('prompt'); // 'prompt' | 'skill'
  const [basePrompt, setBasePrompt] = useState('');
  const [audience, setAudience] = useState('');
  const [constraints, setConstraints] = useState('');
  const [format, setFormat] = useState('Markdown');
  const [tone, setTone] = useState('Direct & Executive');
  const [depth, setDepth] = useState('Balanced');
  const [intent, setIntent] = useState(settings.defaultPromptType || 'rtf');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState(getFrameworkCategory(intent) || 'essentials');
  const [suggestions, setSuggestions] = useState([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [variableValues, setVariableValues] = useState({});
  const abortRef = useRef(null);

  const handleImportSkill = (skillData) => {
    setStudioMode('skill');
    setIntent('agent_skill');
    setActiveCategory('agentic');
    setFormat('Markdown');
    setTone('Technical & Precise');
    if (typeof skillData === 'string') {
      setBasePrompt(skillData);
    } else if (skillData?.prompt) {
      setBasePrompt(skillData.prompt);
    }
    setError('');
  };

  useEffect(() => {
    if (!externalCommand) return;
    if (externalCommand.type === 'framework') {
      selectFramework(externalCommand.value);
    } else if (externalCommand.type === 'preset') {
      handleApplyPreset(externalCommand.value);
    } else if (externalCommand.type === 'open_library') {
      setShowLibrary(true);
    } else if (externalCommand.type === 'open_presets') {
      setShowPresets(true);
    } else if (externalCommand.type === 'import_skill') {
      handleImportSkill(externalCommand.value);
    }
  }, [externalCommand]);

  // Sync studioMode with intent
  const handleModeSwitch = (mode) => {
    setStudioMode(mode);
    if (mode === 'skill') {
      setIntent('agent_skill');
      setActiveCategory('agentic');
      setFormat('Markdown');
      setTone('Technical & Precise');
    } else {
      if (intent === 'agent_skill') {
        setIntent(settings.defaultPromptType || 'rtf');
        setActiveCategory('essentials');
      }
    }
  };

  const selectedFramework = useMemo(() => ({
    label: getFrameworkLabel(intent),
    description: getFrameworkDescription(intent),
  }), [intent]);

  // Extract {{variable_name}} tokens
  const detectedVariables = useMemo(() => {
    const matches = basePrompt.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];
    return Array.from(new Set(matches.map(m => m.slice(2, -2))));
  }, [basePrompt]);

  const substitutedBasePrompt = useMemo(() => {
    let text = basePrompt;
    for (const varName of detectedVariables) {
      if (variableValues[varName]) {
        text = text.replaceAll(`{{${varName}}}`, variableValues[varName]);
      }
    }
    return text;
  }, [basePrompt, detectedVariables, variableValues]);

  const composedPrompt = useMemo(() => {
    const parts = [substitutedBasePrompt.trim()];
    if (audience.trim()) parts.push(`Target audience: ${audience.trim()}`);
    if (format) parts.push(`Preferred output format: ${format}`);
    if (tone) parts.push(`Tone: ${tone}`);
    if (depth) parts.push(`Depth: ${depth}`);
    if (constraints.trim()) parts.push(`Execution constraints: ${constraints.trim()}`);
    return parts.filter(Boolean).join('\n');
  }, [audience, constraints, depth, format, substitutedBasePrompt, tone]);

  const estTokens = Math.round(composedPrompt.length / 4);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSuggestions(basePrompt.trim().length >= 8 && studioMode !== 'skill' ? getSuggestions(basePrompt, 3) : []);
    }, 250);
    return () => clearTimeout(timer);
  }, [basePrompt, studioMode]);

  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    const trimmedPrompt = composedPrompt.trim();
    if (!basePrompt.trim()) {
      setError(
        studioMode === 'skill'
          ? 'Please enter an agent workflow specification or select an example skill below.'
          : 'Please provide a source request or choose a sample prompt below.'
      );
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
      const response = await fetch(`${API_URL}/generate/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_prompt: trimmedPrompt, intent }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || errData.error || 'Optimization request failed');
      }

      let text = '';
      let model = 'AI Model';
      let reqId = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      setResult({
        original_prompt: trimmedPrompt,
        intent,
        optimized_prompt: '',
        ai_model: 'Architecting...',
        isStreaming: true,
      });

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.token) {
                text += data.token;
                model = data.model || model;
                reqId = data.request_id || reqId;
                setResult(prev => ({
                  ...prev,
                  optimized_prompt: text,
                  ai_model: model,
                  request_id: reqId,
                  isStreaming: true,
                }));
              } else if (data.done) {
                reqId = data.request_id || reqId;
                model = data.model || model;
                const finalResult = {
                  original_prompt: trimmedPrompt,
                  intent,
                  optimized_prompt: text,
                  ai_model: model,
                  request_id: reqId,
                  latency_ms: data.latency_ms || 0,
                  isStreaming: false,
                };
                setResult(finalResult);
                if (getSettings().autoSaveHistory !== false && text.trim()) {
                  addToHistory({
                    basePrompt: trimmedPrompt,
                    promptType: intent,
                    optimizedPrompt: text,
                    aiModel: model,
                    requestId: reqId,
                  });
                }
              }
            } catch (err) {
              // Ignore partial JSON parse
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to connect to the backend API');
      }
    } finally {
      if (abortRef.current === controller) {
        setIsLoading(false);
        abortRef.current = null;
      }
    }
  }, [basePrompt, composedPrompt, intent, studioMode]);

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
    setActiveCategory(getFrameworkCategory(type) || 'essentials');
    if (type === 'agent_skill') {
      setStudioMode('skill');
    }
  };

  const handleClear = () => {
    abortRef.current?.abort();
    setBasePrompt('');
    setAudience('');
    setConstraints('');
    setFormat('Markdown');
    setTone(studioMode === 'skill' ? 'Technical & Precise' : 'Direct & Executive');
    setDepth('Balanced');
    setResult(null);
    setError('');
    setVariableValues({});
  };

  const handleLoadPrompt = (prompt) => {
    setBasePrompt(prompt.basePrompt || '');
    setAudience('');
    setConstraints('');
    if (prompt.promptType) {
      selectFramework(prompt.promptType);
      if (prompt.promptType === 'agent_skill') {
        setStudioMode('skill');
      }
    }
    if (prompt.optimizedPrompt) {
      setResult({
        original_prompt: prompt.basePrompt,
        intent: prompt.promptType,
        optimized_prompt: prompt.optimizedPrompt,
        aiModel: prompt.aiModel,
      });
    }
  };

  const handleApplyPreset = (preset) => {
    setBasePrompt(preset.basePrompt);
    selectFramework(preset.promptType);
    if (preset.promptType === 'agent_skill') {
      setStudioMode('skill');
    }
  };

  const handleFillSampleVariables = () => {
    const samples = {};
    for (const v of detectedVariables) {
      samples[v] = `Acme_${v}`;
    }
    setVariableValues(samples);
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Studio Header Ribbon with Dual Mode Switcher */}
      <div style={{
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        paddingBottom: '0.875rem',
        borderBottom: '1px solid var(--hairline)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--ink-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              {studioMode === 'skill' ? 'AI IDE Skill Architect' : 'Prompt Studio Workbench'}
            </h1>
            <span className="card-badge" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
              {studioMode === 'skill' ? 'SKILL.md FORMAT' : 'ENTERPRISE LLM'}
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', margin: 0 }}>
            {studioMode === 'skill'
              ? 'Formulate persistent, executable Agent Skills (SKILL.md) with YAML frontmatter, activation triggers, and guardrails for modern AI IDEs.'
              : 'Transform informal instructions, tickets, and drafts into production-ready structured LLM prompts for chatbots and APIs.'}
          </p>
        </div>

        {/* Dual Mode Switcher & Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Segmented Mode Switcher */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--surface-subtle)',
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px',
          }}>
            <button
              type="button"
              onClick={() => handleModeSwitch('prompt')}
              className={`btn btn-sm ${studioMode === 'prompt' ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.625rem',
                borderRadius: 'var(--radius-xs)',
                height: 'auto',
              }}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Prompt Studio</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('skill')}
              className={`btn btn-sm ${studioMode === 'skill' ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.625rem',
                borderRadius: 'var(--radius-xs)',
                height: 'auto',
              }}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>AI IDE Skill Mode</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowPresets(true)}
            className="btn btn-secondary btn-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Presets</span>
          </button>
          <button
            type="button"
            onClick={() => setShowLibrary(true)}
            className="btn btn-secondary btn-sm"
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>Library</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Split Workspace */}
      <div className="workbench-layout">
        {/* Left Column: Studio Composer */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Panel 1: Source Request Terminal */}
          <div className="enterprise-card">
            <div className="card-header-strip">
              <div className="card-title-group">
                {studioMode === 'skill' ? (
                  <Terminal className="w-4 h-4 text-zinc-700" />
                ) : (
                  <Code2 className="w-4 h-4 text-zinc-700" />
                )}
                <h2>
                  {studioMode === 'skill' ? 'Agent Skill Workflow Specification' : 'Source Request'}
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`card-badge tabular-nums ${composedPrompt.length > 7200 ? 'text-amber-600' : ''}`}>
                  {composedPrompt.length} / 8000 chars &bull; ~{estTokens} tokens
                </span>
              </div>
            </div>

            <div className="card-body" style={{ padding: '0.875rem' }}>
              <div className="source-terminal-wrapper">
                <textarea
                  id="base-prompt"
                  value={basePrompt}
                  onChange={(e) => setBasePrompt(e.target.value)}
                  placeholder={
                    studioMode === 'skill'
                      ? 'Define the agent workflow, tool interactions, and constraints (e.g. Audit React components for performance leaks and generate Vitest tests with 0 errors)...'
                      : 'Enter raw request, prompt draft, user ticket, or template with {{variables}}... (e.g., Audit {{app_name}} for security vulnerabilities)'
                  }
                  className="source-terminal-textarea"
                  rows={8}
                  required
                />

                <div className="source-terminal-footer">
                  <span>Press <span className="kbd">Ctrl</span> + <span className="kbd">Enter</span> to {studioMode === 'skill' ? 'architect skill' : 'optimize'}</span>
                  {basePrompt && (
                    <button
                      type="button"
                      onClick={() => setBasePrompt('')}
                      style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', fontSize: '0.725rem' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Dynamic Variable Manager */}
              {detectedVariables.length > 0 && (
                <div className="variable-matrix-panel">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-secondary)' }}>
                      <Variable className="w-3.5 h-3.5" />
                      <span>Template Variables ({detectedVariables.length})</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleFillSampleVariables}
                      style={{ background: 'none', border: 'none', color: 'var(--ink-body)', cursor: 'pointer', fontSize: '0.7rem', textDecoration: 'underline' }}
                    >
                      Fill Sample Values
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(13rem, 1fr))', gap: '0.5rem' }}>
                    {detectedVariables.map((varName) => (
                      <div key={varName} className="variable-row">
                        <span className="variable-label-pill">{`{{${varName}}}`}</span>
                        <input
                          type="text"
                          value={variableValues[varName] || ''}
                          onChange={(e) => setVariableValues(prev => ({ ...prev, [varName]: e.target.value }))}
                          placeholder={`Value...`}
                          className="variable-input-field"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sample Starters */}
              {!basePrompt && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <span style={{ fontSize: '0.725rem', color: 'var(--ink-muted)', fontWeight: 500 }}>
                    {studioMode === 'skill' ? 'Sample AI IDE Agent Skills:' : 'Quick Starters:'}
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {(studioMode === 'skill' ? exampleSkillPrompts : examplePrompts).map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => setBasePrompt(example)}
                        style={{
                          padding: '0.3rem 0.5rem',
                          borderRadius: 'var(--radius-xs)',
                          border: '1px solid var(--hairline)',
                          background: 'var(--surface-subtle)',
                          color: 'var(--ink-body)',
                          fontSize: '0.725rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          lineHeight: '1.3'
                        }}
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions (only in prompt mode) */}
              {suggestions.length > 0 && studioMode !== 'skill' && (
                <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--surface-subtle)', border: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.725rem', color: 'var(--ink-muted)', fontWeight: 600 }}>Suggested:</span>
                  {suggestions.map((sug) => (
                    <button
                      key={sug.type}
                      type="button"
                      onClick={() => selectFramework(sug.type)}
                      className={`btn btn-sm ${intent === sug.type ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                      title={sug.reason}
                    >
                      {getFrameworkLabel(sug.type)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Panel 2: Framework / Specification Selector */}
          <div className="enterprise-card">
            <div className="card-header-strip">
              <div className="card-title-group">
                <Sliders className="w-4 h-4 text-zinc-700" />
                <h2>Specification &bull; {selectedFramework.label}</h2>
              </div>
              <span className="card-badge">{selectedFramework.description}</span>
            </div>

            <div className="card-body" style={{ padding: '0.875rem' }}>
              {/* Category Segment Tabs */}
              <div className="framework-tabs-header">
                {Object.entries(frameworkCategories).map(([key, category]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setActiveCategory(key);
                      if (key === 'agentic') {
                        setStudioMode('skill');
                      }
                    }}
                    className={`framework-tab-btn ${activeCategory === key ? 'framework-tab-btn--active' : ''}`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              {/* Grid of Framework Cards */}
              <div className="framework-grid">
                {frameworkCategories[activeCategory]?.types.map((option) => {
                  const isSelected = intent === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => selectFramework(option.value)}
                      className={`framework-card-btn ${isSelected ? 'framework-card-btn--active' : ''}`}
                    >
                      <span className="framework-card-badge">{option.label}</span>
                      <span className="framework-card-desc">{option.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Panel 3: Execution Controls */}
          <div className="enterprise-card">
            <div className="card-header-strip">
              <div className="card-title-group">
                <Sliders className="w-4 h-4 text-zinc-700" />
                <h2>Execution Controls</h2>
              </div>
              <span className="card-badge">Target Parameters</span>
            </div>

            <div className="card-body" style={{ padding: '0.875rem' }}>
              <div className="param-grid">
                <div className="param-field">
                  <label className="param-label" htmlFor="param-audience">
                    {studioMode === 'skill' ? 'Target AI IDE' : 'Target Audience'}
                  </label>
                  <input
                    id="param-audience"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder={
                      studioMode === 'skill'
                        ? 'e.g., Google Antigravity, Cursor, Claude Code, Windsurf'
                        : 'e.g., Enterprise CTO, Security Auditor'
                    }
                    className="param-input"
                  />
                </div>

                <div className="param-field">
                  <label className="param-label" htmlFor="param-format">Output Format</label>
                  <select
                    id="param-format"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="param-select"
                  >
                    {outputFormats.map(fmt => <option key={fmt}>{fmt}</option>)}
                  </select>
                </div>

                <div className="param-field">
                  <label className="param-label" htmlFor="param-tone">Tone / Stance</label>
                  <select
                    id="param-tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="param-select"
                  >
                    {toneOptions.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div className="param-field">
                  <label className="param-label" htmlFor="param-depth">Depth Level</label>
                  <select
                    id="param-depth"
                    value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                    className="param-select"
                  >
                    {depthOptions.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="param-field" style={{ marginTop: '0.75rem' }}>
                <label className="param-label" htmlFor="param-constraints">
                  {studioMode === 'skill' ? 'Agent Guardrails & Safety Constraints' : 'Execution Constraints / Guardrails'}
                </label>
                <input
                  id="param-constraints"
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  placeholder={
                    studioMode === 'skill'
                      ? 'e.g., Never modify files without verification, run test suite after edits, zero regression policy'
                      : 'e.g., No hallucinated citations, include worst-case failure modes, cite uncertainty'
                  }
                  className="param-input"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--semantic-error-subtle)',
              border: '1px solid var(--semantic-error-border)',
              color: 'var(--semantic-error)',
              fontSize: '0.8125rem'
            }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={isLoading || !basePrompt.trim()}
              className="btn btn-primary"
              style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {isLoading
                  ? (studioMode === 'skill' ? 'Architecting Skill...' : 'Optimizing Prompt...')
                  : (studioMode === 'skill' ? 'Architect Agent SKILL.md' : 'Optimize Prompt')}
              </span>
              <span className="kbd" style={{ background: '#27272a', borderColor: '#3f3f46', color: '#d4d4d8', marginLeft: '0.25rem' }}>
                Ctrl Enter
              </span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="btn btn-secondary"
              style={{ padding: '0.625rem 0.875rem' }}
              title="Reset form"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </form>

        {/* Right Column: Studio Output & Evaluation Inspector */}
        <div>
          {isLoading ? (
            <div className="enterprise-card" style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                border: '2px solid var(--hairline)',
                borderTopColor: 'var(--primary)',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 1rem auto'
              }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink-primary)', marginBottom: '0.25rem' }}>
                {studioMode === 'skill' ? 'Architecting Agent SKILL.md' : 'Optimizing Prompt Structure'}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', maxWidth: '24rem', margin: '0 auto' }}>
                Applying <strong>{selectedFramework.label}</strong> specifications, frontmatter triggers, and verification checklists...
              </p>
            </div>
          ) : result ? (
            <PromptOutput
              result={result}
              intentOptions={frameworkOptions}
              onUpdatePrompt={(newPrompt) => setResult(prev => prev ? ({ ...prev, optimized_prompt: newPrompt }) : null)}
            />
          ) : (
            <div className="enterprise-card">
              <div className="card-header-strip">
                <div className="card-title-group">
                  {studioMode === 'skill' ? (
                    <FileCode className="w-4 h-4 text-zinc-700" />
                  ) : (
                    <Code2 className="w-4 h-4 text-zinc-700" />
                  )}
                  <h2>
                    {studioMode === 'skill' ? 'Agent Skill Preview (SKILL.md)' : 'Production Prompt Preview'}
                  </h2>
                </div>
                <span className="card-badge">Sample Specification</span>
              </div>

              <div className="card-body" style={{ padding: '1.25rem' }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginBottom: '1rem', lineHeight: '1.5' }}>
                  {studioMode === 'skill'
                    ? 'PromptBuddy generates standardized SKILL.md documents with YAML frontmatter, activation triggers, procedures, and guardrails for modern AI IDEs.'
                    : 'PromptBuddy formulates prompt architecture designed for high reasoning fidelity, reliable JSON generation, and zero retry overhead.'}
                </p>

                <div className="output-code-container" style={{ maxHeight: '20rem' }}>
                  {studioMode === 'skill' ? (
`---
name: code-reviewer-agent
description: "Activates when the user asks to review, audit, or verify pull requests, code changes, or system architecture."
version: 1.0.0
---

# Code Reviewer Agent

## When to Activate
- When the user asks to: "review PR", "audit code", "check for vulnerabilities"
- Keywords & Triggers: \`audit\`, \`review\`, \`security\`, \`refactor\`

## Core Workflow & Procedure
1. **Analyze Repository State & Git Diff**
   - Review touched files and dependencies.
   - Verify compatibility against current runtime.

2. **Execute In-Depth Inspection**
   - Check for security vulnerabilities, SQL injections, and auth leaks.
   - Verify performance bottlenecks, memory leaks, and edge conditions.

3. **Verify & Validate**
   - Run tests and lint checks.
   - Ensure zero regressions before concluding.

## Operational Guardrails & Constraints
- Never approve breaking changes without explicit migration plans.
- Provide actionable, minimal line diffs for required fixes.`
                  ) : (
`# ROLE & CONTEXT
You are a Staff Security Architect auditing enterprise cloud configurations.

# OBJECTIVE
Identify configuration drift, IAM privilege escalation paths, and missing egress controls.

# EXECUTION STEPS
1. Enumerate all external ingress points.
2. Validate least-privilege role bindings against CIS benchmarks.
3. Provide remediation JSON patches for all high-severity findings.

# CONSTRAINTS & FORMAT
- Return structured output conforming strictly to RFC 8259 JSON.
- Cite specific CIS control numbers for each violation.
- Flag any ambiguous assumptions explicitly.`
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '1rem' }}>
                  <div className="scorecard-metric-card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Structure</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink-primary)' }}>100%</div>
                  </div>
                  <div className="scorecard-metric-card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Frontmatter</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink-primary)' }}>Valid</div>
                  </div>
                  <div className="scorecard-metric-card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', textTransform: 'uppercase' }}>IDE Ready</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink-primary)' }}>Yes</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <PromptLibrary isOpen={showLibrary} onClose={() => setShowLibrary(false)} onLoadPrompt={handleLoadPrompt} />
      {showPresets && <PresetSelector onSelectPreset={handleApplyPreset} onClose={() => setShowPresets(false)} />}
    </div>
  );
};

export default PromptGenerator;
