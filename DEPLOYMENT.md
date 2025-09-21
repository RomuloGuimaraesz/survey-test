# Deployment Roadmap

This guide covers migrating data.json to MongoDB Atlas, deploying the backend to a free-tier host, and publishing the frontend via GitHub Pages + Actions.

## 1) Migrate data.json to MongoDB Atlas

Prereqs:
- MongoDB Atlas account and a connection string (SRV URI)
- Node 18+

Steps:
1. Create a Database on Atlas and get your connection string.
2. Add an `.env` file at `server/.env` (or export envs in CI):

```
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>?retryWrites=true&w=majority
MONGO_DB_NAME=<db>
MONGO_COLLECTION=contacts
DATA_JSON=./data.json
```

3. Run the migration locally:

```
npm install
npm run migrate:mongo
```

This upserts each contact by `whatsapp` (or `id` fallback) into `<db>.contacts`.

Notes:
- Script is flexible (no strict schema). It preserves fields like survey, clickedAt, whatsappStatus, etc.
- Adds indexes on `whatsapp` and `id`.

## 2) Deploy backend (Express) on a free tier

Options:
- Fly.io (free allowances, quick Node deploy)
- Render Free Web Service
- Railway Free (credits-based)
- Heroku free is gone; hobby/eco plans exist but not fully free.

Recommended: Render (simplest UI) or Fly.io (CLI).

Common backend env vars required:
- PORT (Render/Fly set automatically)
- BASE_URL (public URL; used in links)
- SESSION_SECRET
- WHATSAPP_PROVIDER=meta|twilio|mock
- WHATSAPP_MODE=mock|real
- For Meta: META_ACCESS_TOKEN, META_PHONE_NUMBER_ID, META_APP_SECRET, META_WEBHOOK_VERIFY_TOKEN
- For Twilio: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM

Also keep local file fallback:
- DB_FILE=data.json (if still using file until Mongo integration is coded)

Deploy on Render (example):
1. Push repo to GitHub.
2. Create new Web Service from repo.
3. Root directory: `server`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables listed above (plus any used by orchestrator/AI provider).
7. Set Health Check Path to `/api/health`.

Deploy on Fly.io (example):
1. Install flyctl and run `fly launch` in `server/`.
2. Answer prompts: Node app, 3001 internal port, autodeploy yes/no.
3. Set secrets:
   - `fly secrets set SESSION_SECRET=... MONGODB_URI=...`
4. `fly deploy`.

Webhook URLs after deploy:
- Meta: https://your-app/webhooks/meta
- Twilio: https://your-app/webhooks/twilio

Note: Current code uses the JSON file for persistence. After migration, refactor `readDB()`/`writeDB()` to use Mongo (Mongoose) in production. See Next Steps.

## 3) Deploy frontend with GitHub Pages + Actions

We added `.github/workflows/gh-pages.yml` to publish `server/public` folder to Pages on push to main/master.

Steps:
1. Ensure your default branch is `main` or `master`.
2. In your repo Settings → Pages → Build and deployment: Source = GitHub Actions.
3. Commit and push. The workflow uploads `server/public` as the site.
4. Your Pages URL shows in the workflow output (e.g., https://<org>.github.io/<repo>/).

Important: The frontend calls backend endpoints like `/api/...`. When hosted on Pages, the domain differs from backend. Update the JS to use the backend base URL via an env or a small config, or proxy.
- Quick fix: add a `window.API_BASE` constant in HTML and prefix fetches with it.
- Or serve frontend from the backend (keep as today) and skip Pages.

## Next Steps: Wire backend to Mongo

After data migration, switch the app from file to Mongo in production:
- Create `models/Contact.js` with a flexible schema.
- Replace `readDB()`/`writeDB()` usages with Mongoose queries when `MONGODB_URI` is present.
- Keep file fallback for dev.

Minimal toggle approach inside `server.js`:
- If `process.env.MONGODB_URI` exists, use a `db` module that reads/writes from Mongo.
- Else, fall back to the current JSON file helpers.

Testing/Quality gates:
- `npm run dev` locally
- Hit `/api/health` and `/api`.
- Use `test/query-smoke.js` files as quick smoke checks if applicable.
