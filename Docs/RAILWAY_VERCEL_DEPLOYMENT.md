# Railway + Vercel Deployment

This repository is a monorepo. Deploy the backend and frontend as separate services from the same GitHub branch.

## 1. Railway backend

Create a Railway service from the repository and set its **Root Directory** to `/herbalaibackend`. Railway will detect the Dockerfile.

Configure these deployment settings in Railway:

- Pre-deploy command: `npm run deploy:migrate`
- Start command: `npm start`
- Healthcheck path: `/api/health`
- Healthcheck timeout: `300`

Add a PostgreSQL service with the `pgvector` extension available, then configure:

```env
DATABASE_URL=<Railway PostgreSQL connection URL>
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

After the first successful migration, run this command **once** in the Railway backend service:

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

1. Replace `FRONTEND_URL` in Railway with the final Vercel production URL and redeploy the backend.
2. Open the Vercel site and verify registration, email verification, username login, library loading, Dr. AI, community notifications, and Messenger sockets.
3. Never commit `.env`, `.env.local`, API keys, database URLs, or real passwords.
