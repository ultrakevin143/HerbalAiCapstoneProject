# Herbal-Ai — Philippine Medicinal Plants Repository

Herbal-Ai is a full-stack educational repository for documenting and sharing Philippine medicinal-plant knowledge. It combines a curated plant library, source-grounded AI assistance, community features, and an administrative review workflow. It is not a diagnostic service, a prescribing system, or an institutional DOH/PITAHC product.

## Code review folder guide

The active project contains the frontend, backend, application tests, database tooling, and run/deployment configuration. Presentation materials, manuscripts, videos, screenshots, prototypes, historical reports, and local AI/editor tooling were moved into `futureuses/cleanup-2026-10-16/files/`, preserving their original relative paths. Nothing was permanently deleted.

| Keep in the project | Purpose |
| :--- | :--- |
| `herbalaifrontend/` | Next.js pages, React components, state, API clients, public images, PWA files, and frontend configuration. |
| `herbalaibackend/` | Express API, authentication, AI services, realtime messaging, Prisma schema/migrations, seeds, content imports, and automated tests. |
| `scripts/` | Start/stop the local demonstration, deploy the application, and run regression, browser, performance, and maintenance checks. Presentation-document checks and the old UAT report summarizer were archived. |
| `Docs/research/` | Data and evidence fixtures read by existing tests and herb database tooling. Keep their current paths so those checks remain runnable. |
| `Docs/DEPLOYMENT_GUIDE.md`, `Docs/RAILWAY_VERCEL_DEPLOYMENT.md` | Instructions for configuring and deploying the application. |
| `.github/workflows/` | Automated build, lint, and test workflows. |
| `docker-compose.yml`, `nginx.conf`, `.env.example` | Container orchestration, reverse proxy configuration, and environment-variable template. |
| `README.md`, `.gitignore`, `.git/` | Setup instructions, ignored-file rules, and local version history. |
| `futureuses/` | Local archive, excluded from new Git additions. Review the code outside this folder. |

Within each application, keep `package.json`, `package-lock.json`, TypeScript/lint/build settings, and Docker files. The backend's `content/` files are application data, including knowledge-base retirement lists used by the importer. Frontend `public/` files include images and downloadable templates used by the application.

Installed `node_modules/` folders and current `herbalaifrontend/.next/` and `herbalaibackend/dist/` builds remain available for local execution. They are generated files and are already ignored by Git; a fresh installation can recreate them. The frontend `AGENTS.md` remains because Next.js generates and maintains it.

Local `herbalaibackend/.env` and `herbalaifrontend/.env.local` remain in place so the existing installation can run. They contain local configuration and may contain credentials: use `.env.example` when preparing a shareable source copy, and exclude the real environment files, dependencies, generated builds, `.git/`, and `futureuses/` from that copy. The database itself is external to these source folders; migrations and seeds are kept here for setup.

The archive includes a [cleanup report](futureuses/cleanup-2026-10-16/README.md), a CSV mapping original locations to archive locations, checksums for retained files, and backups of this README and `.gitignore` from before the documentation update. Archived scripts are historical copies; restore their original paths and required inputs before using them again.

---

## Architecture Overview

```mermaid
graph TD
    Client[Next.js 16 Web Client]
    API[Express 5 / Node.js API Gateway]
    Socket[Socket.io Real-Time Engine]
    DB[(PostgreSQL 16 + pgvector)]
    Gemini[Google Gemini API]
    Cloudinary[Cloudinary Media Storage]

    Client -->|REST API / HTTPS| API
    Client <-->|WebSocket / WSS| Socket
    API -->|Prisma ORM / SQL| DB
    API -->|Embeddings & Chat Synthesis| Gemini
    API -->|Image Uploads| Cloudinary
```

---

## Core Features

1. **Philippine Medicinal Plants Catalog**
   * Includes the 10 medicinal plants commonly identified in Philippine DOH reference materials (*Lagundi, Sambong, Ampalaya, Bawang, Bayabas, Yerba Buena, Tsaang Gubat, Akapulko, Niyog-niyogan, Ulasimang Bato*) alongside additional reviewed Philippine plant records.
   * Local, scientific, and regional (Cebuano/Tagalog) names, preparation steps, dosages, and contraindications.
   * Semantic vector search via 768-dimension embeddings (`pgvector`).

