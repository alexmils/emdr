#!/usr/bin/env bash
# Idempotent dependency setup for Cloud Agent / local dev.
# Installs PostgreSQL 16, project npm deps, and bootstraps a local .env.
# Per-boot service startup lives in .cursor/start.sh.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "[install] Ensuring PostgreSQL 16 is installed…"
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib
else
  echo "[install] PostgreSQL already present — skipping apt install."
fi

echo "[install] Installing npm dependencies…"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

if [ ! -f .env ]; then
  echo "[install] Creating .env from .env.example with a generated AUTH_SECRET…"
  cp .env.example .env
  SECRET="$(openssl rand -base64 32)"
  # DATABASE_URL / APP_URL defaults in .env.example already target local dev.
  sed -i "s|^AUTH_SECRET=.*|AUTH_SECRET=${SECRET}|" .env
else
  echo "[install] .env already exists — leaving it untouched."
fi

echo "[install] Done."
