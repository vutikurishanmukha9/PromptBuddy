import React, { useState, useEffect, useCallback } from 'react';
import PromptGenerator from './components/PromptGenerator';
import ThemeToggle from './components/ThemeToggle';
import ShortcutsHelp from './components/ShortcutsHelp';
import { getTheme } from './utils/storage';
import './index.css';

function App() {
  const [theme, setTheme] = useState('light');
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = getTheme();
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Global keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    // Ctrl + / - Toggle shortcuts help
    if (e.ctrlKey && e.key === '/') {
      e.preventDefault();
      setShowShortcuts(prev => !prev);
    }
    // Ctrl + D - Toggle dark mode
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('promptbuddy_theme', newTheme);
    }
    // Escape - Close dialogs
    if (e.key === 'Escape') {
      setShowShortcuts(false);
    }
  }, [theme]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="App min-h-screen">
      {/* Animated background - theme aware */}
      <div className={`fixed inset-0 -z-10 transition-colors duration-300 ${theme === 'dark'
        ? 'bg-gradient-to-br from-[#0c0a1d] via-[#1a1632] to-[#0f0d24]'
        : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'
        }`}>
        <div className={`absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM2NjdlZWEiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDI0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00ek0xMiAxNmMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHptMCAyNGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] ${theme === 'dark' ? 'opacity-20' : 'opacity-40'
          }`}></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-lg shadow-lg border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center space-x-2 sm:space-x-3 animate-slideIn">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform flex-shrink-0">
                <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent truncate">
                  PromptBuddy
                </h1>
                <p className="text-xs text-gray-500 font-medium hidden sm:block">AI-Powered Prompt Optimizer</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 animate-fadeIn">
              {/* Keyboard shortcuts button */}
              <button
                onClick={() => setShowShortcuts(true)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                title="Keyboard shortcuts (Ctrl+/)"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                </svg>
              </button>

              {/* Theme toggle */}
              <ThemeToggle theme={theme} setTheme={setTheme} />

              {/* Live indicator */}
              <div className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Live</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 animate-fadeIn">
        <div className="px-4 py-6 sm:px-0">
          <PromptGenerator />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative bg-white/60 backdrop-blur-md border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
            <p className="text-sm text-gray-600">
              © 2025 <span className="font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">PromptBuddy</span>. Crafted for AI.
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-500">
                Press <span className="kbd">Ctrl</span>+<span className="kbd">/</span> for shortcuts
              </span>
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Shortcuts Help Modal */}
      <ShortcutsHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}

export default App;
