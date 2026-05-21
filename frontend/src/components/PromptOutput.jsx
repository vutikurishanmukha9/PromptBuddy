import React, { useState, useEffect, useCallback } from 'react';
import { exportPrompt } from '../utils/exporters';
import { calculateQualityScore } from '../utils/qualityScorer';
import { savePrompt } from '../utils/storage';

// Simple markdown renderer for AI output
const renderMarkdown = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeLines = [];

  lines.forEach((line, i) => {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="prose-sm"><code>{codeLines.join('\n')}</code></pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }
    if (inCodeBlock) { codeLines.push(line); return; }

    if (line.startsWith('### ')) {
      elements.push(<h4 key={i} className="prose-sm">{line.slice(4)}</h4>);
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(<h3 key={i} className="prose-sm">{line.slice(3)}</h3>);
      return;
    }
    if (line.startsWith('# ')) {
      elements.push(<h2 key={i} className="prose-sm">{line.slice(2)}</h2>);
      return;
    }

    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const indent = line.search(/\S/);
      const content = line.trim().slice(2);
      elements.push(
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', paddingLeft: `${Math.max(0, indent) * 4}px`, margin: '0.125rem 0' }}>
          <span className="list-dot" aria-hidden="true" />
          <span className="prose-sm" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{inlineMd(content)}</span>
        </div>
      );
      return;
    }

    const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
    if (numMatch) {
      elements.push(
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', margin: '0.125rem 0' }}>
          <span style={{ color: 'rgb(var(--color-primary))', fontWeight: 600, fontSize: '0.8rem', minWidth: '1.25rem' }}>{numMatch[1]}.</span>
          <span className="prose-sm" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{inlineMd(numMatch[2])}</span>
        </div>
      );
      return;
    }

    if (line.trim() === '') { elements.push(<div key={i} style={{ height: '0.5rem' }} />); return; }

    elements.push(<p key={i} className="prose-sm">{inlineMd(line)}</p>);
  });

  return elements;
};

