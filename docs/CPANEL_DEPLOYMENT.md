# ExamPattern AI — cPanel & Passenger Production Deployment Guide

> **Target Domain:** `https://aiexam.rupakgupta.com`  
> **Repository:** `https://github.com/rgupta265/exam-pattern-ai.git`  
> **Production Stack:** cPanel + CloudLinux Node.js 22 (LTS) + Phusion Passenger + Next.js 16 (App Router) + MySQL 8 + Prisma ORM 6 + Local File Storage + Git Deployment

---

## Architecture Overview

```
[Developer / Local Machine]
          │  git push origin main
          ▼
   [GitHub Repository]
          │  Trigger on push to 'main'
          ▼
   [GitHub Actions CI Pipeline]
      ├── 1. npm ci
      ├── 2. npm run prisma:generate
      ├── 3. npm run check-translations
      ├── 4. npm run typecheck
      ├── 5. npm run lint
      ├── 6. npm test (Vitest)
      └── 7. npm run build
          │  (On Success)
          ▼
   [SSH Deployment Trigger]
          │  Executes deploy.sh via SSH
          ▼
   [cPanel Host (aiexam.rupakgupta.com)]
      ├── git reset --hard origin/main
      ├── npm ci
      ├── npm run prisma:generate
      ├── npx prisma migrate deploy
      ├── npm run build
      └── touch tmp/restart.txt (Phusion Passenger Restart)
          │
          ▼
   [Live Production Application]
      https://aiexam.rupakgupta.com
```

---

## 19-Step Production Deployment Guide

### Step 1: Subdomain Setup
1. Log into your **cPanel Dashboard**.
2. Navigate to **Domains** → **Domains** (or **Subdomains**).
3. Click **Create A New Domain**:
   - **Domain Name:** `aiexam.rupakgupta.com`
   - **Document Root:** Deselect "Share document root" and specify `/home/rupakgup/aiexam.rupakgupta.com/public` (or `/home/rupakgup/aiexam.rupakgupta.com`).
4. Click **Submit**.

---

### Step 2: Clone GitHub Repository
Open cPanel **Terminal** or SSH into your cPanel server:
```bash
# Navigate to home directory
cd /home/rupakgup

# Clone repository into the subdomain directory
git clone https://github.com/rgupta265/exam-pattern-ai.git aiexam.rupakgupta.com

# Enter directory
cd aiexam.rupakgupta.com
```

---

### Step 3: Configure Node.js 22
1. In cPanel, navigate to **Software** → **Setup Node.js App** (or **NodeJS Selector**).
2. Click **Create Application**.
3. Select **Node.js version:** `22.x` (or latest available 20.x/22.x LTS).
4. Set **Application mode:** `Production`.

---

### Step 4: Configure Application Manager & Paths
Set the following paths in Setup Node.js App:
* **Application root:** `aiexam.rupakgupta.com` (relative to `/home/rupakgup/`).
* **Application URL:** `aiexam.rupakgupta.com`
* **Application startup file:** `app.js`

---

### Step 5: Verify Application Root Structure
Ensure the project structure matches:
```
/home/rupakgup/aiexam.rupakgupta.com/
├── app.js                   <-- Phusion Passenger wrapper
├── deploy.sh                <-- Automated deployment script
├── package.json
├── package-lock.json
├── next.config.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   └── middleware.ts
└── storage/                 <-- Local storage directory
    ├── private/
    └── public/
```

---

### Step 6: Verify Startup File (`app.js`)
`app.js` serves as the minimal production wrapper for Phusion Passenger without introducing extraneous frameworks:
```javascript
const next = require("next");
const http = require("http");

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "127.0.0.1";

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (error) {
      console.error("Next.js request error:", error);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    }
  });

  server.listen(port, hostname, () => {
    console.log(`> ExamPattern AI Next.js running on http://${hostname}:${port}`);
  });
});
```

---

### Step 7: Environment Variables Setup
Configure the environment variables in cPanel under **Setup Node.js App** → **Environment Variables**, or in a protected `.env` file (`chmod 600 .env`):

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

# Google Gemini AI API Key (Server-Side Only)
GEMINI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY

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

# Initial Super Admin Seed Credentials
SEED_ADMIN_EMAIL=admin@exampattern.ai
SEED_ADMIN_PASSWORD=YOUR_INITIAL_ADMIN_PASSWORD
```

---

### Step 8: MySQL 8 Database Creation
1. Go to cPanel → **MySQL® Databases**.
2. **Create Database:** `rupakgup_exampattern`.
3. **Create User:** `rupakgup_examuser` with a strong 24-character generated password.
4. **Add User to Database:** Select `rupakgup_examuser` and `rupakgup_exampattern`, grant **ALL PRIVILEGES**.

---

### Step 9: Install Dependencies (`npm ci`)
Activate the cPanel Node virtual environment and run clean install (including build-time devDependencies like `tsx`, `tailwindcss`, `postcss`, `autoprefixer`, and `prisma`):
```bash
# Path displayed at top of cPanel Node.js selector page:
source /home/rupakgup/nodevenv/aiexam.rupakgupta.com/22/bin/activate
cd /home/rupakgup/aiexam.rupakgupta.com

npm ci --include=dev --prefer-offline --no-audit
```

