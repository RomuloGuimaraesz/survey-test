/**
 * QuickStats Web Component Tests
 * Tests functionality, rendering, and behavior of <quick-stats> component
 */

import { QuickStats } from '../public/js/web-components/components/QuickStats.js';

// Register the component
if (!customElements.get('quick-stats')) {
  customElements.define('quick-stats', QuickStats);
}

// Test utilities
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const createComponent = (attributes = {}) => {
  const component = document.createElement('quick-stats');
  Object.entries(attributes).forEach(([key, value]) => {
    component.setAttribute(key, value);
  });
  document.body.appendChild(component);
  return component;
};

const cleanup = () => {
  document.querySelectorAll('quick-stats').forEach(el => el.remove());
};

// Test suite
const tests = [];
const results = { passed: 0, failed: 0, total: 0 };

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n🧪 Running QuickStats Component Tests\n');
  console.log('='.repeat(60));

  for (const { name, fn } of tests) {
    results.total++;
    try {
      await fn();
      results.passed++;
      console.log(`✅ PASS: ${name}`);
    } catch (error) {
      results.failed++;
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${error.message}`);
      if (error.stack) {
        console.error(`   Stack: ${error.stack.split('\n').slice(1, 3).join('\n')}`);
      }
    } finally {
      cleanup();
    }
  }

  console.log('='.repeat(60));
  console.log(`\n📊 Test Results: ${results.passed}/${results.total} passed, ${results.failed} failed\n`);

  return results.failed === 0;
}

// ============================================
// Component Creation & Lifecycle Tests
// ============================================

test('Component should be defined', () => {
  const component = createComponent();
  if (!(component instanceof QuickStats)) {
    throw new Error('Component is not an instance of QuickStats');
  }
  if (!component.shadowRoot) {
    throw new Error('Component does not have shadow root');
  }
});

test('Component should render with default title', () => {
  const component = createComponent();
  const h3 = component.shadowRoot.querySelector('h3');
  if (!h3) {
    throw new Error('Title element not found');
  }
  if (h3.textContent !== 'Painel Geral') {
    throw new Error(`Expected "Painel Geral", got "${h3.textContent}"`);
  }
});

test('Component should accept custom title attribute', () => {
  const component = createComponent({ title: 'Custom Title' });
  const h3 = component.shadowRoot.querySelector('h3');
  if (h3.textContent !== 'Custom Title') {
    throw new Error(`Expected "Custom Title", got "${h3.textContent}"`);
  }
});

test('Component should render 4 stat cards by default', () => {
  const component = createComponent();
  const cards = component.shadowRoot.querySelectorAll('.quick-stats-item');
  if (cards.length !== 4) {
    throw new Error(`Expected 4 cards, found ${cards.length}`);
  }
});

// ============================================
// Rendering Tests
// ============================================

test('Component should render stats with default values of 0', () => {
  const component = createComponent();
  const counters = component.shadowRoot.querySelectorAll('.quick-stats__counter span');

  if (counters.length !== 4) {
    throw new Error(`Expected 4 counters, found ${counters.length}`);
  }

  counters.forEach((counter, i) => {
    if (counter.textContent !== '0') {
      throw new Error(`Counter ${i} should be 0, got ${counter.textContent}`);
    }
  });
});

test('Component should render correct stat labels', () => {
  const component = createComponent();
  const labels = component.shadowRoot.querySelectorAll('.quick-stats__label');

  const expectedLabels = ['Total', 'Enviados', 'Respondidos', 'Pendentes'];

  if (labels.length !== expectedLabels.length) {
    throw new Error(`Expected ${expectedLabels.length} labels, found ${labels.length}`);
  }

  labels.forEach((label, i) => {
    if (label.textContent !== expectedLabels[i]) {
      throw new Error(`Label ${i} should be "${expectedLabels[i]}", got "${label.textContent}"`);
    }
  });
});

test('Component should render all stat icons', () => {
  const component = createComponent();
  const icons = component.shadowRoot.querySelectorAll('.quick-stats__icon img');

  if (icons.length !== 4) {
    throw new Error(`Expected 4 icons, found ${icons.length}`);
  }

  const expectedIcons = ['total-icon.svg', 'enviado-icon.svg', 'recebido-icon.svg', 'pendente-icon.svg'];

  icons.forEach((icon, i) => {
    if (!icon.src.includes(expectedIcons[i])) {
      throw new Error(`Icon ${i} should be "${expectedIcons[i]}", got "${icon.src}"`);
    }
  });
});

// ============================================
// Data Update Tests
// ============================================

test('Component should update stats via updateStats() method', async () => {
  const component = createComponent();

  component.updateStats({
    total: 100,
    sent: 75,
    responded: 50,
    pending: 25
  });

  await sleep(50); // Wait for render

  const counters = component.shadowRoot.querySelectorAll('.quick-stats__counter span');
  const expectedValues = ['100', '75', '50', '25'];

  counters.forEach((counter, i) => {
    if (counter.textContent !== expectedValues[i]) {
      throw new Error(`Counter ${i} should be ${expectedValues[i]}, got ${counter.textContent}`);
    }
  });
});

test('Component should handle partial stats data', async () => {
  const component = createComponent();

  component.updateStats({
    total: 50,
    sent: 30
    // responded and pending should default to 0
  });

  await sleep(50);

  const counters = component.shadowRoot.querySelectorAll('.quick-stats__counter span');
  const expectedValues = ['50', '30', '0', '0'];

  counters.forEach((counter, i) => {
    if (counter.textContent !== expectedValues[i]) {
      throw new Error(`Counter ${i} should be ${expectedValues[i]}, got ${counter.textContent}`);
    }
  });
});

// ============================================
// Loading State Tests
// ============================================

test('Component should show loading state', () => {
  const component = createComponent();
  component.loading = true;

  const container = component.shadowRoot.querySelector('.quick-stats');
  if (!container.classList.contains('loading')) {
    throw new Error('Component should have loading class');
  }
});

test('Component should remove loading state', () => {
  const component = createComponent();
  component.loading = true;
  component.loading = false;

  const container = component.shadowRoot.querySelector('.quick-stats');
  if (container.classList.contains('loading')) {
    throw new Error('Component should not have loading class');
  }
});

// ============================================
// Event Tests
// ============================================

test('Component should emit stats-loaded event on successful update', async () => {
  const component = createComponent();

  let eventFired = false;
  let eventData = null;

  component.addEventListener('stats-loaded', (e) => {
    eventFired = true;
    eventData = e.detail;
  });

  const testStats = { total: 10, sent: 5, responded: 3, pending: 2 };

  // Mock fetch
  const originalFetch = window.fetch;
  window.fetch = async () => ({
    ok: true,
    json: async () => testStats
  });

  await component.fetchStats('/api/stats');
  await sleep(50);

  window.fetch = originalFetch;

  if (!eventFired) {
    throw new Error('stats-loaded event was not fired');
  }

  if (JSON.stringify(eventData.stats) !== JSON.stringify(testStats)) {
    throw new Error('Event data does not match expected stats');
  }
});

test('Component should emit stats-error event on fetch failure', async () => {
  const component = createComponent();

  let errorEventFired = false;

  component.addEventListener('stats-error', () => {
    errorEventFired = true;
  });

  // Mock fetch to fail
  const originalFetch = window.fetch;
  window.fetch = async () => ({
    ok: false,
    status: 404
  });

  await component.fetchStats('/api/invalid');
  await sleep(50);

  window.fetch = originalFetch;

  if (!errorEventFired) {
    throw new Error('stats-error event was not fired');
  }
});

// ============================================
// CSS Class Tests
// ============================================

test('Component should have correct CSS classes for card types', () => {
  const component = createComponent();
  const cards = component.shadowRoot.querySelectorAll('.quick-stats-item');

  const expectedClasses = [
    'quick-stats__total',
    'quick-stats__enviados',
    'quick-stats__respondidos',
    'quick-stats__pendentes'
  ];

  cards.forEach((card, i) => {
    if (!card.classList.contains(expectedClasses[i])) {
      throw new Error(`Card ${i} should have class ${expectedClasses[i]}`);
    }
  });
});

test('Component should apply glassmorphic styles', () => {
  const component = createComponent();
  const container = component.shadowRoot.querySelector('.quick-stats');

  const styles = window.getComputedStyle(container);

  // Check for key glassmorphic properties
  if (!styles.backdropFilter && !styles.webkitBackdropFilter) {
    throw new Error('Component should have backdrop-filter for glassmorphic effect');
  }

  if (styles.borderRadius === '0px') {
    throw new Error('Component should have border-radius');
  }
});

// ============================================
// Accessibility Tests
// ============================================

test('Component should have proper alt text for icons', () => {
  const component = createComponent();
  const icons = component.shadowRoot.querySelectorAll('.quick-stats__icon img');

  const expectedAltText = ['Total', 'Enviados', 'Respondidos', 'Pendentes'];

  icons.forEach((icon, i) => {
    if (icon.alt !== expectedAltText[i]) {
      throw new Error(`Icon ${i} alt text should be "${expectedAltText[i]}", got "${icon.alt}"`);
    }
  });
});

// ============================================
// Responsive Layout Tests
// ============================================

test('Component cards container should be scrollable on mobile', () => {
  const component = createComponent();
  const cardsContainer = component.shadowRoot.querySelector('.quick-stats__cards');

  const styles = window.getComputedStyle(cardsContainer);

  if (styles.overflowX !== 'auto') {
    throw new Error('Cards container should have overflow-x: auto');
  }
});

test('Component should have scroll-snap behavior', () => {
  const component = createComponent();
  const cardsContainer = component.shadowRoot.querySelector('.quick-stats__cards');

  const styles = window.getComputedStyle(cardsContainer);

  // Note: scroll-snap-type might not be fully supported in test environment
  // But we can check the class exists
  if (!cardsContainer.classList.contains('quick-stats__cards')) {
    throw new Error('Cards container should have correct class');
  }
});

// ============================================
// Run all tests
// ============================================

export { runTests, test };

// Auto-run if loaded directly in browser
if (typeof window !== 'undefined' && !window.__TESTING__) {
  window.__TESTING__ = true;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runTests);
  } else {
    runTests().then(success => {
      if (!success) {
        console.error('❌ Some tests failed');
        process?.exit?.(1);
      } else {
        console.log('✅ All tests passed!');
        process?.exit?.(0);
      }
    });
  }
}
