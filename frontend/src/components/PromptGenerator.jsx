import React, { useState, useEffect, useCallback } from 'react';
import PromptOutput from './PromptOutput';
import PromptLibrary from './PromptLibrary';
import PresetSelector from './PresetSelector';
import { getSuggestions } from '../utils/suggestions';
import { addToHistory } from '../utils/storage';

const PromptGenerator = () => {
  const [basePrompt, setBasePrompt] = useState('');
  const [intent, setIntent] = useState('rtf');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('essentials');
  const [suggestions, setSuggestions] = useState([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (basePrompt.trim().length >= 5) {
        const newSuggestions = getSuggestions(basePrompt, 3);
        setSuggestions(newSuggestions);
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [basePrompt]);

  const promptCategories = {
    essentials: {
      label: 'Essentials',
      types: [
        { value: 'rtf', label: 'RTF', desc: 'Role · Task · Format' },
        { value: 'race', label: 'RACE', desc: 'Role · Action · Context · Expectation' },
        { value: 'ape', label: 'APE', desc: 'Action · Purpose · Expectation' },
        { value: 'tag', label: 'TAG', desc: 'Task · Audience · Goal' },
        { value: 'era', label: 'ERA', desc: 'Expectation · Role · Action' },
      ]
    },
    structured: {
      label: 'Structured',
      types: [
        { value: 'risen', label: 'RISEN', desc: 'Role · Instructions · Steps · End Goal · Narrowing' },
        { value: 'coast', label: 'COAST', desc: 'Context · Objective · Action · Scenario · Task' },
        { value: 'trace', label: 'TRACE', desc: 'Task · Role · Action · Context · Example' },
        { value: 'crispe', label: 'CRISPE', desc: 'Capacity · Role · Insight · Statement · Personality · Experiment' },
        { value: 'clear', label: 'CLEAR', desc: 'Context · Limits · Expectations · Action · Results' },
      ]
    },
    persuasion: {
      label: 'Persuasion',
      types: [
        { value: 'pastor', label: 'PASTOR', desc: 'Problem · Amplify · Story · Transformation · Offer · Response' },
        { value: 'bab', label: 'BAB', desc: 'Before · After · Bridge' },
        { value: 'aida', label: 'AIDA', desc: 'Attention · Interest · Desire · Action' },
        { value: 'peel', label: 'PEEL', desc: 'Point · Evidence · Explain · Link' },
      ]
    },
    problem_solving: {
      label: 'Problem-Solving',
      types: [
        { value: 'scqa', label: 'SCQA', desc: 'Situation · Complication · Question · Answer' },
        { value: 'grow', label: 'GROW', desc: 'Goal · Reality · Options · Will' },
        { value: 'star', label: 'STAR', desc: 'Situation · Task · Action · Result' },
        { value: 'par', label: 'PAR', desc: 'Problem · Action · Result' },
        { value: 'care', label: 'CARE', desc: 'Context · Action · Result · Example' },
      ]
    },
    analysis: {
      label: 'Analysis',
      types: [
        { value: 'smart', label: 'SMART', desc: 'Specific · Measurable · Achievable · Relevant · Time-bound' },
        { value: 'ice', label: 'ICE', desc: 'Idea · Context · Execution' },
        { value: '5w1h', label: '5W1H', desc: 'Who · What · When · Where · Why · How' },
      ]
    },
  };

  const intentOptions = Object.values(promptCategories).flatMap(cat => cat.types);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!basePrompt.trim()) {
      setError('Please enter a base prompt');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_prompt: basePrompt, intent })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Failed to generate prompt');
      }

      setResult(data);
      addToHistory({
        basePrompt: data.original_prompt,
        promptType: data.intent,
        optimizedPrompt: data.optimized_prompt,
      });
    } catch (err) {
      setError(err.message || 'Failed to connect to the server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'Enter' && basePrompt.trim()) {
        handleSubmit();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [basePrompt, intent]);

  const handleClear = () => {
    setBasePrompt('');
    setResult(null);
    setError('');
  };

  const handleLoadPrompt = (prompt) => {
    setBasePrompt(prompt.basePrompt);
    if (prompt.promptType) {
      setIntent(prompt.promptType);
      for (const [catKey, cat] of Object.entries(promptCategories)) {
        if (cat.types.some(t => t.value === prompt.promptType)) {
          setActiveCategory(catKey);
          break;
        }
      }
    }
  };

  const handleApplyPreset = (preset) => {
    setBasePrompt(preset.basePrompt);
    setIntent(preset.promptType);
    for (const [catKey, cat] of Object.entries(promptCategories)) {
      if (cat.types.some(t => t.value === preset.promptType)) {
        setActiveCategory(catKey);
        break;
      }
    }
  };

  return (
    <div className="generator-card">
      <div className="card animate-fadeIn">
        {/* Header */}
        <div className="generator-header">
          <div className="generator-header__top">
            <h2 className="generator-header__title">Generate Optimized Prompts</h2>
            <div className="generator-header__actions">
              <button
                type="button"
                onClick={() => setShowLibrary(true)}
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', fontSize: '0.8rem' }}
              >
                <svg className="w-4 h-4" style={{ flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Library
              </button>
              <button
                type="button"
                onClick={() => setShowPresets(true)}
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', fontSize: '0.8rem' }}
              >
                <svg className="w-4 h-4" style={{ flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                Presets
              </button>
            </div>
          </div>
          <p className="generator-header__desc">
            Enter your base prompt and select a framework to get an <strong style={{ color: 'rgb(var(--color-primary))' }}>AI-optimized</strong> prompt.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Textarea */}
          <div>
            <label
              htmlFor="base-prompt"
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}
            >
              <svg className="w-4 h-4" style={{ color: 'rgb(var(--color-primary))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Base Prompt
            </label>
            <textarea
              id="base-prompt"
              value={basePrompt}
              onChange={(e) => setBasePrompt(e.target.value)}
              placeholder="e.g., 'Create a website for a coffee shop' or 'Help me debug this React component'..."
              className="prompt-textarea"
              rows="4"
              required
            />

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="animate-fadeIn" style={{ marginTop: '0.75rem' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Suggested frameworks:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setIntent(suggestion.type);
                        for (const [catKey, cat] of Object.entries(promptCategories)) {
                          if (cat.types.some(t => t.value === suggestion.type)) {
                            setActiveCategory(catKey);
                            break;
                          }
                        }
                      }}
                      className={`suggestion-chip ${intent === suggestion.type ? 'ring-2 ring-purple-500' : ''}`}
                      title={suggestion.reason}
                    >
                      {intentOptions.find(o => o.value === suggestion.type)?.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Framework Selection */}
          <div>
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}
            >
              <svg className="w-4 h-4" style={{ color: 'rgb(var(--color-primary))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Prompt Framework
            </label>

            {/* Category Tabs */}
            <div className="category-tabs">
              {Object.entries(promptCategories).map(([key, category]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveCategory(key)}
                  className={`category-tab ${activeCategory === key ? 'category-tab--active' : ''}`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {/* Framework Cards */}
            <div className="framework-grid">
              {promptCategories[activeCategory].types.map((option) => (
                <label
                  key={option.value}
                  className={`framework-card ${intent === option.value ? 'framework-card--active' : ''}`}
                >
                  <input
                    type="radio"
                    name="intent"
                    value={option.value}
                    checked={intent === option.value}
                    onChange={(e) => setIntent(e.target.value)}
                    className="sr-only"
                  />
                  <span className="framework-card__label">{option.label}</span>
                  <span className="framework-card__desc">{option.desc}</span>
                </label>
              ))}
            </div>

            {/* Selected Indicator */}
            <div className="selected-indicator">
              Selected: {intentOptions.find(o => o.value === intent)?.label} — {intentOptions.find(o => o.value === intent)?.desc}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="error-box">
              <svg className="w-5 h-5 error-box__icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="error-box__text">{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-row">
            <button
              type="submit"
              disabled={isLoading || !basePrompt.trim()}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem 1.5rem', fontSize: '0.9rem', flex: 1 }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin" style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  AI is optimizing...
                </>
              ) : (
                <>
                  <svg style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Optimize with AI
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}
            >
              <svg style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Output */}
      {result && (
        <div style={{ marginTop: '2rem' }}>
          <PromptOutput result={result} intentOptions={intentOptions} />
        </div>
      )}

      {/* Modals */}
      <PromptLibrary
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        onLoadPrompt={handleLoadPrompt}
      />
      {showPresets && (
        <PresetSelector
          onSelectPreset={handleApplyPreset}
          onClose={() => setShowPresets(false)}
        />
      )}
    </div>
  );
};

export default PromptGenerator;
