# NuraHelp AI

Next.js web app for **EMDR Support** with bilateral stimulation (BLS), AI session guide, and memory sets. Brand: NuraHelp · Product: NuraHelp AI · Site: [nurahelp.com](https://nurahelp.com).

## Features

- Left sidebar with session threads and account menu
- Center canvas with AFTL-style ball controls (speed, repeats, sound, animation, vibration, gear)
- Faded agent overlay at bottom-center with hover history and roll-in animation
- Space / gamepad to start/stop BLS
- Settings: Auto voice, DeepSeek/OpenAI/Claude, ElevenLabs, memories & sets
- Right-click thread → Edit → enable memory sets per session

## Setup

```bash
npm install
cp .env.example .env
npm run db:up    # Postgres on localhost:5434 (5432/5433 often already in use)
npm run dev      # http://localhost:3471
```

Add API keys in `.env` or via Settings.

### Ports

| Service   | Port | Notes                          |
|-----------|------|--------------------------------|
| Next.js   | 3471 | dev + production start         |
| Postgres  | 5434 | Docker; maps to 5432 in container |

To use an existing Postgres instance instead of Docker, set `DATABASE_URL` in `.env`.

### Dev tunnel (`dev.nurahelp.com`)

Exposes local **3471** behind Cloudflare Access (email one-time PIN; anyone can request a code). Credentials live in `%USERPROFILE%\.cloudflared\` (not in git).

```powershell
# With Next already on :3471
cloudflared tunnel run nurahelp-dev
```

Set in `.env` while using the tunnel: `APP_URL=https://dev.nurahelp.com`, `TRUST_PROXY=true`, and WebAuthn RP/origin for `dev.nurahelp.com` (see `.env.example`).

### Stripe billing (consumer onboarding)

Ordinary users complete `/app/onboarding` after invite password setup:

1. Welcome → choose monthly/yearly plan
2. Stripe Checkout (card required) with a **7-day trial**
3. Trial limits: **3 guided sessions** and **10 minutes** total Free/BLS
4. Exhausted limits open an **Upgrade** modal (no extra usage spent)

Env vars (see `.env.example`):

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Prefer a restricted key (`rk_…`) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for `/api/webhooks/stripe` |
| `STRIPE_PRICE_ID_MONTHLY` | Monthly Price ID |
| `STRIPE_PRICE_ID_YEARLY` | Yearly Price ID |
| `STRIPE_PRICE_ID` | Legacy monthly fallback |

Webhook events to enable: `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`.

Customer Portal is available from `/app/billing` → **Manage billing**.

**Stripe Tax:** do not enable `automatic_tax` until you have an active tax registration in the Stripe Dashboard; otherwise no tax is collected.

Existing users with a password are **grandfathered** (`legacy` access) and skip the paywall.

## Disclaimer

Self-help tool only. Not a replacement for licensed therapy.
