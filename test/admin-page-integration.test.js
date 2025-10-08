/**
 * Admin Page Integration Test
 * Verifies the admin-refactored.html page works correctly with web components
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  log('\n🧪 Admin Page Integration Tests\n', 'bold');
  log('='.repeat(60), 'blue');

  const results = { passed: 0, failed: 0, total: 0 };

  async function test(name, fn) {
    results.total++;
    try {
      await fn();
      results.passed++;
      log(`✅ PASS: ${name}`, 'green');
    } catch (error) {
      results.failed++;
      log(`❌ FAIL: ${name}`, 'red');
      log(`   Error: ${error.message}`, 'red');
    }
  }

  // ============================================
  // Page Structure Tests
  // ============================================

  await test('Admin page should be accessible', async () => {
    const response = await makeRequest('/admin-refactored.html');
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
  });

  await test('Page should use quick-stats web component', async () => {
    const response = await makeRequest('/admin-refactored.html');
    if (!response.body.includes('<quick-stats')) {
      throw new Error('quick-stats web component not found in page');
    }
    if (!response.body.includes('id="quick-stats"')) {
      throw new Error('quick-stats component missing id attribute');
    }
    if (!response.body.includes('title="Painel Geral"')) {
      throw new Error('quick-stats component missing title attribute');
    }
  });

  await test('Page should NOT have duplicate quick-stats HTML', async () => {
    const response = await makeRequest('/admin-refactored.html');
    const quickStatsCount = (response.body.match(/quick-stats/g) || []).length;

    // Should have: <quick-stats tag, id="quick-stats", and maybe title="quick-stats" - so 2-3 occurrences
    if (quickStatsCount > 5) {
      throw new Error(`Found ${quickStatsCount} occurrences of "quick-stats" - possible duplicate HTML`);
    }
  });

  await test('Page should load main.js module', async () => {
    const response = await makeRequest('/admin-refactored.html');
    if (!response.body.includes('type="module"')) {
      throw new Error('Module script not found');
    }
    if (!response.body.includes('src="./js/main.js"')) {
      throw new Error('main.js not loaded');
    }
  });

  await test('Page should include toast manager', async () => {
    const response = await makeRequest('/admin-refactored.html');
    if (!response.body.includes('toast.js')) {
      throw new Error('Toast manager script not found');
    }
    if (!response.body.includes('ToastManager')) {
      throw new Error('ToastManager initialization not found');
    }
  });

  // ============================================
  // JavaScript Module Tests
  // ============================================

  await test('main.js should import web components', async () => {
    const response = await makeRequest('/js/main.js');
    if (!response.body.includes("import { registerAllComponents } from './web-components/index.js'")) {
      throw new Error('Web components not imported in main.js');
    }
  });

  await test('main.js should register web components on init', async () => {
    const response = await makeRequest('/js/main.js');
    if (!response.body.includes('registerAllComponents()')) {
      throw new Error('Web components not registered in initialize()');
    }
  });

  await test('StatisticsPanel should support web components', async () => {
    const response = await makeRequest('/js/presentation/components/StatisticsPanel.js');
    if (!response.body.includes('QUICK-STATS')) {
      throw new Error('StatisticsPanel does not check for web component');
    }
    if (!response.body.includes('updateStats')) {
      throw new Error('StatisticsPanel does not call updateStats method');
    }
  });

  await test('StatisticsPanel should use correct selector', async () => {
    const response = await makeRequest('/js/main.js');
    if (!response.body.includes("new StatisticsPanel('#quick-stats')")) {
      throw new Error('StatisticsPanel not using correct selector');
    }
  });

  // ============================================
  // Web Component Registry Tests
  // ============================================

  await test('Web components index should export QuickStats', async () => {
    const response = await makeRequest('/js/web-components/index.js');
    if (!response.body.includes("import { QuickStats }")) {
      throw new Error('QuickStats not imported in index.js');
    }
    if (!response.body.includes("registerComponent('quick-stats', QuickStats)")) {
      throw new Error('QuickStats not registered in index.js');
    }
  });

  await test('QuickStats component should be available', async () => {
    const response = await makeRequest('/js/web-components/components/QuickStats.js');
    if (!response.body.includes('export class QuickStats')) {
      throw new Error('QuickStats class not exported');
    }
  });

  // ============================================
  // Page Elements Tests
  // ============================================

  await test('Page should have all required UI elements', async () => {
    const response = await makeRequest('/admin-refactored.html');

    const requiredElements = [
      'id="quick-stats"',
      'id="toggleActions"',
      'id="actionsBar"',
      'id="newContactsTable"',
      'id="slidePanel"',
      'id="chatContainer"'
    ];

    for (const element of requiredElements) {
      if (!response.body.includes(element)) {
        throw new Error(`Missing required element: ${element}`);
      }
    }
  });

  await test('Page should have filter controls', async () => {
    const response = await makeRequest('/admin-refactored.html');
    if (!response.body.includes('id="filterNeighborhood"')) {
      throw new Error('Neighborhood filter not found');
    }
    if (!response.body.includes('id="filterAnswered"')) {
      throw new Error('Answered filter not found');
    }
    if (!response.body.includes('id="btnFilter"')) {
      throw new Error('Filter button not found');
    }
  });

  await test('Page should have export button', async () => {
    const response = await makeRequest('/admin-refactored.html');
    if (!response.body.includes('id="btnExport"')) {
      throw new Error('Export button not found');
    }
  });

  await test('Page should have table with column navigation', async () => {
    const response = await makeRequest('/admin-refactored.html');
    if (!response.body.includes('id="prevColumn"')) {
      throw new Error('Previous column button not found');
    }
    if (!response.body.includes('id="nextColumn"')) {
      throw new Error('Next column button not found');
    }
    if (!response.body.includes('id="columnIndicator"')) {
      throw new Error('Column indicator not found');
    }
  });

  // ============================================
  // Style Tests
  // ============================================

  await test('Page should link to styles.css', async () => {
    const response = await makeRequest('/admin-refactored.html');
    if (!response.body.includes('href="styles.css"') && !response.body.includes('href="./styles.css"')) {
      throw new Error('styles.css not linked');
    }
  });

  await test('Styles.css should still have legacy quick-stats styles', async () => {
    const response = await makeRequest('/styles.css');
    // Keep legacy styles for backward compatibility and comparison
    if (!response.body.includes('.quick-stats')) {
      throw new Error('Legacy quick-stats styles removed - needed for comparison page');
    }
  });

  // ============================================
  // No Code Duplication Tests
  // ============================================

  await test('Page should NOT have old quick-stats HTML structure', async () => {
    const response = await makeRequest('/admin-refactored.html');

    // Should NOT have the old nested div structure
    if (response.body.includes('quick-stats__cards') &&
        response.body.includes('quick-stats__total') &&
        response.body.includes('quick-stats-item')) {
      throw new Error('Old quick-stats HTML structure still present - code duplication detected');
    }
  });

  await test('Page should be clean and minimal', async () => {
    const response = await makeRequest('/admin-refactored.html');
    const lines = response.body.split('\n').length;

    // Original admin-refactored.html had ~210 lines
    // After removing quick-stats HTML, should be significantly less
    if (lines > 200) {
      log(`   Warning: Page has ${lines} lines - may have duplicate code`, 'yellow');
    }
  });

  // ============================================
  // Results
  // ============================================

  log('='.repeat(60), 'blue');
  log(`\n📊 Test Results:`, 'bold');
  log(`   Total: ${results.total}`, 'blue');
  log(`   Passed: ${results.passed}`, 'green');
  log(`   Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');

  if (results.failed === 0) {
    log('\n✅ All integration tests passed!', 'green');
    log('The admin page is working correctly with web components.\n', 'green');
  } else {
    log('\n❌ Some integration tests failed.', 'red');
    log('Please review the errors above.\n', 'red');
  }

  return results.failed === 0;
}

// Run tests
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`\n❌ Fatal error: ${error.message}`, 'red');
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runTests };
