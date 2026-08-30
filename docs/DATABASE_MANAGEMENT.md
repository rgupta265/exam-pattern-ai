# Database Management & Maintenance Architecture — ExamPattern AI

## 1. Overview & Core Philosophy
The **Database Management** system provides authorized Administrators (`SUPER_ADMIN` and `ADMIN`) with secure, server-side tools to inspect database infrastructure status, create full standard MySQL 8 backups, perform controlled testing data resets, and seed authoritative fresh application data without risking credential leaks or data corruption.

---

## 2. Security Non-Negotiables & Isolation Rules
1. **Zero Credential Exposure:** Database passwords, full connection URLs, and socket credentials are never sent to the browser, rendered in HTML, or logged in client transcripts.
2. **Strict Candidate RBAC Isolation:** Candidates are strictly blocked from accessing `/admin/database` and all associated `/api/admin/database/*` endpoints with HTTP 403 Forbidden.
3. **Private Storage Isolation:** All `.sql` database backup archives are stored exclusively under `./storage/private/backups/` outside the Next.js `public/` directory. Direct URL access is blocked.
4. **Path Traversal Defense:** Backup downloads and deletions enforce strict path resolution (`path.resolve()`) within the configured private storage root, preventing directory traversal (`../`) attacks.
5. **No Arbitrary Command/SQL Execution:** The API only accepts strictly typed predefined operations (`BACKUP`, `CLEAN`, `SEED`). Arbitrary SQL or shell strings from the client are completely prohibited.
6. **Zero Candidate Seed Data:** Fresh data seeding strictly preserves `Candidate Count = 0`. Super Admin credentials are sourced solely from environment variables (`ADMIN_SEED_EMAIL`).

---

## 3. Database Infrastructure Status
The Admin status dashboard exposes:
* **Connection Health:** Active connectivity status to MySQL 8 via Prisma ORM.
* **Database Name:** Configured active database (e.g., `exampattern_ai`).
* **Masked Host & Port:** Server host (e.g., `127.0.0.1:3306` or `d***.com:3306`).
* **Table & Row Metrics:** Total MySQL tables count and live estimated database row count.
* **Concurrency Lock State:** Live operational status (`IDLE`, `BACKUP`, `CLEAN`, `SEED`).

---

## 4. Full Server-Side MySQL 8 Backup Architecture
When an Admin initiates a database backup:
1. **Concurrency Lock:** Acquires the `BACKUP` operation lock.
2. **Metadata Record:** Creates a `DatabaseBackup` row with status `IN_PROGRESS`.
3. **Stream Generation:** Emits standard MySQL 8 SQL dump syntax:
   * Sets UTF-8 encoding: `SET NAMES utf8mb4;`
   * Disables foreign key checks: `SET FOREIGN_KEY_CHECKS = 0;`
   * Emits table definitions: `DROP TABLE IF EXISTS \`table\`; CREATE TABLE ...;`
   * Emits chunked batched row insertions: `INSERT INTO \`table\` VALUES (...);`
   * Restores foreign keys: `SET FOREIGN_KEY_CHECKS = 1;`
4. **Metadata Update:** Computes file size and exact exported rows, marking status `COMPLETED`.
5. **Audit Logging:** Emits `DATABASE_BACKUP_CREATED` with metadata diffs.
6. **Lock Release:** Resets operation lock to `IDLE`.

---

## 5. Controlled Data Cleaning & Test Reset
The **Clean Data** engine allows developers and administrators to reset testing data without manual SQL queries.

### Clean Modes:
1. **Candidate & Test Data Only (`TEST_DATA` - Recommended):**
   * Removes all candidate user accounts, profiles, addresses, education, and experience.
   * Removes all exam attempts, question answers, event logs, and test results.
   * Removes all practice tests, practice attempts, and practice resources.
   * **Preserves:** Super Admin, Admin accounts, official exam categories, exams, versions, blueprints, syllabi, and verified mock tests.
2. **All Application Data (`ALL_DATA`):**
   * Removes all candidate data, attempts, results, mock tests, questions, blueprints, syllabi, exam documents, and exams.
   * **Preserves:** Super Admin and Admin user accounts and system configuration.

### Multi-Step Safety Confirmation:
* **Step 1:** Shows warning and exact counts of records to be deleted. Prompts: *"Create Backup First?"*.
* **Step 2:** Requires typing the explicit confirmation phrase:
  * **Development:** `DELETE ALL TEST DATA`
  * **Production:** `CONFIRM PRODUCTION DATA RESET`
* **Admin Protection:** The currently logged-in Admin and all Admin accounts are permanently protected and cannot be deleted by the clean transaction.

---

## 6. Authoritative Fresh Data Seeding
The **Fresh Data Seed** engine populates initial official exam blueprints, syllabi, categories, and sample pattern-verified mock tests:
* Sourced from `prisma/seed.ts` via server-side CLI execution.
* Ensures **Candidate Count = 0**.
* Idempotent: Can be run multiple times safely without duplicate records.

---

## 7. Manual Database Restoration Guide
To restore a `.sql` backup archive manually on the database server:

```bash
# Uncompress if gzipped, or stream directly into MySQL:
mysql -h <DB_HOST> -P <DB_PORT> -u <DB_USERNAME> -p <DB_NAME> < storage/private/backups/backup-exampattern_ai-TIMESTAMP.sql
```

> [!WARNING]
> Restoring a database backup will overwrite existing records. Always take a fresh backup prior to restoring historical data.

---

## 8. Audit Event Log Mappings
All database maintenance operations record immutable entries in `AuditLog`:
* `DATABASE_BACKUP_CREATED`
* `DATABASE_BACKUP_DOWNLOADED`
* `DATABASE_BACKUP_DELETED`
* `DATA_CLEAN_STARTED`
* `DATA_CLEAN_COMPLETED`
* `DATA_CLEAN_FAILED`
* `FRESH_DATA_SEED_STARTED`
* `FRESH_DATA_SEED_COMPLETED`
* `FRESH_DATA_SEED_FAILED`
