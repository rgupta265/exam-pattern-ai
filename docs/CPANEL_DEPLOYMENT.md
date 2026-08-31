# ExamPattern AI — Complete Automated Production Deployment Guide

> **Target Domain:** `https://aiexam.rupakgupta.com`  
> **Repository:** `https://github.com/rgupta265/exam-pattern-ai.git` (Private Repository)  
> **Production Stack:** cPanel + CloudLinux Node.js 22 (LTS) + Phusion Passenger + Next.js 16 (App Router, Standalone) + MySQL 8 + Prisma ORM 6 + Local File Storage + GitHub Actions CI/CD over SSH  
> **Application Path:** `/home/rupakgup/aiexam.rupakgupta.com`

---

## 1. Architecture Overview

```
[Developer Local Machine]
           │  git push origin main
           ▼
[Private GitHub Repository] (rgupta265/exam-pattern-ai)
           │  Automatic Trigger on push to 'main'
           ▼
[GitHub Actions CI/CD Pipeline (Node.js 22)]
   ├── 1. Checkout private repo (built-in GITHUB_TOKEN)
   ├── 2. npm ci (clean install)
   ├── 3. npm run prisma:generate
   ├── 4. npm run check-translations (100% parity check)
   ├── 5. npm run typecheck (tsc --noEmit)
   ├── 6. npm run lint (ESLint strict mode)
   ├── 7. npm test (Vitest unit & integration test suite)
   ├── 8. npm run build (next build --webpack with output: "standalone")
   ├── 9. Assemble & validate standalone artifact (.next/standalone + static + public + prisma + messages + app.js)
   └── 10. Package into standalone-artifact-${COMMIT_SHA}.tar.gz
           │
           │  SSH / SCP (Encrypted deployment via SSH Private Key)
           ▼
[cPanel Production Server] (/home/rupakgup/aiexam.rupakgupta.com)
   ├── 1. Receive artifact into .deployments/${COMMIT_SHA}/
   ├── 2. Validate server.js and .next/static
   ├── 3. Backup active .next/standalone to .deployments/PREVIOUS/
   ├── 4. Atomically swap new build into active .next/standalone
   ├── 5. Preserve .env, storage/, root node_modules, and MySQL database
   ├── 6. Restart Phusion Passenger (touch tmp/restart.txt)
   └── 7. Execute automated health check (/api/health)
           │  (If Healthy) ──► Live Production Updated
           │  (If Failed)  ──► Automatic Rollback to PREVIOUS & Passenger Restart
           ▼
[Live Website Updated]
https://aiexam.rupakgupta.com
```

---

## 2. Private Repository Handling & Security Model

> [!IMPORTANT]
> The GitHub repository is **PRIVATE**. The cPanel server **never** clones, pulls, or accesses the private GitHub repository.

### Core Security Guarantees:
1. **Zero GitHub Credentials on cPanel:**
   * Do **NOT** install GitHub Personal Access Tokens (PAT) on cPanel.
   * Do **NOT** configure Git origin or GitHub SSH deploy keys on cPanel.
   * Do **NOT** store `GITHUB_TOKEN` inside cPanel environment variables or `.env`.
2. **GitHub Actions Authority:**
   * GitHub Actions runs *inside* the private repository and has automatic, authenticated access to checkout source code.
   * GitHub Actions compiles and bundles the entire Next.js application into a self-contained standalone production artifact.
3. **Artifact-Only Transfer:**
   * GitHub Actions connects to cPanel via SSH using `CPANEL_SSH_PRIVATE_KEY` and transfers *only* the compiled production artifact (`standalone-artifact-${COMMIT_SHA}.tar.gz`).
   * No raw source code (`src/`, `tests/`, `.git/`, `.github/`) is copied to cPanel.
4. **CloudLinux & cPanel Protection:**
   * Next.js production builds (`npm run build`) are **NEVER** executed on cPanel. This completely eliminates CloudLinux worker process table exhaustion (`Error: spawn ... node EAGAIN`).

---

## 3. GitHub Actions Secrets Configuration

Add the following repository secrets in GitHub (**Settings** → **Secrets and variables** → **Actions** → **New repository secret**):

