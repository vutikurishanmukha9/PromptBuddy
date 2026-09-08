import React, { useState, useEffect, useMemo } from 'react';
import { industryPresets, getAllPresets } from '../utils/presets';
import {
  Code2,
  TrendingUp,
  GraduationCap,
  Briefcase,
  Scale,
  FileText,
  SlidersHorizontal,
  Search,
  X,
  ArrowRight
} from 'lucide-react';

const CategoryIcon = ({ icon, className = 'w-4 h-4' }) => {
  switch (icon) {
    case 'code':
      return <Code2 className={className} />;
    case 'marketing':
      return <TrendingUp className={className} />;
    case 'education':
      return <GraduationCap className={className} />;
    case 'business':
      return <Briefcase className={className} />;
    case 'legal':
      return <Scale className={className} />;
    case 'creative':
      return <FileText className={className} />;
    default:
      return <SlidersHorizontal className={className} />;
  }
};

const PresetSelector = ({ onSelectPreset, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('software');
  const [searchQuery, setSearchQuery] = useState('');

  const allPresetsList = useMemo(() => getAllPresets(), []);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSelectPreset = (preset) => {
    onSelectPreset(preset);
    onClose();
  };

  const filteredPresets = useMemo(() => {
    if (!searchQuery.trim()) {
      return industryPresets[activeCategory]?.presets || [];
    }
    const q = searchQuery.toLowerCase();
    return allPresetsList.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.basePrompt.toLowerCase().includes(q) ||
      p.promptType.toLowerCase().includes(q) ||
      p.categoryLabel.toLowerCase().includes(q)
    );
  }, [activeCategory, allPresetsList, searchQuery]);

  const activeCatInfo = industryPresets[activeCategory];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '54rem' }}
      >
        {/* Enterprise Header */}
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
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                Industry Prompt Presets
              </h3>
              <p style={{ margin: 0, fontSize: '0.725rem', color: 'var(--ink-muted)' }}>
                Curated domain architectures ready for instant loading
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

        {/* Search Bar */}
        <div style={{ padding: '0.625rem 1.25rem', borderBottom: '1px solid var(--hairline)', background: 'var(--surface-subtle)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 0.75rem',
            background: '#ffffff',
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search presets by keyword, role, or framework..."
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.8125rem',
                color: 'var(--ink-primary)',
                width: '100%',
                fontFamily: 'var(--font-sans)'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', padding: 0 }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Body with Left Category Column & Right Grid */}
        <div className="preset-modal-body">
          {/* Category Sidebar */}
          {!searchQuery && (
            <div className="preset-sidebar">
              {Object.entries(industryPresets).map(([key, cat]) => {
                const isActive = activeCategory === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveCategory(key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.625rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid',
                      borderColor: isActive ? 'var(--hairline-active)' : 'transparent',
                      background: isActive ? '#ffffff' : 'transparent',
                      color: isActive ? 'var(--ink-primary)' : 'var(--ink-body)',
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.7875rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all var(--dur-fast) var(--ease)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      <CategoryIcon icon={cat.icon} className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cat.label}
                      </span>
                    </div>
                    <span className="tabular-nums" style={{
                      fontSize: '0.6875rem',
                      padding: '0.1rem 0.35rem',
                      borderRadius: 'var(--radius-xs)',
                      background: isActive ? 'var(--surface-subtle)' : 'transparent',
                      color: 'var(--ink-muted)'
                    }}>
                      {cat.presets.length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Presets Grid Panel */}
          <div className="preset-grid-pane">
            {!searchQuery && activeCatInfo && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--hairline)' }}>
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink-primary)', margin: 0 }}>
                    {activeCatInfo.label}
                  </h4>
                  <p style={{ fontSize: '0.725rem', color: 'var(--ink-muted)', margin: 0 }}>
                    {activeCatInfo.description}
                  </p>
                </div>
                <span className="card-badge">
                  {activeCatInfo.presets.length} templates
                </span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 15rem), 1fr))', gap: '0.75rem' }}>
              {filteredPresets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '0.875rem',
                    borderRadius: 'var(--radius-sm)',
                    background: '#ffffff',
                    border: '1px solid var(--hairline)',
                    cursor: 'pointer',
                    transition: 'all var(--dur-fast) var(--ease)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--hairline-active)';
                    e.currentTarget.style.background = 'var(--surface-subtle)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--hairline)';
                    e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                        {preset.name}
                      </span>
                      <span className="card-badge" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                        {preset.promptType}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.75rem', color: 'var(--ink-body)', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                      {preset.description}
                    </p>

                    <div style={{
                      padding: '0.45rem 0.55rem',
                      borderRadius: 'var(--radius-xs)',
                      background: 'var(--surface-subtle)',
                      border: '1px solid var(--hairline)',
                      fontSize: '0.7rem',
                      color: 'var(--ink-muted)',
                      fontFamily: 'var(--font-mono)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.35'
                    }}>
                      "{preset.basePrompt}"
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '0.75rem', paddingTop: '0.375rem', borderTop: '1px solid var(--hairline)' }}>
                    <span style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      Load Template <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {filteredPresets.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--ink-muted)' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink-primary)' }}>No presets matching "{searchQuery}"</p>
                <p style={{ fontSize: '0.75rem' }}>Try searching by category or keywords like "review", "audit", or "proposal"</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer-strip">
          <span>Click any template to auto-fill the workbench and configure its matching framework</span>
          <span className="tabular-nums">{allPresetsList.length} Total Presets</span>
        </div>
      </div>
    </div>
  );
};

export default PresetSelector;
