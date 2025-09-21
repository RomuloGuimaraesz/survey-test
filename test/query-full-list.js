const orchestrator = require('../orchestrator');

(async () => {
  const queries = [
    'Show unsatisfied residents',
    'List unhappy residents',
  'Mostre moradores insatisfeitos',
  'List residents interested in participation',
  'List residents not interested in participation',
  'Listar moradores interessados em participar',
  'Listar moradores que não querem participar'
  ];
  for (const q of queries) {
    const res = await orchestrator(q);
    console.log('--- Query:', q);
    console.log('Intent:', res.intent);
    console.log('Residents returned:', Array.isArray(res.residents) ? res.residents.length : 0);
    const sample = (res.residents || []).slice(0,5).map(r => ({name:r.name, satisfaction:r.satisfaction, issue:r.issue}));
    console.log('Sample:', sample);
    console.log();
  }
})().catch(err => { console.error('Error:', err); process.exit(1); });
