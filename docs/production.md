# NuraHelp — production hosting

Canonical runbook for agents and humans. **Do not put secrets in this file** (API tokens, DB passwords, `AUTH_SECRET`, Cloudflare keys). Secrets live in Coolify env + GitHub Actions secrets.

Related: local ports in [README](../README.md), brand in [brand.md](./brand.md).

---

## Quick map

| What | Where |
|------|--------|
| Public site | https://nurahelp.com · https://www.nurahelp.com |
| Coolify panel | https://server.nurahelp.com |
| VPS SSH | `root@217.76.58.141` |
| GitHub repo | https://github.com/alexmils/nura (`main`) |
| Container image | `ghcr.io/alexmils/nura:latest` (+ short SHA tags) |
| App listens | **3471** inside container → host `127.0.0.1:3471` |
| Dev (local) | `localhost:3471` · Postgres Docker **5434** |
| Dev tunnel | https://dev.nurahelp.com → local 3471 (Cloudflare Tunnel + Access) |

---

## Architecture (traffic path)

```
Browser
  → Cloudflare (proxied DNS, SSL to visitor)
  → VPS 217.76.58.141 :443
  → CloudPanel nginx (`/etc/nginx/sites-enabled/nurahelp.com.conf`)
  → http://127.0.0.1:3471
  → Coolify-managed Docker container (`ghcr.io/alexmils/nura`)
  → Next.js standalone (`node server.js`, WORKDIR `/nura`)
  → Postgres container on Docker network (Coolify DB uuid below)
```

**Important:** Traefik/Coolify is **not** the public edge for `nurahelp.com`. Same pattern as Receptly on this box: **CloudPanel nginx** terminates TLS and reverse-proxies to a localhost-bound app port.

Coolify still orchestrates the app + Postgres containers and exposes its UI/API on `server.nurahelp.com`.

---

## VPS / Coolify identifiers

| Resource | Value |
|----------|--------|
| Server IP | `217.76.58.141` |
| Coolify UI / API base | `https://server.nurahelp.com` |
| Coolify API (from VPS loopback) | `http://127.0.0.1:8001/api/v1` (container maps 8001→8080) |
| Coolify project | **NuraHelp** — uuid `e1j7mdyvaodfofmkslvkebsq` |
| Coolify server uuid | `yodymhsdsvglmsevmzb4ixxr` |
| Coolify environment | `production` — uuid `difu7r9gkqfwlpwptqccimwl` |
| Destination uuid | `p1rnpsate6lwkq7odo1pbuvv` |
| Application | **nurahelp** — uuid `epufvmx1j8jold5gdpfak85m` |
| App build pack | **`dockerimage`** (pull only — no on-server Next build) |
| Image name in Coolify | `ghcr.io/alexmils/nura` (tag `latest`) |
| Ports mapping | `127.0.0.1:3471:3471` |
| Domains (Coolify fqdn) | `https://nurahelp.com,https://www.nurahelp.com` |
| Postgres service | **nura-postgres** — uuid `kiywnhlez6gi7d9hkzfksffp` |
| Postgres DB / user | database `nura`, user `nura` (password only in Coolify) |
| Sibling on same VPS | Receptly app on `127.0.0.1:3100` (separate Coolify project) |

Container name pattern: `epufvmx1j8jold5gdpfak85m-<timestamp>`.

---

## DNS & TLS (Cloudflare)

Zone: **nurahelp.com** (zone id used in setup: `5c6b45c42d512efa45c0fb7d8c851e6c` — for API ops; prefer Dashboard if unsure).

| Record | Type | Target | Proxy |
|--------|------|--------|-------|
| `nurahelp.com` | A | `217.76.58.141` | Proxied (orange cloud) |
| `www` | CNAME | `nurahelp.com` | Proxied |

- Origin TLS: nginx uses certs under `/etc/nginx/ssl-certificates/nurahelp.com.*` (Cloudflare Origin CA / CloudPanel).
- Panel host: `server.nurahelp.com` has its own nginx site + certs.
- **CF Access** may protect Coolify UI; API deploy + GitHub webhooks need bypass rules for `/api/v1*` (and webhook paths if used).

---

## Nginx (CloudPanel)

File: `/etc/nginx/sites-enabled/nurahelp.com.conf`

- `:80` → redirect HTTPS
- `:443` → `proxy_pass http://127.0.0.1:3471` with `Host`, `X-Forwarded-For`, `X-Forwarded-Proto https`, WebSocket upgrade headers

Do **not** point public 80/443 at Coolify Traefik for this hostname unless intentionally migrating off CloudPanel.

---

## Deploy pipeline (current)

**On-server Next builds OOM’d** on this VPS. Production flow is CI build → image registry → Coolify pull.

```
git push origin main
  → GitHub Actions: .github/workflows/build-deploy.yml
  → docker build (Dockerfile) + push ghcr.io/alexmils/nura:latest (+ sha)
  → POST https://server.nurahelp.com/api/v1/deploy
       { "uuid": "<COOLIFY_APP_UUID>", "force": true }
  → Coolify pulls image and recreates container
```

### GitHub Actions secrets

| Secret | Purpose |
|--------|---------|
| `COOLIFY_TOKEN` | Coolify personal access token (Bearer) |
| `COOLIFY_APP_UUID` | `epufvmx1j8jold5gdpfak85m` |
| `COOLIFY_API_URL` | `https://server.nurahelp.com` |

