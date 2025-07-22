import React, { useState } from 'react';

const PromptOutput = ({ originalPrompt, refinedPrompt, intent, intentOptions }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(refinedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getIntentLabel = (intentValue) => {
    const option = intentOptions.find(opt => opt.value === intentValue);
    return option ? option.label : intentValue;
  };

  const getIntentIcon = (intentValue) => {
    const option = intentOptions.find(opt => opt.value === intentValue);
    return option ? option.icon : '📝';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
        <h3 className="text-xl font-semibold text-white flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Generated Prompt
        </h3>
      </div>
      
      <div className="p-6">
        {/* Intent Badge */}
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <span className="mr-1">{getIntentIcon(intent)}</span>
            {getIntentLabel(intent)}
          </span>
        </div>

        {/* Original Prompt */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Original Prompt:</h4>
          <div className="bg-gray-50 rounded-md p-3 border-l-4 border-gray-300">
            <p className="text-sm text-gray-600 italic">"{originalPrompt}"</p>
          </div>
        </div>

        {/* Refined Prompt */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Refined Prompt:</h4>
            <button
              onClick={copyToClipboard}
              className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md transition-colors duration-200 ${
                copied
                  ? 'text-green-700 bg-green-100 hover:bg-green-200'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md p-4 border-l-4 border-blue-400">
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {refinedPrompt}
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Original Length</div>
            <div className="text-lg font-semibold text-gray-900">{originalPrompt.length} chars</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Refined Length</div>
            <div className="text-lg font-semibold text-gray-900">{refinedPrompt.length} chars</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptOutput;
