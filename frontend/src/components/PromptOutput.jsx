import React, { useState, useEffect } from 'react';
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
          <span style={{ color: 'rgb(var(--color-accent))', marginTop: '0.375rem', fontSize: '0.375rem' }}>●</span>
          <span className="prose-sm" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: inlineMd(content) }} />
        </div>
      );
      return;
    }

    const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
    if (numMatch) {
      elements.push(
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', margin: '0.125rem 0' }}>
          <span style={{ color: 'rgb(var(--color-primary))', fontWeight: 600, fontSize: '0.8rem', minWidth: '1.25rem' }}>{numMatch[1]}.</span>
          <span className="prose-sm" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: inlineMd(numMatch[2]) }} />
        </div>
      );
      return;
    }

    if (line.trim() === '') { elements.push(<div key={i} style={{ height: '0.5rem' }} />); return; }

    elements.push(<p key={i} className="prose-sm" dangerouslySetInnerHTML={{ __html: inlineMd(line) }} />);
  });

  return elements;
};

// Inline markdown: **bold**, *italic*, `code`
const inlineMd = (text) => {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result.optimized_prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleSave = () => {
    savePrompt({
      title: `${getIntentLabel(result.intent)} - ${result.original_prompt.substring(0, 30)}...`,
      basePrompt: result.original_prompt,
      promptType: result.intent,
      optimizedPrompt: result.optimized_prompt,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = (format) => {
    exportPrompt({
      title: getIntentLabel(result.intent),
      basePrompt: result.original_prompt,
      promptType: result.intent,
      optimizedPrompt: result.optimized_prompt,
    }, format);
    setShowExportMenu(false);
  };

  const getIntentLabel = (val) => intentOptions.find(o => o.value === val)?.label || val;

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
              <span style={{ color: 'white', fontSize: '0.8rem' }}>Quality:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: qualityScore.overall >= 70 ? 'white' : '#fde68a' }}>
                {qualityScore.grade}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>({qualityScore.overall}%)</span>
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
            <p className="original-prompt__text">"{result.original_prompt}"</p>
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
                <div style={{ width: '1.75rem', height: '1.75rem', background: '#19c37d', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: 700 }}>U</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#ececf1', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {result.optimized_prompt}
                </p>
              </div>
            </div>
          )}

          {previewMode === 'claude' && (
            <div className="output-preview output-preview--claude">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '1.5rem', height: '1.5rem', background: '#d97706', borderRadius: '50%' }}></div>
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
