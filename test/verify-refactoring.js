#!/usr/bin/env node

/**
 * Verification Script for AI Chat Web Component Refactoring
 * Tests that the refactoring maintains all functionality
 */

const http = require('http');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let passedTests = 0;
let failedTests = 0;

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function test(name, condition) {
  if (condition) {
    passedTests++;
    log(`✓ ${name}`, GREEN);
    return true;
  } else {
    failedTests++;
    log(`✗ ${name}`, RED);
    return false;
  }
}

async function fetchPage(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3001${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function runTests() {
  log('\n' + BOLD + '🔍 AI Chat Web Component Verification' + RESET);
  log('━'.repeat(50));

  try {
    // Test 1: Page loads
    log('\n📄 Testing Page Loading...', YELLOW);
    const html = await fetchPage('/admin-refactored.html');
    test('Admin page loads successfully', html.includes('<!doctype html>'));
    test('Page has correct title', html.includes('Dashboard - Sistema Municipal'));

    // Test 2: Web component markup
    log('\n🎨 Testing HTML Markup...', YELLOW);
    test('AI Chat component in nav element', html.includes('<nav>') && html.includes('<ai-chat id="aiChat"></ai-chat>'));
    test('Old chat widget markup removed', !html.includes('<div class="chat-widget">'));
    test('Old chat toggle removed', !html.includes('id="chatToggle"'));
    test('Old chat container removed', !html.includes('id="chatContainer"'));
    test('Old quick suggestions removed', !html.includes('onclick="sendQuickMessage'));

    // Test 3: Essential elements preserved
    log('\n🏗️  Testing Essential Elements...', YELLOW);
    test('Quick stats component present', html.includes('<quick-stats'));
    test('Citizens table present', html.includes('id="newContactsTable"'));
    test('Slide panel present', html.includes('id="slidePanel"'));
    test('Toast script loaded', html.includes('toast.js'));
    test('Main.js module loaded', html.includes('type="module" src="./js/main.js"'));

    // Test 4: Web component file
    log('\n📦 Testing Web Component Files...', YELLOW);
    const componentJs = await fetchPage('/js/web-components/components/AIChat.js');
    test('AIChat.js is accessible', componentJs.includes('export class AIChat'));
    test('Component extends ReactiveComponent', componentJs.includes('extends EventEmitterMixin(ReactiveComponent)'));
    test('Component has setDependencies method', componentJs.includes('setDependencies('));
    test('Component has openChat method', componentJs.includes('openChat()'));
    test('Component has sendMessage method', componentJs.includes('sendMessage('));

    // Test 5: Main.js integration
    log('\n🔌 Testing Integration...', YELLOW);
    const mainJs = await fetchPage('/js/main.js');
    test('Main.js loads AIChat from registry', mainJs.includes("getElementById('aiChat')"));
    test('Dependencies injected via setDependencies', mainJs.includes('setDependencies('));
    test('Global sendQuickMessage function present', mainJs.includes('window.sendQuickMessage'));
    test('ChatWidget exposed globally', mainJs.includes('window.chatWidget'));

    // Test 6: Component registry
    log('\n📋 Testing Component Registry...', YELLOW);
    const registryJs = await fetchPage('/js/web-components/index.js');
    test('AIChat imported in registry', registryJs.includes("import { AIChat }"));
    test('AIChat registered as ai-chat', registryJs.includes("registerComponent('ai-chat', AIChat)"));
    test('AIChat exported from registry', registryJs.includes('AIChat'));

    // Test 7: Backwards compatibility
    log('\n🔄 Testing Backwards Compatibility...', YELLOW);
    test('Main.js exposes window.chatWidget', mainJs.includes('window.chatWidget = this.dependencies.chatWidget'));
    test('Global sendQuickMessage implemented', mainJs.includes('window.sendQuickMessage = (message)'));
    test('Component maintains isOpen property', componentJs.includes("defineProperty('isOpen'"));
    test('Component maintains isProcessing property', componentJs.includes("defineProperty('isProcessing'"));

    // Test 8: HTML cleanliness
    log('\n🧹 Testing HTML Cleanliness...', YELLOW);
    const lineCount = html.split('\n').length;
    test('HTML is concise (under 110 lines)', lineCount < 110);
    test('Exactly one AI chat element', (html.match(/<ai-chat/g) || []).length === 1);
    test('No inline chat widget HTML', !html.includes('<div class="chat-messages"'));
    test('No inline typing indicator', !html.includes('id="typingIndicator"'));

    // Results
    log('\n' + '━'.repeat(50));
    log(BOLD + '📊 Test Results:' + RESET);
    log(`${GREEN}Passed: ${passedTests}${RESET}`);
    if (failedTests > 0) {
      log(`${RED}Failed: ${failedTests}${RESET}`);
    }
    log('━'.repeat(50));

    if (failedTests === 0) {
      log(`\n${GREEN}${BOLD}✅ All tests passed! Refactoring successful.${RESET}`);
      log(`${GREEN}The application is working correctly with the new web component.${RESET}\n`);
      process.exit(0);
    } else {
      log(`\n${RED}${BOLD}❌ Some tests failed. Please review the changes.${RESET}\n`);
      process.exit(1);
    }

  } catch (error) {
    log(`\n${RED}${BOLD}Error running tests:${RESET}`, RED);
    log(error.message, RED);
    log(`\n${YELLOW}Make sure the server is running on http://localhost:3001${RESET}\n`);
    process.exit(1);
  }
}

runTests();
