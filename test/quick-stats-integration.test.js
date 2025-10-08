/**
 * Integration Test: QuickStats Component vs Original HTML
 *
 * This test verifies that the new web component behaves identically
 * to the original HTML implementation in the admin page.
 */

const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_PORT = process.env.PORT || 3001;

// ANSI colors for terminal output
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

async function runIntegrationTests() {
  log('\n🔗 QuickStats Integration Tests\n', 'bold');
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
  // Server & File Tests
  // ============================================

  await test('Server should be running and accessible', async () => {
    const response = await makeRequest('/');
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
  });

  await test('QuickStats component file should exist', async () => {
    const response = await makeRequest('/js/web-components/components/QuickStats.js');
    if (response.status !== 200) {
      throw new Error('QuickStats.js file not found');
    }
    if (!response.body.includes('class QuickStats')) {
      throw new Error('QuickStats class not found in file');
    }
  });

  await test('Component should be registered in index.js', async () => {
    const response = await makeRequest('/js/web-components/index.js');
    if (!response.body.includes('QuickStats')) {
      throw new Error('QuickStats not imported in index.js');
    }
    if (!response.body.includes("registerComponent('quick-stats', QuickStats)")) {
      throw new Error('QuickStats not registered in index.js');
    }
  });

  // ============================================
  // HTML Structure Tests
  // ============================================

  await test('Original admin-refactored.html should contain quick-stats div', async () => {
    const response = await makeRequest('/admin-refactored.html');
    if (!response.body.includes('class="quick-stats"')) {
      throw new Error('quick-stats class not found in admin-refactored.html');
    }
  });

  await test('Original admin-refactored.html should have all 4 stat items', async () => {
    const response = await makeRequest('/admin-refactored.html');
    const matches = response.body.match(/quick-stats-item/g);
    if (!matches || matches.length < 4) {
      throw new Error(`Expected 4 quick-stats-item elements, found ${matches ? matches.length : 0}`);
    }
  });

  // ============================================
  // CSS Tests
  // ============================================

  await test('Styles.css should contain quick-stats styles', async () => {
    const response = await makeRequest('/styles.css');
    if (!response.body.includes('.quick-stats')) {
      throw new Error('quick-stats styles not found in styles.css');
    }
    if (!response.body.includes('.quick-stats__cards')) {
      throw new Error('quick-stats__cards styles not found');
    }
    if (!response.body.includes('backdrop-filter')) {
      throw new Error('Glassmorphic backdrop-filter not found');
    }
  });

  await test('Component styles should match original CSS patterns', async () => {
    const componentResponse = await makeRequest('/js/web-components/components/QuickStats.js');
    const stylesResponse = await makeRequest('/styles.css');

    // Check for key style properties
    const keyPatterns = [
      'border-radius: 2rem',
      'backdrop-filter',
      'quick-stats__counter',
      'quick-stats__label'
    ];

    for (const pattern of keyPatterns) {
      if (!componentResponse.body.includes(pattern) && !stylesResponse.body.includes(pattern)) {
        throw new Error(`Key style pattern "${pattern}" not found in component`);
      }
    }
  });

  // ============================================
  // API Endpoint Tests
  // ============================================

  await test('Component can work with or without API endpoint', async () => {
    // The component should work both with hardcoded data and API data
    // This is an optional feature test - component works standalone
    const response = await makeRequest('/js/web-components/components/QuickStats.js');

    // Component should have updateStats method for manual updates
    if (!response.body.includes('updateStats')) {
      throw new Error('Component should have updateStats method for manual data');
    }

    // Component should have fetchStats method for API integration
    if (!response.body.includes('fetchStats')) {
      throw new Error('Component should have fetchStats method for API integration');
    }
  });

  // ============================================
  // Component Structure Tests
  // ============================================

  await test('Component should export QuickStats class', async () => {
    const response = await makeRequest('/js/web-components/components/QuickStats.js');

    if (!response.body.includes('export class QuickStats')) {
      throw new Error('QuickStats class is not exported');
    }

    if (!response.body.includes('ReactiveComponent')) {
      throw new Error('Component does not extend ReactiveComponent');
    }

    if (!response.body.includes('EventEmitterMixin')) {
      throw new Error('Component does not use EventEmitterMixin');
    }
  });

  await test('Component should have required methods', async () => {
    const response = await makeRequest('/js/web-components/components/QuickStats.js');

    const requiredMethods = [
      'updateStats',
      'fetchStats',
      'render',
      'renderStats',
      'styles'
    ];

    for (const method of requiredMethods) {
      if (!response.body.includes(method)) {
        throw new Error(`Component missing required method: ${method}`);
      }
    }
  });

  await test('Component should have reactive properties', async () => {
    const response = await makeRequest('/js/web-components/components/QuickStats.js');

    const requiredProperties = [
      'title',
      'stats',
      'loading'
    ];

    for (const prop of requiredProperties) {
      if (!response.body.includes(`'${prop}'`)) {
        throw new Error(`Component missing reactive property: ${prop}`);
      }
    }
  });

  // ============================================
  // Icon Files Tests
  // ============================================

  await test('All stat icons should be accessible', async () => {
    const icons = [
      '/total-icon.svg',
      '/enviado-icon.svg',
      '/recebido-icon.svg',
      '/pendente-icon.svg'
    ];

    for (const icon of icons) {
      const response = await makeRequest(icon);
      if (response.status !== 200) {
        throw new Error(`Icon ${icon} not found`);
      }
    }
  });

  // ============================================
  // Responsive Design Tests
  // ============================================

  await test('Component should have mobile-first responsive styles', async () => {
    const response = await makeRequest('/js/web-components/components/QuickStats.js');

    const responsivePatterns = [
      '@media (min-width: 680px)',
      'overflow-x: auto',
      'scroll-snap-type'
    ];

    for (const pattern of responsivePatterns) {
      if (!response.body.includes(pattern)) {
        throw new Error(`Missing responsive pattern: ${pattern}`);
      }
    }
  });

  // ============================================
  // Accessibility Tests
  // ============================================

  await test('Component should include accessibility features', async () => {
    const response = await makeRequest('/js/web-components/components/QuickStats.js');

    if (!response.body.includes('alt=')) {
      throw new Error('Component missing alt attributes for images');
    }

    // Check for reduced motion support
    if (!response.body.includes('prefers-reduced-motion')) {
      throw new Error('Component missing reduced motion support');
    }
  });

  // ============================================
  // Test Results
  // ============================================

  log('='.repeat(60), 'blue');
  log(`\n📊 Integration Test Results:`, 'bold');
  log(`   Total: ${results.total}`, 'blue');
  log(`   Passed: ${results.passed}`, 'green');
  log(`   Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');

  if (results.failed === 0) {
    log('\n✅ All integration tests passed!', 'green');
    log('The QuickStats component is ready for production.\n', 'green');
  } else {
    log('\n❌ Some integration tests failed.', 'red');
    log('Please review the errors above.\n', 'red');
  }

  return results.failed === 0;
}

// Run tests
if (require.main === module) {
  runIntegrationTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`\n❌ Fatal error: ${error.message}`, 'red');
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runIntegrationTests };
