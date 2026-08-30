# cPanel Deployment Guide & Checklist for aiexam.rupakgupta.com

This document provides exact, sequential instructions for deploying **ExamPattern AI** to cPanel on domain `aiexam.rupakgupta.com`.

---

## 1. Hosting Requirements Checklist

Before starting, verify with your cPanel hosting provider:
- [x] **cPanel Node.js Application Manager:** Available (CloudLinux NodeJS Selector / Phusion Passenger).
- [x] **Node.js Version:** Node.js 18.x, 20.x, or 22.x LTS supported.
- [x] **MySQL Version:** MySQL 8.0+ or MariaDB 10.5+ with InnoDB support.
- [x] **SSH Terminal Access:** Enabled (or cPanel Terminal tool).
- [x] **SSL / HTTPS:** Let's Encrypt / cPanel AutoSSL available.
- [x] **File Permissions:** Ability to create a folder outside `public_html` for private storage.

---

## 2. Step-by-Step Deployment Procedure

### Step 1: Subdomain Setup
1. Log into your cPanel dashboard.
2. Navigate to **Domains** → **Subdomains** (or **Domains** → **Create A New Domain**).
3. Enter subdomain name: `aiexam`.
4. Domain: `rupakgupta.com`.
5. Document Root: Set to `/home/CPANEL_USER/aiexam.rupakgupta.com/public` (or leave default `/home/CPANEL_USER/aiexam.rupakgupta.com`).
6. Click **Create**.

---

