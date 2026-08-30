# Deployment Guide — ExamPattern AI

## Production Architecture Overview

ExamPattern AI is a modular Next.js application built with TypeScript, Prisma ORM, and MySQL 8.
For production deployments, the application is designed to run in a standalone Node.js LTS environment or on cPanel with Node.js Application Manager (Phusion Passenger).

```
[ Internet / HTTPS Clients ]
            │
            ▼
[ Cloudflare / DNS / Web Server (Apache + Passenger / Nginx) ]
            │ (Reverse Proxy / Passenger Handler)
            ▼
[ Next.js Production Server (Node.js LTS 18/20/22) ]
     ├── App Router (/en, /hi, Middleware, RBAC)
     ├── AI Services (Google Gemini Server-Side)
     ├── LocalStorageProvider (/home/user/exam-pattern-storage)
     └── Prisma ORM Client
            │
            ▼
[ MySQL 8 Database Server (localhost:3306) ]
```

---

## 1. Hosting Prerequisites

* **Target Domain / Subdomain:** `https://aiexam.rupakgupta.com`
* **Runtime:** Node.js 18.x, 20.x, or 22.x LTS
* **Package Manager:** npm (v9+)
* **Database:** MySQL 8.0+ (Strict mode, UTF8mb4 character set)
* **SSL/TLS:** Valid TLS certificate with automatic HTTPS enforcement (AutoSSL / Let's Encrypt)
* **Storage:** Writable filesystem directory isolated from public document roots

---

## 2. Environment Configuration

All production configuration is provided through server environment variables (or `.env.production`). Never commit real production credentials to Git repositories.

| Variable | Description | Production Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Application environment | `production` |
| `PORT` | Listening port for Node server | `3000` |
| `APP_URL` | Canonical public application URL | `https://aiexam.rupakgupta.com` |
| `DB_HOST` | MySQL database host | `127.0.0.1` |
| `DB_PORT` | MySQL database port | `3306` |
| `DB_NAME` | MySQL database name | `rupak_exampattern` |
| `DB_USERNAME` | MySQL database user | `rupak_examuser` |
| `DB_PASSWORD` | Strong database password | `[Secret Strong Password]` |
| `DB_SSL` | Optional SSL connection toggle | `false` |
| `AUTH_SECRET` | 32+ character high-entropy key | `[Secret 32+ Hex String]` |
| `AUTH_EXPIRES_IN` | JWT session validity duration | `7d` |
| `GEMINI_API_KEY` | Server-side Google Gemini key | `[Secret Google AI Key]` |
| `EMAIL_PROVIDER` | Email driver | `smtp` |
| `EMAIL_HOST` | Outgoing SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | Outgoing SMTP port | `587` |
| `EMAIL_USER` | SMTP username | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | SMTP password | `[Secret App Password]` |
| `STORAGE_DRIVER` | Storage abstraction driver | `local` |
| `STORAGE_PATH` | Secure private storage folder | `/home/rupak/exam-pattern-storage` |
| `DEFAULT_LOCALE` | Canonical default locale | `en` |
| `SUPPORTED_LOCALES` | Supported locale codes | `en,hi` |
| `LOG_LEVEL` | Application logging level | `info` |

---

## 3. Production Build & Deployment Commands

```bash
# 1. Clone repository
git clone https://github.com/rupakgupta/exampattern-ai.git /home/username/aiexam.rupakgupta.com
cd /home/username/aiexam.rupakgupta.com

# 2. Clean install dependencies
npm ci

# 3. Generate Prisma client
npx prisma generate

# 4. Apply production database migrations safely
npx prisma migrate deploy

# 5. Build Next.js application for production
npm run build

# 6. (Optional) Prune devDependencies for minimal footprint
npm prune --production
```

---

## 4. Health & Verification

Once deployed, verify the application health endpoint:

```bash
curl -i https://aiexam.rupakgupta.com/api/health
```

Expected HTTP `200 OK` JSON response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-08-29T00:00:00.000Z",
    "version": "1.0.0",
    "database": "connected"
  }
}
```
