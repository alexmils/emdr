# EMDR Guide

Next.js web app for guided EMDR sessions with bilateral stimulation (BLS), AI session guide, and memory sets.

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

## Disclaimer

Self-help tool only. Not a replacement for licensed therapy.
