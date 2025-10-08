#!/usr/bin/env node
/**
 * scripts/analysis-snapshot.js
 * Produce real analysis output (no mock data) using MunicipalAnalysisEngine with current data.json.
 * Usage: node scripts/analysis-snapshot.js [--only satisfaction,neighborhoods]
 */

const path = require('path');
const MunicipalAnalysisEngine = require('../services/MunicipalAnalysisEngine');

async function main() {
  const args = process.argv.slice(2);
  let only = null;
  const onlyIdx = args.indexOf('--only');
  if (onlyIdx !== -1 && args[onlyIdx + 1]) {
    only = args[onlyIdx + 1].split(',').map(s => s.trim());
  }

  const engine = new MunicipalAnalysisEngine();
  const sections = {};

  try {
    if (!only || only.includes('satisfaction')) {
      sections.satisfaction = await engine.analyzeSatisfaction();
    }
  } catch (e) {
    sections.satisfaction = { error: true, message: e.message, stack: e.stack };
  }

  try {
    if (!only || only.includes('neighborhoods')) {
      sections.neighborhoods = await engine.analyzeNeighborhoods();
    }
  } catch (e) {
    sections.neighborhoods = { error: true, message: e.message, stack: e.stack };
  }

  // Future: add issues, engagement if needed

  const snapshot = {
    generatedAt: new Date().toISOString(),
    computationVersions: {
      satisfaction: sections.satisfaction?.meta?.computationVersion || 'unknown',
      neighborhoods: sections.neighborhoods?.meta?.computationVersion || 'unknown'
    },
    sections
  };

  // Pretty print JSON to stdout
  process.stdout.write(JSON.stringify(snapshot, null, 2) + '\n');
}

main().catch(err => {
  console.error('Fatal error generating analysis snapshot:', err);
  process.exit(1);
});
