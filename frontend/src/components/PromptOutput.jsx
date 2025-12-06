import React, { useState, useEffect } from 'react';
import { exportPrompt } from '../utils/exporters';
import { calculateQualityScore } from '../utils/qualityScorer';
import { savePrompt } from '../utils/storage';

const PromptOutput = ({ result, intentOptions }) => {
  const [copied, setCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showQualityDetails, setShowQualityDetails] = useState(false);
  const [saved, setSaved] = useState(false);
  const [qualityScore, setQualityScore] = useState(null);
  const [previewMode, setPreviewMode] = useState('default');

  const previewModes = [
    { value: 'default', label: 'Default', icon: '' },
    { value: 'chatgpt', label: 'ChatGPT', icon: '' },
    { value: 'claude', label: 'Claude', icon: '' },
    { value: 'raw', label: 'Raw', icon: '' },
  ];

  // Calculate quality score when result changes
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

  const getIntentLabel = (intentValue) => {
    const option = intentOptions.find(opt => opt.value === intentValue);
    return option ? option.label : intentValue;
  };

  const getIntentIcon = (intentValue) => {
    const option = intentOptions.find(opt => opt.value === intentValue);
    return option ? option.icon : '📝';
  };

  // Quality score color
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'from-green-100 to-emerald-100 border-green-200';
    if (score >= 60) return 'from-blue-100 to-indigo-100 border-blue-200';
    if (score >= 40) return 'from-yellow-100 to-amber-100 border-yellow-200';
    return 'from-red-100 to-rose-100 border-red-200';
  };

  return (
    <div className="card hover-lift overflow-hidden animate-fadeIn">
      <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              AI-Optimized Prompt
            </h3>
            <p className="text-green-50 text-sm mt-1">Your prompt has been enhanced</p>
          </div>

          {/* Quality Score Badge */}
          {qualityScore && (
            <div
              className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2 cursor-pointer hover:bg-white/30 transition-colors"
              onClick={() => setShowQualityDetails(!showQualityDetails)}
              title="Click for details"
            >
              <span className="text-white text-sm">Quality:</span>
              <span className={`text-2xl font-bold ${qualityScore.overall >= 70 ? 'text-white' : 'text-yellow-200'}`}>
                {qualityScore.grade}
              </span>
              <span className="text-white/80 text-sm">({qualityScore.overall}%)</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-8">
        {/* Quality Score Details (Expandable) */}
        {showQualityDetails && qualityScore && (
          <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200 animate-fadeIn">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              Quality Score Breakdown
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(qualityScore.breakdown).map(([key, data]) => (
                <div key={key} className={`p-3 rounded-lg bg-gradient-to-br ${getScoreBgColor(data.score)} border`}>
                  <div className="text-xs text-gray-600 capitalize font-medium">{key}</div>
                  <div className={`text-lg font-bold ${getScoreColor(data.score)}`}>{data.score}%</div>
                  <div className="text-xs text-gray-500">{data.weight}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-gray-600">{qualityScore.feedback}</p>
          </div>
        )}

        {/* Badges */}
        <div className="mb-6 flex flex-wrap gap-3">
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-200 shadow-sm">
            <span className="mr-2 text-lg">{getIntentIcon(result.intent)}</span>
            {getIntentLabel(result.intent)}
          </span>
        </div>

        {/* Original Prompt */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Your Input:
          </h4>
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border-l-4 border-gray-400 shadow-sm">
            <p className="text-sm text-gray-700 italic font-medium">"{result.original_prompt}"</p>
          </div>
        </div>

        {/* Optimized Prompt */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center">
              <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI-Optimized Prompt:
            </h4>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Save Button */}
              <button
                onClick={handleSave}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${saved
                  ? 'text-white bg-gradient-to-r from-green-500 to-emerald-500'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  }`}
                title="Save to library (Ctrl+S)"
              >
                {saved ? (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Saved!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    Save
                  </>
                )}
              </button>

              {/* Export Dropdown */}
              <div className="export-dropdown">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                  title="Export prompt (Ctrl+E)"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showExportMenu && (
                  <div className="export-menu animate-fadeIn">
                    <button onClick={() => handleExport('markdown')}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <span className="text-sm text-gray-700">Markdown</span>
                    </button>
                    <button onClick={() => handleExport('json')}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                      <span className="text-sm text-gray-700">JSON</span>
                    </button>
                    <button onClick={() => handleExport('text')}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                      <span className="text-sm text-gray-700">Plain Text</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Copy Button */}
              <button
                onClick={copyToClipboard}
                className={`inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 ${copied
                  ? 'text-white bg-gradient-to-r from-green-500 to-emerald-500 shadow-md'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Mode Selector */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-500">Preview:</span>
            {previewModes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setPreviewMode(mode.value)}
                className={`px-3 py-1 text-xs rounded-full transition-all ${previewMode === mode.value
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {mode.icon} {mode.label}
              </button>
            ))}
          </div>

          {/* Preview - Default */}
          {previewMode === 'default' && (
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-5 border-l-4 border-purple-500 shadow-md">
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-medium">
                {result.optimized_prompt}
              </p>
            </div>
          )}

          {/* Preview - ChatGPT Style */}
          {previewMode === 'chatgpt' && (
            <div className="bg-gray-900 rounded-xl p-5 shadow-md">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">U</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">
                    {result.optimized_prompt}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Preview - Claude Style */}
          {previewMode === 'claude' && (
            <div className="bg-orange-50 rounded-xl border border-orange-200 overflow-hidden">
              <div className="bg-orange-100 px-4 py-2 border-b border-orange-200">
                <span className="text-sm font-medium text-orange-800">Human</span>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {result.optimized_prompt}
                </p>
              </div>
            </div>
          )}

          {/* Preview - Raw */}
          {previewMode === 'raw' && (
            <div className="bg-gray-100 rounded-xl p-4 font-mono overflow-x-auto">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                {result.optimized_prompt}
              </pre>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="mt-8 grid grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Original</div>
            <div className="text-2xl font-bold text-gray-900">{result.original_prompt.length}</div>
            <div className="text-xs text-gray-500">characters</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl p-4 border border-purple-200 hover:shadow-md transition-shadow">
            <div className="text-xs text-purple-600 uppercase tracking-wide font-semibold mb-1">Optimized</div>
            <div className="text-2xl font-bold text-purple-900">{result.optimized_prompt.length}</div>
            <div className="text-xs text-purple-600">characters</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border border-green-200 hover:shadow-md transition-shadow">
            <div className="text-xs text-green-600 uppercase tracking-wide font-semibold mb-1">Expansion</div>
            <div className="text-2xl font-bold text-green-700">
              {Math.round((result.optimized_prompt.length / result.original_prompt.length) * 100)}%
            </div>
            <div className="text-xs text-green-600">growth</div>
          </div>
          {qualityScore && (
            <div className={`bg-gradient-to-br ${getScoreBgColor(qualityScore.overall)} rounded-xl p-4 border hover:shadow-md transition-shadow`}>
              <div className="text-xs uppercase tracking-wide font-semibold mb-1">Quality</div>
              <div className={`text-2xl font-bold ${getScoreColor(qualityScore.overall)}`}>
                {qualityScore.grade}
              </div>
              <div className="text-xs">{qualityScore.overall}/100</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptOutput;
