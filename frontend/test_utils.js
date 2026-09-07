// Automated test suite for PromptBuddy frontend utilities
// Tests: exporters, skillGenerator, qualityScorer, presets, frameworks

import assert from 'node:assert';
import {
  exportPromptfooYaml,
  exportLangfuseJson,
  exportPydanticModel,
  exportJsonSchema,
  exportDspySignature,
  exportGuidanceProgram,
  exportOutlinesGrammar,
} from './src/utils/exporters.js';
import {
  generateSkillMarkdown,
  extractSkillMetadata,
  getInstallationGuides,
} from './src/utils/skillGenerator.js';
import { calculateQualityScore } from './src/utils/qualityScorer.js';
import { industryPresets, getAllPresets, getPresetsByCategory } from './src/utils/presets.js';
import {
  frameworkCategories,
  frameworkOptions,
  getFrameworkLabel,
  getFrameworkCategory,
} from './src/utils/frameworks.js';

console.log('--- Running PromptBuddy Frontend Utility Unit Tests ---');

const samplePrompt = {
  title: 'Next.js Performance Auditor',
  basePrompt: 'Audit Next.js 15 app for bundle size and server component performance.',
  optimizedPrompt: `# Role\nYou are an elite Next.js performance consultant.\n\n# Instructions\nAudit bundle sizes, analyze RSC vs client boundaries, and check Core Web Vitals.\n\n# Safety Guidelines\nTier R: read-only analysis.`,
  promptType: 'agent_skill',
  aiModel: 'anthropic/claude-3.5-sonnet',
};

// 1. Exporter Tests
console.log('Testing Exporters...');

// Promptfoo YAML
const promptfooYaml = exportPromptfooYaml(samplePrompt);
assert.ok(promptfooYaml.includes('promptfooconfig.yaml'), 'Promptfoo YAML missing header');
assert.ok(promptfooYaml.includes('description: "Next.js Performance Auditor"'), 'Promptfoo YAML missing title');
assert.ok(promptfooYaml.includes('providers:'), 'Promptfoo YAML missing providers');
assert.ok(promptfooYaml.includes('assert:'), 'Promptfoo YAML missing assertion block');
console.log('✓ exportPromptfooYaml passed');

// Langfuse JSON
const langfuseJson = exportLangfuseJson(samplePrompt);
const parsedLangfuse = JSON.parse(langfuseJson);
assert.strictEqual(parsedLangfuse.name, 'next-js-performance-auditor');
assert.strictEqual(parsedLangfuse.type, 'chat');
assert.strictEqual(parsedLangfuse.config.model, 'anthropic/claude-3.5-sonnet');
assert.ok(Array.isArray(parsedLangfuse.labels));
assert.strictEqual(parsedLangfuse.metadata.generator, 'PromptBuddy');
console.log('✓ exportLangfuseJson passed');

// Pydantic Model
const pydanticModel = exportPydanticModel(samplePrompt);
assert.ok(pydanticModel.includes('from pydantic import BaseModel, Field'), 'Pydantic model missing import');
assert.ok(pydanticModel.includes('class NextjsPerformanceAuditor(BaseModel):'), 'Pydantic model missing class definition');
assert.ok(pydanticModel.includes('reasoning: str'), 'Pydantic model missing reasoning field');
assert.ok(pydanticModel.includes('answer: str'), 'Pydantic model missing answer field');
console.log('✓ exportPydanticModel passed');

// JSON Schema
const jsonSchemaStr = exportJsonSchema(samplePrompt);
const jsonSchema = JSON.parse(jsonSchemaStr);
assert.strictEqual(jsonSchema.$schema, 'https://json-schema.org/draft/2020-12/schema');
assert.strictEqual(jsonSchema.type, 'object');
assert.ok(jsonSchema.properties.reasoning);
assert.ok(jsonSchema.properties.answer);
assert.deepStrictEqual(jsonSchema.required, ['reasoning', 'answer']);
console.log('✓ exportJsonSchema passed');