2. **Dr. Ai — Retrieval-Augmented Generation (RAG) Assistant**
   * Educational assistant that organizes relevant repository records into clear answers with source references and safety boundaries.
   * Refuses unsupported herb-specific guidance when the repository lacks a sufficiently relevant verified source.
   * Session-based memory, input boundary protection, and rate limiting (30 requests / 10 minutes).

3. **Contributor Suggestions & Administrative Moderation**
   * Community submission workflow with administrative review panel.
   * Multi-channel notifications (in-app dropdown, real-time WebSocket push, and email).
   * Immutable Administrative Audit Logging (`APPROVE`, `REJECT`, `UPDATE`, `DELETE`, `BAN`, `UNBAN`).

4. **Community Forums & Real-Time Direct Messaging**
   * Category-based threaded discussions with nested comments.
   * Secure, JWT-authenticated 1-on-1 private messaging with image attachments.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (React 19), TypeScript, Vanilla CSS, Lucide Icons, Socket.io-Client, Recharts |
| **Backend** | Node.js 22, Express 5, TypeScript, Prisma ORM, Socket.io, Nodemailer, Bcrypt, Zod |
| **Database** | PostgreSQL 16 with `pgvector` extension |
| **AI / NLP** | Google Gemini API (`gemini-embedding-2`; configurable Flash models, default `gemini-3.6-flash`) |
| **Testing** | Vitest, Supertest |
| **DevOps & CI/CD** | Docker, Docker Compose, GitHub Actions |

---

## Getting Started

### Prerequisites
* Node.js v20+ or v22+
* npm v10+
* PostgreSQL 16 (with `pgvector` extension enabled) or a cloud instance (e.g. Neon)
* Google Gemini API Key

---

### Local Installation & Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/your-username/herbal-ai.git
cd herbal-ai
```

#### 2. Backend Setup
```bash
cd herbalaibackend
npm install
```

Configure `herbalaibackend/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/herbalai?sslmode=disable"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
FRONTEND_URL="http://localhost:3000"
GEMINI_API_KEY="your-gemini-api-key"
DR_AI_CHAT_MODELS="gemini-3.6-flash,gemini-3.1-flash-lite,gemini-3.8-flash,gemini-3.7-flash"
DR_AI_MODEL_TIMEOUT_MS=7000
DR_AI_MAX_OUTPUT_TOKENS=4096
DR_AI_MAX_MODEL_ATTEMPTS=4
DR_AI_MODEL_COOLDOWN_MS=60000
```

`DR_AI_MAX_OUTPUT_TOKENS` defaults to 4096 and is clamped to 2048–8192. Thinking models use generation headroom for both reasoning and visible answers, so a short visible reply can still reach the output limit. The larger default does not relax source-grounding, safety, completion validation, credit refunds or request deadlines. Generation logs record only bounded token counts and normalized terminal reasons, not prompts, answers, thoughts or credentials. Increase allowance only after checking provider usage and latency; a successful model response does not establish medical accuracy.

Chat controller failure responses use the shared `AiRequestError` contract for JSON and terminal SSE errors: a safe `message`, `code`, `retryable`, and `creditStatus`. Existing `AI_RESPONSE_INCOMPLETE` and `AI_RESPONSE_BLOCKED` codes are retained; generic provider/deadline failures use `AI_UNAVAILABLE`, and credit validation/settlement errors use `AI_CREDIT_ERROR`. Pre-controller authentication, rate-limit and schema-validation responses retain their existing contracts.

Do not promise a refund when `creditStatus` is `recovery_pending`: preserve the draft and reconcile the wallet before another paid attempt. Recovery-pending, safety-blocked and credit errors have `retryable: false`; other generation errors permit a user-confirmed retry only after reconciling any ambiguous result. This flag is not an instruction to retry automatically. Replayed completed answers use the original idempotency key without another debit. These controller diagnostics log normalized error codes rather than raw provider messages; other provider-layer diagnostics remain separate.

Initialize the database and load the configured seed catalog:
```bash
npx prisma generate
npx prisma db push
npm run seed
```

Start backend development server:
```bash
npm run dev
```

#### 3. Frontend Setup
```bash
cd ../herbalaifrontend
npm install
```

Configure `herbalaifrontend/.env.local`:
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
NEXT_PUBLIC_SOCKET_URL="http://localhost:5000"
```