---

### Step 10: Generate Prisma ORM Client
```bash
npm run prisma:generate
```

---

### Step 11: Apply Database Migrations (`prisma migrate deploy`)
> [!IMPORTANT]
> Always run `prisma migrate deploy` in production. **NEVER** run `prisma migrate dev` or `prisma migrate reset` in production.

```bash
npx prisma migrate deploy
```

---

### Step 12: Initial Database Seeding
> [!NOTE]
> Database seeding populates system roles, permissions, exam categories, sample blueprint, and initial Super Admin. Per security standards, **0 candidate accounts** are seeded.

```bash
npx tsx prisma/seed.ts
```

---

### Step 13: Build Next.js Production Bundle
```bash
npm run build
```

---

### Step 14: Passenger Restart
Trigger Phusion Passenger restart:
```bash
mkdir -p tmp
touch tmp/restart.txt
```
Or click **Restart** inside the cPanel Node.js Application Manager UI.

---

### Step 15: SSL & HTTPS Enforcement
1. In cPanel, navigate to **SSL/TLS Status**.
2. Select `aiexam.rupakgupta.com` and click **Run AutoSSL** (or install Let's Encrypt SSL).
3. Under **Domains**, toggle **Force HTTPS Redirect** to ON.

---

### Step 16: Verification & Health Check
Verify the live application:
1. **Health Check:** `curl -I https://aiexam.rupakgupta.com/api/health` (should return HTTP 200).
2. **Canonical English Route:** `https://aiexam.rupakgupta.com/en`
3. **Canonical Hindi Route:** `https://aiexam.rupakgupta.com/hi`
4. **Authentication:** Register a new test candidate and log in.
5. **Admin Access:** Log in as Super Admin (`/en/login` → redirects to `/en/admin/dashboard`).
6. **Examination UI:** Start a mock exam and verify timer synchronization, question palette, and autosave.

---

### Step 17: Git Deployment Automation (GitHub Actions)

Configure automated deployment on `git push origin main`:

#### 1. Add GitHub Repository Secrets
In GitHub (`rgupta265/exam-pattern-ai` → **Settings** → **Secrets and variables** → **Actions**):
* `CPANEL_HOST`: Your cPanel server IP or hostname (e.g., `server.rupakgupta.com`).
* `CPANEL_USERNAME`: `rupakgup`
* `CPANEL_SSH_PORT`: `22` (or your host's SSH port).
* `CPANEL_SSH_KEY`: The private SSH key authorized in cPanel SSH Access (`~/.ssh/authorized_keys`).

#### 2. Workflow Trigger
Whenever code is pushed to `main`:
1. GitHub Actions runs all unit tests, lints, typechecks, and the Next.js build.
2. If all checks pass, GitHub Actions connects via SSH and runs `/home/rupakgup/aiexam.rupakgupta.com/deploy.sh`.
3. Phusion Passenger is restarted automatically.

---

### Step 18: Safe Rollback Procedure

If a production release introduces an issue:

```bash
cd /home/rupakgup/aiexam.rupakgupta.com

# 1. Identify previous stable commit hash
git log -n 5 --oneline

# 2. Reset repository to the known stable commit
git reset --hard <STABLE_COMMIT_HASH>

# 3. Clean reinstall
npm ci

# 4. Re-generate Prisma Client
npm run prisma:generate

# 5. Rebuild Next.js
npm run build

# 6. Restart Passenger
touch tmp/restart.txt
```

> [!WARNING]
> **Database Rollback Note:** Never automatically rollback or reset MySQL migrations. If a database schema change needs reversal, prepare and deploy a forward-compatible downward Prisma migration.

---

### Step 19: Troubleshooting & Maintenance

| Issue | Root Cause | Resolution |
|---|---|---|
| **500 Internal Server Error on Startup** | Missing or incorrect `.env` variables | Check `error.log` or Passenger log in `stderr.log`. Verify `DB_HOST`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `AUTH_SECRET`. |
| **Prisma Connection Refused (`ECONNREFUSED 127.0.0.1:3306`)** | MySQL is listening on localhost or socket | Verify MySQL service is running. If cPanel uses a socket, set `DB_SOCKET_PATH=/var/lib/mysql/mysql.sock` in `.env`. |
| **File Upload Permission Denied (`EACCES`)** | Incorrect storage folder permissions | Run `chmod -R 750 /home/rupakgup/exam-pattern-storage` and ensure owner is `rupakgup`. |
| **Out of Memory during `npm run build`** | Resource limits on shared cPanel hosting | Build locally or in GitHub Actions, or increase Node memory: `NODE_OPTIONS="--max-old-space-size=2048" npm run build`. |
| **Passenger not reloading updated code** | `restart.txt` not touched or timestamp unchanged | Run `touch tmp/restart.txt` or click **Restart** in cPanel Node.js Application Manager. |
| **Locale redirect loop on `/`** | Proxy middleware misconfiguration | Verify `src/middleware.ts` is present and exports `{ middleware, config }` from `./proxy`. |
