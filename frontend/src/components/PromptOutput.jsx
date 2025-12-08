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
    return option ? option.icon : '';
  };

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
      <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-4 sm:px-8 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              AI-Optimized Prompt
            </h3>
            <p className="text-green-50 text-sm mt-1">Your prompt has been enhanced</p>
          </div>

          {qualityScore && (
            <div
              className="flex items-center gap-2 bg-white/20 rounded-lg px-3 sm:px-4 py-2 cursor-pointer hover:bg-white/30 transition-colors"
              onClick={() => setShowQualityDetails(!showQualityDetails)}
              title="Click for details"
            >
              <span className="text-white text-sm">Quality:</span>
              <span className={`text-xl sm:text-2xl font-bold ${qualityScore.overall >= 70 ? 'text-white' : 'text-yellow-200'}`}>
                {qualityScore.grade}
              </span>
              <span className="text-white/80 text-sm">({qualityScore.overall}%)</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-8">
        {/* Quality Score Details */}
        {showQualityDetails && qualityScore && (
          <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-gray-200 dark:border-purple-500/30 animate-fadeIn">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Quality Score Breakdown</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {Object.entries(qualityScore.breakdown).map(([key, data]) => (
                <div key={key} className={`p-2 sm:p-3 rounded-lg bg-gradient-to-br ${getScoreBgColor(data.score)} dark:from-slate-700 dark:to-slate-800 border dark:border-purple-500/20`}>
                  <div className="text-xs text-gray-600 dark:text-gray-300 capitalize font-medium">{key}</div>
                  <div className={`text-base sm:text-lg font-bold ${getScoreColor(data.score)} dark:text-gray-100`}>{data.score}%</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{data.weight}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{qualityScore.feedback}</p>
          </div>
        )}

        {/* Intent Badge */}
        <div className="mb-4 sm:mb-6 flex flex-wrap gap-2 sm:gap-3">
          <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-900/50 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-500/30 shadow-sm">
            <span className="mr-1 sm:mr-2">{getIntentIcon(result.intent)}</span>
            {getIntentLabel(result.intent)}
          </span>
        </div>

        {/* Original Prompt */}
        <div className="mb-4 sm:mb-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 sm:mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Your Input:
          </h4>
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-3 sm:p-4 border-l-4 border-gray-400 dark:border-purple-500 shadow-sm">
            <p className="text-sm text-gray-700 dark:text-gray-200 italic font-medium">"{result.original_prompt}"</p>
          </div>
        </div>

        {/* Optimized Prompt */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center">
              <svg className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI-Optimized Prompt:
            </h4>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleSave}
                className={`inline-flex items-center px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${saved
                  ? 'text-white bg-gradient-to-r from-green-500 to-emerald-500'
                  : 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                title="Save to library"
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
              <div className="export-dropdown relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="inline-flex items-center px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-all duration-200"
                  title="Export prompt"
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
                  <div className="export-menu animate-fadeIn absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border dark:border-slate-700 py-1 z-10">
                    <button onClick={() => handleExport('markdown')} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Markdown
                    </button>
                    <button onClick={() => handleExport('json')} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                      JSON
                    </button>
                    <button onClick={() => handleExport('text')} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                      Text
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={copyToClipboard}
                className={`inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${copied
                  ? 'text-white bg-gradient-to-r from-green-500 to-emerald-500 shadow-md'
                  : 'text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Mode Selector */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs text-gray-500 dark:text-gray-400">Preview:</span>
            {previewModes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setPreviewMode(mode.value)}
                className={`px-2 sm:px-3 py-1 text-xs rounded-full transition-all ${previewMode === mode.value
                  ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-200 font-medium'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Preview - Default */}
          {previewMode === 'default' && (
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-800 dark:via-indigo-900/30 dark:to-purple-900/30 rounded-xl p-4 sm:p-5 border-l-4 border-purple-500 shadow-md">
              <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed font-medium">
                {result.optimized_prompt}
              </p>
            </div>
          )}

          {/* Preview - ChatGPT Style */}
          {previewMode === 'chatgpt' && (
            <div className="bg-gray-900 rounded-xl p-4 sm:p-5 shadow-md">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs sm:text-sm font-bold">U</span>
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
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 sm:p-5 shadow-md border border-orange-200 dark:border-orange-500/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">Human</span>
              </div>
              <p className="text-sm text-gray-800 dark:text-orange-100 whitespace-pre-wrap leading-relaxed">
                {result.optimized_prompt}
              </p>
            </div>
          )}

          {/* Preview - Raw */}
          {previewMode === 'raw' && (
            <div className="bg-gray-100 dark:bg-slate-800 rounded-xl p-4 font-mono overflow-x-auto">
              <pre className="text-xs text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words">
                {result.optimized_prompt}
              </pre>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="bg-gradient-to-br from-gray-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg sm:rounded-xl p-2 sm:p-4 border border-gray-200 dark:border-purple-500/30 hover:shadow-md transition-shadow overflow-hidden">
            <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-300 uppercase tracking-wide font-semibold mb-1 truncate">Original</div>
            <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{result.original_prompt.length}</div>
            <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">chars</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-900/50 rounded-lg sm:rounded-xl p-2 sm:p-4 border border-purple-200 dark:border-purple-500/30 hover:shadow-md transition-shadow overflow-hidden">
            <div className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-300 uppercase tracking-wide font-semibold mb-1 truncate">Optimized</div>
            <div className="text-lg sm:text-2xl font-bold text-purple-900 dark:text-purple-100 truncate">{result.optimized_prompt.length}</div>
            <div className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-300 truncate">chars</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-emerald-900/50 dark:to-green-900/50 rounded-lg sm:rounded-xl p-2 sm:p-4 border border-green-200 dark:border-green-500/30 hover:shadow-md transition-shadow overflow-hidden">
            <div className="text-[10px] sm:text-xs text-green-600 dark:text-green-300 uppercase tracking-wide font-semibold mb-1 truncate">Expand</div>
            <div className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-100 truncate">
              {Math.round((result.optimized_prompt.length / result.original_prompt.length) * 100)}%
            </div>
            <div className="text-[10px] sm:text-xs text-green-600 dark:text-green-300 truncate">growth</div>
          </div>
          {qualityScore && (
            <div className={`bg-gradient-to-br ${getScoreBgColor(qualityScore.overall)} dark:from-blue-900/50 dark:to-indigo-900/50 rounded-lg sm:rounded-xl p-2 sm:p-4 border dark:border-blue-500/30 hover:shadow-md transition-shadow overflow-hidden`}>
              <div className="text-[10px] sm:text-xs uppercase tracking-wide font-semibold mb-1 dark:text-blue-300 truncate">Quality</div>
              <div className={`text-lg sm:text-2xl font-bold ${getScoreColor(qualityScore.overall)} dark:text-blue-100 truncate`}>
                {qualityScore.grade}
              </div>
              <div className="text-[10px] sm:text-xs dark:text-blue-300 truncate">{qualityScore.overall}/100</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptOutput;
