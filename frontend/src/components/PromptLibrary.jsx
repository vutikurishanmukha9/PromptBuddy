import React, { useState, useEffect } from 'react';
import { getSavedPrompts, deletePrompt, getPromptHistory, clearHistory } from '../utils/storage';

const PromptLibrary = ({ isOpen, onClose, onLoadPrompt }) => {
    const [activeTab, setActiveTab] = useState('saved');
    const [savedPrompts, setSavedPrompts] = useState([]);
    const [history, setHistory] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSavedPrompts(getSavedPrompts());
            setHistory(getPromptHistory());
        }
    }, [isOpen]);

    const handleDelete = (id) => {
        deletePrompt(id);
        setSavedPrompts(getSavedPrompts());
    };

    const handleClearHistory = () => {
        if (window.confirm('Are you sure you want to clear all history?')) {
            clearHistory();
            setHistory([]);
        }
    };

    const filteredPrompts = savedPrompts.filter(p =>
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.basePrompt?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredHistory = history.filter(h =>
        h.basePrompt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.promptType?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden animate-fadeIn">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        Prompt Library
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

                {/* Tabs */}
                <div className="border-b border-gray-200 px-6">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('saved')}
                            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'saved'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Saved ({savedPrompts.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            History ({history.length})
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="px-6 py-4 border-b border-gray-100">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search prompts..."
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[50vh]">
                    {activeTab === 'saved' ? (
                        filteredPrompts.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <div className="text-4xl mb-2"></div>
                                <p>No saved prompts yet</p>
                                <p className="text-sm">Generate and save prompts to build your library</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredPrompts.map((prompt) => (
                                    <div
                                        key={prompt.id}
                                        className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-gray-800 truncate flex-1">
                                                {prompt.title}
                                            </h3>
                                            <div className="flex items-center gap-2 ml-4">
                                                <button
                                                    onClick={() => {
                                                        onLoadPrompt(prompt);
                                                        onClose();
                                                    }}
                                                    className="px-3 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                                                >
                                                    Load
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(prompt.id)}
                                                    className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                                            {prompt.basePrompt}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <span className="px-2 py-1 bg-gray-100 rounded-full">{prompt.promptType}</span>
                                            <span>{new Date(prompt.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        <>
                            {history.length > 0 && (
                                <div className="flex justify-end mb-4">
                                    <button
                                        onClick={handleClearHistory}
                                        className="text-sm text-red-500 hover:text-red-700"
                                    >
                                        Clear History
                                    </button>
                                </div>
                            )}
                            {filteredHistory.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <div className="text-4xl mb-2"></div>
                                    <p>No history yet</p>
                                    <p className="text-sm">Your generated prompts will appear here</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredHistory.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => {
                                                onLoadPrompt({
                                                    basePrompt: item.basePrompt,
                                                    promptType: item.promptType,
                                                });
                                                onClose();
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-700 truncate flex-1">
                                                    {item.basePrompt}
                                                </span>
                                                <div className="flex items-center gap-2 ml-4 text-xs text-gray-400">
                                                    <span className="px-2 py-1 bg-gray-100 rounded-full">{item.promptType}</span>
                                                    <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PromptLibrary;
