import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

const ShortcutsHelp = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { keys: ['Ctrl', 'Enter'], action: 'Optimize prompt from source input' },
    { keys: ['Ctrl', 'K'], action: 'Open global command palette' },
    { keys: ['Ctrl', 'Shift', 'C'], action: 'Copy generated prompt' },
    { keys: ['Ctrl', 'S'], action: 'Save prompt to library' },
    { keys: ['Ctrl', 'E'], action: 'Export prompt as markdown' },
    { keys: ['Ctrl', '/'], action: 'Toggle keyboard shortcuts guide' },
    { keys: ['Esc'], action: 'Dismiss modals and dialogs' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '32rem' }}
      >
        <div className="modal-header" style={{ background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Keyboard className="w-4 h-4 text-zinc-700" />
            <h3 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
                padding: '0.35rem 0',
                borderBottom: index < shortcuts.length - 1 ? '1px solid var(--hairline)' : 'none'
              }}
            >
              <span style={{ fontSize: '0.8125rem', color: 'var(--ink-body)' }}>{shortcut.action}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {shortcut.keys.map((key, i) => (
                  <React.Fragment key={i}>
                    <span className="kbd">{key}</span>
                    {i < shortcut.keys.length - 1 && <span style={{ color: 'var(--ink-muted)', fontSize: '0.75rem' }}>+</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer-strip" style={{ justifyContent: 'center' }}>
          <span>Press <span className="kbd">Ctrl</span> + <span className="kbd">/</span> anytime to open this guide</span>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsHelp;
