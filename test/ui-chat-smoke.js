/*
 UI Chat smoke test: verifies admin chat UI renders residents for main queries
 Steps:
 - Start server (assumes already running on PORT or default 3001)
 - Open admin.html, perform login if redirected
 - Open chat widget, send queries, wait for resident list to render
 - Assert list shows at least 1 resident and key fields
*/

const http = require('http');
const puppeteer = require('puppeteer');

const PORT = process.env.PORT || 3001;
const BASE = process.env.BASE_URL || `http://localhost:${PORT}`;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

async function waitForServerReady(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`${BASE}/api/health`, (res) => {
          if (res.statusCode === 200) resolve(); else reject(new Error('HTTP ' + res.statusCode));
        });
        req.on('error', reject);
      });
      return true;
    } catch (e) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error('Server not ready at ' + BASE);
}

async function ensureLoggedIn(page) {
  await page.goto(`${BASE}/admin.html`, { waitUntil: 'domcontentloaded' });
  const url = page.url();
  if (url.includes('/login.html')) {
    await page.type('input[name="username"]', ADMIN_USER);
    await page.type('input[name="password"]', ADMIN_PASS);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);
  }
}

async function sendChatQuery(page, query) {
  // ensure chat is open
  const isOpen = await page.$('#chatContainer.open');
  if (!isOpen) {
    await page.click('#chatToggle');
    await page.waitForSelector('#chatContainer.open', { timeout: 5000 });
  }
  await page.type('#chatInput', query);
  await page.keyboard.press('Enter');
  // wait until typing indicator shows and then hides
  await page.waitForSelector('#typingIndicator.typing-indicator.show', { timeout: 5000 });
  await page.waitForSelector('#typingIndicator.typing-indicator:not(.show)', { timeout: 30000 });
  // wait for a bot message that likely contains residents content
  await page.waitForFunction(() => {
    const msgs = Array.from(document.querySelectorAll('.message.bot .message-content'));
    const last = msgs[msgs.length - 1];
    if (!last) return false;
    const html = last.innerHTML || '';
    return /RESIDENTES \(\d+\)/i.test(html) || html.includes('Lista de residentes');
  }, { timeout: 30000 });
}

async function getLastBotMessageHTML(page) {
  const html = await page.evaluate(() => {
    const msgs = Array.from(document.querySelectorAll('.message.bot .message-content'));
    const last = msgs[msgs.length - 1];
    return last ? last.innerHTML : '';
  });
  return html;
}

function assertResidentList(html) {
  const hasBlock = html.includes('Lista de residentes');
  const hasSummaryList = /RESIDENTES \(\d+\)/i.test(html);
  if (!(hasBlock || hasSummaryList)) {
    console.log('--- Last bot HTML ---\n' + html.slice(0, 1000) + '\n--- end ---');
    throw new Error('Resident list missing');
  }
  if (!/(Satisfa[cç][aã]o|Participa[cç][aã]o)/i.test(html)) {
    console.log('--- Last bot HTML ---\n' + html.slice(0, 1000) + '\n--- end ---');
    throw new Error('Key fields missing');
  }
}

(async () => {
  console.log('[UI] Waiting for server...');
  await waitForServerReady();

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  console.log('[UI] Ensuring login...');
  await ensureLoggedIn(page);

  const queries = [
    'Mostre moradores satisfeitos',
    'Mostre moradores insatisfeitos',
    'Mostre moradores interessados em participar',
    'Mostre moradores que não querem participar'
  ];

  for (const q of queries) {
    console.log('[UI] Sending:', q);
    await sendChatQuery(page, q);
    const html = await getLastBotMessageHTML(page);
    assertResidentList(html);
    console.log('[UI] OK for:', q);
  }

  await browser.close();
  console.log('[UI] All checks passed');
})().catch(async (err) => {
  console.error('UI smoke failed:', err.message);
  process.exit(1);
});
