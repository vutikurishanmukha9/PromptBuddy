import React, { useState, useEffect } from 'react';
import { getPromptHistory } from '../utils/storage';

const VersionHistory = ({ currentPrompt, onSelectVersion, onClose }) => {
    const [history, setHistory] = useState([]);
    const [selectedVersion, setSelectedVersion] = useState(null);

    useEffect(() => {
        const allHistory = getPromptHistory();
        // Filter to show similar prompts (same base prompt type or substring match)
        const relevantHistory = allHistory.filter(h =>
            h.promptType === currentPrompt?.promptType ||
            currentPrompt?.basePrompt?.includes(h.basePrompt?.substring(0, 20))
        );
        setHistory(relevantHistory.slice(0, 10));
    }, [currentPrompt]);

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden animate-fadeIn">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        Version History
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex h-[60vh]">
                    {/* History List */}
                    <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
                        {history.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                                <div className="text-3xl mb-2"></div>
                                <p className="text-sm">No version history yet</p>
                            </div>
                        ) : (
                            history.map((item, index) => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedVersion(item)}
                                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${selectedVersion?.id === item.id
                                        ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                        : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-gray-500">
                                            Version {history.length - index}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {formatTime(item.timestamp)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 line-clamp-2">
                                        {item.basePrompt}
                                    </p>
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500 mt-1 inline-block">
                                        {item.promptType}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Preview Panel */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {selectedVersion ? (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-800">Version Preview</h3>
                                    <button
                                        onClick={() => {
                                            onSelectVersion(selectedVersion);
                                            onClose();
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-colors"
                                    >
                                        Restore This Version
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase">Base Prompt</label>
                                        <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                                            {selectedVersion.basePrompt}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase">Optimized Prompt</label>
                                        <div className="mt-1 p-3 bg-blue-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                                            {selectedVersion.optimizedPrompt}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <div className="text-4xl mb-2"></div>
                                    <p>Select a version to preview</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VersionHistory;
