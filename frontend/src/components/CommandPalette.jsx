import React, { useState, useEffect, useRef } from 'react';
import { frameworkOptions } from '../utils/frameworks';
import { getAllPresets } from '../utils/presets';
import {
  Search,
  SlidersHorizontal,
  FolderArchive,
  Code2,
  CornerDownLeft,
  Boxes,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

const CommandPalette = ({ isOpen, onClose, onSelectFramework, onSelectPreset, onOpenLibrary, onOpenSkills }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const presets = getAllPresets();

  const actions = [
    {
      id: 'act_skills',
      type: 'action',
      name: 'Browse 132 Enterprise Agent Skills Catalog',
      desc: 'Explore cloud, ads, developers, analytics, and identity blueprints',
      action: onOpenSkills,
      icon: <Boxes className="w-4 h-4 text-zinc-600" />
    },
    {
      id: 'act_library',
      type: 'action',
      name: 'Open Prompt Library',
      desc: 'Browse saved templates & session history',
      action: onOpenLibrary,
      icon: <FolderArchive className="w-4 h-4 text-zinc-600" />
    },
    {
      id: 'act_presets',
      type: 'action',
      name: 'Browse Industry Presets',
      desc: 'Load curated domain prompt architectures',
      action: () => onSelectPreset({ basePrompt: 'Audit this system for performance and scalability', promptType: 'risen' }),
      icon: <SlidersHorizontal className="w-4 h-4 text-zinc-600" />
    }
  ];

  const frameworkItems = frameworkOptions.map(f => ({
    id: `fw_${f.value}`,
    type: 'framework',
    value: f.value,
    name: `Framework: ${f.label}`,
    desc: f.desc,
    action: () => onSelectFramework(f.value),
    icon: <Code2 className="w-4 h-4 text-zinc-600" />
  }));

  const presetItems = presets.map(p => ({
    id: `pr_${p.id}`,
    type: 'preset',
    name: `Preset: ${p.name}`,
    desc: p.description,
    action: () => onSelectPreset(p),
    icon: <SlidersHorizontal className="w-4 h-4 text-zinc-600" />
  }));

  const allItems = [...actions, ...frameworkItems, ...presetItems];

  const filteredItems = query.trim()
    ? allItems.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.desc?.toLowerCase().includes(query.toLowerCase())
      )
    : allItems.slice(0, 14);

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
    <div className="modal-backdrop" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '10vh' }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '40rem', width: '100%', overflow: 'hidden' }}
      >
        {/* Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--hairline)',
          background: '#ffffff'
        }}>
          <Search className="w-4 h-4 text-zinc-400" style={{ marginRight: '0.625rem' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, framework (RTF, STAR, CLEAR...), or preset..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.875rem',
              color: 'var(--ink-primary)',
              width: '100%',
              fontFamily: 'var(--font-sans)'
            }}
          />
          <span className="kbd">ESC</span>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '22rem', overflowY: 'auto', padding: '0.375rem' }}>
          {filteredItems.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <div
                key={item.id}
                onClick={() => { item.action(); onClose(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--surface-subtle)' : 'transparent',
                  border: isSelected ? '1px solid var(--hairline-active)' : '1px solid transparent',
                  transition: 'all var(--dur-fast) var(--ease)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
                  <div style={{ flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink-primary)', margin: 0 }}>
                      {item.name}
                    </p>
                    {item.desc && (
                      <p style={{ fontSize: '0.725rem', color: 'var(--ink-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.desc}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span className="card-badge" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                    {item.type}
                  </span>
                  {isSelected && (
                    <CornerDownLeft className="w-3 h-3 text-zinc-500" />
                  )}
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--ink-muted)', fontSize: '0.8125rem' }}>
              No commands matching "{query}"
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="modal-footer-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span><span className="kbd">&uarr;</span> <span className="kbd">&darr;</span> navigate</span>
            <span><span className="kbd">&crarr;</span> select</span>
          </div>
          <span>Command Palette</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