// DSPy Signature
const dspySignature = exportDspySignature(samplePrompt);
assert.ok(dspySignature.includes('import dspy'), 'DSPy missing import');
assert.ok(dspySignature.includes('class NextjsPerformanceAuditor(dspy.Signature):'), 'DSPy missing class');
assert.ok(dspySignature.includes('context: str = dspy.InputField'), 'DSPy missing context input');
assert.ok(dspySignature.includes('answer: str = dspy.OutputField'), 'DSPy missing answer output');
console.log('✓ exportDspySignature passed');

// 2. Skill Generator Tests
console.log('Testing Skill Generator...');
const skillMd = generateSkillMarkdown(samplePrompt.basePrompt, samplePrompt.optimizedPrompt, 'Agent SKILL.md');
assert.ok(skillMd.startsWith('---'), 'SKILL.md missing frontmatter start');
assert.ok(skillMd.includes('name:'), 'SKILL.md missing name frontmatter');
assert.ok(skillMd.includes('version:'), 'SKILL.md missing version frontmatter');
assert.ok(skillMd.includes('## Safety & Permission Boundaries'), 'SKILL.md missing safety boundaries');
assert.ok(skillMd.includes('Tier R (Read-Only)'), 'SKILL.md missing Tier R');
assert.ok(skillMd.includes('Tier M (Modify Worktree)'), 'SKILL.md missing Tier M');
assert.ok(skillMd.includes('Tier D (Destructive / External)'), 'SKILL.md missing Tier D');

const metadata = extractSkillMetadata(skillMd);
assert.ok(metadata.name, 'Metadata extraction failed for name');
assert.ok(metadata.version, 'Metadata extraction failed for version');
assert.ok(metadata.description, 'Metadata extraction failed for description');

const guides = getInstallationGuides('nextjs-auditor');
assert.strictEqual(guides.length, 4, 'Installation guides should have 4 targets');
assert.ok(guides.some(g => g.id === 'claude'), 'Missing Claude guide');
assert.ok(guides.some(g => g.id === 'cursor'), 'Missing Cursor guide');
console.log('✓ Skill Generator passed');

// 3. Quality Scorer Tests
console.log('Testing Quality Scorer...');
const scoreHigh = calculateQualityScore(`
# Role
You are a Senior Systems Architect and Performance Engineer.

# Context
We are designing a mission-critical distributed service handling 100,000 requests per second across 12 geographic regions.

# Core Requirements
- Specifically, you must design an in-memory distributed cache with high availability.
- Step 1: Implement a token bucket rate limiter using Go atomic primitives.
- Step 2: Build a consensus mechanism such as Raft for leader election.
- Step 3: Outline precise failure recovery procedures and data replication constraints.

# Output Format:
Provide a structured JSON response including schema specifications and benchmark examples.
`);
assert.ok(scoreHigh.overall >= 80, `Expected score >= 80, got ${scoreHigh.overall}`);
assert.ok(['A+', 'A', 'B'].includes(scoreHigh.grade), `Expected grade A+, A or B, got ${scoreHigh.grade}`);

const scoreLow = calculateQualityScore('do code review please');
assert.ok(scoreLow.overall < 70, `Expected low score < 70, got ${scoreLow.overall}`);
console.log('✓ Quality Scorer passed');

// 4. Presets Tests
console.log('Testing Presets...');
assert.ok(industryPresets.agentSkills, 'agentSkills category missing from presets');
assert.strictEqual(industryPresets.agentSkills.presets.length, 5, 'agentSkills should have 5 presets');
const allPresets = getAllPresets();
assert.ok(allPresets.length >= 25, `Expected >= 25 presets, got ${allPresets.length}`);
const skillPresets = getPresetsByCategory('agentSkills');
assert.strictEqual(skillPresets.length, 5);
console.log('✓ Presets passed');

// 5. Frameworks Tests
console.log('Testing Frameworks...');
assert.ok(frameworkCategories.agentic, 'agentic category missing');
assert.strictEqual(frameworkCategories.agentic.types[0].value, 'agent_skill');
assert.strictEqual(getFrameworkLabel('agent_skill'), 'Agent SKILL.md');
assert.strictEqual(getFrameworkCategory('agent_skill'), 'agentic');
assert.ok(frameworkOptions.some(opt => opt.value === 'rtf'), 'RTF missing from options');
console.log('✓ Frameworks passed');

