import React from 'react';
import PromptGenerator from './components/PromptGenerator';
import './index.css';

function App() {
  return (
    <div className="App">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  AI Prompt Generator
                </h1>
              </div>
              <div className="text-sm text-gray-500">
                Powered by AI
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <PromptGenerator />
          </div>
        </main>
        
        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              © 2025 AI Prompt Generator. Built with React & Flask.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
