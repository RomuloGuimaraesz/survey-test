#!/usr/bin/env node
/**
 * scripts/reset-data.js
 *
 * Securely wipes the data file (data.json by default) after a demo.
 * Requires DEMO_RESET_ENABLED=true and an interactive confirmation or
 * a DEMO_RESET_CONFIRM=CONFIRM environment variable to run non-interactively.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const rootDir = path.join(__dirname, '..');
const dbFileEnv = process.env.DB_FILE || 'data.json';
const dataPath = path.isAbsolute(dbFileEnv) ? dbFileEnv : path.join(rootDir, dbFileEnv);

async function confirmPrompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

(async () => {
  if (process.env.DEMO_RESET_ENABLED !== 'true') {
    console.error('Refusing to reset: DEMO_RESET_ENABLED is not true.');
    process.exit(1);
  }

  const confirmEnv = process.env.DEMO_RESET_CONFIRM === 'CONFIRM';
  let confirmed = confirmEnv;

  if (!confirmed) {
    const ans = await confirmPrompt(`This will WIPE all data in ${dataPath}. Type CONFIRM to proceed: `);
    confirmed = ans.trim() === 'CONFIRM';
  }

  if (!confirmed) {
    console.log('Aborted.');
    process.exit(1);
  }

  try {
    if (fs.existsSync(dataPath)) {
      // backup before wipe
      const backup = dataPath.replace('.json', `.backup.${Date.now()}.json`);
      fs.copyFileSync(dataPath, backup);
    }

    fs.writeFileSync(dataPath, '[]');
    console.log(`Data reset complete. ${dataPath} now contains an empty array.`);
  } catch (e) {
    console.error('Failed to reset data:', e.message);
    process.exit(1);
  }
})();
