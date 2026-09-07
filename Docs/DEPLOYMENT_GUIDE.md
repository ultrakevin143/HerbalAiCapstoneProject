# VPS Deployment & Docker Orchestration Guide

This guide details the complete production deployment workflow for **Herbal AI** on a virtual private server (e.g., Hostinger, DigitalOcean, AWS EC2, or Linode) running Ubuntu 22.04 / 24.04 LTS.

---

## 1. Prerequisites & Host Specifications

* **Recommended Server Specs**:
  * Minimum: 2 vCPU, 4GB RAM, 20GB SSD (Hostinger KVM 2 or equivalent).
* **Domain DNS Setup**:
  * Create an **A Record** pointing `herbalai.ph` and `www.herbalai.ph` $\rightarrow$ `YOUR_VPS_IP`
  * Create an **A Record** pointing `api.herbalai.ph` $\rightarrow$ `YOUR_VPS_IP`

---

## 2. Server Provisioning

### Step 1: Connect to VPS via SSH
```bash
ssh root@YOUR_VPS_IP
```

### Step 2: Clone the Repository
```bash
cd /root
git clone https://github.com/your-organization/herbal-ai.git
cd /root/herbal-ai
```

### Step 3: Run the Docker Setup Script
```bash
chmod +x scripts/*.sh
./scripts/setup-docker.sh
```

---

## 3. Environment Configuration

### Configure Docker Compose Environment
Copy the root environment template and replace every placeholder with a production value. Do not use predictable JWT secrets or commit the resulting `.env` file.

```bash
cp .env.example .env
chmod 600 .env
```

### Configure Backend Environment
Create and edit `/root/herbal-ai/herbalaibackend/.env`:
```env
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://herbalai_user:herbalai_secure_pass@postgres:5432/herbalai_db?sslmode=disable"
JWT_SECRET="your-production-secret-jwt-key"
JWT_REFRESH_SECRET="your-production-secret-refresh-key"
FRONTEND_URL="https://herbalai.ph"
GEMINI_API_KEY="your-google-gemini-api-key"
ADMIN_EMAIL="admin@herbalai.ph"
ADMIN_PASSWORD="generate-a-unique-random-password-of-at-least-12-characters"
```

### Configure Frontend Environment
For Docker Compose, set these values in the **root `.env`** (not the frontend `.env.local`, which is excluded from the Docker build):
```env
NEXT_PUBLIC_API_URL="https://api.herbalai.ph/api"
NEXT_PUBLIC_SOCKET_URL="https://api.herbalai.ph"
```

Replace these example domains with the actual staging or production addresses. Compose passes both public URLs as build arguments before `next build`; changing container runtime variables alone does not change the browser bundle. Rebuild the frontend image after changing either URL. Never put secrets in `NEXT_PUBLIC_*` variables. For local, non-Docker development, continue using `herbalaifrontend/.env.local`.

Check the deployment configuration before building:

```bash
docker compose config --quiet
node --test scripts/deployment-config.test.mjs
```

The Node checks are static regression checks, not proof that Docker builds or the deployment works. On the staging host, build/start the services and confirm in browser network tools that API and Socket.IO requests use the configured staging host, not localhost. Confirm remote herb images load as well; the frontend runtime must retain `next.config.ts` for image configuration.

---

## 4. Build & Start Containerized Services

Start all containers in detached mode:
```bash
docker compose up -d --build
```

Verify that all 3 services are healthy and running:
```bash
docker compose ps
```

Seed the 10 DOH medicinal plants:
```bash
docker compose exec backend npm run seed
```

---

## 5. Nginx Reverse Proxy & SSL Setup

### Step 1: Run Nginx Setup Script
```bash
./scripts/setup-nginx.sh
```

### Step 2: Generate Free SSL Certificates (Certbot)
Run Certbot to obtain Let's Encrypt certificates and auto-configure HTTPS redirects:
```bash
certbot --nginx -d herbalai.ph -d www.herbalai.ph -d api.herbalai.ph
```

Test automatic certificate renewal:
```bash
certbot renew --dry-run
```

---

## 6. Continuous Deployment & Updates

Deployment is optional while preparing a local capstone demo. Do not run these commands just to test the application locally. This script is for a reviewed release on a Docker host; it does not provide zero downtime.

Before an update, review migration compatibility with the currently running application. Use backward-compatible migrations or schedule a maintenance window and stop application writes. Verify a recent database backup can be restored into a separate test database. Record the current git commit and backend/frontend image IDs outside the checkout, and retain those images. An existing database originally created with `db push` may need a reviewed Prisma migration baseline; do not bypass migration errors or mark unknown migrations applied.

Only after completing those checks:

```bash
cd /root/herbal-ai
DEPLOY_BACKUP_CONFIRMED=yes ./scripts/deploy.sh
```

The script:

1. Requires Git, Docker Compose, a clean checkout and explicit backup acknowledgement.
2. Updates the current branch from its configured upstream using fast-forward only.
3. Validates Compose settings and builds the images before replacing application containers.
4. Waits for PostgreSQL, then runs `prisma migrate deploy` and `prisma migrate status` using the new backend image. Errors stop deployment.
5. Starts the application containers and retries internal API/homepage checks at most 30 times, with per-request timeouts.
6. Retains old images and reports that public HTTPS, login/OAuth, email and browser smoke tests remain necessary.

The backup flag is an operator acknowledgement, not an automated backup or restore test. Internal health checks do not certify every database query or user workflow. A failed rollout can leave migrations applied or containers partially replaced; the script does not automatically roll anything back.

### Failure and recovery checklist

- Inspect the failing command and `docker compose logs --tail=100 backend frontend postgres`; avoid sharing secrets or personal data from logs.
- For build failure, verify the previous application containers still serve correctly before retrying.
- For migration failure, stop and inspect migration status. Do not use `db push`, force-reset the database, or suppress the failure.
- For a bad application release, restore the recorded prior image versions using a reviewed Compose override only after confirming they are compatible with the current database schema.
- If schema recovery is necessary, enter maintenance mode, preserve the current database for investigation, and restore the verified backup into a separate database first. Validate data and login before changing the application connection. Obtain approval before replacing live data; writes since the backup can be lost.
- Keep previous images and backups until the release has passed browser checks and reviewer acceptance. Do not automatically prune them during deployment.

### Local verification status

Static checks can be run without a VPS, domain or Docker:

```bash
node --test scripts/deployment-config.test.mjs
bash -n scripts/deploy.sh
```

These checks do not execute Docker or migrations. A real container build, migration against a disposable database, backup restore drill and live readiness checks remain pending until a Docker test environment is available.

Run mocked control-flow tests with `node --test scripts/deployment-flow.test.mjs`. They require Bash (set TEST_BASH to its executable if necessary) and replace Git, Docker and sleep with test functions. All 15 static/mocked checks passed locally, covering dirty checkout, Git status/update failure, missing backup acknowledgement, build/migration failure, exhausted health retries and success. Bash syntax and git whitespace checks passed. These results are separate from the application's 37-test backend suite.