Start frontend development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Local debugging on Windows

From the project root, start both development servers with hot reload/watch mode:

```powershell
.\scripts\start-local.ps1
```

This pins the frontend to `http://localhost:3000`, the API to `http://localhost:5000/api`, and Google OAuth's callback to `http://localhost:5000/api/auth/google/callback`. The configured Google OAuth client must allow that callback. It uses the existing backend `.env` database connection; local app servers do not make a hosted Neon database offline.

The launcher limits the backend pool to three connections, opens no database connections at startup, and closes idle connections after 15 seconds. Existing herb reads stay cached for five minutes and are invalidated by application-managed herb changes. Stop the servers when finished to close their connections:

```powershell
.\scripts\stop-local.ps1
```

Email defaults to log mode. To test real verification and password-reset emails for an address you control, explicitly allow it:

```powershell
.\scripts\start-local.ps1 -EmailTestRecipient 'your-email@example.com'
```

Other recipients remain suppressed in that session. Logs are in `.demo-logs/local-*.log`; process records are in the ignored `.local-pids.json`. The launcher changes only child-process environment settings and leaves saved `.env` files untouched. Use either the development launcher or the production demonstration launcher at a time, since both use ports 3000 and 5000.

#### Production-mode capstone demonstration (Windows)

For a faster, stable demonstration without development overlays or on-demand compilation:

```powershell
.\scripts\start-demo.ps1
```

Open `http://localhost:3000`. When the demonstration is finished:

```powershell
.\scripts\stop-demo.ps1
```

The start script performs clean backend and frontend production builds, launches both services in production mode, and verifies their health before reporting readiness. Runtime logs are written to the ignored `.demo-logs` directory. Demo email defaults to safe `log` mode; explicitly set `EMAIL_DELIVERY_MODE=allowlist` and `EMAIL_ALLOWED_RECIPIENTS` before starting only when a controlled mailbox test is required.

---

### Running with Docker Compose (One-Click Setup)

To run the complete system (PostgreSQL with `pgvector`, Express API backend, and Next.js frontend):

```bash
docker compose up --build
```

Services will be available at:
* **Frontend Web Client**: `http://localhost:3000`
* **Backend API Gateway**: `http://localhost:5000/api`
* **PostgreSQL Database**: `localhost:5432`

### Production VPS Deployment (Hostinger / DigitalOcean / AWS)

For deploying to an Ubuntu VPS with Nginx reverse proxy, automatic SSL (Certbot), and zero-downtime updates, follow the complete guide in **[Docs/DEPLOYMENT_GUIDE.md](Docs/DEPLOYMENT_GUIDE.md)**:

```bash
# 1. Setup Docker on VPS
./scripts/setup-docker.sh

# 2. Setup Nginx and SSL
./scripts/setup-nginx.sh

# 3. Deploy and update services
./scripts/deploy.sh
```

### Railway + Vercel

For the recommended split deployment, use Railway for the Express/PostgreSQL backend and Vercel for the Next.js frontend. Follow [`Docs/RAILWAY_VERCEL_DEPLOYMENT.md`](Docs/RAILWAY_VERCEL_DEPLOYMENT.md) for root directories, environment variables, migrations, health checks, and the one-time herb/knowledge-base bootstrap.

---

## Automated Testing

Historical manual session notes are archived in [`HERBAL_AI_TESTING_SCRATCHPAD.md`](futureuses/cleanup-2026-10-16/files/HERBAL_AI_TESTING_SCRATCHPAD.md); previous confirmed outcomes are in the archived [`TEST_EXECUTION_LOG.md`](futureuses/cleanup-2026-10-16/files/Docs/TEST_EXECUTION_LOG.md). The application test suites remain in their original locations.

Run the automated Vitest test suites (some integration checks require a dedicated test database or configured external services):

```bash
cd herbalaibackend
npm test
```

Run TypeScript compilation checks:
```bash
# Backend
cd herbalaibackend && npx tsc --noEmit

# Frontend
cd herbalaifrontend && npx tsc --noEmit
```

### Performance controls

