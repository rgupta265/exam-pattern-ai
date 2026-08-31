#!/usr/bin/env bash
# ==============================================================================
# ExamPattern AI — Production Artifact Deployment Script
# Target: cPanel / Phusion Passenger / Node.js 22 / MySQL 8 / Next.js Standalone
# Domain: https://aiexam.rupakgupta.com
# Architecture: GitHub Actions CI -> Standalone Artifact -> cPanel Deploy
# ==============================================================================

set -e # Exit immediately if any command returns a non-zero status

echo "============================================================"
echo "🚀 ExamPattern AI — Safe Production Artifact Deployment"
echo "Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "============================================================"

# 1. Configuration & Paths
APP_PATH="${CPANEL_APP_PATH:-/home/rupakgup/aiexam.rupakgupta.com}"
COMMIT_SHA="${1:-$(date +%s)}"
DEPLOY_DIR="${APP_PATH}/.deployments/${COMMIT_SHA}"
TAR_FILE="${APP_PATH}/.deployments/standalone-artifact-${COMMIT_SHA}.tar.gz"

echo "📂 Application Directory: ${APP_PATH}"
echo "🔖 Deployment Version:    ${COMMIT_SHA}"

# 2. Verify artifact archive or extracted directory exists
if [ ! -f "${TAR_FILE}" ] && [ ! -d "${DEPLOY_DIR}" ]; then
  echo "❌ Error: Neither artifact archive (${TAR_FILE}) nor extracted folder (${DEPLOY_DIR}) exists." >&2
  exit 1
fi

# 3. Extract artifact if tarball is present
if [ -f "${TAR_FILE}" ]; then
  echo ""
  echo "📦 [1/5] Extracting standalone artifact into ${DEPLOY_DIR}..."
  mkdir -p "${DEPLOY_DIR}"
  tar -xzf "${TAR_FILE}" -C "${DEPLOY_DIR}"
  rm -f "${TAR_FILE}"
fi

# 4. Validate standalone artifact integrity
echo ""
echo "🔍 [2/5] Validating artifact structure..."
if [ ! -f "${DEPLOY_DIR}/server.js" ]; then
  echo "❌ Validation failed: server.js not found in artifact." >&2
  exit 1
fi
if [ ! -d "${DEPLOY_DIR}/.next/static" ]; then
  echo "❌ Validation failed: .next/static not found in artifact." >&2
  exit 1
fi
echo "Artifact validation: PASS"

# 5. Backup current active deployment to .deployments/PREVIOUS
echo ""
echo "💾 [3/5] Backing up current active deployment..."
if [ -d "${APP_PATH}/.next/standalone" ]; then
  rm -rf "${APP_PATH}/.deployments/PREVIOUS"
  mkdir -p "${APP_PATH}/.deployments/PREVIOUS"
  cp -r "${APP_PATH}/.next/standalone/." "${APP_PATH}/.deployments/PREVIOUS/" 2>/dev/null || true
  echo "Current deployment backed up to ${APP_PATH}/.deployments/PREVIOUS"
fi

# 6. Atomic swap into .next/standalone
echo ""
echo "🔄 [4/5] Activating new standalone build..."
mkdir -p "${APP_PATH}/.next/standalone_staging"
cp -r "${DEPLOY_DIR}/." "${APP_PATH}/.next/standalone_staging/"

rm -rf "${APP_PATH}/.next/standalone_old"
if [ -d "${APP_PATH}/.next/standalone" ]; then
  mv "${APP_PATH}/.next/standalone" "${APP_PATH}/.next/standalone_old"
fi
mv "${APP_PATH}/.next/standalone_staging" "${APP_PATH}/.next/standalone"
rm -rf "${APP_PATH}/.next/standalone_old"

# Ensure root app.js exists / is synchronized
if [ -f "${DEPLOY_DIR}/app.js" ]; then
  cp "${DEPLOY_DIR}/app.js" "${APP_PATH}/app.js"
fi

# Clean up older deployment folders, keep latest 3 versions plus PREVIOUS
cd "${APP_PATH}/.deployments"
ls -dt [0-9a-f]* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null || true

# 7. Restart Phusion Passenger
echo ""
echo "⚡ [5/5] Restarting Phusion Passenger application..."
mkdir -p "${APP_PATH}/tmp"
touch "${APP_PATH}/tmp/restart.txt"

echo ""
echo "============================================================"
echo "✅ Deployment completed successfully!"
echo "Site URL: https://aiexam.rupakgupta.com"
echo "Health:   https://aiexam.rupakgupta.com/api/health"
echo "============================================================"
