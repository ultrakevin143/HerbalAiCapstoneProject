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

When the active database is Neon, keep `DATABASE_URL` as the pooled connection for application traffic and set `DIRECT_URL` in Railway to the **same Neon database's direct, non-pooler connection**. Prisma CLI commands, including the pre-deploy `prisma migrate deploy`, use `DIRECT_URL` when present; they fall back to `DATABASE_URL` for local or single-URL deployments. Verify both URLs identify the same database and role before redeploying. Store the direct credential only in Railway's protected variables, never in Git or Vercel. Do not replace the runtime `DATABASE_URL` with the direct URL.

For a new Railway-hosted database, add a PostgreSQL service from the pgvector template, confirm the `vector` extension is available, and keep its TCP proxy disabled when the backend runs in the same Railway project. The Railway project has a service named `pgvector`, but the 27 September 2026 pre-deploy log showed this backend connecting to a Neon-hosted database named `neondb`; do not assume the Railway database is the active one or replace the current `DATABASE_URL` during a routine release. If intentionally using Railway's pgvector service, configure the backend with its private URL reference:

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
EMAIL_PROVIDER=resend
RESEND_API_KEY=<email API key>
RESEND_FROM_EMAIL=<sender address on a verified domain>
```

Dr. Ai has optional request-budget variables with safe defaults: `DR_AI_EMBEDDING_TIMEOUT_MS=10000` (range 1000–30000), `DR_AI_MODEL_TIMEOUT_MS=15000` (range 1000–30000), and `DR_AI_REQUEST_TIMEOUT_MS=90000` (range 1000–110000). The whole-request deadline spans retrieval and all model attempts, rather than restarting per attempt. Existing model fallback and retrieved-record responses remain available for provider failures while the request is active. A browser disconnect or whole-request deadline stops waiting, aborts active Gemini HTTP requests, and prevents new provider attempts or successful fallback output for that canceled request. Abort does not prove the provider stopped remote computation or that an already submitted Prisma query was canceled. The request scope clears its timer and disconnect listeners on completion. No Railway variable change is required to use these defaults after the code is released.

Railway Free, Trial, and Hobby services block outbound SMTP. Use the HTTPS email API above for account verification and password reset. Verify the sender domain with the email provider and enter the API key only in Railway Variables. Local development can still use `EMAIL_DELIVERY_MODE=log`; SMTP remains available through `EMAIL_PROVIDER=smtp` only where the hosting plan permits outbound SMTP. After switching providers, redeploy and use the resend-verification action for accounts created during a previous mail failure. A registration response with `verificationEmailSent: false` means the account exists but needs a new link; do not submit the signup form again.

If you want those two transactional emails to come from an existing Gmail account without buying a sending domain, the backend also supports Gmail API over HTTPS. Use a **separate Google Cloud project** from the site's Google sign-in project, enable Gmail API, and create a Web OAuth client with only the `https://www.googleapis.com/auth/gmail.send` scope. Authorize the sender Gmail account once with offline access and store the resulting refresh token in Railway Variables. Set:

```env
EMAIL_PROVIDER=gmail
GMAIL_CLIENT_ID=<mail-only OAuth client ID>
GMAIL_CLIENT_SECRET=<mail-only OAuth client secret>
GMAIL_REFRESH_TOKEN=<sender account refresh token>
GMAIL_SENDER_EMAIL=<same Gmail address that granted access>
EMAIL_DELIVERY_MODE=live
```

Do not reuse the Google sign-in client or place the client secret or refresh token in Vercel, frontend code, Git, or chat. An OAuth app left in Google's External **Testing** status receives Gmail-scope refresh tokens that expire after seven days; do not rely on that for a presentation or production. Check the publishing/verification requirements and Gmail sending limits before enabling verification. Keep `REQUIRE_EMAIL_VERIFICATION=false` until mail delivery has been tested with an email/password account. Google-only accounts are not suitable for testing password reset.

For a one-time sender authorization, create a Web OAuth client in the mail-only project and add `https://developers.google.com/oauthplayground` as its authorized redirect URI. In Google's OAuth 2.0 Playground, use your own client credentials, select server-side offline access and only the `https://www.googleapis.com/auth/gmail.send` scope, sign in as the sending Gmail account, then exchange the authorization code for a refresh token. Enter the client ID, client secret, refresh token, and sender address directly into Railway's protected Variables UI; never paste them into a support chat. Authorizing the Gmail scope allows this backend to send mail from that account, so use a dedicated sender mailbox if possible. After a successful real-email test, remove the temporary Playground redirect URI from the OAuth client and keep a recovery plan for revoked or expired refresh tokens.

For a temporary demonstration, set `REQUIRE_EMAIL_VERIFICATION=false` in Railway and deploy matching backend and frontend revisions. Signup then skips verification-mail delivery and allows password login while leaving `emailVerified` unset. This does not prove that users own their email addresses; someone can register using another person's address. Password recovery works only when an email provider is configured and delivering mail. After deploying the `email_verification_required` database migration and matching backend code, existing accounts retain password login when `REQUIRE_EMAIL_VERIFICATION=true`; only accounts created with verification required must verify before login. Deploy the migration and code before changing the Railway variable, and confirm email delivery before enabling it.

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
