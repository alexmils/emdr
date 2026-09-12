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

### robots.txt and AI crawlers

Origin file: [`app/robots.txt/route.ts`](../app/robots.txt/route.ts) via [`lib/robots-txt.ts`](../lib/robots-txt.ts). Public [`/llms.txt`](../app/llms.txt/route.ts) invites crawl / index / ground / cite and forbids training.

| Crawler class | User-agents | Policy |
|---|---|---|
| Ordinary search | `*` | Public pages allowed. `/app`, `/admin`, `/api` disallowed. `Content-Signal: search=yes,ai-input=yes,ai-train=no` |
| Grounding / AI search | `OAI-SearchBot`, `PerplexityBot`, `ChatGPT-User` | Allow `/`, `/emdr`, `/about`, `/editorial`, `/resources`, `/blog` (plus `/llms.txt`, `/sitemap.xml`). Disallow everything else |
| Training | `GPTBot`, `ClaudeBot`, `CCBot`, `Google-Extended`, `Applebot-Extended`, `Amazonbot`, `Bytespider`, `meta-externalagent` | `Disallow: /` |

Cloudflare managed robots.txt must stay **off** (`bot_management.is_robots_txt_managed=false`). When on, CF **prepends** named-bot `Disallow: /` groups and a Content-Signal **without** `ai-input=yes`; those named groups override any later `Allow` for the same bot (RFC 9309). Origin already blocks training crawlers.

Do **not** set Cloudflare `ai_bots_protection` to `block` / block-all — that 403s search/grounding crawlers regardless of robots.txt. Prefer `disabled` or `only_on_ad_pages`.

Keep Bot Fight Mode for junk scrapers; verified search bots should remain allowed.

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
# uuid/force must be query params (JSON body is ignored by this Coolify version)
curl -X POST -G "$COOLIFY_API_URL/api/v1/deploy" \
  --data-urlencode "uuid=epufvmx1j8jold5gdpfak85m" \
  --data-urlencode "force=true" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Accept: application/json"
```

If Actions fails with **401 Unauthenticated**, the Coolify `personal_access_tokens` row is missing/expired: create a new token in Coolify → Keys & Tokens (or via Sanctum on the VPS) and update GitHub secret `COOLIFY_TOKEN`. Do not commit the token.

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
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public Turnstile sitekey |
| `TURNSTILE_SECRET` | Turnstile widget secret (Coolify only; never git) |
| `TURNSTILE_HOSTNAMES` | Prod: `nurahelp.com,www.nurahelp.com` (no localhost) |
| `CRON_SECRET` | Shared secret for scheduled jobs (e.g. guest help transcript cron) |
| Email / Stripe | Prefer **Admin → Email / Billing** in DB; optional env bootstrap |
| `COOLIFY_TOKEN` | Same PAT as GitHub Actions; lets Admin Overview read live app status |
| `COOLIFY_API_URL` | `https://server.nurahelp.com` (Access must allow `/api/v1*`) |
| `COOLIFY_APP_UUID` | `epufvmx1j8jold5gdpfak85m` (optional; this is the default) |

Schema migrates on app start via app DB init (same as local).

---

## Healthcheck (`GET /health`)

Coolify and Docker probe **`GET /health`** (not `/`). It returns JSON `{ ok, status, checks: { app, db } }` — **200** when Postgres answers `SELECT 1`, **503** otherwise. No auth, no schema work, `Cache-Control: no-store`.

| Where | Setting |
|-------|---------|
| Dockerfile `HEALTHCHECK` | `http://127.0.0.1:3471/health` (node `fetch`; image also has `curl`) |
| Coolify → Configuration → Healthcheck | Type **HTTP**, method `GET`, path `/health`, port **3471**, host `localhost` |
| Admin Overview | Platform health card polls `GET /api/admin/health` every 10s (local `/health` + Coolify `GET /api/v1/applications/{uuid}` when `COOLIFY_TOKEN` is set) |

Without `COOLIFY_TOKEN` the Coolify chip reads **Coolify local** (this process only).

---

## Admin / ops

- Seed platform admin with `scripts/seed-admin.ts` against production `DATABASE_URL` (run from a trusted shell; do not commit credentials).
- Production admin email historically seeded as platform admin (see Mem0 / ops notes) — password only in operator vault, never in docs.
- Stripe webhook URL: `https://nurahelp.com/api/webhooks/stripe`
- Public marketing routes vs `/app` console: middleware + `lib/public-paths.ts`.
- **Guest help transcript cron:** Coolify (or any scheduler) every **10–15 minutes** → `GET` or `POST` `https://nurahelp.com/api/cron/help-guest-transcripts` with `Authorization: Bearer $CRON_SECRET` (or `x-cron-secret` / `?secret=`). Sends one chat transcript email ~1 hour after last guest activity when email was captured.

---

## Smoke checks after deploy

```bash
# From laptop
curl -sS -o /dev/null -w "%{http_code}\n" https://nurahelp.com/
curl -sS https://nurahelp.com/health
curl -sS https://nurahelp.com/ | findstr /C:"frontend-home" /C:"Support for therapy"

# On VPS
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3471/
curl -sS http://127.0.0.1:3471/health
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