// 6. Extended Edge Cases & Quality Dimensions
console.log('Testing Extended Edge Cases & Presets Breakdown...');

// Quality scorer dimensions
const breakdownResult = calculateQualityScore('# Role\nExpert\n# Instructions\nAudit code.');
assert.ok('length' in breakdownResult.breakdown, 'Missing length breakdown');
assert.ok('specificity' in breakdownResult.breakdown, 'Missing specificity breakdown');
assert.ok('structure' in breakdownResult.breakdown, 'Missing structure breakdown');
assert.ok('actionability' in breakdownResult.breakdown, 'Missing actionability breakdown');
assert.ok('clarity' in breakdownResult.breakdown, 'Missing clarity breakdown');
assert.ok('completeness' in breakdownResult.breakdown, 'Missing completeness breakdown');

// Empty and edge prompt scoring
const emptyScore = calculateQualityScore('');
assert.strictEqual(emptyScore.overall, 0, 'Empty string should score 0');
assert.strictEqual(emptyScore.grade, 'N/A', 'Empty string should receive grade N/A');

// Verify all preset categories have valid entries
const presetCategoryKeys = Object.keys(industryPresets);
assert.ok(presetCategoryKeys.length >= 5, 'Should have at least 5 preset categories');
for (const catKey of presetCategoryKeys) {
  const category = industryPresets[catKey];
  assert.ok(category.label, `Category ${catKey} missing label`);
  assert.ok(category.presets && category.presets.length > 0, `Category ${catKey} has no presets`);
  for (const p of category.presets) {
    assert.ok(p.id, `Preset in ${catKey} missing id`);
    assert.ok(p.name, `Preset in ${catKey} missing name`);
    assert.ok(p.basePrompt, `Preset in ${catKey} missing basePrompt`);
    assert.ok(p.promptType, `Preset in ${catKey} missing promptType`);
  }
}

// Verify all frameworkOptions map cleanly
assert.ok(frameworkOptions.length >= 20, `Expected >= 20 framework options, got ${frameworkOptions.length}`);
for (const fw of frameworkOptions) {
  assert.ok(fw.value, 'Framework missing value');
  assert.ok(fw.label, 'Framework missing label');
  assert.ok(fw.desc, 'Framework missing desc');
  const cat = getFrameworkCategory(fw.value);
  assert.ok(cat, `Category missing for framework ${fw.value}`);
  assert.strictEqual(getFrameworkLabel(fw.value), fw.label);
}

// Guidance Program Export
const guidanceProgram = exportGuidanceProgram(samplePrompt);
assert.ok(guidanceProgram.includes('import guidance'), 'Guidance program missing import');
assert.ok(guidanceProgram.includes('models.OpenAI'), 'Guidance program missing model init');
assert.ok(guidanceProgram.includes('with system():'), 'Guidance program missing system block');
console.log('✓ exportGuidanceProgram passed');

// Outlines Grammar Export
const outlinesGrammar = exportOutlinesGrammar(samplePrompt);
assert.ok(outlinesGrammar.includes('import outlines'), 'Outlines grammar missing import');
assert.ok(outlinesGrammar.includes('regex_pattern ='), 'Outlines grammar missing regex pattern');
console.log('✓ exportOutlinesGrammar passed');

// Exporters with multiline quotes and backslashes
const complexPrompt = {
  title: 'C++ & Python "Bridge" \\ Auditor',
  basePrompt: 'Test multiline input with "double quotes" and \\backslashes\\.',
  optimizedPrompt: '```json\n{"status": "ok"}\n```',
  promptType: 'rtf',
  aiModel: 'google/gemini-2.5-pro',
};
const complexYaml = exportPromptfooYaml(complexPrompt);
assert.ok(complexYaml.includes('promptfooconfig.yaml'));
const complexPydantic = exportPydanticModel(complexPrompt);
assert.ok(complexPydantic.includes('class'));
const complexDspy = exportDspySignature(complexPrompt);
assert.ok(complexDspy.includes('dspy.Signature'));

