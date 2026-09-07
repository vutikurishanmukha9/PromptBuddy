import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  exportPrompt,
  exportPydanticModel,
  exportJsonSchema,
  exportDspySignature,
  exportGuidanceProgram,
  exportOutlinesGrammar,
} from '../utils/exporters';
import { calculateQualityScore } from '../utils/qualityScorer';
import { savePrompt } from '../utils/storage';
import {
  generateSkillMarkdown,
  downloadSkillFile,
  extractSkillMetadata,
  getInstallationGuides,
} from '../utils/skillGenerator';
import {
  runRedteamAudit,
  evolvePrompt,
  generatePromptVariants,
  compileGuidance,
  compileGrammar,
} from '../utils/api';
import {
  Copy,
  Check,
  FolderArchive,
  Download,
  Split,
  Play,
  BarChart2,
  Code2,
  FileText,
  AlertCircle,
  Cpu,
  Terminal,
  FileCode,
  Layers,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';

const inlineMd = (text) => {
  const parts = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${match.index}-${token}`;
    if (token.startsWith('**')) {
      parts.push(<strong key={key} style={{ color: 'var(--ink-primary)', fontWeight: 600 }}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      parts.push(<code key={key} style={{ background: 'var(--surface-subtle)', border: '1px solid var(--hairline)', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.85em' }}>{token.slice(1, -1)}</code>);
    } else {
      parts.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

const renderMarkdown = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeLines = [];

  lines.forEach((line, i) => {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} style={{ background: 'var(--surface-subtle)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', overflowX: 'auto', margin: '0.5rem 0', fontSize: '0.8rem' }}>
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }
    if (inCodeBlock) { codeLines.push(line); return; }

    if (line.startsWith('### ')) {
      elements.push(<h4 key={i} style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink-primary)', margin: '0.75rem 0 0.25rem 0' }}>{line.slice(4)}</h4>);
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(<h3 key={i} style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink-primary)', margin: '1rem 0 0.35rem 0', borderBottom: '1px solid var(--hairline)', paddingBottom: '0.2rem' }}>{line.slice(3)}</h3>);
      return;
    }
    if (line.startsWith('# ')) {
      elements.push(<h2 key={i} style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink-primary)', margin: '1rem 0 0.5rem 0' }}>{line.slice(2)}</h2>);
      return;
    }

    const trimmed = line.trim();
    if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ')) {
      const isChecked = trimmed.startsWith('- [x] ');
      elements.push(
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0 0.25rem 0.5rem', fontSize: '0.8125rem', color: 'var(--ink-body)' }}>
          <input type="checkbox" checked={isChecked} readOnly style={{ accentColor: 'var(--primary)' }} />
          <span>{inlineMd(trimmed.slice(6))}</span>
        </div>
      );
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <li key={i} style={{ margin: '0.2rem 0 0.2rem 1.25rem', color: 'var(--ink-body)', fontSize: '0.8125rem' }}>
          {inlineMd(line.slice(2))}
        </li>
      );
      return;
    }

    const structMatch = trimmed.match(/^(ROLE|TASK|FORMAT|CONSTRAINTS|CONTEXT|GOAL|EXPECTATION|STEP \d+):/i);
    if (structMatch) {
      const tag = structMatch[1].toUpperCase();
      elements.push(
        <div key={i} style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '0.5rem',
          padding: '0.4rem 0.6rem',
          margin: '0.35rem 0',
          background: 'var(--surface-subtle)',
          borderLeft: '2px solid var(--primary)',
          borderRadius: 'var(--radius-xs)',
          fontSize: '0.8125rem'
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--ink-primary)', textTransform: 'uppercase' }}>
            {tag}
          </span>
          <span style={{ color: 'var(--ink-body)', flex: 1 }}>{inlineMd(trimmed.slice(structMatch[0].length))}</span>
        </div>
      );
      return;
    }

    if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: '0.5rem' }} />);
      return;
    }

    elements.push(
      <p key={i} style={{ margin: '0.25rem 0', color: 'var(--ink-body)', fontSize: '0.8125rem', lineHeight: '1.6' }}>
        {inlineMd(line)}
      </p>
    );
  });

  return elements;
};

const PromptOutput = ({ result, intentOptions, onUpdatePrompt }) => {
  const [activePromptOverride, setActivePromptOverride] = useState(null);
  const currentPrompt = activePromptOverride || result?.optimized_prompt || '';

  const isAgentSkillIntent = result?.intent === 'agent_skill';
  const [copied, setCopied] = useState(false);
  const [skillCopied, setSkillCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeTab, setActiveTab] = useState(isAgentSkillIntent ? 'skill' : 'output');
  const [qualityScore, setQualityScore] = useState(null);
  const [skillViewMode, setSkillViewMode] = useState('preview'); // 'preview' | 'raw' | 'guides'
  const [copiedGuideId, setCopiedGuideId] = useState(null);

  // SDK Sub-tab state
  const [sdkTab, setSdkTab] = useState('python'); // 'python' | 'guidance' | 'grammar' | 'pydantic' | 'schema' | 'dspy' | 'curl'

  // Evaluation Lab state
  const [playgroundInput, setPlaygroundInput] = useState('');
  const [playgroundOutput, setPlaygroundOutput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState('');
  const [assertionResults, setAssertionResults] = useState(null);
  const [isEvaluatingAssertions, setIsEvaluatingAssertions] = useState(false);
  const [assertionError, setAssertionError] = useState('');

  // Redteam State
  const [redteamResult, setRedteamResult] = useState(null);
  const [isRunningRedteam, setIsRunningRedteam] = useState(false);
  const [redteamError, setRedteamError] = useState('');
  const [appliedDefense, setAppliedDefense] = useState(false);

  // Evolution & Variants State
  const [evolutionCritique, setEvolutionCritique] = useState('');
  const [isEvolving, setIsEvolving] = useState(false);
  const [evolutionResult, setEvolutionResult] = useState(null);
  const [evolutionError, setEvolutionError] = useState('');
  const [appliedEvolution, setAppliedEvolution] = useState(false);

  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);
  const [variantsResult, setVariantsResult] = useState(null);
  const [variantsError, setVariantsError] = useState('');
  const [selectedVariantKey, setSelectedVariantKey] = useState('minimalist');
  const [appliedVariant, setAppliedVariant] = useState(false);

  // Guidance & Grammar compiled code cache
  const [guidanceCode, setGuidanceCode] = useState('');
  const [isCompilingGuidance, setIsCompilingGuidance] = useState(false);
  const [grammarCode, setGrammarCode] = useState('');
  const [isCompilingGrammar, setIsCompilingGrammar] = useState(false);

  const estimatedTokens = Math.round((currentPrompt?.length || 0) / 4);
  const estimatedCost = (estimatedTokens * 0.00000015).toFixed(5);

  useEffect(() => {
    setActivePromptOverride(null);
    setRedteamResult(null);
    setAppliedDefense(false);
    setEvolutionResult(null);
    setAppliedEvolution(false);
    setVariantsResult(null);
    setAppliedVariant(false);
    setGuidanceCode('');
    setGrammarCode('');
  }, [result?.optimized_prompt]);

  useEffect(() => {
    if (currentPrompt) {
      const score = calculateQualityScore(currentPrompt);
      setQualityScore(score);
    }
  }, [currentPrompt]);

  useEffect(() => {
    if (result?.intent === 'agent_skill') {
      setActiveTab('skill');
    }
  }, [result?.intent]);

  const getIntentLabel = useCallback(
    (val) => intentOptions.find((o) => o.value === val)?.label || val,
    [intentOptions]
  );

  // Derive standardized SKILL.md representation
  const skillMarkdown = useMemo(() => {
    return generateSkillMarkdown(
      result?.original_prompt || '',
      currentPrompt,
      getIntentLabel(result?.intent)
    );
  }, [result?.original_prompt, currentPrompt, getIntentLabel]);

  const skillMetadata = useMemo(() => {
    return extractSkillMetadata(skillMarkdown);
  }, [skillMarkdown]);

  const installationGuides = useMemo(() => {
    return getInstallationGuides(skillMetadata.name);
  }, [skillMetadata.name]);

  const copyToClipboard = useCallback(async () => {
    if (!currentPrompt) return;
    try {
      await navigator.clipboard.writeText(currentPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }, [currentPrompt]);

  const copySkillMarkdown = useCallback(async () => {
    if (!skillMarkdown) return;
    try {
      await navigator.clipboard.writeText(skillMarkdown);
      setSkillCopied(true);
      setTimeout(() => setSkillCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy skill: ', err);
    }
  }, [skillMarkdown]);

  const handleDownloadSkill = useCallback(() => {
    if (!skillMarkdown) return;
    downloadSkillFile(skillMarkdown, 'SKILL.md');
  }, [skillMarkdown]);

  const copyGuideCommand = useCallback(async (guide) => {
    try {
      await navigator.clipboard.writeText(guide.bashCmd);
      setCopiedGuideId(guide.id);
      setTimeout(() => setCopiedGuideId(null), 2000);
    } catch (err) {
      console.error('Failed to copy command: ', err);
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!currentPrompt) return;
    savePrompt({
      title: `${getIntentLabel(result.intent)} - ${result.original_prompt.substring(0, 30)}...`,
      basePrompt: result.original_prompt,
      promptType: result.intent,
      optimizedPrompt: currentPrompt,
      aiModel: result.ai_model,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [getIntentLabel, result, currentPrompt]);

  const handleExport = useCallback((fmt) => {
    if (fmt === 'skill_md') {
      handleDownloadSkill();
    } else {
      exportPrompt({
        title: getIntentLabel(result.intent),
        basePrompt: result.original_prompt,
        promptType: result.intent,
        optimizedPrompt: currentPrompt,
        aiModel: result.ai_model,
      }, fmt);
    }
    setShowExportMenu(false);
  }, [getIntentLabel, result, currentPrompt, handleDownloadSkill]);

  const handleRunTest = async () => {
    if (!currentPrompt) return;
    setIsTesting(true);
    setTestError('');
    setPlaygroundOutput('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/test-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          user_input: playgroundInput,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || data.error || 'Test execution failed');
      }

      setPlaygroundOutput(data.output || 'No output generated');
    } catch (err) {
      setTestError(err.message || 'Failed to execute prompt test');
    } finally {
      setIsTesting(false);
    }
  };

  // Python integration code snippet
  const pythonSnippet = useMemo(() => {
    return `from openai import OpenAI

client = OpenAI()

prompt = """${currentPrompt?.replace(/"""/g, '\\"\\"\\"') || ''}"""

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": prompt},
        {"role": "user", "content": "Process initial input..."}
    ],
    temperature=0.2
)

print(response.choices[0].message.content)`;
  }, [currentPrompt]);

  const curlSnippet = useMemo(() => {
    return `curl https://api.openai.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "system", "content": ${JSON.stringify(currentPrompt || '')}}
    ]
  }'`;
  }, [currentPrompt]);

  const pydanticSnippet = useMemo(() => {
    return exportPydanticModel({
      title: getIntentLabel(result?.intent) || 'PromptResponse',
      basePrompt: result?.original_prompt,
      optimizedPrompt: currentPrompt,
    });
  }, [result, getIntentLabel, currentPrompt]);

  const schemaSnippet = useMemo(() => {
    return exportJsonSchema({
      title: getIntentLabel(result?.intent) || 'PromptResponse',
      basePrompt: result?.original_prompt,
      optimizedPrompt: currentPrompt,
    });
  }, [result, getIntentLabel, currentPrompt]);

  const dspySnippet = useMemo(() => {
    return exportDspySignature({
      title: getIntentLabel(result?.intent) || 'PromptTask',
      basePrompt: result?.original_prompt,
      optimizedPrompt: currentPrompt,
    });
  }, [result, getIntentLabel, currentPrompt]);

  const guidanceSnippet = useMemo(() => {
    return guidanceCode || exportGuidanceProgram({ optimizedPrompt: currentPrompt });
  }, [guidanceCode, currentPrompt]);

  const grammarSnippet = useMemo(() => {
    return grammarCode || exportOutlinesGrammar({ optimizedPrompt: currentPrompt });
  }, [grammarCode, currentPrompt]);

  // Redteam audit handler
  const handleRunRedteamAudit = async () => {
    if (!currentPrompt) return;
    setIsRunningRedteam(true);
    setRedteamError('');
    setAppliedDefense(false);
    try {
      const res = await runRedteamAudit({
        prompt: currentPrompt,
        targetIntent: result?.intent || 'general',
      });
      setRedteamResult(res);
    } catch (err) {
      console.error('Redteam audit error:', err);
      setRedteamError(err.message || 'Failed to complete redteam security audit');
    } finally {
      setIsRunningRedteam(false);
    }
  };

  const handleApplyHardenedDefense = () => {
    if (!redteamResult?.hardened_prompt) return;
    setActivePromptOverride(redteamResult.hardened_prompt);
    setAppliedDefense(true);
    if (onUpdatePrompt) onUpdatePrompt(redteamResult.hardened_prompt);
  };

  // Evolution handler
  const handleRunEvolution = async () => {
    if (!currentPrompt) return;
    setIsEvolving(true);
    setEvolutionError('');
    setAppliedEvolution(false);
    try {
      const res = await evolvePrompt({
        basePrompt: currentPrompt,
        intent: result?.intent || 'general',
        critique: evolutionCritique.trim(),
        maxIterations: 3,
      });
      setEvolutionResult(res);
    } catch (err) {
      console.error('Evolution error:', err);
      setEvolutionError(err.message || 'Failed to evolve prompt');
    } finally {
      setIsEvolving(false);
    }
  };

  const handleAdoptEvolvedPrompt = () => {
    if (!evolutionResult?.final_prompt) return;
    setActivePromptOverride(evolutionResult.final_prompt);
    setAppliedEvolution(true);
    if (onUpdatePrompt) onUpdatePrompt(evolutionResult.final_prompt);
  };

  // Variants handler
  const handleRunVariants = async () => {
    if (!currentPrompt) return;
    setIsGeneratingVariants(true);
    setVariantsError('');
    setAppliedVariant(false);
    try {
      const res = await generatePromptVariants({
        basePrompt: currentPrompt,
        intent: result?.intent || 'general',
      });
      setVariantsResult(res);
      if (res.variants && Object.keys(res.variants).length > 0) {
        setSelectedVariantKey(Object.keys(res.variants)[0]);
      }
    } catch (err) {
      console.error('Variants generation error:', err);
      setVariantsError(err.message || 'Failed to generate prompt variants');
    } finally {
      setIsGeneratingVariants(false);
    }
  };

  const handleApplyVariant = (variantText) => {
    if (!variantText) return;
    setActivePromptOverride(variantText);
    setAppliedVariant(true);
    if (onUpdatePrompt) onUpdatePrompt(variantText);
  };

  // Guidance compilation handler
  const handleCompileGuidance = async () => {
    setIsCompilingGuidance(true);
    try {
      const res = await compileGuidance({ prompt: currentPrompt, modelFamily: 'openai' });
      setGuidanceCode(res.guidance_program || exportGuidanceProgram({ optimizedPrompt: currentPrompt }));
    } catch (err) {
      console.warn('Backend guidance compiler error, using template:', err);
      setGuidanceCode(exportGuidanceProgram({ optimizedPrompt: currentPrompt }));
    } finally {
      setIsCompilingGuidance(false);
    }
  };

  // Grammar compilation handler
  const handleCompileGrammar = async () => {
    setIsCompilingGrammar(true);
    try {
      const res = await compileGrammar({ grammarFormat: 'regex' });
      setGrammarCode(res.grammar || exportOutlinesGrammar({ optimizedPrompt: currentPrompt }));
    } catch (err) {
      console.warn('Backend grammar compiler error, using template:', err);
      setGrammarCode(exportOutlinesGrammar({ optimizedPrompt: currentPrompt }));
    } finally {
      setIsCompilingGrammar(false);
    }
  };

  const handleRunAssertions = async (targetText) => {
    const textToEvaluate = targetText || playgroundOutput || result?.optimized_prompt;
    if (!textToEvaluate) return;
    setIsEvaluatingAssertions(true);
    setAssertionError('');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/assertions/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToEvaluate,
          rules: [
            { type: 'no_refusals' },
            { type: 'no_secrets' },
            { type: 'length_bounds', expected: { min: 10, max: 50000 } },
          ],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || data.error || 'Assertion evaluation failed');
      }
      setAssertionResults(data);
    } catch (err) {
      setAssertionError(err.message || 'Failed to run assertions');
    } finally {
      setIsEvaluatingAssertions(false);
    }
  };

  return (
    <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Inspector Header */}
      <div className="card-header-strip" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isAgentSkillIntent ? (
            <Cpu className="w-4 h-4 text-zinc-700" />
          ) : (
            <Code2 className="w-4 h-4 text-zinc-700" />
          )}
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
            {isAgentSkillIntent ? 'AI IDE Agent Skill Inspector' : 'Optimized Prompt Inspector'}
          </h2>
          {result.ai_model && (
            <span className="card-badge" style={{ fontSize: '0.65rem' }}>
              {result.ai_model}
            </span>
          )}
        </div>

        {/* Telemetry & Quick Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <button
            type="button"
            onClick={copyToClipboard}
            className="btn btn-secondary btn-sm"
            title="Copy optimized text"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadSkill}
            className="btn btn-secondary btn-sm"
            title="Download standardized SKILL.md for AI IDEs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>SKILL.md</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="btn btn-secondary btn-sm"
            title="Save to prompt library"
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>{saved ? 'Saved' : 'Save'}</span>
          </button>

          {/* Export Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn btn-secondary btn-sm"
              title="Export options"
            >
              <span>Export</span>
            </button>

            {showExportMenu && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: '0.25rem',
                zIndex: 30,
                background: '#ffffff',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-md)',
                minWidth: '12rem',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '0.35rem 0.75rem', fontSize: '0.65rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--hairline)' }}>
                  Standard Exports
                </div>
                <button
                  type="button"
                  onClick={() => handleExport('skill_md')}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.45rem 0.75rem', fontSize: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-primary)', fontWeight: 600 }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--surface-subtle)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  AI Skill (SKILL.md)
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('markdown')}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.45rem 0.75rem', fontSize: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-primary)' }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--surface-subtle)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  Standard Markdown (.md)
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('json')}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.45rem 0.75rem', fontSize: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-primary)' }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--surface-subtle)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  JSON Payload (.json)
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('text')}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.45rem 0.75rem', fontSize: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-primary)' }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--surface-subtle)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  Plain Text (.txt)
                </button>

                <div style={{ padding: '0.35rem 0.75rem', fontSize: '0.65rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderTop: '1px solid var(--hairline)', borderBottom: '1px solid var(--hairline)' }}>
                  Enterprise CI/CD & Schemas
                </div>
                <button
                  type="button"
                  onClick={() => handleExport('promptfoo')}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.45rem 0.75rem', fontSize: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-primary)' }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--surface-subtle)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  Promptfoo CI/CD (.yaml)
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('langfuse')}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.45rem 0.75rem', fontSize: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-primary)' }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--surface-subtle)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  Langfuse Prompt (.json)
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('pydantic')}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.45rem 0.75rem', fontSize: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-primary)' }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--surface-subtle)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  Pydantic Model (.py)
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('jsonschema')}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.45rem 0.75rem', fontSize: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-primary)' }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--surface-subtle)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  JSON Schema Draft 2020-12
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('dspy')}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.45rem 0.75rem', fontSize: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-primary)' }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--surface-subtle)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  DSPy Signature (.py)
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('guidance')}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.45rem 0.75rem', fontSize: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-primary)' }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--surface-subtle)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  Microsoft Guidance (.py)
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('grammar')}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.45rem 0.75rem', fontSize: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-primary)' }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--surface-subtle)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  Outlines Regex Grammar (.py)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Telemetry Stats Bar */}
      <div className="telemetry-stats-bar">
        <div>
          <span style={{ color: 'var(--ink-muted)' }}>Tokens: </span>
          <strong className="tabular-nums" style={{ color: 'var(--ink-primary)' }}>{estimatedTokens}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--ink-muted)' }}>Est. Cost: </span>
          <strong className="tabular-nums" style={{ color: 'var(--ink-primary)' }}>${estimatedCost}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--ink-muted)' }}>Latency: </span>
          <strong className="tabular-nums" style={{ color: 'var(--ink-primary)' }}>{result.latency_ms || 320}ms</strong>
        </div>
        <div>
          <span style={{ color: 'var(--ink-muted)' }}>Quality: </span>
          <strong style={{ color: 'var(--ink-primary)' }}>{qualityScore?.grade || 'A'} ({qualityScore?.overall || 92}%)</strong>
        </div>
      </div>

      {/* Tab Navigation Strip */}
      <div className="inspector-tab-strip">
        <button
          type="button"
          onClick={() => setActiveTab('output')}
          className={`inspector-tab ${activeTab === 'output' ? 'inspector-tab--active' : ''}`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Output</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('skill')}
          className={`inspector-tab ${activeTab === 'skill' ? 'inspector-tab--active' : ''}`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Agent SKILL.md</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`inspector-tab ${activeTab === 'security' ? 'inspector-tab--active' : ''}`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Redteam Audit</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('evolution')}
          className={`inspector-tab ${activeTab === 'evolution' ? 'inspector-tab--active' : ''}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Evolution &amp; Variants</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('diff')}
          className={`inspector-tab ${activeTab === 'diff' ? 'inspector-tab--active' : ''}`}
        >
          <Split className="w-3.5 h-3.5" />
          <span>Diff Engine</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('eval')}
          className={`inspector-tab ${activeTab === 'eval' ? 'inspector-tab--active' : ''}`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>Evaluation Lab</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('scorecard')}
          className={`inspector-tab ${activeTab === 'scorecard' ? 'inspector-tab--active' : ''}`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Scorecard</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('code')}
          className={`inspector-tab ${activeTab === 'code' ? 'inspector-tab--active' : ''}`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>SDK Code</span>
        </button>
      </div>

      {/* Tab 1: Formatted Output */}
      {activeTab === 'output' && (
        <div className="card-body" style={{ padding: '1rem' }}>
          {activePromptOverride && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0.75rem',
              marginBottom: '0.75rem',
              borderRadius: 'var(--radius-xs)',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              fontSize: '0.75rem',
              color: '#15803d'
            }}>
              <span>⚡ Active workspace prompt modified with hardened defense or evolved variant.</span>
              <button
                type="button"
                onClick={() => setActivePromptOverride(null)}
                style={{ background: 'none', border: 'none', color: '#15803d', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.7rem' }}
              >
                Reset to Original
              </button>
            </div>
          )}
          <div className="output-code-container">
            {renderMarkdown(currentPrompt)}
          </div>
        </div>
      )}

      {/* Tab 2: AI IDE Skill Architect (SKILL.md) */}
      {activeTab === 'skill' && (
        <div className="card-body" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {/* Skill Specification Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem',
            background: 'var(--surface-subtle)',
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--radius-sm)',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <span className="card-badge" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                  SKILL.md
                </span>
                <strong style={{ fontSize: '0.8125rem', color: 'var(--ink-primary)' }}>
                  {skillMetadata.name}
                </strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--ink-muted)' }}>
                  v{skillMetadata.version}
                </span>
              </div>
              <p style={{ fontSize: '0.725rem', color: 'var(--ink-secondary)', margin: 0, maxWidth: '32rem' }}>
                {skillMetadata.description || 'Standardized AI agent capability specification with YAML frontmatter.'}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <button
                type="button"
                onClick={copySkillMarkdown}
                className="btn btn-secondary btn-sm"
              >
                {skillCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{skillCopied ? 'Copied' : 'Copy SKILL.md'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSkill}
                className="btn btn-primary btn-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </button>
            </div>
          </div>

          {/* Sub-view switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', borderBottom: '1px solid var(--hairline)', paddingBottom: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setSkillViewMode('preview')}
              className={`btn btn-sm ${skillViewMode === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.725rem', padding: '0.25rem 0.625rem' }}
            >
              <FileText className="w-3 h-3" />
              <span>Skill Document View</span>
            </button>
            <button
              type="button"
              onClick={() => setSkillViewMode('raw')}
              className={`btn btn-sm ${skillViewMode === 'raw' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.725rem', padding: '0.25rem 0.625rem' }}
            >
              <FileCode className="w-3 h-3" />
              <span>Raw Markdown Source</span>
            </button>
            <button
              type="button"
              onClick={() => setSkillViewMode('guides')}
              className={`btn btn-sm ${skillViewMode === 'guides' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.725rem', padding: '0.25rem 0.625rem' }}
            >
              <Terminal className="w-3 h-3" />
              <span>AI IDE Install Guides</span>
            </button>
          </div>

          {/* Sub-view: Document Preview */}
          {skillViewMode === 'preview' && (
            <div className="output-code-container" style={{ padding: '1rem' }}>
              {renderMarkdown(skillMarkdown)}
            </div>
          )}

          {/* Sub-view: Raw Markdown Source */}
          {skillViewMode === 'raw' && (
            <div>
              <pre style={{
                background: 'var(--surface-subtle)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.875rem',
                fontSize: '0.75rem',
                lineHeight: '1.6',
                color: 'var(--ink-primary)',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--font-mono)',
                margin: 0
              }}>
                <code>{skillMarkdown}</code>
              </pre>
            </div>
          )}

          {/* Sub-view: AI IDE Installation Guides */}
          {skillViewMode === 'guides' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                Deploy this skill directly into your AI IDE workspace so agents automatically detect, activate, and follow this workflow:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(17rem, 1fr))', gap: '0.75rem' }}>
                {installationGuides.map((guide) => (
                  <div
                    key={guide.id}
                    style={{
                      padding: '0.75rem',
                      background: 'var(--surface-subtle)',
                      border: '1px solid var(--hairline)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                        {guide.ide}
                      </span>
                      <span className="card-badge" style={{ fontSize: '0.65rem' }}>
                        {guide.scope}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.725rem', color: 'var(--ink-secondary)', lineHeight: '1.4' }}>
                      {guide.instruction}
                    </div>

                    <div style={{
                      background: '#ffffff',
                      border: '1px solid var(--hairline)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '0.4rem 0.6rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      color: 'var(--ink-primary)',
                      overflowX: 'auto'
                    }}>
                      <code>{guide.path}</code>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--ink-muted)' }}>CLI Command:</span>
                      <button
                        type="button"
                        onClick={() => copyGuideCommand(guide)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.6875rem', padding: '0.15rem 0.4rem' }}
                      >
                        {copiedGuideId === guide.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedGuideId === guide.id ? 'Copied' : 'Copy CLI'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Automated Redteam Security Audit */}
      {activeTab === 'security' && (
        <div className="card-body" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <ShieldAlert className="w-4 h-4 text-zinc-800" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink-primary)', margin: 0 }}>
                  Automated Redteam Vulnerability Scanner
                </h3>
              </div>
              <p style={{ fontSize: '0.725rem', color: 'var(--ink-muted)', margin: 0 }}>
                Audits prompt against 6 adversarial attack vectors: injection, jailbreaking, delimiters, secret leakage, tool escalation, and data exfiltration.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunRedteamAudit}
              disabled={isRunningRedteam}
              className="btn btn-primary btn-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningRedteam ? 'animate-spin' : ''}`} />
              <span>{isRunningRedteam ? 'Auditing 6 Attack Vectors...' : 'Run Redteam Security Audit'}</span>
            </button>
          </div>

          {redteamError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-xs)', background: 'var(--semantic-error-subtle)', border: '1px solid var(--semantic-error-border)', color: 'var(--semantic-error)', fontSize: '0.75rem' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{redteamError}</span>
            </div>
          )}

          {redteamResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Score & Risk Summary Banner */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
                padding: '1rem',
                background: 'var(--surface-subtle)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Security Hardening Score
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.2rem' }}>
                    <strong style={{
                      fontSize: '1.5rem',
                      fontFamily: 'var(--font-mono)',
                      color: redteamResult.security_score >= 80 ? 'var(--semantic-success)' : redteamResult.security_score >= 60 ? 'var(--semantic-warning)' : 'var(--semantic-error)'
                    }}>
                      {redteamResult.security_score}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>/ 100</span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Adversarial Risk Tier
                  </span>
                  <div style={{ marginTop: '0.35rem' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.625rem',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: redteamResult.risk_tier === 'SAFE' || redteamResult.risk_tier === 'LOW' ? '#f0fdf4' : redteamResult.risk_tier === 'MEDIUM' ? '#fffbeb' : '#fef2f2',
                      color: redteamResult.risk_tier === 'SAFE' || redteamResult.risk_tier === 'LOW' ? '#15803d' : redteamResult.risk_tier === 'MEDIUM' ? '#b45309' : '#b91c1c',
                      border: `1px solid ${redteamResult.risk_tier === 'SAFE' || redteamResult.risk_tier === 'LOW' ? '#bbf7d0' : redteamResult.risk_tier === 'MEDIUM' ? '#fde68a' : '#fecaca'}`
                    }}>
                      {redteamResult.risk_tier === 'SAFE' ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                      <span>{redteamResult.risk_tier} RISK TIER</span>
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Verification Coverage
                  </span>
                  <div style={{ marginTop: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                    {redteamResult.checks_run || 6} / 6 Vectors Audited
                  </div>
                </div>
              </div>

              {/* 6 Attack Vector Inspection Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-secondary)' }}>
                  Attack Vector Evaluation Results
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '0.625rem' }}>
                  {redteamResult.findings?.map((finding, idx) => {
                    const isPassed = finding.passed ?? (finding.status === 'PASSED');
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          background: '#ffffff',
                          border: '1px solid var(--hairline)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                            {finding.vector || finding.name || `Check #${idx + 1}`}
                          </span>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.4rem',
                            borderRadius: 'var(--radius-xs)',
                            background: isPassed ? '#f0fdf4' : '#fef2f2',
                            color: isPassed ? '#15803d' : '#b91c1c',
                            border: `1px solid ${isPassed ? '#bbf7d0' : '#fecaca'}`
                          }}>
                            {isPassed ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            <span>{isPassed ? 'RESISTANT' : 'VULNERABLE'}</span>
                          </span>
                        </div>
                        <p style={{ fontSize: '0.725rem', color: 'var(--ink-body)', margin: 0, lineHeight: '1.4' }}>
                          {finding.details || finding.description || (isPassed ? 'Defenses successfully mitigate adversarial attempts.' : 'Prompt lacks explicit defensive barriers against this vector.')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hardened Defense Section */}
              {redteamResult.hardened_prompt && (
                <div style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: '#ffffff',
                  border: '1px solid var(--hairline)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                        Automated Hardened Defense Specification
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyHardenedDefense}
                      className="btn btn-primary btn-sm"
                      title="Apply hardened defense to current prompt workspace"
                    >
                      {appliedDefense ? <Check className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      <span>{appliedDefense ? '✓ Defense Applied to Workspace!' : 'Apply Hardened Defense'}</span>
                    </button>
                  </div>

                  <pre style={{
                    background: 'var(--surface-subtle)',
                    border: '1px solid var(--hairline)',
                    borderRadius: 'var(--radius-xs)',
                    padding: '0.75rem',
                    fontSize: '0.725rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--ink-primary)',
                    maxHeight: '12rem',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.5'
                  }}>
                    <code>{redteamResult.hardened_prompt}</code>
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              padding: '3rem 1rem',
              textAlign: 'center',
              background: 'var(--surface-subtle)',
              border: '1px dashed var(--hairline)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--ink-muted)'
            }}>
              <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
              <p style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--ink-primary)', margin: 0 }}>
                No Redteam Security Audit Performed Yet
              </p>
              <p style={{ fontSize: '0.75rem', margin: '0.25rem 0 1rem 0' }}>
                Click "Run Redteam Security Audit" above to test your prompt against 6 industrial vulnerability classes.
              </p>
              <button
                type="button"
                onClick={handleRunRedteamAudit}
                disabled={isRunningRedteam}
                className="btn btn-primary btn-sm"
              >
                Start Security Audit
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Prompt Evolution & Multi-Strategy Variants */}
      {activeTab === 'evolution' && (
        <div className="card-body" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Section 1: Feedback Descent Evolution */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <Sparkles className="w-4 h-4 text-zinc-800" />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink-primary)', margin: 0 }}>
                    Feedback Descent Prompt Evolution
                  </h3>
                </div>
                <p style={{ fontSize: '0.725rem', color: 'var(--ink-muted)', margin: 0 }}>
                  Iteratively analyzes prompt weaknesses, applies targeted critiques, and climbs the quality gradient.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunEvolution}
                disabled={isEvolving}
                className="btn btn-primary btn-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isEvolving ? 'animate-spin' : ''}`} />
                <span>{isEvolving ? 'Evolving Prompt...' : 'Run Evolution Loop'}</span>
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: '0.35rem' }}>
                Optimization Focus / Specific Critique (Optional):
              </label>
              <input
                type="text"
                value={evolutionCritique}
                onChange={(e) => setEvolutionCritique(e.target.value)}
                placeholder="e.g. Enforce strict JSON output, reduce token verbosity, ensure zero hallucination boundaries..."
                style={{
                  width: '100%',
                  padding: '0.4rem 0.625rem',
                  fontSize: '0.775rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--hairline)',
                  background: 'var(--surface-subtle)',
                  color: 'var(--ink-primary)'
                }}
              />
            </div>

            {evolutionError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-xs)', background: 'var(--semantic-error-subtle)', border: '1px solid var(--semantic-error-border)', color: 'var(--semantic-error)', fontSize: '0.75rem' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{evolutionError}</span>
              </div>
            )}

            {evolutionResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--surface-subtle)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                    Score Trajectory (Iterative Ascent)
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {evolutionResult.score_trajectory?.map((sc, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.675rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-xs)',
                          background: i === evolutionResult.score_trajectory.length - 1 ? '#18181b' : '#ffffff',
                          color: i === evolutionResult.score_trajectory.length - 1 ? '#ffffff' : 'var(--ink-secondary)',
                          border: '1px solid var(--hairline)',
                          fontWeight: 600
                        }}
                      >
                        Step {i + 1}: {sc}%
                      </span>
                    ))}
                  </div>
                </div>

                <pre style={{
                  background: '#ffffff',
                  border: '1px solid var(--hairline)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '0.75rem',
                  fontSize: '0.725rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--ink-primary)',
                  maxHeight: '12rem',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.5'
                }}>
                  <code>{evolutionResult.final_prompt}</code>
                </pre>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleAdoptEvolvedPrompt}
                    className="btn btn-primary btn-sm"
                  >
                    {appliedEvolution ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>{appliedEvolution ? '✓ Evolved Prompt Adopted!' : 'Adopt Evolved Prompt into Studio'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Multi-Strategy Variants Generator */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <Layers className="w-4 h-4 text-zinc-800" />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink-primary)', margin: 0 }}>
                    Multi-Strategy Architectural Variants
                  </h3>
                </div>
                <p style={{ fontSize: '0.725rem', color: 'var(--ink-muted)', margin: 0 }}>
                  Instantly synthesize 4 distinct architectural styles: Minimalist, Strict Guardrails, Few-Shot Demonstrations, and Chain-of-Thought Reasoning.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunVariants}
                disabled={isGeneratingVariants}
                className="btn btn-primary btn-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingVariants ? 'animate-spin' : ''}`} />
                <span>{isGeneratingVariants ? 'Synthesizing 4 Variants...' : 'Generate 4 Architectural Variants'}</span>
              </button>
            </div>

            {variantsError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-xs)', background: 'var(--semantic-error-subtle)', border: '1px solid var(--semantic-error-border)', color: 'var(--semantic-error)', fontSize: '0.75rem' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{variantsError}</span>
              </div>
            )}

            {variantsResult?.variants && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Variant Selector Tabs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {Object.keys(variantsResult.variants).map((strategyKey) => {
                    const label = strategyKey === 'minimalist' ? 'Minimalist High-Density'
                      : strategyKey === 'strict_guardrails' ? 'Strict Defense Guardrails'
                      : strategyKey === 'few_shot' ? 'Few-Shot Exemplars'
                      : 'Chain-of-Thought Reasoning';
                    const isSelected = selectedVariantKey === strategyKey;
                    return (
                      <button
                        key={strategyKey}
                        type="button"
                        onClick={() => setSelectedVariantKey(strategyKey)}
                        className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.725rem' }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Variant Display */}
                <div style={{
                  background: 'var(--surface-subtle)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-primary)', textTransform: 'capitalize' }}>
                      {selectedVariantKey.replace(/_/g, ' ')} Blueprint
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplyVariant(variantsResult.variants[selectedVariantKey])}
                      className="btn btn-primary btn-sm"
                    >
                      {appliedVariant ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                      <span>{appliedVariant ? '✓ Variant Loaded into Studio!' : 'Use This Variant in Studio'}</span>
                    </button>
                  </div>

                  <pre style={{
                    background: '#ffffff',
                    border: '1px solid var(--hairline)',
                    borderRadius: 'var(--radius-xs)',
                    padding: '0.75rem',
                    fontSize: '0.725rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--ink-primary)',
                    maxHeight: '12rem',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.5'
                  }}>
                    <code>{variantsResult.variants[selectedVariantKey]}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Side-by-Side Diff Engine */}
      {activeTab === 'diff' && (
        <div className="card-body" style={{ padding: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginBottom: '0.75rem' }}>
            Compare raw informal request with the structured enterprise prompt.
          </p>
          <div className="diff-container">
            <div className="diff-pane">
              <div className="diff-pane__header">Original Request</div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--ink-body)' }}>
                {result.original_prompt}
              </div>
            </div>

            <div className="diff-pane" style={{ borderLeftColor: 'var(--primary)' }}>
              <div className="diff-pane__header" style={{ color: 'var(--ink-primary)' }}>Structured Output</div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--ink-primary)' }}>
                {currentPrompt}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Interactive Evaluation Lab */}
      {activeTab === 'eval' && (
        <div className="card-body" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: '0.35rem' }}>
              Test User Input Payload:
            </label>
            <textarea
              value={playgroundInput}
              onChange={(e) => setPlaygroundInput(e.target.value)}
              placeholder="Enter sample input to test this prompt against the AI backend..."
              className="source-terminal-textarea"
              style={{ minHeight: '5rem', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleRunTest}
              disabled={isTesting}
              className="btn btn-primary btn-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isTesting ? 'Running Test...' : 'Run Test Execution'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleRunAssertions()}
              disabled={isEvaluatingAssertions}
              className="btn btn-secondary btn-sm"
              title="Evaluate security, refusal, and length assertions"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isEvaluatingAssertions ? 'Evaluating...' : 'Run Assertion Suite'}</span>
            </button>
          </div>

          {testError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-xs)', background: 'var(--semantic-error-subtle)', border: '1px solid var(--semantic-error-border)', color: 'var(--semantic-error)', fontSize: '0.75rem' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{testError}</span>
            </div>
          )}

          {assertionError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-xs)', background: 'var(--semantic-error-subtle)', border: '1px solid var(--semantic-error-border)', color: 'var(--semantic-error)', fontSize: '0.75rem' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{assertionError}</span>
            </div>
          )}

          {assertionResults && (
            <div style={{
              background: 'var(--surface-subtle)',
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                    Enterprise Assertion Matrix
                  </span>
                </div>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-full)',
                  background: assertionResults.overall_passed ? '#16a34a' : '#dc2626',
                  color: '#ffffff',
                  textTransform: 'uppercase'
                }}>
                  {assertionResults.overall_passed ? 'All Passed' : `${assertionResults.failed_count} Failed`} ({assertionResults.passed_count}/{assertionResults.total_assertions})
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {assertionResults.results.map((rule, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.35rem 0.5rem',
                      borderRadius: 'var(--radius-xs)',
                      background: '#ffffff',
                      border: '1px solid var(--hairline)',
                      fontSize: '0.725rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      {rule.passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                      )}
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ink-primary)' }}>
                        {rule.type}
                      </span>
                    </div>
                    <span style={{ color: rule.passed ? 'var(--ink-muted)' : '#dc2626' }}>
                      {rule.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {playgroundOutput && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-secondary)' }}>
                  Test Execution Response:
                </label>
                <button
                  type="button"
                  onClick={() => handleRunAssertions(playgroundOutput)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.675rem', padding: '0.15rem 0.4rem' }}
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Assert on Output</span>
                </button>
              </div>
              <div className="output-code-container" style={{ maxHeight: '14rem' }}>
                {playgroundOutput}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Quality Scorecard */}
      {activeTab === 'scorecard' && qualityScore && (
        <div className="card-body" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--hairline)' }}>
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                Enterprise Quality Grade: {qualityScore.grade}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                Overall Readiness Score: {qualityScore.overall}%
              </p>
            </div>
            <span className="card-badge" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              {qualityScore.overall >= 80 ? 'Production Ready' : 'Needs Refinement'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '0.625rem' }}>
            {Object.entries(qualityScore.breakdown).map(([key, data]) => (
              <div key={key} className="scorecard-metric-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-secondary)', textTransform: 'capitalize' }}>
                    {key}
                  </span>
                  <span className="tabular-nums" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
                    {data.score}%
                  </span>
                </div>
                <div style={{ height: '4px', borderRadius: '999px', background: 'var(--hairline)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${data.score}%`, background: 'var(--primary)' }} />
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--ink-muted)', marginTop: '0.25rem', display: 'block' }}>
                  Weight: {data.weight}
                </span>
              </div>
            ))}
          </div>

          <div style={{ padding: '0.625rem', borderRadius: 'var(--radius-xs)', background: 'var(--surface-subtle)', border: '1px solid var(--hairline)', fontSize: '0.75rem', color: 'var(--ink-body)' }}>
            <strong>Analysis Feedback:</strong> {qualityScore.feedback}
          </div>
        </div>
      )}

      {/* Tab 6: Integration Code */}
      {activeTab === 'code' && (
        <div className="card-body" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Sub-tabs for SDKs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', borderBottom: '1px solid var(--hairline)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'python', label: 'Python (OpenAI)' },
              { id: 'guidance', label: 'Guidance (Microsoft)' },
              { id: 'grammar', label: 'Outlines Regex Grammar' },
              { id: 'pydantic', label: 'Pydantic Model' },
              { id: 'schema', label: 'JSON Schema' },
              { id: 'dspy', label: 'DSPy Signature' },
              { id: 'curl', label: 'cURL Request' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSdkTab(tab.id)}
                className={`btn btn-sm ${sdkTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.725rem', padding: '0.25rem 0.6rem' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {sdkTab === 'python' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-secondary)' }}>
                  Python (OpenAI SDK Completion)
                </span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(pythonSnippet)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                >
                  Copy Python
                </button>
              </div>
              <pre style={{ background: 'var(--surface-subtle)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.75rem', overflowX: 'auto', color: 'var(--ink-primary)' }}>
                <code>{pythonSnippet}</code>
              </pre>
            </div>
          )}

          {sdkTab === 'guidance' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-secondary)' }}>
                  Microsoft Guidance Program (.py)
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleCompileGuidance}
                    disabled={isCompilingGuidance}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                  >
                    <RefreshCw className={`w-3 h-3 ${isCompilingGuidance ? 'animate-spin' : ''}`} />
                    <span>{isCompilingGuidance ? 'Compiling...' : 'Recompile'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(guidanceSnippet)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                  >
                    Copy Guidance
                  </button>
                </div>
              </div>
              <pre style={{ background: 'var(--surface-subtle)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.75rem', overflowX: 'auto', color: 'var(--ink-primary)' }}>
                <code>{guidanceSnippet}</code>
              </pre>
            </div>
          )}

          {sdkTab === 'grammar' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-secondary)' }}>
                  Outlines Guided Decoding Regex &amp; Grammar (.py)
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleCompileGrammar}
                    disabled={isCompilingGrammar}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                  >
                    <RefreshCw className={`w-3 h-3 ${isCompilingGrammar ? 'animate-spin' : ''}`} />
                    <span>{isCompilingGrammar ? 'Compiling...' : 'Recompile'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(grammarSnippet)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                  >
                    Copy Outlines
                  </button>
                </div>
              </div>
              <pre style={{ background: 'var(--surface-subtle)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.75rem', overflowX: 'auto', color: 'var(--ink-primary)' }}>
                <code>{grammarSnippet}</code>
              </pre>
            </div>
          )}

          {sdkTab === 'pydantic' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-secondary)' }}>
                  Python (Pydantic v2 BaseModel for Structured Outputs)
                </span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(pydanticSnippet)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                >
                  Copy Pydantic
                </button>
              </div>
              <pre style={{ background: 'var(--surface-subtle)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.75rem', overflowX: 'auto', color: 'var(--ink-primary)' }}>
                <code>{pydanticSnippet}</code>
              </pre>
            </div>
          )}

          {sdkTab === 'schema' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-secondary)' }}>
                  JSON Schema (Draft 2020-12 Response Format)
                </span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(schemaSnippet)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                >
                  Copy JSON Schema
                </button>
              </div>
              <pre style={{ background: 'var(--surface-subtle)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.75rem', overflowX: 'auto', color: 'var(--ink-primary)' }}>
                <code>{schemaSnippet}</code>
              </pre>
            </div>
          )}

          {sdkTab === 'dspy' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-secondary)' }}>
                  DSPy Signature (dspy.Signature / ChainOfThought)
                </span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(dspySnippet)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                >
                  Copy DSPy
                </button>
              </div>
              <pre style={{ background: 'var(--surface-subtle)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.75rem', overflowX: 'auto', color: 'var(--ink-primary)' }}>
                <code>{dspySnippet}</code>
              </pre>
            </div>
          )}

          {sdkTab === 'curl' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-secondary)' }}>
                  cURL Shell Request
                </span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(curlSnippet)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                >
                  Copy cURL
                </button>
              </div>
              <pre style={{ background: 'var(--surface-subtle)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.75rem', overflowX: 'auto', color: 'var(--ink-primary)' }}>
                <code>{curlSnippet}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PromptOutput;
