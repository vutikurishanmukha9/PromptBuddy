import React from 'react';

const ShortcutsHelp = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const shortcuts = [
        { keys: ['Ctrl', 'Enter'], action: 'Generate prompt' },
        { keys: ['Ctrl', 'Shift', 'C'], action: 'Copy output' },
        { keys: ['Ctrl', 'S'], action: 'Save to library' },
        { keys: ['Ctrl', 'E'], action: 'Export prompt' },
        { keys: ['Ctrl', '/'], action: 'Toggle shortcuts help' },
        { keys: ['Ctrl', 'D'], action: 'Toggle dark mode' },
        { keys: ['Esc'], action: 'Close dialogs' },
    ];

    return (
        <div className="shortcuts-modal" onClick={onClose}>
            <div className="shortcuts-content animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Keyboard Shortcuts</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-3">
                    {shortcuts.map((shortcut, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{shortcut.action}</span>
                            <div className="flex items-center gap-1">
                                {shortcut.keys.map((key, i) => (
                                    <React.Fragment key={i}>
                                        <span className="kbd">{key}</span>
                                        {i < shortcut.keys.length - 1 && <span className="text-gray-400">+</span>}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        Press <span className="kbd">Ctrl</span> + <span className="kbd">/</span> anytime to toggle
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ShortcutsHelp;
