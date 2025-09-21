require('dotenv').config();
const orchestrator = require('../orchestrator');

(async () => {
  const query = 'Mostre moradores insatisfeitos';
  const res = await orchestrator(query);
  const out = {
    intent: res.intent,
    llmEnhanced: res.llmEnhanced || false,
    responseQuality: res.responseQuality || 'data-driven',
    provider: res.provider || 'n/a',
    model: res.model || 'n/a',
    residents: Array.isArray(res.residents) ? res.residents.length : 0,
    responsePreview: (res.response || '').slice(0, 180).replace(/\n/g, ' ')
  };
  console.log(JSON.stringify(out, null, 2));
})().catch(err => { console.error('Smoke test error:', err.message); process.exit(1); });