| Secret Name | Description | Example / Production Value |
|---|---|---|
| `CPANEL_HOST` | cPanel server IP address or hostname | `162.241.85.197` (or `server.rupakgupta.com`) |
| `CPANEL_PORT` | SSH port configured on cPanel | `22` (or your hosting provider's SSH port) |
| `CPANEL_USERNAME` | cPanel username | `rupakgup` |
| `CPANEL_SSH_PRIVATE_KEY` | OpenSSH formatted Private SSH Key | `-----BEGIN OPENSSH PRIVATE KEY----- ...` |
| `CPANEL_APP_PATH` | Absolute path to application root on cPanel | `/home/rupakgup/aiexam.rupakgupta.com` |

---

## 4. SSH Key Generation & cPanel Public Key Setup

To enable GitHub Actions to deploy to cPanel securely without passwords:

### Step 4.1: Generate SSH Key Pair (Locally or in Terminal)
Run the following command in your terminal:
```bash
ssh-keygen -t ed25519 -C "github-actions-deploy@aiexam.rupakgupta.com" -f ./cpanel_deploy_key
```
*(Or use `ssh-keygen -t rsa -b 4096` if your host requires RSA).* Leave passphrase empty for automated CI/CD.

This produces two files:
* `cpanel_deploy_key` (Private key — Add as `CPANEL_SSH_PRIVATE_KEY` in GitHub Secrets)
* `cpanel_deploy_key.pub` (Public key — Authorize in cPanel)

### Step 4.2: Authorize Public Key on cPanel
**Option A: via cPanel Web Interface**
1. Log in to cPanel → **SSH Access** → **Manage SSH Keys**.
2. Click **Import Key**.
3. Paste the public key content into **Public Key** box (name it `github_deploy_key.pub`).
4. Click **Import**.
5. Back in **Manage SSH Keys**, click **Manage** next to the imported key and click **Authorize**.

**Option B: via cPanel Terminal / SSH**
```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
cat >> ~/.ssh/authorized_keys << 'EOF'
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... github-actions-deploy@aiexam.rupakgupta.com
EOF
chmod 600 ~/.ssh/authorized_keys
```

---

## 5. cPanel Node.js Application Manager Setup

In cPanel under **Software** → **Setup Node.js App**:

1. **Node.js version:** `22.x` (or latest 20.x/22.x LTS).
2. **Application mode:** `Production`.
3. **Application root:** `aiexam.rupakgupta.com` (maps to `/home/rupakgup/aiexam.rupakgupta.com`).
4. **Application URL:** `aiexam.rupakgupta.com`
5. **Application startup file:** `app.js`

### Phusion Passenger Startup Wrapper (`app.js`)
`app.js` resides in `/home/rupakgup/aiexam.rupakgupta.com/app.js` and acts as the entrypoint for Passenger:
```javascript
const fs = require("fs");
const path = require("path");

// Load .env from root before starting standalone server if dotenv is available
const rootEnvPath = path.join(__dirname, ".env");
if (fs.existsSync(rootEnvPath)) {
  try {
    require("dotenv").config({ path: rootEnvPath });
  } catch {}
}

const standaloneServerPath = path.join(__dirname, ".next", "standalone", "server.js");

if (fs.existsSync(standaloneServerPath)) {
  require(standaloneServerPath);
} else {
  // fallback server initialization ...
}
```

---

## 6. Standalone Production Artifact Structure

The production artifact packaged by GitHub Actions contains exclusively the pruned production bundle:

```
.next/standalone/
├── server.js               <-- Minimal production Node.js server
├── package.json            <-- Traced dependency manifest
├── node_modules/           <-- Pruned production dependencies
├── prisma/                 <-- Schema & client references
├── messages/               <-- i18n translations (en.json, hi.json)
├── app.js                  <-- Passenger entrypoint
├── public/                 <-- Static public assets & icons
└── .next/
    ├── static/             <-- Webpack static CSS/JS chunks
    └── server/             <-- Server pages & route handlers
```

---

## 7. Atomic Deployment & Rollback Lifecycle

Every deployment is atomic and zero-downtime:

```
1. Upload artifact to /home/rupakgup/aiexam.rupakgupta.com/.deployments/standalone-artifact-<SHA>.tar.gz
2. Extract to /home/rupakgup/aiexam.rupakgupta.com/.deployments/<SHA>/
3. Validate presence of server.js and .next/static/
4. Copy current .next/standalone to .deployments/PREVIOUS/
5. Atomic swap: stage to .next/standalone_staging, swap to .next/standalone
6. Sync root app.js
7. Restart Passenger: touch tmp/restart.txt
8. Run Health Check: curl https://aiexam.rupakgupta.com/api/health
    ├── Success (200): Deployment marked successful
    └── Failure: Restore .deployments/PREVIOUS to .next/standalone, touch tmp/restart.txt, fail CI
```

---

## 8. Preserved Production Assets & Data Isolation

The deployment process strictly preserves all runtime state on cPanel:

1. **`.env` (Environment File):** NEVER overwritten or committed to repository.
2. **`storage/` (Local Private Storage):** Uploaded candidate documents, question assets, and exam notifications reside in `/home/rupakgup/aiexam.rupakgupta.com/storage/` or `STORAGE_BASE_PATH` and are NEVER touched.
3. **`node_modules` (Root Symlink):** The root `node_modules` symlink managed by CloudLinux virtual environment is NEVER deleted or overwritten.
4. **MySQL Database:** Automatic deployments **NEVER** run `prisma db push`, `prisma migrate reset`, or `prisma db:seed`. Database schemas remain completely untouched during routine code deployments.

---

## 9. Environment Variables on cPanel

Production environment variables configured in `.env` (or cPanel Setup Node.js App):

```ini
# Application
NODE_ENV=production
PORT=3000
APP_URL=https://aiexam.rupakgupta.com
NEXT_PUBLIC_APP_URL=https://aiexam.rupakgupta.com

# MySQL 8 Database (Separate Properties — Never Single URL)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=rupakgup_exampattern
DB_USERNAME=rupakgup_examuser
DB_PASSWORD=YOUR_STRONG_DB_PASSWORD
DB_SSL=false
DB_POOL_SIZE=10

# Authentication & Sessions (Minimum 32 Characters)
AUTH_SECRET=YOUR_RANDOM_HIGH_ENTROPY_32_CHAR_SECRET_KEY
AUTH_EXPIRES_IN=7d

# Google Gemini AI Engine
GEMINI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY
GEMINI_MODEL=gemini-1.5-flash

# Local File Storage (Outside Web Root)
STORAGE_DRIVER=local
STORAGE_BASE_PATH=/home/rupakgup/aiexam-storage
STORAGE_PATH=/home/rupakgup/aiexam-storage

# Email / SMTP Configuration
EMAIL_PROVIDER=smtp
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=no-reply@aiexam.rupakgupta.com
EMAIL_FROM_NAME=ExamPattern AI

# Internationalization
DEFAULT_LOCALE=en
SUPPORTED_LOCALES=en,hi

# Logging
LOG_LEVEL=info
```

---

## 10. Automated Health Check Verification

The pipeline polls `https://aiexam.rupakgupta.com/api/health` with exponential retries.
A healthy deployment returns HTTP 200:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-08-31T22:30:00.000Z",
    "version": "1.0.0",
    "database": "connected"
  }
}
```

Then verifies canonical user-facing route: `https://aiexam.rupakgupta.com/en/login`.

