import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchSkillsCatalog, fetchSkillDetail, importCatalogSkill } from '../utils/api';
import {
  Boxes,
  Search,
  X,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Download,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  Terminal,
  Cpu
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Domains' },
  { id: 'cloud', label: 'Cloud & Infra' },
  { id: 'developers', label: 'Developers & Code' },
  { id: 'analytics', label: 'Analytics & BI' },
  { id: 'identity', label: 'Identity & Auth' },
  { id: 'ads', label: 'Ads & Campaigns' },
];

const getSafetyTierBadge = (tier) => {
  const normalized = (tier || '').toUpperCase();
  if (normalized.includes('TIER R') || normalized === 'TIER_R') {
    return {
      label: 'Tier R (Read-Only)',
      color: '#16a34a',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
    };
  }
  if (normalized.includes('TIER M') || normalized === 'TIER_M') {
    return {
      label: 'Tier M (Mutation)',
      color: '#d97706',
      bg: '#fffbeb',
      border: '#fde68a',
      icon: <Shield className="w-3.5 h-3.5 text-amber-600" />
    };
  }
  if (normalized.includes('TIER D') || normalized === 'TIER_D') {
    return {
      label: 'Tier D (Destructive)',
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
    };
  }
  return {
    label: tier || 'Standard',
    color: 'var(--ink-secondary)',
    bg: 'var(--surface-subtle)',
    border: 'var(--hairline)',
    icon: <Shield className="w-3.5 h-3.5" />
  };
};

