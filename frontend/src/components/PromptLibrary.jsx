import React, { useState, useEffect, useRef } from 'react';
import { getSavedPrompts, deletePrompt, getPromptHistory, clearHistory, exportFullLibraryJSON, importFullLibraryJSON } from '../utils/storage';

const PromptLibrary = ({ isOpen, onClose, onLoadPrompt }) => {
    const [activeTab, setActiveTab] = useState('saved');
    const [savedPrompts, setSavedPrompts] = useState([]);
    const [history, setHistory] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFolder, setSelectedFolder] = useState('all');
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setSavedPrompts(getSavedPrompts());
            setHistory(getPromptHistory());
        }
    }, [isOpen]);

    const handleDelete = (id) => {
        if (!window.confirm('Delete this saved prompt?')) return;
        deletePrompt(id);
        setSavedPrompts(getSavedPrompts());
    };

    const handleClearHistory = () => {
        if (window.confirm('Are you sure you want to clear all history?')) {
            clearHistory();
            setHistory([]);
        }
    };

    const handleImportFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result;
            if (content && importFullLibraryJSON(content)) {
                setSavedPrompts(getSavedPrompts());
                alert('Prompt library restored successfully!');
            } else {
                alert('Failed to import prompt library JSON.');
            }
        };
        reader.readAsText(file);
    };

    const filteredPrompts = savedPrompts.filter(p => {
        const matchesQuery = p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.basePrompt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.optimizedPrompt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.promptType?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFolder = selectedFolder === 'all' || p.category === selectedFolder || p.promptType === selectedFolder;
        return matchesQuery && matchesFolder;
    });

    const filteredHistory = history.filter(h =>
        h.basePrompt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.promptType?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'flex-end' }}>
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '48rem' }}
            >
                {/* Header */}
                <div className="modal-header modal-header--primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 className="modal-header__title">Prompt Library</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                            onClick={exportFullLibraryJSON}
                            className="btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            title="Export full library backup as JSON"
                        >
                            Backup JSON
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            title="Restore library from JSON backup file"
                        >
                            Restore
                        </button>
                        <input
                            type="file"
                            accept=".json"
                            ref={fileInputRef}
                            onChange={handleImportFile}
                            style={{ display: 'none' }}
                        />
                        <button onClick={onClose} className="modal-header__close">
                            <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="library-tabs">
                    <button
                        onClick={() => setActiveTab('saved')}
                        className={`library-tab ${activeTab === 'saved' ? 'library-tab--active' : ''}`}
                    >
                        Saved ({savedPrompts.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`library-tab ${activeTab === 'history' ? 'library-tab--active' : ''}`}
                    >
                        History ({history.length})
                    </button>
                </div>

                {/* Search & Folder Filters */}
                <div className="modal-search" style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search prompts..."
                        style={{ flex: 1 }}
                    />
                    <select
                        value={selectedFolder}
                        onChange={(e) => setSelectedFolder(e.target.value)}
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                        <option value="all">All Folders</option>
                        <option value="rtf">RTF</option>
                        <option value="risen">RISEN</option>
                        <option value="star">STAR</option>
                        <option value="5w1h">5W1H</option>
                    </select>
                </div>

                {/* Content */}
                <div className="modal-body">
                    {activeTab === 'saved' ? (
                        filteredPrompts.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state__icon">No items</div>
                                <p className="empty-state__title">No saved prompts found</p>
                                <p className="empty-state__desc">Generate and save prompts to build your library</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {filteredPrompts.map((prompt) => (
                                    <div key={prompt.id} className="library-item">
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.375rem' }}>
                                            <h3 className="library-item__title" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {prompt.title}
                                            </h3>
                                            <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                                                <button
                                                    onClick={() => { onLoadPrompt(prompt); onClose(); }}
                                                    className="btn-secondary"
                                                    style={{ padding: '0.25rem 0.625rem', fontSize: '0.7rem' }}
                                                >
                                                    Load
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(prompt.id)}
                                                    style={{ padding: '0.25rem 0.625rem', fontSize: '0.7rem', background: 'rgba(var(--color-danger), 0.05)', color: 'rgb(var(--color-danger))', border: '1px solid rgba(var(--color-danger), 0.15)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                        <p className="library-item__excerpt">{prompt.basePrompt}</p>
                                        <div className="library-item__meta" style={{ marginTop: '0.375rem' }}>
                                            <span className="library-item__type">{prompt.promptType}</span>
                                            <span>{new Date(prompt.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        <>
                            {history.length > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
                                    <button
                                        onClick={handleClearHistory}
                                        style={{ fontSize: '0.75rem', color: 'rgb(var(--color-danger))', background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                        Clear History
                                    </button>
                                </div>
                            )}
                            {filteredHistory.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state__icon">No items</div>
                                    <p className="empty-state__title">No history yet</p>
                                    <p className="empty-state__desc">Your generated prompts will appear here</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {filteredHistory.map((item) => (
                                        <div
                                            key={item.id}
                                            className="library-item"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => {
                                                onLoadPrompt({
                                                    basePrompt: item.basePrompt,
                                                    promptType: item.promptType,
                                                    optimizedPrompt: item.optimizedPrompt,
                                                    aiModel: item.aiModel,
                                                });
                                                onClose();
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                                    {item.basePrompt}
                                                </span>
                                                <div className="library-item__meta">
                                                    <span className="library-item__type">{item.promptType}</span>
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
