# Herbal AI - Botanical Knowledge & AI-Assisted Healthcare System

Herbal AI is a full-stack, AI-powered botanical information repository and consultation platform dedicated to documenting, validating, and sharing Philippine traditional medicinal plant knowledge in compliance with Department of Health (DOH) guidelines.

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

1. **DOH-Validated Medicinal Plants Catalog**
   * Pre-populated with the **10 DOH Scientifically Validated Plants** (*Lagundi, Sambong, Ampalaya, Bawang, Bayabas, Yerba Buena, Tsaang Gubat, Akapulko, Niyog-niyogan, Ulasimang Bato*).
   * Local, scientific, and regional (Cebuano/Tagalog) names, preparation steps, dosages, and contraindications.
   * Semantic vector search via 768-dimension embeddings (`pgvector`).

2. **Dr. AI - Retrieval-Augmented Generation (RAG) Assistant**
   * Conversational botanical consultant providing referenced preparation instructions and medical safety disclaimers.
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
| **AI / NLP** | Google Gemini API (`gemini-embedding-2`; configurable Flash models, default `gemini-3.5-flash-lite`) |
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
```

Initialize database & seed 10 DOH plants:
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

---

## Automated Testing

Use the root-level [`HERBAL_AI_TESTING_SCRATCHPAD.md`](HERBAL_AI_TESTING_SCRATCHPAD.md) for manual session notes, quick regression commands, evidence capture, and temporary-data cleanup. Confirmed outcomes belong in `Docs/TEST_EXECUTION_LOG.md`.

Run the automated Vitest test suites (82 tests across authentication/account recovery, profile authorization and validation, bounded user lookup batching, production error responses, herbs, suggestions, chat, system features, validation, fallback behavior, forum deletion and cache controls; some integration checks require the configured database and Gemini API):

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
- Dr. AI reports separate embedding, retrieval, and generation timings without logging question content.

Optional tuning values are documented in `.env.example`: `HERB_CACHE_TTL_MS`, `AUTH_USER_CACHE_TTL_MS`, `AUTH_USER_CACHE_MAX_ENTRIES`, `SLOW_REQUEST_THRESHOLD_MS`, `DR_AI_MAX_COSINE_DISTANCE`, and the bounded `DB_POOL_*` connection-pool settings. Slow-request logs include a pool snapshot (`total`, `idle`, and `waiting`) to identify database saturation. The authentication-user cache is intentionally short-lived and is invalidated immediately by application-managed ban, verification, and password changes.

Email safety is controlled by `EMAIL_DELIVERY_MODE`: use `log` for local development, `allowlist` plus `EMAIL_ALLOWED_RECIPIENTS` for controlled mailbox testing, and `live` only for production. Development defaults to `log` when the variable is omitted.

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
│   └── DEPLOYMENT_GUIDE.md        # Full VPS & Docker Deployment Guide
├── scripts/
│   ├── setup-docker.sh            # Automated Docker Engine installer for Ubuntu
│   ├── setup-nginx.sh             # Automated Nginx & Certbot SSL setup
│   └── deploy.sh                  # Zero-downtime deployment & rebuild script
├── docker-compose.yml             # Full-Stack Docker Orchestration Configuration
├── nginx.conf                     # Production Nginx Reverse Proxy Config
├── DEFENSE_DEMO_SCRIPT.md         # Capstone Defense Presentation Script
├── README.md                      # Project Documentation
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