const SkillCatalogModal = ({ isOpen, onClose, onImportSkill }) => {
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [skills, setSkills] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [skillDetail, setSkillDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [copiedSpec, setCopiedSpec] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  // Load catalog list
  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchSkillsCatalog({
        category,
        query: searchQuery.trim(),
        limit: 150,
      });
      setSkills(data.skills || []);
      setTotalCount(data.total || (data.skills ? data.skills.length : 0));
      if (data.skills && data.skills.length > 0) {
        // Default select first item if none or current selected is not in results
        const exists = data.skills.some(s => s.name === selectedSkill?.name);
        if (!exists) {
          setSelectedSkill(data.skills[0]);
        }
      } else {
        setSelectedSkill(null);
        setSkillDetail(null);
      }
    } catch (err) {
      console.error('Failed to load skills catalog:', err);
      setError(err.message || 'Failed to connect to backend skills catalog.');
    } finally {
      setIsLoading(false);
    }
  }, [category, searchQuery, selectedSkill?.name]);

  useEffect(() => {
    if (isOpen) {
      loadCatalog();
    }
  }, [isOpen, category, loadCatalog]);

  // Load skill detail when selection changes
  useEffect(() => {
    if (!selectedSkill) {
      setSkillDetail(null);
      return;
    }
    let isCancelled = false;
    async function loadDetail() {
      setIsLoadingDetail(true);
      try {
        const detail = await fetchSkillDetail(selectedSkill.category, selectedSkill.name);
        if (!isCancelled) {
          setSkillDetail(detail);
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn('Failed to load full skill spec, using catalog summary:', err);
          setSkillDetail({
            ...selectedSkill,
            guidelines: ['Adhere to strict safety clearance bounds.'],
            permissions: selectedSkill.tags || [],
          });
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingDetail(false);
        }
      }
    }
    loadDetail();
    return () => { isCancelled = true; };
  }, [selectedSkill]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleImport = async () => {
    if (!selectedSkill) return;
    setIsImporting(true);
    setImportSuccess(false);
    try {
      const result = await importCatalogSkill({
        category: selectedSkill.category,
        skillName: selectedSkill.name,
      });

      setImportSuccess(true);
      setTimeout(() => {
        if (onImportSkill) {
          onImportSkill({
            prompt: result.prompt || skillDetail?.full_spec || selectedSkill.description,
            metadata: result.metadata || skillDetail || selectedSkill,
            safetyTier: result.safety_tier || selectedSkill.safety_tier,
          });
        }
        onClose();
      }, 400);
    } catch (err) {
      console.error('Failed to import skill:', err);
      // Fallback: build prompt directly from detail
      const fallbackPrompt = skillDetail?.full_spec || `# Role: ${selectedSkill.title}\n\n${selectedSkill.description}\n\nSafety Clearance: ${selectedSkill.safety_tier}`;
      if (onImportSkill) {
        onImportSkill({
          prompt: fallbackPrompt,
          metadata: selectedSkill,
          safetyTier: selectedSkill.safety_tier,
        });
      }
      onClose();
    } finally {
      setIsImporting(false);
    }
  };

  const handleCopySpec = async () => {
    const textToCopy = skillDetail?.full_spec || selectedSkill?.description || '';
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedSpec(true);
      setTimeout(() => setCopiedSpec(false), 2000);
    } catch (err) {
      console.error('Failed to copy spec:', err);
    }
  };

  if (!isOpen) return null;

  const safetyBadge = getSafetyTierBadge(selectedSkill?.safety_tier);

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 100 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '94vw',
          maxWidth: '68rem',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-modal)'
        }}
      >
        {/* Header Strip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--hairline)',
          background: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-subtle)',
              border: '1px solid var(--hairline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Boxes className="w-4 h-4 text-zinc-800" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink-primary)', margin: 0 }}>
                  Agent Skills Specification Catalog
                </h2>
                <span className="card-badge" style={{ fontSize: '0.65rem' }}>
                  {totalCount} ENTERPRISE SKILLS
                </span>
              </div>
              <p style={{ fontSize: '0.725rem', color: 'var(--ink-muted)', margin: 0 }}>
                Standardized AI agent capability blueprints with YAML frontmatter, execution permissions, and safety tiers.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            title="Close catalog (Esc)"
          >
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '0.75rem 1.25rem',
          background: 'var(--surface-subtle)',
          borderBottom: '1px solid var(--hairline)',
          flexWrap: 'wrap'
        }}>
          {/* Category Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`btn btn-sm ${category === cat.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.725rem', padding: '0.25rem 0.6rem' }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: 'min(100%, 14rem)', flex: 1, maxWidth: '24rem' }}>
            <Search className="w-3.5 h-3.5 text-zinc-400" style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skills, tools, or tags..."
              style={{
                width: '100%',
                padding: '0.35rem 0.625rem 0.35rem 2rem',
                fontSize: '0.775rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--hairline)',
                background: '#ffffff',
                color: 'var(--ink-primary)',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--ink-muted)'
                }}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Two-Pane Body */}
        <div className="skill-catalog-body">
          {/* Left Pane: Skill List */}
          <div className="skill-catalog-list-pane" style={{
            display: 'flex',
            flexDirection: 'column'
          }}>
            {isLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--ink-muted)', fontSize: '0.8rem' }}>
                <div style={{ display: 'inline-block', width: '1.25rem', height: '1.25rem', border: '2px solid var(--hairline)', borderTopColor: 'var(--ink-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
                <div>Loading enterprise skill specifications...</div>
              </div>
            ) : error ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--semantic-error)', fontSize: '0.775rem' }}>
                <AlertCircle className="w-5 h-5 mx-auto mb-1" />
                <p style={{ margin: 0 }}>{error}</p>
                <button
                  type="button"
                  onClick={loadCatalog}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '0.75rem' }}
                >
                  Retry Connection
                </button>
              </div>
            ) : skills.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--ink-muted)', fontSize: '0.775rem' }}>
                <Boxes className="w-6 h-6 mx-auto mb-2 text-zinc-400" />
                <p style={{ margin: 0, fontWeight: 500 }}>No skills found matching "{searchQuery}"</p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem' }}>Try searching another keyword or clearing filters.</p>
              </div>
            ) : (
              <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {skills.map((s) => {
                  const isSelected = selectedSkill?.name === s.name;
                  const tierBadge = getSafetyTierBadge(s.safety_tier);
                  return (
                    <div
                      key={`${s.category}-${s.name}`}
                      onClick={() => setSelectedSkill(s)}
                      style={{
                        padding: '0.625rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        background: isSelected ? 'var(--surface-subtle)' : 'transparent',
                        border: isSelected ? '1px solid var(--hairline-dark)' : '1px solid transparent',
                        transition: 'all 120ms ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'var(--surface-subtle)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <strong style={{ fontSize: '0.8rem', color: 'var(--ink-primary)' }}>
                          {s.title || s.name}
                        </strong>
                        <span style={{
                          fontSize: '0.625rem',
                          padding: '0.1rem 0.35rem',
                          borderRadius: 'var(--radius-xs)',
                          background: tierBadge.bg,
                          color: tierBadge.color,
                          border: `1px solid ${tierBadge.border}`,
                          fontWeight: 600
                        }}>
                          {s.safety_tier || 'Tier R'}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '0.725rem',
                        color: 'var(--ink-body)',
                        margin: 0,
                        lineHeight: '1.35',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {s.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                        <span className="card-badge" style={{ fontSize: '0.6rem', textTransform: 'uppercase' }}>
                          {s.category}
                        </span>
                        {s.tags?.slice(0, 2).map((t, idx) => (
                          <span key={idx} style={{ fontSize: '0.6rem', color: 'var(--ink-muted)' }}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Pane: Skill Inspector Detail */}
          <div className="skill-catalog-detail-pane" style={{
            padding: '1.25rem',
            gap: '1rem'
          }}>
            {selectedSkill ? (
              <>
                {/* Detail Header */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid var(--hairline)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span className="card-badge" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                          {selectedSkill.category}
                        </span>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.675rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-xs)',
                          background: safetyBadge.bg,
                          color: safetyBadge.color,
                          border: `1px solid ${safetyBadge.border}`,
                          fontWeight: 600
                        }}>
                          {safetyBadge.icon}
                          <span>{safetyBadge.label}</span>
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink-primary)', margin: 0 }}>
                        {selectedSkill.title || selectedSkill.name}
                      </h3>
                      <code style={{ fontSize: '0.725rem', color: 'var(--ink-muted)' }}>
                        {selectedSkill.name}
                      </code>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={handleCopySpec}
                        className="btn btn-secondary btn-sm"
                        title="Copy skill specification to clipboard"
                      >
                        {copiedSpec ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSpec ? 'Copied' : 'Copy Spec'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleImport}
                        disabled={isImporting || importSuccess}
                        className="btn btn-primary btn-sm"
                        title="Load this skill into the workbench"
                      >
                        {importSuccess ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>{importSuccess ? 'Imported!' : isImporting ? 'Importing...' : 'Import to Studio'}</span>
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--ink-body)', margin: 0, lineHeight: '1.5' }}>
                    {selectedSkill.description}
                  </p>
                </div>

                {/* Execution Permissions & Scope */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid var(--hairline)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.875rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                    <Shield className="w-3.5 h-3.5 text-zinc-700" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                      Execution Permissions & Scope
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                    {selectedSkill.permissions && selectedSkill.permissions.length > 0 ? (
                      selectedSkill.permissions.map((p, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-xs)',
                            background: 'var(--surface-subtle)',
                            border: '1px solid var(--hairline)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.675rem',
                            color: 'var(--ink-secondary)'
                          }}
                        >
                          {p}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.725rem', color: 'var(--ink-muted)' }}>
                        Standard read permissions. No elevated mutation scopes required.
                      </span>
                    )}
                  </div>
                </div>

                {/* Safety & Operational Guidelines */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid var(--hairline)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.875rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                    <Terminal className="w-3.5 h-3.5 text-zinc-700" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                      Safety & Operational Guidelines
                    </span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem', color: 'var(--ink-body)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {skillDetail?.guidelines && skillDetail.guidelines.length > 0 ? (
                      skillDetail.guidelines.map((g, idx) => (
                        <li key={idx}>{g}</li>
                      ))
                    ) : (
                      <>
                        <li>Enforce strict isolation between user prompts and internal model tool invocations.</li>
                        <li>Respect tier clearance: mutations must require explicit human confirmation.</li>
                        <li>Validate all structural parameters against enterprise schema standards.</li>
                      </>
                    )}
                  </ul>
                </div>

                {/* Full Spec Preview */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid var(--hairline)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.875rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Cpu className="w-3.5 h-3.5 text-zinc-700" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                        Specification Preview (SKILL.md)
                      </span>
                    </div>
                    <span style={{ fontSize: '0.675rem', color: 'var(--ink-muted)' }}>
                      {isLoadingDetail ? 'Loading spec...' : 'Spec Loaded'}
                    </span>
                  </div>

                  <pre style={{
                    background: 'var(--surface-subtle)',
                    border: '1px solid var(--hairline)',
                    borderRadius: 'var(--radius-xs)',
                    padding: '0.75rem',
                    fontSize: '0.725rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--ink-primary)',
                    maxHeight: '14rem',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.5'
                  }}>
                    <code>{skillDetail?.full_spec || `# Specification: ${selectedSkill.name}\n\nLoading specification from backend...`}</code>
                  </pre>
                </div>
              </>
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-muted)', fontSize: '0.8rem' }}>
                Select a skill from the catalog to inspect its enterprise blueprint.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillCatalogModal;
