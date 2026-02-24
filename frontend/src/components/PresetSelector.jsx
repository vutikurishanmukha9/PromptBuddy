import React, { useState } from 'react';
import { industryPresets } from '../utils/presets';

const PresetSelector = ({ onSelectPreset, onClose }) => {
    const [activeCategory, setActiveCategory] = useState('software');
    const [searchQuery, setSearchQuery] = useState('');

    const handleSelectPreset = (preset) => {
        onSelectPreset(preset);
        onClose();
    };

    const filteredPresets = searchQuery
        ? Object.values(industryPresets).flatMap(cat =>
            cat.presets.filter(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
        : industryPresets[activeCategory]?.presets || [];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content animate-slideUp"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '48rem' }}
            >
                {/* Header */}
                <div className="modal-header" style={{ background: 'linear-gradient(135deg, rgb(var(--color-warning)), #d97706)' }}>
                    <h2 className="modal-header__title">Industry Presets</h2>
                    <button onClick={onClose} className="modal-header__close">
                        <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Search */}
                <div className="modal-search">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search presets..."
                    />
                </div>

                {/* Mobile: Horizontal scrollable pills */}
                {!searchQuery && (
                    <div className="preset-pills">
                        {Object.entries(industryPresets).map(([key, category]) => (
                            <button
                                key={key}
                                onClick={() => setActiveCategory(key)}
                                className={`preset-pill ${activeCategory === key ? 'preset-pill--active' : ''}`}
                            >
                                {category.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Content */}
                <div style={{ display: 'flex', height: 'clamp(40vh, 50vh, 55vh)' }}>
                    {/* Desktop Sidebar */}
                    {!searchQuery && (
                        <div className="preset-sidebar">
                            {Object.entries(industryPresets).map(([key, category]) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveCategory(key)}
                                    className={`preset-sidebar__btn ${activeCategory === key ? 'preset-sidebar__btn--active' : ''}`}
                                >
                                    {category.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Presets Grid */}
                    <div style={{ flex: 1, padding: '0.75rem 1rem', overflowY: 'auto', minWidth: 0 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))', gap: '0.625rem' }}>
                            {filteredPresets.map((preset) => (
                                <button
                                    key={preset.id}
                                    onClick={() => handleSelectPreset(preset)}
                                    className="preset-card"
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.375rem' }}>
                                        <span className="preset-card__name">{preset.name}</span>
                                        <span className="preset-card__type">{preset.promptType}</span>
                                    </div>
                                    <p className="preset-card__desc">{preset.description}</p>
                                </button>
                            ))}
                        </div>

                        {filteredPresets.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-state__icon">—</div>
                                <p className="empty-state__title">No presets found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <p className="modal-footer__text">Select a preset to auto-fill the prompt type and base prompt</p>
                </div>
            </div>
        </div>
    );
};

export default PresetSelector;
