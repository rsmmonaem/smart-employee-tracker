#!/bin/bash
set -e

APP_DIR="/home/tracmatrix.com/app.tracmatrix.com"
TEMP_DIR="${APP_DIR}/temp"
PROD_DIR="${APP_DIR}/current"
BACKUP_DIR="${APP_DIR}/backup"
USER="tracm3580"
GROUP="tracm3580"

echo "=== [1/6] Preparing temp build directory ==="
rm -rf "${TEMP_DIR}"
mkdir -p "${TEMP_DIR}"

if [ -f "${APP_DIR}/source.tar.gz" ]; then
    tar -xzf "${APP_DIR}/source.tar.gz" -C "${TEMP_DIR}"
    rm -f "${APP_DIR}/source.tar.gz"
fi

cd "${TEMP_DIR}"

echo "=== [2/6] Configuring production environment ==="
if [ -f "${APP_DIR}/.env.production" ]; then
    cp "${APP_DIR}/.env.production" "${TEMP_DIR}/apps/web/.env.production"
    cp "${APP_DIR}/.env.production" "${TEMP_DIR}/apps/web/.env.local"
fi

echo "=== [3/6] Installing dependencies in temp ==="
npm install --production=false

echo "=== [4/6] Building Next.js application in temp ==="
NEXT_PUBLIC_SUPABASE_URL=https://supabase.tracmatrix.com \
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzkxMjY2NjM2LCJleHAiOjE5NDg5NDY2MzZ9.43d4cm4IVkAuFX03AaAGR3y4fpCeRs9b_RfX-8MIZTs \
npm run build:web

echo "=== [5/6] Swapping temp to production (Atomic Swap) ==="
if [ -d "${PROD_DIR}" ]; then
    rm -rf "${BACKUP_DIR}"
    mv "${PROD_DIR}" "${BACKUP_DIR}"
fi
mv "${TEMP_DIR}" "${PROD_DIR}"

chown -R ${USER}:${GROUP} "${PROD_DIR}"

echo "=== [6/6] Reloading PM2 process ==="
cd "${PROD_DIR}/apps/web"
if pm2 describe tracmatrix-app > /dev/null 2>&1; then
    pm2 reload tracmatrix-app --update-env
else
    pm2 start npm --name "tracmatrix-app" -- start -- -p 3000
    pm2 save
fi

echo "=== Deployment Successfully Completed! ==="
