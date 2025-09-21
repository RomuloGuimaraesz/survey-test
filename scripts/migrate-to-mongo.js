#!/usr/bin/env node
/**
 * scripts/migrate-to-mongo.js
 * 
 * Migrates local data.json contacts to a MongoDB Atlas collection preserving fields.
 * - Uses Mongoose for schema flexibility.
 * - Upserts by whatsapp (unique) or id when available.
 * 
 * Required env vars:
 *   MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
 *   MONGO_DB_NAME=<dbName>   # optional, inferred from URI path if omitted
 *   MONGO_COLLECTION=contacts # optional (default: contacts)
 *   DATA_JSON=./data.json     # optional path override
 */

/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

(async () => {
  const rootDir = path.join(__dirname, '..');
  const dataFile = process.env.DATA_JSON
    ? path.isAbsolute(process.env.DATA_JSON) ? process.env.DATA_JSON : path.join(rootDir, process.env.DATA_JSON)
    : path.join(rootDir, 'data.json');

  const mongoUri = process.env.MONGODB_URI;
  const dbName = process.env.MONGO_DB_NAME; // optional
  const collectionName = process.env.MONGO_COLLECTION || 'contacts';

  if (!mongoUri) {
    console.error('Missing MONGODB_URI env. Example: mongodb+srv://user:pass@cluster.mongodb.net/mydb');
    process.exit(1);
  }
  if (!fs.existsSync(dataFile)) {
    console.error(`data.json not found at: ${dataFile}`);
    process.exit(1);
  }

  // Connect
  try {
    await mongoose.connect(mongoUri, {
      dbName: dbName || undefined,
    });
  } catch (err) {
    console.error('Failed to connect MongoDB:', err.message);
    process.exit(1);
  }

  const schema = new mongoose.Schema({
    // Keep it flexible to accept existing fields
  }, { strict: false, collection: collectionName });

  const Contact = mongoose.model('Contact', schema, collectionName);

  // Ensure index on whatsapp if present
  try {
    await Contact.collection.createIndex({ whatsapp: 1 }, { unique: false, sparse: true });
    await Contact.collection.createIndex({ id: 1 }, { unique: false, sparse: true });
  } catch (e) {
    console.warn('Index creation warning:', e.message);
  }

  // Read data
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch (err) {
    console.error('Failed to read/parse data.json:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(raw)) {
    console.error('data.json must be an array of contacts');
    process.exit(1);
  }

  console.log(`Migrating ${raw.length} contacts to MongoDB collection "${collectionName}"...`);

  let inserted = 0, updated = 0, failed = 0;

  for (const contact of raw) {
    const selector = contact.whatsapp ? { whatsapp: contact.whatsapp } : { id: contact.id };
    try {
      const result = await Contact.updateOne(selector, { $set: contact }, { upsert: true });
      if (result.upsertedCount && result.upsertedCount > 0) inserted++;
      else if (result.matchedCount > 0) updated++;
      else inserted++; // fallback
    } catch (err) {
      failed++;
      console.warn(`Failed upsert for ${JSON.stringify(selector)}:`, err.message);
    }
  }

  console.log('Done. Summary:');
  console.log({ inserted, updated, failed, total: raw.length });

  await mongoose.disconnect();
  process.exit(0);
})();
