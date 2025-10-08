#!/usr/bin/env node
/**
 * Test pt-BR Translations
 * Verifies that AI responses and UI elements are in Brazilian Portuguese
 */

const TEST_QUERIES = [
  'Mostrar análise de satisfação',
  'Encontrar moradores insatisfeitos',
  'Quais bairros precisam de acompanhamento',
  'Status do sistema'
];

async function testAIResponses() {
  console.log('🧪 Testing AI Responses in pt-BR...\n');

  for (const query of TEST_QUERIES) {
    console.log(`\n📝 Query: "${query}"`);
    console.log('─'.repeat(60));

    try {
      const response = await fetch('http://localhost:3001/api/admin/agent-ui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        console.error(`❌ HTTP ${response.status}: ${await response.text()}`);
        continue;
      }

      const result = await response.json();

      // Check if response contains Portuguese indicators
      const responseText = JSON.stringify(result);
      const hasPtBR = /satisfação|análise|moradores|bairros|cidadãos|recomendações/i.test(responseText);
      const hasEnUS = /satisfaction|residents|neighborhoods|citizens|recommendations/i.test(responseText);

      console.log(`✓ Agent: ${result.intent || 'Unknown'}`);
      console.log(`✓ Response: ${result.response?.substring(0, 100)}...`);
      console.log(`\n🌐 Language Check:`);
      console.log(`  - Contains pt-BR terms: ${hasPtBR ? '✅ YES' : '❌ NO'}`);
      console.log(`  - Contains en-US terms: ${hasEnUS ? '⚠️  YES (should be pt-BR)' : '✅ NO'}`);

      if (result.report?.metrics) {
        console.log(`\n📊 Metrics: Total=${result.report.metrics.total}, Sent=${result.report.metrics.sent}`);
      }

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
}

async function testUIElements() {
  console.log('\n\n🎨 Testing UI Elements in pt-BR...\n');
  console.log('─'.repeat(60));

  try {
    const response = await fetch('http://localhost:3001/admin-refactored.html');
    const html = await response.text();

    // Check for key UI elements
    const checks = {
      'AI Chat Title': html.includes('Assistente IA'),
      'AI Chat Placeholder': html.includes('Experimente:'),
      'Quick Suggestions (pt-BR)': html.includes('Mostrar análise de satisfação'),
      'No English Suggestions': !html.includes('Show satisfaction analysis'),
    };

    console.log('UI Element Checks:');
    for (const [check, passed] of Object.entries(checks)) {
      console.log(`  ${passed ? '✅' : '❌'} ${check}`);
    }

  } catch (error) {
    console.error(`❌ Error checking UI: ${error.message}`);
  }
}

async function testReportPage() {
  console.log('\n\n📄 Testing Report Page in pt-BR...\n');
  console.log('─'.repeat(60));

  try {
    const response = await fetch('http://localhost:3001/report.html');
    const html = await response.text();

    const checks = {
      'Report Title': html.includes('Relatório Executivo'),
      'Metrics Section': html.includes('Métricas'),
      'Insights renamed to Análises': html.includes('Análises'),
      'Recommendations': html.includes('Recomendações'),
      'No English "Insights"': !html.includes("'Insights'"),
    };

    console.log('Report Page Checks:');
    for (const [check, passed] of Object.entries(checks)) {
      console.log(`  ${passed ? '✅' : '❌'} ${check}`);
    }

  } catch (error) {
    console.error(`❌ Error checking report: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('═'.repeat(60));
  console.log('🇧🇷  PT-BR TRANSLATION TEST SUITE');
  console.log('═'.repeat(60));

  await testUIElements();
  await testReportPage();
  await testAIResponses();

  console.log('\n' + '═'.repeat(60));
  console.log('✅ All tests completed!');
  console.log('═'.repeat(60));
  console.log('\n📌 Manual Testing Required:');
  console.log('   1. Open http://localhost:3001/admin-refactored.html');
  console.log('   2. Click each quick suggestion button in AI chat');
  console.log('   3. Verify ALL responses are in pt-BR');
  console.log('   4. Click "Abrir relatório completo" link');
  console.log('   5. Verify report page shows pt-BR content\n');
}

// Run tests
runAllTests().catch(console.error);
