# Changelog

All notable changes to the EMDR Guide project are documented here.
New entries are appended at the bottom of each section (newest last under `[Unreleased]`).

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Next.js 15 App Router app: guided EMDR sessions, BLS ball canvas, agent overlay, settings, memory sets
- PostgreSQL via `pg` + Docker Compose on port **5434** (`DATABASE_URL`)
- Dev/production server on port **3471**
- `start.bat` — Docker Postgres, `npm install`, opens browser, runs dev server
- Global **apple-design** skill (`billythekidz/apple-design-skill`) for Apple HIG
- Project skill `.cursor/skills/apple-ui` (Inter font, Apple tokens)
- Cursor rule `.cursor/rules/apple-design-ui.mdc` for UI work
- `CHANGELOG.md` and Mem0 workflow (`user_id: emdr`)
- Cursor rule `.cursor/rules/emdr-memory.mdc` — check Mem0 + changelog before/after changes

### Changed
- Database migrated from SQLite (`better-sqlite3`) to PostgreSQL
- BLS toolbar: slimmer dock layout; **chevron** at end hides entire bar; collapsed pill **bottom-right** (same side as hide); toolbar overlays canvas so main area fills full height
- Removed gear/settings icon from BLS toolbar; ball options via **double-click** on canvas
- Agent overlay shifts down when toolbar is collapsed
- UI refresh: Apple-like design — frosted glass, segmented BLS controls, grouped settings
- Typography: **Inter** via `next/font/google` (SF Pro not used on web)
- Sidebar: removed placeholder Sparkles icon; text-only header until logo is provided
- Apple design tokens aligned with `apple-design` skill in `app/globals.css`
- Settings page: left sidebar tabs (Voice, AI, ElevenLabs, Memory, Coming soon) with panel on the right
- Apple-style toggle switches replace checkboxes (Auto voice, memory sets in thread edit)
- GitHub: initial push to public repo https://github.com/alexmils/emdr (`main`); `.gitignore` excludes `.env`, `__pycache__`

### Fixed
- Internal Server Error on `/` from stale `.next` cache — clean rebuild fixes it; `start.bat` now frees port 3471 before dev
- Ball dot hidden until BLS starts (no overlap with idle hint text)
- BallCanvas animation loop (refs instead of stale React state for direction)
- SQLite `app_settings` schema migration issue (replaced by Postgres)

---

<!-- Agent: append new bullets under [Unreleased] after each change session, then sync summary to Mem0 user_id "emdr". -->
