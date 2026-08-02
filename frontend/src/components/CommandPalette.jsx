import React, { useState, useEffect, useRef } from 'react';
import { frameworkOptions } from '../utils/frameworks';
import { getAllPresets } from '../utils/presets';

const CommandPalette = ({ isOpen, onClose, onSelectFramework, onSelectPreset, onToggleTheme, onOpenLibrary }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);

    const presets = getAllPresets();

    const actions = [
        { id: 'act_theme', type: 'action', name: 'Toggle Dark / Light Theme', action: onToggleTheme, icon: 'theme' },
        { id: 'act_library', type: 'action', name: 'Open Prompt Library', action: onOpenLibrary, icon: 'library' },
    ];

    const frameworkItems = frameworkOptions.map(f => ({
        id: `fw_${f.value}`,
        type: 'framework',
        value: f.value,
        name: `Framework: ${f.label}`,
        desc: f.desc,
        action: () => onSelectFramework(f.value),
    }));

    const presetItems = presets.map(p => ({
        id: `pr_${p.id}`,
        type: 'preset',
        name: `Preset: ${p.name}`,
        desc: p.description,
        action: () => onSelectPreset(p),
    }));

    const allItems = [...actions, ...frameworkItems, ...presetItems];

    const filteredItems = query.trim()
        ? allItems.filter(item =>
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.desc?.toLowerCase().includes(query.toLowerCase())
        )
        : allItems.slice(0, 12);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredItems[selectedIndex]) {
                filteredItems[selectedIndex].action();
                onClose();
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '10vh' }}>
            <div
                className="modal-content animate-slideUp"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '38rem', width: '100%', overflow: 'hidden', padding: 0 }}
            >
                {/* Search Bar */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '0.875rem 1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                    <svg style={{ width: '1.25rem', height: '1.25rem', color: 'var(--text-muted)', marginRight: '0.75rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a command, framework (RTF, STAR...), or preset..."
                        style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', color: 'var(--text-primary)', width: '100%' }}
                    />
                    <span className="kbd" style={{ fontSize: '0.7rem' }}>ESC</span>
                </div>

                {/* Results List */}
                <div style={{ maxHeight: '20rem', overflowY: 'auto', padding: '0.5rem' }}>
                    {filteredItems.map((item, index) => (
                        <div
                            key={item.id}
                            onClick={() => { item.action(); onClose(); }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.625rem 0.875rem',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                background: index === selectedIndex ? 'rgba(var(--color-primary), 0.1)' : 'transparent',
                                borderLeft: index === selectedIndex ? '3px solid rgb(var(--color-primary))' : '3px solid transparent',
                            }}
                        >
                            <div>
                                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                    {item.name}
                                </p>
                                {item.desc && (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                                        {item.desc}
                                    </p>
                                )}
                            </div>
                            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', padding: '0.125rem 0.375rem', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                                {item.type}
                            </span>
                        </div>
                    ))}

                    {filteredItems.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            No commands matching "{query}"
                        </div>
                    )}
                </div>

                <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>Use ↑ ↓ to navigate</span>
                    <span>Press Enter to select</span>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
