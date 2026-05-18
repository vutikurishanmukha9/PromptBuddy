import React, { useState, useEffect, useCallback } from 'react';
import PromptGenerator from './components/PromptGenerator';
import ThemeToggle from './components/ThemeToggle';
import ShortcutsHelp from './components/ShortcutsHelp';
import { getTheme, setTheme as persistTheme } from './utils/storage';
import './index.css';

function App() {
  const [theme, setTheme] = useState('light');
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const savedTheme = getTheme();
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey && e.key === '/') {
      e.preventDefault();
      setShowShortcuts(prev => !prev);
    }
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      persistTheme(newTheme);
    }
    if (e.key === 'Escape') {
      setShowShortcuts(false);
    }
  }, [theme]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="App">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__brand animate-slideIn">
            <div className="app-header__logo">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="app-header__title">PromptBuddy</div>
              <div className="app-header__subtitle">AI-Powered Prompt Optimizer</div>
            </div>
          </div>

          <div className="app-header__actions animate-fadeIn">
            <button
              onClick={() => setShowShortcuts(true)}
              className="btn-secondary"
              title="Keyboard shortcuts (Ctrl+/)"
              style={{ padding: '0.5rem' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
              </svg>
            </button>

            <ThemeToggle theme={theme} setTheme={setTheme} />

            <div className="app-header__status">
              <div className="app-header__status-dot"></div>
              <span className="app-header__status-text">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main animate-fadeIn">
        <PromptGenerator />
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="app-footer__inner">
          <p className="app-footer__text">
            © 2026 <span className="app-footer__brand">PromptBuddy</span>. Crafted for AI.
          </p>
          <span className="app-footer__shortcuts">
            Press <span className="kbd">Ctrl</span> + <span className="kbd">/</span> for shortcuts
          </span>
        </div>
      </footer>

      {/* Shortcuts Help Modal */}
      <ShortcutsHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}

export default App;