### Step 2: SSL & HTTPS Enforcement
1. In cPanel, navigate to **SSL/TLS Status**.
2. Select `aiexam.rupakgupta.com` and click **Run AutoSSL** (or install Let's Encrypt certificate).
3. Under **Domains**, enable **Force HTTPS Redirect** for `aiexam.rupakgupta.com`.

---

### Step 3: MySQL 8 Database Creation
1. Navigate to **MySQL® Databases** in cPanel.
2. **Create New Database:**
   - Database Name: `username_exampattern`
   - Click **Create Database**.
3. **Add New User:**
   - Username: `username_examuser`
   - Password: Use Password Generator (min 18 characters, store securely).
   - Click **Create User**.
4. **Add User to Database:**
   - Select `username_examuser` and `username_exampattern`.
   - Click **Add**.
   - Check **ALL PRIVILEGES**.
   - Click **Make Changes**.

---

### Step 4: Secure Local Storage Directory
Create the private local storage directory outside public document root so private files cannot be accessed via direct web URLs:

```bash
mkdir -p /home/CPANEL_USER/exam-pattern-storage/private/notifications
mkdir -p /home/CPANEL_USER/exam-pattern-storage/private/question-assets
mkdir -p /home/CPANEL_USER/exam-pattern-storage/private/exports
mkdir -p /home/CPANEL_USER/exam-pattern-storage/private/candidate-documents
mkdir -p /home/CPANEL_USER/exam-pattern-storage/public/avatars
chmod -R 750 /home/CPANEL_USER/exam-pattern-storage
```

---

### Step 5: Setup Node.js App in cPanel
1. In cPanel, navigate to **Software** → **Setup Node.js App**.
2. Click **Create Application**.
3. Configure settings:
   - **Node.js version:** Select `20.x` or `22.x` (LTS).
   - **Application mode:** `Production`.
   - **Application root:** `aiexam.rupakgupta.com` (relative to home).
   - **Application URL:** `aiexam.rupakgupta.com`.
   - **Application startup file:** `server.js` or `node_modules/next/dist/bin/next` with argument `start`.
4. **Add Environment Variables:**
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
   - `APP_URL`: `https://aiexam.rupakgupta.com`
   - `DATABASE_HOST`: `127.0.0.1`
   - `DATABASE_PORT`: `3306`
   - `DATABASE_NAME`: `username_exampattern`
   - `DATABASE_USER`: `username_examuser`
   - `DATABASE_PASSWORD`: `[Your_MySQL_Password]`
   - `AUTH_SECRET`: `[Your_32+_Character_Secret]`
   - `AUTH_EXPIRES_IN`: `7d`
   - `GEMINI_API_KEY`: `[Your_Gemini_API_Key]`
   - `STORAGE_DRIVER`: `local`
   - `STORAGE_PATH`: `/home/CPANEL_USER/exam-pattern-storage`
   - `DEFAULT_LOCALE`: `en`
   - `SUPPORTED_LOCALES`: `en,hi`
   - `LOG_LEVEL`: `info`
5. Click **Create**.

---

### Step 6: Deploy Code & Execute Production Build
Open SSH or cPanel Terminal:

```bash
# 1. Navigate to application folder
cd /home/CPANEL_USER/aiexam.rupakgupta.com

# 2. Clone/Pull latest code from GitHub
git clone https://github.com/rupakgupta/exampattern-ai.git .

# 3. Enter the virtual environment created by cPanel (path displayed at top of Node.js app page)
# Example:
source /home/CPANEL_USER/nodevenv/aiexam.rupakgupta.com/20/bin/activate && cd /home/CPANEL_USER/aiexam.rupakgupta.com

# 4. Install all dependencies cleanly
npm ci

# 5. Generate Prisma ORM client
npx prisma generate

# 6. Apply database migrations to production MySQL
npx prisma migrate deploy

# 7. Seed initial admin & roles (if first-time deployment)
npx tsx prisma/seed.ts

# 8. Build Next.js production bundle
npm run build
```

---

### Step 7: Restart Application & Verify
1. In cPanel **Setup Node.js App**, click **Restart**.
2. Or via SSH:
   ```bash
   mkdir -p tmp && touch tmp/restart.txt
   ```
3. Test health check endpoint:
   ```bash
   curl -I https://aiexam.rupakgupta.com/api/health
   ```

---

## 3. Comprehensive Verification & Testing Checklist

- [ ] **1. DNS & SSL:** `https://aiexam.rupakgupta.com` loads securely with green padlock.
- [ ] **2. Canonical Locale:** Visiting `https://aiexam.rupakgupta.com/` cleanly redirects to `https://aiexam.rupakgupta.com/en`.
- [ ] **3. Hindi Locale:** Visiting `https://aiexam.rupakgupta.com/hi` renders UI in Hindi.
- [ ] **4. Language Switcher:** Clicking English / हिंदी switches UI smoothly without full page reload.
- [ ] **5. Login Screen:** No credential hints or demo credentials appear on the login page.
- [ ] **6. Candidate Registration & Login:** Able to register and log in to `/candidate/dashboard`.
- [ ] **7. Admin Console:** Able to log in as administrator to `/admin/dashboard`.
- [ ] **8. Exam Management:** Able to view exams, create blueprint versions, and verify syllabus.
- [ ] **9. Question Bank:** Able to create questions manually and via AI.
- [ ] **10. Mock Generation:** Able to generate full-pattern mocks passing 100% pattern validation.
- [ ] **11. Touch Exam Interface:** Countdown timer synchronizes, question palette navigates, autosaves answers, and submits properly.
- [ ] **12. Candidate Practice:** PDF/DOCX/URL practice generation generates drills correctly.
- [ ] **13. Mobile Responsive View:** Tested on 360px, 390px, 412px, tablet (768px), and desktop (1440px).
- [ ] **14. Health Check:** `GET /api/health` returns `200 OK` with `status: "healthy"` and `database: "connected"`.

---

## 4. Backup & Disaster Recovery Procedure

1. **MySQL Scheduled Backups:**
   - In cPanel, configure automated backups via **Backup Wizard** or cron job:
   ```bash
   mysqldump -u username_examuser -p'PASSWORD' username_exampattern | gzip > /home/CPANEL_USER/backups/db_$(date +\%F).sql.gz
   ```
2. **Local Storage Backup:**
   ```bash
   tar -czf /home/CPANEL_USER/backups/storage_$(date +\%F).tar.gz /home/CPANEL_USER/exam-pattern-storage/
   ```
3. **Retention Policy:**
   - Keep daily backups for 7 days, weekly backups for 4 weeks.
