#!/usr/bin/env bash
# ==============================================================================
# ExamPattern AI — Automated Production Deployment Script
# Target: cPanel / Phusion Passenger / Node.js 22 / MySQL 8 / Next.js
# Domain: https://aiexam.rupakgupta.com
# ==============================================================================

set -e # Exit immediately if any command returns a non-zero status

echo "============================================================"
echo "🚀 Starting ExamPattern AI Production Deployment"
echo "Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "============================================================"

# 1. Configuration & Paths
APP_DIR="${APP_DIR:-/home/rupakgup/aiexam.rupakgupta.com}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"

# Detect Node.js binary path on cPanel or use system default
if [ -d "/opt/cpanel/ea-nodejs22/bin" ]; then
  export PATH="/opt/cpanel/ea-nodejs22/bin:$PATH"
elif [ -d "/opt/cpanel/ea-nodejs20/bin" ]; then
  export PATH="/opt/cpanel/ea-nodejs20/bin:$PATH"
fi

echo "📂 Application Directory: ${APP_DIR}"
echo "🌿 Production Branch:     ${DEPLOY_BRANCH}"
echo "🟢 Node Version:          $(node -v 2>/dev/null || echo 'Node not found in PATH')"
echo "📦 NPM Version:           $(npm -v 2>/dev/null || echo 'NPM not found in PATH')"

# 2. Enter application directory
cd "${APP_DIR}"

# 3. Pull latest code from GitHub production branch
echo ""
echo "📥 [1/6] Synchronizing repository from origin/${DEPLOY_BRANCH}..."
git fetch origin "${DEPLOY_BRANCH}"
git reset --hard "origin/${DEPLOY_BRANCH}"

# 4. Clean dependency installation
echo ""
echo "📦 [2/6] Installing dependencies via npm ci..."
npm ci --prefer-offline --no-audit

# 5. Generate Prisma Client
echo ""
echo "⚡ [3/6] Generating Prisma ORM Client..."
npm run prisma:generate

# 6. Apply database migrations (Safe Deploy Only — NEVER Reset)
echo ""
echo "🗄️  [4/6] Applying production database migrations..."
npx prisma migrate deploy

# 7. Build Next.js production application
echo ""
echo "🏗️  [5/6] Building Next.js production bundle..."
npm run build

# 8. Trigger Passenger application restart
echo ""
echo "🔄 [6/6] Restarting Phusion Passenger application..."
mkdir -p tmp
touch tmp/restart.txt

echo ""
echo "============================================================"
echo "✅ Deployment completed successfully!"
echo "Site URL: https://aiexam.rupakgupta.com"
echo "============================================================"
