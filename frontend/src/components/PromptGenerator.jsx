import React, { useState, useEffect, useCallback } from 'react';
import PromptOutput from './PromptOutput';
import PromptLibrary from './PromptLibrary';
import PresetSelector from './PresetSelector';
import { getSuggestions } from '../utils/suggestions';
import { addToHistory } from '../utils/storage';

const PromptGenerator = () => {
  const [basePrompt, setBasePrompt] = useState('');
  const [intent, setIntent] = useState('instruction');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('basic');
  const [suggestions, setSuggestions] = useState([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  // Update suggestions when base prompt changes
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
  // Organized prompt types by category
  const promptCategories = {
    basic: {
      label: 'Basic',
      types: [
        { value: 'instruction', label: 'Instruction', icon: '', desc: 'Direct, actionable instructions' },
        { value: 'contextual', label: 'Contextual', icon: '', desc: 'Context-enriched prompts' },
        { value: 'role_based', label: 'Role-Based', icon: '', desc: 'Expert persona approach' },
      ]
    },
    shots: {
      label: 'Shot-Based',
      types: [
        { value: 'zero_shot', label: 'Zero-Shot', icon: '', desc: 'No examples, pure reasoning' },
        { value: 'one_shot', label: 'One-Shot', icon: '', desc: 'Single example pattern' },
        { value: 'few_shot', label: 'Few-Shot', icon: '', desc: 'Multiple examples for learning' },
      ]
    },
    reasoning: {
      label: 'Reasoning',
      types: [
        { value: 'chain_of_thought', label: 'Chain-of-Thought', icon: '', desc: 'Step-by-step reasoning' },
        { value: 'self_consistency', label: 'Self-Consistency', icon: '', desc: 'Multiple reasoning paths' },
        { value: 'socratic', label: 'Socratic', icon: '', desc: 'Guided questioning method' },
      ]
    },
    structured: {
      label: 'Structured',
      types: [
        { value: 'template', label: 'Template', icon: '', desc: 'Schema-based format' },
        { value: 'goal_oriented', label: 'Goal-Oriented', icon: '', desc: 'Objective-focused' },
        { value: 'constraint_based', label: 'Constraint-Based', icon: '', desc: 'Within boundaries' },
      ]
    },
    advanced: {
      label: 'Advanced',
      types: [
        { value: 'meta_prompt', label: 'Meta-Prompt', icon: '', desc: 'Prompts about prompts' },
        { value: 'refinement', label: 'Refinement', icon: '', desc: 'Iterative improvement' },
        { value: 'evaluation', label: 'Evaluation', icon: '', desc: 'Judge and score content' },
      ]
    },
    collaborative: {
      label: 'Collaborative',
      types: [
        { value: 'multi_agent', label: 'Multi-Agent', icon: '', desc: 'AI team roles' },
        { value: 'delegation', label: 'Delegation', icon: '', desc: 'Subtask breakdown' },
        { value: 'planning', label: 'Planning', icon: '', desc: 'Strategy-first structure' },
      ]
    },
    creative: {
      label: 'Creative',
      types: [
        { value: 'creative', label: 'Creative', icon: '', desc: 'Story, art, ideation' },
        { value: 'transformation', label: 'Transformation', icon: '', desc: 'Convert X to Y' },
        { value: 'retrieval_augmented', label: 'RAG', icon: '', desc: 'With external data' },
      ]
    }
  };


  // Flatten for easy lookup
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base_prompt: basePrompt,
          intent: intent
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate prompt');
      }

      setResult(data);

      // Save to history
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

  // Keyboard shortcut: Ctrl+Enter to generate
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

  // Load prompt from library
  const handleLoadPrompt = (prompt) => {
    setBasePrompt(prompt.basePrompt);
    if (prompt.promptType) {
      setIntent(prompt.promptType);
      // Find and set the active category
      for (const [catKey, cat] of Object.entries(promptCategories)) {
        if (cat.types.some(t => t.value === prompt.promptType)) {
          setActiveCategory(catKey);
          break;
        }
      }
    }
  };

  // Apply preset
  const handleApplyPreset = (preset) => {
    setBasePrompt(preset.basePrompt);
    setIntent(preset.promptType);
    // Find and set the active category
    for (const [catKey, cat] of Object.entries(promptCategories)) {
      if (cat.types.some(t => t.value === preset.promptType)) {
        setActiveCategory(catKey);
        break;
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card hover-lift p-8 animate-fadeIn">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Generate Optimized Prompts
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLibrary(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Library
              </button>
              <button
                type="button"
                onClick={() => setShowPresets(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                Presets
              </button>
            </div>
          </div>
          <p className="text-gray-600 text-lg">
            Enter your base prompt and select the intended use case to get an <span className="font-semibold text-purple-600">AI-optimized</span>, refined prompt.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Base Prompt Input */}
          <div>
            <label
              htmlFor="base-prompt"
              className="block text-sm font-semibold text-gray-700 mb-3 flex items-center"
            >
              <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Base Prompt
            </label>
            <textarea
              id="base-prompt"
              value={basePrompt}
              onChange={(e) => setBasePrompt(e.target.value)}
              placeholder="e.g., 'Create a website for a coffee shop' or 'Design a logo for a tech startup'..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 resize-none hover:border-gray-300 transition-all"
              rows="4"
              required
            />

            {/* Smart Suggestions */}
            {suggestions.length > 0 && (
              <div className="mt-3 animate-fadeIn">
                <p className="text-xs text-gray-500 mb-2">Suggested prompt types based on your input:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setIntent(suggestion.type);
                        // Find the category for this type and set it active
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
                      {intentOptions.find(o => o.value === suggestion.type)?.icon} {intentOptions.find(o => o.value === suggestion.type)?.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Prompt Type Selection */}
          <div>
            <label
              htmlFor="intent"
              className="block text-sm font-semibold text-gray-700 mb-3 flex items-center"
            >
              <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Prompt Structure Type
            </label>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-4 w-full">
              {Object.entries(promptCategories).map(([key, category]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveCategory(key)}
                  className={`flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeCategory === key
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {/* Prompt Types for Active Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              {promptCategories[activeCategory].types.map((option) => (
                <label
                  key={option.value}
                  className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 ${intent === option.value
                    ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 shadow-md'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/30'
                    }`}
                >
                  <input
                    type="radio"
                    name="intent"
                    value={option.value}
                    checked={intent === option.value}
                    onChange={(e) => setIntent(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center mb-1">
                    <span className="text-xl mr-2">{option.icon}</span>
                    <span className="text-sm font-semibold">{option.label}</span>
                  </div>
                  <span className="text-xs text-gray-500">{option.desc}</span>
                </label>
              ))}
            </div>

            {/* Selected Type Display */}
            <div className="mt-3 px-3 py-2 bg-purple-50 rounded-lg border border-purple-200">
              <span className="text-xs text-purple-600 font-medium">
                Selected: {intentOptions.find(o => o.value === intent)?.icon} {intentOptions.find(o => o.value === intent)?.label}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={isLoading || !basePrompt.trim()}
              className={`flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-xl text-white transition-all duration-200 btn-glow ${isLoading || !basePrompt.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  AI is optimizing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Optimize with AI
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="flex-shrink-0 inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-base font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-105"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Output Section */}
      {result && (
        <div className="mt-8">
          <PromptOutput
            result={result}
            intentOptions={intentOptions}
          />
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