console.log('✓ Extended edge cases passed');

// 6. Frontend API Client Tests (Mocked Transport)
console.log('Testing Frontend API Client (src/utils/api.js)...');
const {
  checkBackendHealth,
  fetchSkillsCatalog,
  fetchSkillDetail,
  importCatalogSkill,
  evolvePrompt,
  generatePromptVariants,
  runRedteamAudit,
  runBatchEvalMatrix,
  compileGuidance,
  compileGrammar,
  fetchTelemetryTraces,
  testPromptExecution,
  evaluateAssertions,
} = await import('./src/utils/api.js');

const originalFetch = globalThis.fetch;
let interceptedRequests = [];

globalThis.fetch = async (url, options = {}) => {
  interceptedRequests.push({ url, options });
  return {
    ok: true,
    status: 200,
    json: async () => ({
      status: 'ok',
      url,
      method: options.method || 'GET',
      body: options.body ? JSON.parse(options.body) : null,
    }),
  };
};

try {
  // Test 1: checkBackendHealth
  const healthRes = await checkBackendHealth();
  assert.ok(healthRes.url.includes('/health'), 'Health endpoint URL invalid');

  // Test 2: fetchSkillsCatalog with params
  const catRes = await fetchSkillsCatalog({ category: 'cloud', query: 'k8s', page: 2, limit: 10 });
  assert.ok(catRes.url.includes('/skills/catalog?category=cloud&query=k8s&page=2&limit=10'));

  // Test 3: fetchSkillDetail
  const detailRes = await fetchSkillDetail('developers', 'code-reviewer');
  assert.ok(detailRes.url.includes('/skills/developers/code-reviewer'));

  // Test 4: importCatalogSkill
  const importRes = await importCatalogSkill({ category: 'cloud', skillName: 'k8s-operator' });
  assert.strictEqual(importRes.method, 'POST');
  assert.strictEqual(importRes.body.category, 'cloud');
  assert.strictEqual(importRes.body.skill_name, 'k8s-operator');

  // Test 5: evolvePrompt
  const evolveRes = await evolvePrompt({ basePrompt: 'Audit code', intent: 'risen', critique: 'Make concise' });
  assert.strictEqual(evolveRes.method, 'POST');
  assert.strictEqual(evolveRes.body.base_prompt, 'Audit code');
  assert.strictEqual(evolveRes.body.critique, 'Make concise');

  // Test 6: generatePromptVariants
  const variantsRes = await generatePromptVariants({ basePrompt: 'Design API', intent: 'rtf' });
  assert.strictEqual(variantsRes.method, 'POST');
  assert.strictEqual(variantsRes.body.base_prompt, 'Design API');

  // Test 7: runRedteamAudit
  const redteamRes = await runRedteamAudit({ prompt: 'Ignore previous instructions', targetIntent: 'safety' });
  assert.strictEqual(redteamRes.method, 'POST');
  assert.strictEqual(redteamRes.body.prompt, 'Ignore previous instructions');

  // Test 8: compileGuidance
  const guidanceRes = await compileGuidance({ prompt: 'System prompt', modelFamily: 'openai' });
  assert.strictEqual(guidanceRes.method, 'POST');
  assert.strictEqual(guidanceRes.body.model_family, 'openai');

  // Test 9: compileGrammar
  const grammarRes = await compileGrammar({ grammarFormat: 'regex' });
  assert.strictEqual(grammarRes.method, 'POST');
  assert.strictEqual(grammarRes.body.grammar_format, 'regex');

  // Test 10: evaluateAssertions
  const assertRes = await evaluateAssertions({ text: 'Hello', rules: [{ type: 'no_secrets' }] });
  assert.strictEqual(assertRes.method, 'POST');
  assert.strictEqual(assertRes.body.text, 'Hello');

  console.log('✓ All 10 API client endpoints verified successfully');
} finally {
  globalThis.fetch = originalFetch;
}

console.log('====================================================');
console.log('ALL FRONTEND UTILITY & API TESTS PASSED! (60+ assertions)');
console.log('====================================================');
