#!/usr/bin/env bash
# Idempotent per-boot startup: bring up PostgreSQL on port 5434 and ensure the
# app's `emdr` role + database exist. Matches DATABASE_URL in .env.example
# (postgresql://emdr:emdr@localhost:5434/emdr).
set -euo pipefail

PG_VERSION=16
PG_CLUSTER=main
PG_PORT=5434

echo "[start] Ensuring PostgreSQL cluster ${PG_VERSION}/${PG_CLUSTER} is on port ${PG_PORT}…"
sudo pg_conftool "${PG_VERSION}" "${PG_CLUSTER}" set port "${PG_PORT}" >/dev/null 2>&1 || true

status="$(sudo pg_lsclusters -h "${PG_VERSION}" "${PG_CLUSTER}" 2>/dev/null | awk '{print $4}')"
if [ "${status}" != "online" ]; then
  echo "[start] Starting PostgreSQL cluster…"
  sudo pg_ctlcluster "${PG_VERSION}" "${PG_CLUSTER}" start
else
  echo "[start] PostgreSQL already online."
fi

# Wait for the socket to accept connections.
for _ in $(seq 1 20); do
  if sudo -u postgres pg_isready -p "${PG_PORT}" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "[start] Ensuring 'emdr' role and database exist…"
sudo -u postgres psql -p "${PG_PORT}" -v ON_ERROR_STOP=1 <<'SQL'
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'emdr') THEN
    CREATE ROLE emdr LOGIN PASSWORD 'emdr';
  END IF;
END $$;
SQL
if ! sudo -u postgres psql -p "${PG_PORT}" -tAc "SELECT 1 FROM pg_database WHERE datname='emdr'" | grep -q 1; then
  sudo -u postgres createdb -p "${PG_PORT}" -O emdr emdr
fi

echo "[start] PostgreSQL ready on localhost:${PG_PORT} (db: emdr)."
