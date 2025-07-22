import React, { useState } from 'react';
import PromptOutput from './PromptOutput';

const PromptGenerator = () => {
  const [basePrompt, setBasePrompt] = useState('');
  const [intent, setIntent] = useState('general_knowledge');
  const [refinedPrompt, setRefinedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const intentOptions = [
    { value: 'image_generation', label: 'Image Generation', icon: '🎨' },
    { value: 'code_generation', label: 'Code Generation', icon: '💻' },
    { value: 'research', label: 'Research', icon: '🔬' },
    { value: 'general_knowledge', label: 'General Knowledge', icon: '📚' },
    { value: 'latest_info', label: 'Latest Information', icon: '📰' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!basePrompt.trim()) {
      setError('Please enter a base prompt');
      return;
    }

    setIsLoading(true);
    setError('');
    setRefinedPrompt('');

    try {
      const response = await fetch('http://localhost:5000/generate', {
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

      setRefinedPrompt(data.refined_prompt);
    } catch (err) {
      setError(err.message || 'Failed to connect to the server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setBasePrompt('');
    setRefinedPrompt('');
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Generate Optimized Prompts
          </h2>
          <p className="text-gray-600">
            Enter your base prompt and select the intended use case to get an optimized, refined prompt.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Base Prompt Input */}
          <div>
            <label 
              htmlFor="base-prompt" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Base Prompt
            </label>
            <textarea
              id="base-prompt"
              value={basePrompt}
              onChange={(e) => setBasePrompt(e.target.value)}
              placeholder="Enter your base prompt here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="4"
              required
            />
          </div>

          {/* Intent Selection */}
          <div>
            <label 
              htmlFor="intent" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Purpose / Intent
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {intentOptions.map((option) => (
                <label
                  key={option.value}
                  className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                    intent === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
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
                  <span className="text-xl mr-3">{option.icon}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </label>
              ))}
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
              className={`flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white transition-colors duration-200 ${
                isLoading || !basePrompt.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Prompt
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={handleClear}
              className="flex-shrink-0 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      {refinedPrompt && (
        <div className="mt-8">
          <PromptOutput 
            originalPrompt={basePrompt}
            refinedPrompt={refinedPrompt}
            intent={intent}
            intentOptions={intentOptions}
          />
        </div>
      )}
    </div>
  );
};

export default PromptGenerator;