---

## 11. Daily Developer Workflow

After initial GitHub Secrets configuration, the ONLY deployment command you need is:

```bash
git add .
git commit -m "Your descriptive change message"
git push origin main
```

GitHub Actions automatically:
1. Validates code, types, lints, and runs 48 test suites (212 unit/integration tests).
2. Builds standalone production bundle on GitHub's high-speed Ubuntu runners.
3. Securely SSHs into cPanel.
4. Uploads artifact and performs atomic swap.
5. Restarts Passenger.
6. Runs health check and reports status.

---

## 12. Troubleshooting & FAQ

| Problem | Root Cause | Solution |
|---|---|---|
| **Error: spawn ... node EAGAIN** | Running `next build` on cPanel triggers CloudLinux NPROC process limits. | **Resolved.** GitHub Actions compiles the standalone artifact remotely; cPanel only executes the pre-built bundle. |
| **SSH connection refused / Permission denied (publickey)** | Public key not authorized in cPanel or wrong port/user. | Ensure public key is in `~/.ssh/authorized_keys` with `chmod 600`. Verify `CPANEL_PORT` and `CPANEL_USERNAME` in GitHub Secrets. |
| **500 Internal Server Error after deploy** | Missing `.env` variables or MySQL database connectivity error. | Check cPanel Node.js application `stderr.log`. Verify `DB_HOST`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`. |
| **Health Check Timed Out** | Passenger worker taking longer than 30s to boot. | Pipeline automatically triggers rollback to `PREVIOUS` and reports error in GitHub Actions logs. Check server CPU/RAM in cPanel. |
| **Gemini API Error (model not found)** | `gemini-2.0-flash` deprecated or unavailable in region. | Set `GEMINI_MODEL=gemini-1.5-flash` in cPanel environment variables. |

