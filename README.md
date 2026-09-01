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
| **AI / NLP** | Google Gemini API (`text-embedding-004` / `gemini-embedding-2`, `gemini-2.5-flash`) |
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

Run the automated Vitest test suites (28 tests across Auth, Herbs, Suggestions, Chat, and system features):

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
