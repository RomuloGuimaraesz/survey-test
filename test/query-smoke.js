const orchestrator = require('../orchestrator');

(async () => {
  const queries = [
    'Mostre moradores satisfeitos',
  'Mostre moradores insatisfeitos',
  'Mostre moradores interessados em participar',
  'Mostre moradores que não querem participar'
  ];
  for (const q of queries) {
    const res = await orchestrator(q);
    console.log('--- Query:', q);
    console.log('Intent:', res.intent);
    console.log('Residents returned:', Array.isArray(res.residents) ? res.residents.length : 0);
    console.log('First 3:', (res.residents || []).slice(0,3));
    console.log();
  }
})().catch(err => { console.error('Error:', err); process.exit(1); });
