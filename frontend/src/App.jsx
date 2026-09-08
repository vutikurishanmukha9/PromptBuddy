import React, { useState, useEffect, useCallback } from 'react';
import PromptGenerator from './components/PromptGenerator';
import ShortcutsHelp from './components/ShortcutsHelp';
import CommandPalette from './components/CommandPalette';
import SkillCatalogModal from './components/SkillCatalogModal';
import { SlidersHorizontal, FolderArchive, Command, HelpCircle, Boxes } from 'lucide-react';
import './index.css';

function App() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSkillCatalog, setShowSkillCatalog] = useState(false);
  const [externalCommand, setExternalCommand] = useState(null);

  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setShowCommandPalette(prev => !prev);
    }
    if (e.ctrlKey && e.key === '/') {
      e.preventDefault();
      setShowShortcuts(prev => !prev);
    }
    if (e.key === 'Escape') {
      setShowShortcuts(false);
      setShowCommandPalette(false);
      setShowSkillCatalog(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="app-shell">
      {/* Enterprise Top Navigation Bar */}
      <header className="top-navbar">
        <div className="top-navbar__inner">
          {/* Brand Monogram & Identity */}
          <div className="brand-badge">
            <div className="brand-icon-box" aria-hidden="true">
              [&gt;]
            </div>
            <div className="brand-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="brand-name">PromptBuddy</span>
                <span className="card-badge" style={{ fontSize: '0.625rem', letterSpacing: '0.04em' }}>STUDIO</span>
              </div>
              <span className="brand-tagline">Enterprise Prompt Engineering &amp; Optimization</span>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="nav-actions">
            <button
              type="button"
              onClick={() => setShowSkillCatalog(true)}
              className="btn btn-secondary btn-sm"
              title="Browse 454 enterprise agent skills specification catalog"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span className="nav-btn-text">Agent Skills (454)</span>
            </button>

            <button
              type="button"
              onClick={() => setExternalCommand({ type: 'open_presets' })}
              className="btn btn-secondary btn-sm"
              title="Browse industry prompt presets"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="nav-btn-text">Presets</span>
            </button>

            <button
              type="button"
              onClick={() => setExternalCommand({ type: 'open_library' })}
              className="btn btn-secondary btn-sm"
              title="Saved prompt library"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span className="nav-btn-text">Library</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCommandPalette(true)}
              className="btn btn-secondary btn-sm"
              title="Global command palette (Ctrl+K)"
            >
              <Command className="w-3.5 h-3.5" />
              <span className="kbd">Ctrl K</span>
            </button>

            <button
              type="button"
              onClick={() => setShowShortcuts(true)}
              className="btn btn-ghost btn-icon"
              title="Keyboard shortcuts (Ctrl+/)"
            >
              <HelpCircle className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Workbench Area */}
      <main className="workbench-container">
        <PromptGenerator externalCommand={externalCommand} />
      </main>

      {/* Enterprise Footer */}
      <footer style={{
        borderTop: '1px solid var(--hairline)',
        background: '#ffffff',
        padding: '1rem 1.25rem',
        marginTop: 'auto'
      }}>
        <div style={{
          maxHeight: '90rem',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.75rem',
          color: 'var(--ink-muted)'
        }}>
          <div>
            <span>PromptBuddy Studio</span> &bull; <span>Enterprise AI Optimization Engine</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span>454 Enterprise Agent Skills</span>
            <span>22 Industrial Frameworks</span>
            <span>Zero-Retention Workspace</span>
            <span>Version 4.2</span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <ShortcutsHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onSelectFramework={(fw) => setExternalCommand({ type: 'framework', value: fw })}
        onSelectPreset={(pr) => setExternalCommand({ type: 'preset', value: pr })}
        onToggleTheme={() => {}}
        onOpenLibrary={() => setExternalCommand({ type: 'open_library' })}
        onOpenSkills={() => setShowSkillCatalog(true)}
      />
      <SkillCatalogModal
        isOpen={showSkillCatalog}
        onClose={() => setShowSkillCatalog(false)}
        onImportSkill={(imported) => {
          setExternalCommand({ type: 'import_skill', value: imported });
        }}
      />
    </div>
  );
}

export default App;
