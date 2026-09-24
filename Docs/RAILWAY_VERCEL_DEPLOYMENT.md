# Railway + Vercel Deployment

This repository is a monorepo. Deploy the backend and frontend as separate services from the same GitHub branch. Keep the root-level capstone documents and `Docs/` as references; do not delete them to prepare a deployment. Neither service should use the repository root as its application root.

## Before creating services

1. Select the intended release branch in both platforms. For the current release, that is `codex/readability-accessibility`, not the older `main` branch. Verify the deployed commit matches the branch head before testing.
2. Choose a database: use a separate staging database for rehearsals, or back up and review migration status before connecting an existing database. A new Railway database will **not** contain the local Neon users, suggestions, or other data automatically.
3. Use Railway's **pgvector template**, not its standard PostgreSQL service. The schema's migrations create the `vector` extension and vector columns; the standard image does not include pgvector.
4. Create fresh production credentials. Do not copy local `.env` files into either platform or reuse secrets from a deleted deployment. Enter credentials directly in the provider's protected environment-variable UI.
5. Run the backend build/tests, frontend production build, and deployment configuration checks before rollout. Keep the Git worktree clean except for intentional release changes.

## 1. Railway backend

Create a Railway service from the repository and set its **Root Directory** to `/herbalaibackend`. Railway will detect the Dockerfile.

Configure these deployment settings in Railway:

- Pre-deploy command: `npm run deploy:migrate`
- Start command: `npm start`
- Healthcheck path: `/api/health`
- Healthcheck timeout: `300`

Add a PostgreSQL service from the pgvector template, confirm the `vector` extension is available, and keep its TCP proxy disabled when the backend runs in the same Railway project. Configure the backend with a Railway reference to the database service's private URL (the current staging service is named `pgvector`):

```env
DATABASE_URL=${{pgvector.DATABASE_URL_PRIVATE}}
NODE_ENV=production
JWT_SECRET=<long random secret>
JWT_REFRESH_SECRET=<different long random secret>
FRONTEND_URL=https://<your-vercel-domain>
BACKEND_URL=https://<your-railway-domain>
GEMINI_API_KEY=<Gemini API key>
ADMIN_EMAIL=<administrator email>
ADMIN_PASSWORD=<unique password with at least 12 characters>
EMAIL_DELIVERY_MODE=live
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<mail account>
SMTP_PASSWORD=<mail app password>
SMTP_FROM=<verified sender address>
```

Also add the optional Google and Cloudinary variables from `.env.example` when those integrations are enabled.

After the first successful migration, run this command **once** in the Railway backend service against the chosen database:

```bash
npm run deploy:bootstrap
```

This idempotently creates the administrator and base catalog, publishes both embedded herb batches, and imports the Philippine-focused Dr. AI knowledge base. It is intentionally separate from every deployment because generating embeddings consumes Gemini quota.

Verify the backend at:

```text
https://<your-railway-domain>/api/health
```

## 2. Vercel frontend

Import the same repository into Vercel and set **Root Directory** to `herbalaifrontend`. Keep the detected Next.js build settings.

Set these variables for Production and Preview as appropriate:

```env
NEXT_PUBLIC_API_URL=https://<your-railway-domain>/api
NEXT_PUBLIC_SOCKET_URL=https://<your-railway-domain>
```

Redeploy after changing either public variable because Next.js embeds `NEXT_PUBLIC_*` values during the build.

## 3. Final connection check

1. Replace `FRONTEND_URL` in Railway with the exact Vercel deployment URL and redeploy the backend. For staging, keep both services and the database isolated from production.
2. Open the Vercel site and verify registration, email verification, username login, library loading, Dr. AI, community notifications, and Messenger sockets. Confirm requests use the hosted API, not `localhost`.
3. Record the deployed commit, URLs, health-check result, and rollback path before calling the release ready. A green `/api/health` response alone does not prove the database-backed workflows work.
4. Never commit `.env`, `.env.local`, API keys, database URLs, or real passwords.
# Google OAuth callback

Configure `GOOGLE_REDIRECT_URI` with the exact backend callback URL for each environment:

- Local: `http://localhost:5000/api/auth/google/callback`
- Production: `https://YOUR-RAILWAY-DOMAIN/api/auth/google/callback`

Add the same values, character-for-character, under **Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client → Authorized redirect URIs**. A different protocol, hostname, port, path, or trailing slash causes Google error `400: redirect_uri_mismatch`.
