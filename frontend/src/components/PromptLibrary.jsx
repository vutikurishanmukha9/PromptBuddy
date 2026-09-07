import React, { useState, useEffect, useRef } from 'react';
import {
  getSavedPrompts,
  deletePrompt,
  getPromptHistory,
  clearHistory,
  exportFullLibraryJSON,
  importFullLibraryJSON,
  createVersion,
  setReleaseTag,
} from '../utils/storage';
import {
  FolderArchive,
  Search,
  Download,
  Upload,
  Trash2,
  ArrowRight,
  X,
  History,
  Bookmark,
  Tag
} from 'lucide-react';

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
    if (!window.confirm('Delete this prompt template from your library?')) return;
    deletePrompt(id);
    setSavedPrompts(getSavedPrompts());
  };

  const handleCreateVersion = (id) => {
    createVersion(id);
    setSavedPrompts(getSavedPrompts());
  };

  const handleCycleTag = (id, currentTag) => {
    const cycle = { draft: 'staging', staging: 'production', production: 'draft' };
    setReleaseTag(id, cycle[currentTag] || 'draft');
    setSavedPrompts(getSavedPrompts());
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all session prompt history?')) {
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

  const filteredPrompts = savedPrompts.filter((p) => {
    const matchesQuery =
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.basePrompt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.optimizedPrompt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.promptType?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder =
      selectedFolder === 'all' ||
      p.category === selectedFolder ||
      p.promptType === selectedFolder;
    return matchesQuery && matchesFolder;
  });

  const filteredHistory = history.filter(
    (h) =>
      h.basePrompt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.promptType?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '50rem' }}
      >
        {/* Enterprise Modal Header */}
        <div className="modal-header" style={{ background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FolderArchive className="w-4 h-4" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                Prompt Library &amp; Vault
              </h3>
              <p style={{ margin: 0, fontSize: '0.725rem', color: 'var(--ink-muted)' }}>
                Manage, backup, and restore enterprise prompt architectures
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={exportFullLibraryJSON}
              className="btn btn-secondary btn-sm"
              title="Backup library as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup JSON</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary btn-sm"
              title="Restore library from JSON backup"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Restore</span>
            </button>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleImportFile}
              style={{ display: 'none' }}
            />

            <span className="kbd">ESC</span>
            <button
              type="button"
              onClick={onClose}
              className="modal-close-btn"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs & Search Filter Bar */}
        <div style={{ borderBottom: '1px solid var(--hairline)', background: 'var(--surface-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <button
                type="button"
                onClick={() => setActiveTab('saved')}
                className={`btn btn-sm ${activeTab === 'saved' ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Saved Prompts ({savedPrompts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Session History ({history.length})</span>
              </button>
            </div>

            {activeTab === 'history' && history.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="btn btn-secondary btn-sm text-red-700"
                style={{ fontSize: '0.7rem' }}
              >
                Clear History
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 1.25rem', borderTop: '1px solid var(--hairline)', flexWrap: 'wrap' }}>
            <div style={{
              flex: 1,
              minWidth: 'min(100%, 14rem)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.65rem',
              background: '#ffffff',
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates by title, content, or framework..."
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.8rem',
                  color: 'var(--ink-primary)',
                  width: '100%',
                  fontFamily: 'var(--font-sans)'
                }}
              />
            </div>

            {activeTab === 'saved' && (
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="param-select"
                style={{ width: 'auto', minWidth: '8rem', padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
              >
                <option value="all">All Frameworks</option>
                <option value="rtf">RTF</option>
                <option value="risen">RISEN</option>
                <option value="star">STAR</option>
                <option value="5w1h">5W1H</option>
                <option value="clear">CLEAR</option>
                <option value="pastor">PASTOR</option>
                <option value="agent_skill">Agent SKILL.md</option>
              </select>
            )}
          </div>
        </div>

        {/* Modal Body List */}
        <div style={{ flex: 1, padding: '1rem 1.25rem', overflowY: 'auto', maxHeight: '50vh' }}>
          {activeTab === 'saved' ? (
            filteredPrompts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--ink-muted)' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink-primary)' }}>No saved prompts found</p>
                <p style={{ fontSize: '0.75rem' }}>Optimize and save prompts to build your organization's prompt library</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {filteredPrompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    style={{
                      padding: '0.75rem 0.875rem',
                      borderRadius: 'var(--radius-sm)',
                      background: '#ffffff',
                      border: '1px solid var(--hairline)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <h4 style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--ink-primary)', margin: 0 }}>
                          {prompt.title}
                        </h4>
                        {/* Version badge */}
                        <span style={{
                          fontSize: '0.625rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '0.1rem 0.35rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--surface-subtle)',
                          border: '1px solid var(--hairline)',
                          color: 'var(--ink-secondary)',
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          v{prompt.version || '1.0.0'}
                        </span>
                        {/* Release tag pill */}
                        <button
                          type="button"
                          onClick={() => handleCycleTag(prompt.id, prompt.releaseTag || 'draft')}
                          title="Click to cycle release tag"
                          style={{
                            fontSize: '0.575rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            padding: '0.1rem 0.35rem',
                            borderRadius: 'var(--radius-full)',
                            border: 'none',
                            cursor: 'pointer',
                            background: (prompt.releaseTag || 'draft') === 'production' ? '#16a34a'
                              : (prompt.releaseTag || 'draft') === 'staging' ? '#d97706'
                              : 'var(--ink-muted)',
                            color: '#ffffff',
                          }}
                        >
                          {prompt.releaseTag || 'draft'}
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span className="card-badge" style={{ textTransform: 'uppercase' }}>
                          {prompt.promptType}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCreateVersion(prompt.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }}
                          title="Create new version snapshot"
                        >
                          <Tag className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { onLoadPrompt(prompt); onClose(); }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                        >
                          <span>Load</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(prompt.id)}
                          className="btn btn-ghost btn-sm text-red-700"
                          style={{ padding: '0.2rem 0.35rem' }}
                          title="Delete template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.75rem', color: 'var(--ink-body)', margin: '0 0 0.35rem 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {prompt.basePrompt}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--ink-muted)' }}>
                      <span>{new Date(prompt.createdAt).toLocaleDateString()} &bull; {prompt.aiModel || 'OpenRouter'}</span>
                      {prompt.versions && prompt.versions.length > 1 && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem' }}>
                          {prompt.versions.length} versions
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            filteredHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--ink-muted)' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink-primary)' }}>No session history</p>
                <p style={{ fontSize: '0.75rem' }}>Your generated prompts will appear here automatically</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {filteredHistory.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.75rem 0.875rem',
                      borderRadius: 'var(--radius-sm)',
                      background: '#ffffff',
                      border: '1px solid var(--hairline)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span className="card-badge" style={{ textTransform: 'uppercase' }}>
                        {item.promptType}
                      </span>
                      <button
                        type="button"
                        onClick={() => { onLoadPrompt(item); onClose(); }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                      >
                        Load to Studio
                      </button>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--ink-body)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.basePrompt}
                    </p>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer-strip">
          <span>Enterprise Prompt Storage &bull; Local JSON encrypted storage</span>
          <span className="tabular-nums">{savedPrompts.length} Saved Templates</span>
        </div>
      </div>
    </div>
  );
};

export default PromptLibrary;
