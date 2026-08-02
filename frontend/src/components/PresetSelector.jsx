import React, { useState, useMemo } from 'react';
import { industryPresets, getAllPresets } from '../utils/presets';

const CategoryIcon = ({ icon, className = 'w-4 h-4' }) => {
    switch (icon) {
        case 'code':
            return (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
            );
        case 'marketing':
            return (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
            );
        case 'education':
            return (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
            );
        case 'business':
            return (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            );
        case 'legal':
            return (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l9-4 9 4v6c0 5.55-3.84 10.74-9 12-5.16-1.26-9-5.45-9-12V6z" />
                </svg>
            );
        case 'creative':
            return (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
            );
        default:
            return (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            );
    }
};

const PresetSelector = ({ onSelectPreset, onClose }) => {
    const [activeCategory, setActiveCategory] = useState('software');
    const [searchQuery, setSearchQuery] = useState('');

    const allPresetsList = useMemo(() => getAllPresets(), []);

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
        <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
            <div
                className="modal-content animate-slideUp"
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: '56rem',
                    width: '95vw',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    padding: 0,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)',
                    background: '#ffffff'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    background: '#0f172a',
                    color: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '2.5rem',
                                height: '2.5rem',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 0 12px rgba(20, 184, 166, 0.3)'
                            }}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', margin: 0, letterSpacing: '-0.01em' }}>
                                    Industry Presets
                                </h2>
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
                                    Pre-configured prompt templates crafted for domain experts
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span className="kbd" style={{ fontSize: '0.7rem', background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}>ESC</span>
                            <button
                                onClick={onClose}
                                style={{
                                    background: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '50%',
                                    width: '2rem',
                                    height: '2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justify: 'center',
                                    color: '#94a3b8',
                                    cursor: 'pointer'
                                }}
                            >
                                <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.625rem',
                        padding: '0.625rem 0.875rem',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px'
                    }}>
                        <svg style={{ width: '1.125rem', height: '1.125rem', color: '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search presets across code, marketing, education, legal..."
                            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', color: '#ffffff', width: '100%' }}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Body */}
                <div style={{ display: 'flex', height: 'clamp(24rem, 55vh, 32rem)', background: '#ffffff' }}>
                    {/* Category Sidebar (Desktop) */}
                    {!searchQuery && (
                        <div style={{
                            width: '15rem',
                            borderRight: '1px solid #e2e8f0',
                            background: '#f8fafc',
                            padding: '0.75rem 0.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.375rem',
                            overflowY: 'auto'
                        }}>
                            {Object.entries(industryPresets).map(([key, cat]) => {
                                const isActive = activeCategory === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setActiveCategory(key)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justify: 'space-between',
                                            padding: '0.625rem 0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid',
                                            borderColor: isActive ? 'rgba(15, 118, 110, 0.3)' : 'transparent',
                                            background: isActive ? 'rgba(15, 118, 110, 0.1)' : 'transparent',
                                            color: isActive ? '#0f766e' : '#475569',
                                            fontWeight: isActive ? 700 : 500,
                                            fontSize: '0.825rem',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
                                            <CategoryIcon icon={cat.icon} className="w-4 h-4 flex-shrink-0" />
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {cat.label}
                                            </span>
                                        </div>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            padding: '0.1rem 0.4rem',
                                            borderRadius: '999px',
                                            background: isActive ? '#0f766e' : '#e2e8f0',
                                            color: isActive ? '#ffffff' : '#64748b',
                                            fontWeight: 600
                                        }}>
                                            {cat.presets.length}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Presets Content Grid */}
                    <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {!searchQuery && activeCatInfo && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                                <div>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                        {activeCatInfo.label}
                                    </h3>
                                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                                        {activeCatInfo.description}
                                    </p>
                                </div>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    {activeCatInfo.presets.length} templates
                                </span>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(17rem, 1fr))', gap: '0.875rem' }}>
                            {filteredPresets.map((preset) => (
                                <div
                                    key={preset.id}
                                    onClick={() => handleSelectPreset(preset)}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justify: 'space-between',
                                        padding: '1rem',
                                        borderRadius: '10px',
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        cursor: 'pointer',
                                        transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                                    }}
                                    className="preset-card-item"
                                >
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                                                {preset.name}
                                            </span>
                                            <span style={{
                                                fontSize: '0.65rem',
                                                fontWeight: 700,
                                                padding: '0.15rem 0.45rem',
                                                borderRadius: '4px',
                                                background: 'rgba(15, 118, 110, 0.12)',
                                                color: '#0f766e',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em'
                                            }}>
                                                {preset.promptType}
                                            </span>
                                        </div>

                                        <p style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                                            {preset.description}
                                        </p>

                                        {/* Prompt Excerpt Box */}
                                        <div style={{
                                            padding: '0.5rem 0.625rem',
                                            borderRadius: '6px',
                                            background: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            fontSize: '0.72rem',
                                            color: '#64748b',
                                            fontFamily: 'monospace',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            lineHeight: '1.3'
                                        }}>
                                            "{preset.basePrompt}"
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '0.875rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f766e', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            Load Preset
                                            <svg style={{ width: '0.875rem', height: '0.875rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredPresets.length === 0 && (
                            <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                                <div className="empty-state__icon">🔍</div>
                                <p className="empty-state__title">No presets matching "{searchQuery}"</p>
                                <p className="empty-state__desc">Try searching for keywords like "review", "email", "contract", or "lesson"</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '0.75rem 1.5rem',
                    background: '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    fontSize: '0.75rem',
                    color: '#64748b'
                }}>
                    <span>Tip: Click any preset card to instantly populate your workbench & auto-select its optimal framework</span>
                    <span>{allPresetsList.length} Total Presets</span>
                </div>
            </div>
        </div>
    );
};

export default PresetSelector;