`GITHUB_TOKEN` is used automatically for GHCR push (`packages: write`). Package visibility has been **public** so Coolify can pull without a registry login (revisit if made private).

Manual redeploy: Actions → **Build and Deploy** → Run workflow, or Coolify UI → Redeploy, or:

```bash
curl -X POST "$COOLIFY_API_URL/api/v1/deploy" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uuid":"epufvmx1j8jold5gdpfak85m","force":true}'
```

### Retired

- GitHub **git** webhook that triggered Coolify to build from source (removed after switching to `dockerimage`).
- Building the Next app inside Coolify on the VPS (OOM).

---

## Docker image rules

File: [`Dockerfile`](../Dockerfile)

| Rule | Why |
|------|-----|
| `WORKDIR /nura` (**never `/app`**) | Next App Router dir is `./app` and console routes are `./app/app` (URL `/app`). cwd `/app` breaks standalone path traces → `/` loads AppAccessGate / login without `globals.css`. See vercel/next.js#68690. |
| `output: "standalone"` in `next.config.ts` | Slim runner image |
| `PORT=3471` `HOSTNAME=0.0.0.0` | Matches product + Coolify mapping |
| `npm ci --include=dev` | Build needs typescript/eslint tooling even with `NODE_ENV=production` |
| `eslint.ignoreDuringBuilds` / `typescript.ignoreBuildErrors` | Keep image build light; lint/typecheck in CI/local |
| Declare runtime deps in `package.json` | e.g. `gsap`, `lenis` — local-only installs are missing in Docker |

Runner copies: `public/`, `.next/standalone` → `/nura`, `.next/static` → `/nura/.next/static`.

---

## Application env (Coolify — names only)

Set in Coolify → **nurahelp** → Environment (values not in git):

| Variable | Production intent |
|----------|-------------------|
| `DATABASE_URL` | Postgres on Coolify network, host = DB container name/uuid `kiywnhlez6gi7d9hkzfksffp`, db/user `nura`, port `5432` |
| `AUTH_SECRET` | ≥32 chars; rotating invalidates sessions |
| `APP_URL` | `https://nurahelp.com` |
| `TRUST_PROXY` | `true` (Cloudflare + nginx) |
| `WEBAUTHN_RP_ID` | `nurahelp.com` |
| `WEBAUTHN_ORIGIN` | `https://nurahelp.com` |
| `PORT` | `3471` (image default) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Prod Google OAuth; add redirect `https://nurahelp.com/api/auth/google/callback` |
| Email / Stripe | Prefer **Admin → Email / Billing** in DB; optional env bootstrap |

Schema migrates on app start via app DB init (same as local).

---

## Admin / ops

- Seed platform admin with `scripts/seed-admin.ts` against production `DATABASE_URL` (run from a trusted shell; do not commit credentials).
- Production admin email historically seeded as platform admin (see Mem0 / ops notes) — password only in operator vault, never in docs.
- Stripe webhook URL: `https://nurahelp.com/api/webhooks/stripe`
- Public marketing routes vs `/app` console: middleware + `lib/public-paths.ts`.

---

## Smoke checks after deploy

```bash
# From laptop
curl -sS -o /dev/null -w "%{http_code}\n" https://nurahelp.com/
curl -sS https://nurahelp.com/ | findstr /C:"frontend-home" /C:"Support for therapy"

# On VPS
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3471/
docker ps --filter publish=3471 --format '{{.Image}} {{.Status}} {{.Ports}}'
```

Healthy home HTML should include marketing shell (`frontend-home`, hero copy) and `<link rel="stylesheet" …>`, **not** bare “Checking access…” / forced `/app/login` for anonymous `/`.

If `/` looks unstyled and login-gated: suspect **WORKDIR `/app` regression** or stale image — confirm container `WorkingDir` is `/nura` and image digest is fresh from GHCR.

---

## Dev vs production

| | Local | Production |
|--|--------|------------|
| App | `npm run dev` → :3471 | GHCR image → :3471 on loopback |
| DB | Docker Compose → host **5434** | Coolify Postgres uuid `kiywnh…` |
| URL | `http://localhost:3471` or `https://dev.nurahelp.com` | `https://nurahelp.com` |
| Deploy | n/a | push `main` → Actions → Coolify pull |

---

## Agent checklist (deploy / hosting tasks)

1. Read this doc + Mem0 `user_id: emdr` for “Coolify / production”.
2. Never commit `.env`, Coolify tokens, Cloudflare tokens, or DB passwords.
3. Prefer **image pull** deploy; do not re-enable on-server `next build` without checking RAM.
4. Keep Dockerfile `WORKDIR /nura`.
5. After infra changes: smoke `https://nurahelp.com/` and update this file + CHANGELOG + Mem0.
6. SSH for debugging: `ssh root@217.76.58.141` — inspect nginx, `docker ps`, Coolify DB only as needed.

---

## Changelog of hosting decisions (Sep 2026)

1. Coolify project **NuraHelp** on existing Coolify (already on VPS with Receptly).
2. Cloudflare A/CNAME → VPS; nginx site for apex/www → `127.0.0.1:3471`.
3. First deploys: Dockerfile build **on Coolify** → OOM → raised heap / skip lint in image.
4. Switched to **GitHub Actions build + GHCR + Coolify `dockerimage` pull**.
5. Fixed prod “no CSS / home → login”: `WORKDIR` `/app` → `/nura`; added `gsap`/`lenis` to `package.json`.