- Public herb queries use a bounded in-memory cache with automatic invalidation after library changes.
- The frontend deduplicates concurrent herb/session/notification GET requests.
- Messenger history uses a 50-message cursor and can load older pages on demand.
- API responses expose `Server-Timing` and `X-Response-Time`; slow requests are logged as structured JSON.
- Dr. Ai reports separate embedding, retrieval, and generation timings without logging question content.

Optional tuning values are documented in `.env.example`: `HERB_CACHE_TTL_MS`, `AUTH_USER_CACHE_TTL_MS`, `AUTH_USER_CACHE_MAX_ENTRIES`, `SLOW_REQUEST_THRESHOLD_MS`, `DR_AI_MAX_COSINE_DISTANCE`, and the bounded `DB_POOL_*` connection-pool settings. Slow-request logs include a pool snapshot (`total`, `idle`, and `waiting`) to identify database saturation. The authentication-user cache is intentionally short-lived and is invalidated immediately by application-managed ban, verification, and password changes.

Email safety is controlled by `EMAIL_DELIVERY_MODE`: use `log` for local development, `allowlist` plus `EMAIL_ALLOWED_RECIPIENTS` for controlled mailbox testing, and `live` only for production. Development defaults to `log` when the variable is omitted.
On Railway Free, Trial, or Hobby, SMTP is blocked. Use an HTTPS mail provider: either `EMAIL_PROVIDER=resend` with a verified sender domain, or `EMAIL_PROVIDER=gmail` with a dedicated Gmail API OAuth client and refresh token for an existing Gmail sender. See `Docs/RAILWAY_VERCEL_DEPLOYMENT.md`. Failed verification delivery leaves a recoverable unverified account, so use the resend-verification action rather than signing up again.
`REQUIRE_EMAIL_VERIFICATION=false` is a temporary, explicit fallback: it skips verification email during signup and permits password login for unverified accounts without marking their addresses verified. It weakens identity assurance. Password recovery still requires working email delivery. After deploying the `email_verification_required` migration and matching backend, existing accounts created during this fallback retain password login; newly registered password accounts must verify when the setting returns to `true`. Restore it only after mail delivery is reliable.
The forgot-password endpoint keeps its existing per-IP limit and permits at most one accepted reset email per account in a rolling hour. Repeated and unknown-address requests receive the same neutral response; a failed or suppressed delivery releases the per-account cooldown so the user can retry. Reset links expire after one hour.

---

## Administrative Account

Before running `npm run seed`, configure `ADMIN_EMAIL` and a unique random `ADMIN_PASSWORD` of at least 12 characters. The project does not ship a default administrator password. Never commit production credentials.

---

## Project Structure

```
CAPSTONE PROJECT/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI Workflow
├── Docs/
│   ├── DEPLOYMENT_GUIDE.md        # VPS & Docker deployment guide
│   ├── RAILWAY_VERCEL_DEPLOYMENT.md # Split-hosting deployment guide
│   └── research/                 # Fixtures used by tests and herb tooling
├── scripts/
│   ├── start-local.ps1            # Development servers with bounded database pooling
│   ├── stop-local.ps1             # Stop development servers and watch processes
│   ├── start-demo.ps1             # Build and run the production demonstration
│   ├── stop-demo.ps1              # Stop the production demonstration
│   ├── setup-docker.sh            # Automated Docker Engine installer for Ubuntu
│   ├── setup-nginx.sh             # Automated Nginx & Certbot SSL setup
│   └── deploy.sh                  # Zero-downtime deployment & rebuild script
├── docker-compose.yml             # Full-Stack Docker Orchestration Configuration
├── nginx.conf                     # Production Nginx Reverse Proxy Config
├── README.md                      # Project Documentation
├── futureuses/                    # Local archive; excluded from Git additions
├── herbalaibackend/               # Express.js REST & Socket.io API
│   ├── prisma/
│   │   ├── schema.prisma          # Database Schema & pgvector definitions
│   │   └── seed.ts                # DOH Medicinal Plants Seed Script
│   ├── src/                       # Backend Source Code
│   ├── tests/                     # Automated Vitest & Supertest Suites
│   └── Dockerfile                 # Multi-stage Backend Container Definition
└── herbalaifrontend/              # Next.js 16 Web Application
    ├── app/                       # App Router Pages
    ├── components/                # React Components
    ├── context/                   # Global Auth & App State
    └── Dockerfile                 # Multi-stage Frontend Container Definition
```
