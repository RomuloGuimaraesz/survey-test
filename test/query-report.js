const orchestrator = require('../orchestrator');

(async () => {
  const queries = [
    'Mostre moradores insatisfeitos',
  'Mostre moradores satisfeitos',
  'Mostre moradores interessados em participar',
  'Mostre moradores que não querem participar'
  ];
  for (const q of queries) {
    const res = await orchestrator(q);
    console.log('--- Query:', q);
    console.log('Intent:', res.intent, 'Residents:', res.residents?.length || 0);
    const report = res?.analysis?.report || res?.agentResult?.analysis?.report; // UI vs raw orchestrator
    console.log('Report metrics:', report?.metrics || '(none)');
    if (report?.whatsappTemplates) console.log('Templates sample:', report.whatsappTemplates.slice(0,1));
    console.log('Summary starts with:', (res.response || '').slice(0,120).replace(/\n/g,' '));
    console.log();
  }
})().catch(err => { console.error('Error:', err); process.exit(1); });