// Inline markdown: **bold**, *italic*, `code`
const inlineMd = (text) => {
  const parts = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${match.index}-${token}`;
    if (token.startsWith('**')) {
      parts.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      parts.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else {
      parts.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

const PromptOutput = ({ result, intentOptions }) => {
  const [copied, setCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showQualityDetails, setShowQualityDetails] = useState(false);
  const [saved, setSaved] = useState(false);
  const [qualityScore, setQualityScore] = useState(null);
  const [previewMode, setPreviewMode] = useState('default');

  const previewModes = [
    { value: 'default', label: 'Default' },
    { value: 'chatgpt', label: 'ChatGPT' },
    { value: 'claude', label: 'Claude' },
    { value: 'raw', label: 'Raw' },
  ];

  useEffect(() => {
    if (result?.optimized_prompt) {
      const score = calculateQualityScore(result.optimized_prompt);
      setQualityScore(score);
    }
  }, [result]);

  const getIntentLabel = useCallback((val) => intentOptions.find(o => o.value === val)?.label || val, [intentOptions]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result.optimized_prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, [result]);

  const handleSave = useCallback(() => {
    savePrompt({
      title: `${getIntentLabel(result.intent)} - ${result.original_prompt.substring(0, 30)}...`,
      basePrompt: result.original_prompt,
      promptType: result.intent,
      optimizedPrompt: result.optimized_prompt,
      aiModel: result.ai_model,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [getIntentLabel, result]);

  const handleExport = useCallback((format) => {
    exportPrompt({
      title: getIntentLabel(result.intent),
      basePrompt: result.original_prompt,
      promptType: result.intent,
      optimizedPrompt: result.optimized_prompt,
      aiModel: result.ai_model,
    }, format);
    setShowExportMenu(false);
  }, [getIntentLabel, result]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!result?.optimized_prompt) return;
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copyToClipboard();
      }
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleExport('markdown');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [copyToClipboard, handleExport, handleSave, result]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'rgb(var(--color-success))';
    if (score >= 60) return 'rgb(var(--color-primary))';
    if (score >= 40) return 'rgb(var(--color-warning))';
    return 'rgb(var(--color-danger))';
  };

  return (
    <div className="card animate-fadeIn" style={{ overflow: 'hidden' }}>
      {/* Green Header */}
      <div className="output-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ flex: 1 }}>
            <h3 className="output-header__title">
              <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              AI-Optimized Prompt
            </h3>
            <div className="output-header__meta">
              <span className="output-header__subtitle">Your prompt has been enhanced</span>
              {result.ai_model && (
                <span className="output-header__model">{result.ai_model}</span>
              )}
            </div>
          </div>

          {qualityScore && (
            <div
              className="quality-badge"
              onClick={() => setShowQualityDetails(!showQualityDetails)}
              title="Click for details"
            >
              <span className="quality-badge__label">Quality:</span>
              <span className={`quality-badge__grade ${qualityScore.overall >= 70 ? '' : 'quality-badge__grade--warning'}`}>
                {qualityScore.grade}
              </span>
              <span className="quality-badge__score">({qualityScore.overall}%)</span>
            </div>
          )}
        </div>
      </div>

      <div className="output-body">
        {/* Quality Breakdown */}
        {showQualityDetails && qualityScore && (
          <div className="animate-fadeIn" style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Quality Score Breakdown</h4>
            <div className="quality-breakdown">
              {Object.entries(qualityScore.breakdown).map(([key, data]) => (
                <div key={key} className="quality-breakdown__item">
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'capitalize' }}>{key}</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: getScoreColor(data.score) }}>{data.score}%</div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>{data.weight}</div>
                </div>
              ))}
            </div>
            <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{qualityScore.feedback}</p>
          </div>
        )}

        {/* Intent Badge */}
        <div style={{ marginBottom: '1rem' }}>
          <span className="intent-badge">{getIntentLabel(result.intent)}</span>
        </div>

        {/* Original Prompt */}
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <svg style={{ width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Your Input
          </h4>
          <div className="original-prompt">
            <p className="original-prompt__text">{result.original_prompt}</p>
          </div>
        </div>

        {/* Optimized Prompt */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <svg style={{ width: '0.875rem', height: '0.875rem', color: 'rgb(var(--color-primary))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI-Optimized Prompt
              </h4>

              {/* Action Buttons */}
              <div className="output-actions">
                <button
                  onClick={handleSave}
                  className={`output-actions__btn ${saved ? 'output-actions__btn--success' : ''}`}
                >
                  <svg style={{ width: '0.875rem', height: '0.875rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {saved ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    )}
                  </svg>
                  {saved ? 'Saved!' : 'Save'}
                </button>

                {/* Export */}
                <div className="export-dropdown">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="output-actions__btn"
                  >
                    <svg style={{ width: '0.875rem', height: '0.875rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export
                    <svg style={{ width: '0.625rem', height: '0.625rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showExportMenu && (
                    <div className="export-menu animate-fadeIn">
                      <button onClick={() => handleExport('markdown')}>
                        <svg style={{ width: '0.875rem', height: '0.875rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Markdown
                      </button>
                      <button onClick={() => handleExport('json')}>
                        <svg style={{ width: '0.875rem', height: '0.875rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                        JSON
                      </button>
                      <button onClick={() => handleExport('text')}>
                        <svg style={{ width: '0.875rem', height: '0.875rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                        Text
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={copyToClipboard}
                  className={`output-actions__btn ${copied ? 'output-actions__btn--success' : ''}`}
                >
                  <svg style={{ width: '0.875rem', height: '0.875rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {copied ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    )}
                  </svg>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Preview Tabs */}
            <div className="preview-tabs">
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>Preview:</span>
              {previewModes.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setPreviewMode(mode.value)}
                  className={`preview-tab ${previewMode === mode.value ? 'preview-tab--active' : ''}`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Content */}
          {previewMode === 'default' && (
            <div className="output-preview output-preview--default">
              <div className="prose-sm">
                {renderMarkdown(result.optimized_prompt)}
              </div>
            </div>
          )}

          {previewMode === 'chatgpt' && (
            <div className="output-preview output-preview--chatgpt">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div className="chatgpt-avatar">
                  <span>U</span>
                </div>
                <p className="chatgpt-preview-text">
                  {result.optimized_prompt}
                </p>
              </div>
            </div>
          )}

          {previewMode === 'claude' && (
            <div className="output-preview output-preview--claude">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div className="claude-avatar"></div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Human</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {result.optimized_prompt}
              </p>
            </div>
          )}

          {previewMode === 'raw' && (
            <div className="output-preview output-preview--raw">
              <pre style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                {result.optimized_prompt}
              </pre>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-card__label">Original</div>
            <div className="stat-card__value">{result.original_prompt.length}</div>
            <div className="stat-card__unit">chars</div>
          </div>
          <div className="stat-card" style={{ borderColor: 'rgba(var(--color-primary), 0.2)' }}>
            <div className="stat-card__label" style={{ color: 'rgb(var(--color-primary))' }}>Optimized</div>
            <div className="stat-card__value" style={{ color: 'rgb(var(--color-primary))' }}>{result.optimized_prompt.length}</div>
            <div className="stat-card__unit" style={{ color: 'rgb(var(--color-primary))' }}>chars</div>
          </div>
          <div className="stat-card" style={{ borderColor: 'rgba(var(--color-success), 0.2)' }}>
            <div className="stat-card__label" style={{ color: 'rgb(var(--color-success))' }}>Expand</div>
            <div className="stat-card__value" style={{ color: 'rgb(var(--color-success))' }}>
              {Math.round((result.optimized_prompt.length / result.original_prompt.length) * 100)}%
            </div>
            <div className="stat-card__unit" style={{ color: 'rgb(var(--color-success))' }}>growth</div>
          </div>
          {qualityScore && (
            <div className="stat-card">
              <div className="stat-card__label">Quality</div>
              <div className="stat-card__value" style={{ color: getScoreColor(qualityScore.overall) }}>
                {qualityScore.grade}
              </div>
              <div className="stat-card__unit">{qualityScore.overall}/100</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptOutput;
