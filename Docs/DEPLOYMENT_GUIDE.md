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
Create and edit `/root/herbal-ai/herbalaifrontend/.env.local`:
```env
NEXT_PUBLIC_API_URL="https://api.herbalai.ph/api"
NEXT_PUBLIC_SOCKET_URL="https://api.herbalai.ph"
```

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

Whenever new code is pushed to your Git repository:

```bash
cd /root/herbal-ai
./scripts/deploy.sh
```

This script will automatically:
1. Pull the latest code (`git pull origin main`).
2. Rebuild and launch modified containers (`docker compose up -d --build`).
3. Sync Prisma database migrations.
4. Prune unused images to maintain disk space.
