# Changelog

All notable changes to the NuraHelp AI project are documented here.
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
- Auth: login, forgot/reset/create-password pages; JWT session cookie; middleware protects app routes
- Email: Brevo (primary) with Gmail API fallback on quota; templates — `password_reset`, `welcome_invite`, `password_changed`, `welcome`
- API: `/api/auth/login`, `logout`, `me`, `forgot-password`, `reset-password`, `create-password`, `invite`
- Script `scripts/invite-user.ts` — invite user and send create-password email
- PostgreSQL RLS: each `user` sees only own rows (`user_id` on threads, memories, settings); no admin bypass on data tables
- Roles: `platform_admin` | `user`; invite API restricted to platform admin
- Script `scripts/seed-admin.ts` — create/update platform admin and migrate orphan data
- Script `scripts/seed-user.ts` — create/update regular `user` with password
- **Session mode picker**: new chat starts as `pending` with Guided vs Free choice (`SessionStartScreen`); `threads.mode` column; guided keeps AI composer/check-in, free is BLS-only (no chat overlay)
- **Frontend site vs `/app`**: public landing at `/` (`FrontendShell`), Privacy/Terms stubs; product console under `/app` (session, settings, billing, auth); `lib/app-base.ts` + `lib/public-paths.ts`; `app/robots.ts` disallows `/app` and `/admin`
- Cloudflare Tunnel **`nurahelp-dev`**: `https://dev.nurahelp.com` → localhost **3471**; Access email one-time PIN with Allow Everyone (credentials in `%USERPROFILE%\.cloudflared\`, not git)
- **Consumer onboarding + billing**: `/app/onboarding` (welcome → plan → Stripe Checkout 7-day trial → tutorial); monthly/yearly prices; trial limits **3 guided sessions** + **10 min Free/BLS**; upgrade modal; Customer Portal; entitlement gate; grandfather existing password users as `legacy`
- **Create account**: `/app/create-account` + `POST /api/auth/register`; link from login footer and landing header; new users land on onboarding
- **Stripe project `nurahelp`**: dedicated test sandbox (`acct_1UCsfAAiWsQlzMVG`, Dashboard name **Nura sandbox**); product NuraHelp AI with monthly €14.99 / yearly €99 prices; Customer Portal; webhook → `https://dev.nurahelp.com/api/webhooks/stripe`; keys + price IDs wired in local `.env` (CLI profile `-p nurahelp`); claimed and verified Checkout branding
- **Help chat**: right-side drawer (“Need help?”) under `/app`; AI first reply with keyword RAG (`help_knowledge`) + allow/deny topics; admin inbox + email notify at `/admin/help`; settings stored in platform `help` block
- **Guided intake phase (EMDR Phase 1)**: new `intake` protocol phase before grounding; conversational history-taking + safety screen; persistent `client_profiles` table (RLS); returning users get short re-evaluation opener; interpreter extracts intake fields; BLS disabled until after intake
- **Free-session ads**: interstitial before BLS start for trial users only (`lib/ads.ts` + `AdInterstitial`); admin frequency controls (per session / every N minutes / every N sets); AdSense + placeholder + GAM seam; paying users never receive ad config from `/api/billing/status`
- Free-session ads fixes: Upgrade no longer starts BLS; frequency counted only on Continue; AdSense script loads only when ads are active for the trial user; ad freq keyed by user id in localStorage
- Root **`reset.bat`**: kills anything on port **3471**, then runs `start.bat` (same pattern as Hubcast `restart_hubcast.bat`)

### Changed
- Email: **Brevo is primary**; Gmail API is fallback on missing Brevo config or quota (send-as default `hi@contact.nurahelp.com`, editable in Admin → Email)
- Product rebrand: **NuraHelp** / **NuraHelp AI** (feature: **EMDR Support**); defaults, meta, emails, WebAuthn `rpName`, UI chrome, README/`package.json`; clinical protocol copy kept as EMDR
- UI redesign: **ChatGPT / DeepSeek** product style — dark sidebar, flat BLS bar, bottom chat composer; retired Apple HIG (`apple-design-ui` rule disabled, new `product-ui` rule)
- Database migrated from SQLite (`better-sqlite3`) to PostgreSQL
- BLS toolbar: slimmer dock layout; **chevron** at end hides entire bar; collapsed pill **bottom-right** (same side as hide); toolbar overlays canvas so main area fills full height
- Removed double-click on canvas for ball options; **gear icon** next to Animation in BLS bar opens adjustments panel
- Agent overlay shifts down when toolbar is collapsed
- UI refresh: Apple-like design — frosted glass, segmented BLS controls, grouped settings
- Typography: **Inter** via `next/font/google` (SF Pro not used on web)
- Sidebar: removed placeholder Sparkles icon; text-only header until logo is provided
- Apple design tokens aligned with `apple-design` skill in `app/globals.css`
- Settings page: left sidebar tabs (Voice, AI, ElevenLabs, Memory, Coming soon) with panel on the right
- Apple-style toggle switches replace checkboxes (Auto voice, memory sets in thread edit)
- GitHub: initial push to public repo https://github.com/alexmils/emdr (`main`); `.gitignore` excludes `.env`, `__pycache__`
- BLS vibration: **none / soft / hard** for joystick rumble on each ball edge; control hidden until a gamepad is connected
- BLS speed: **Arrow Up / Arrow Down** adjusts Hz in 0.1 steps (0.5–2.0); toolbar shows current value
- BLS toolbar gamepad/keyboard nav: **Left/Right** switches field (Speed, Repeats, Sound…); **Up/Down** changes value in focused field; D-pad on joystick maps the same way
- BLS toolbar fields show a **single live value** per box (not preset chips); ↑/↓ adjusts the number/text inside the focused box
- BLS toolbar: three speed presets (0.5 / 1.0 / 2.0) with ↑↓ per slot; removed BLS label; bar lifted from bottom edge
- Bottom layout: agent overlay centered on canvas above BLS bar; dock height measured dynamically (no overlap)
- Chat + BLS use fixed light chrome above canvas (unaffected by background color); idle hint uses `mix-blend-mode: difference` for contrast on any background
- BLS immersive mode: sidebar + header hide while ball runs; canvas fullscreen, only BLS bar remains (`AppShell`, `session-immersive`)
- **RLS user isolation**: each user sees only own threads/chats/memories/settings (admin bypass removed from data policies)
- **Admin dashboard** at `/admin` — user count, MRR/subscriptions, sessions stats, user table; `/api/admin/stats`, `/api/admin/users`
- `subscriptions` table schema for future billing; user billing page vs admin aggregate stats
- Admin **CRUD**: invite/add user, delete user; **event log** (login, logout, invite, password set); admin blocked from session app (`/` → `/admin`)
- Session role sync: middleware + `/api/auth/sync-session` refresh JWT from DB; admin user edit UI (name/role)
- Unit tests (`npm test`) for role validation and fetch-json errors
- `TRUST_PROXY` env for audit IP behind reverse proxy

- Gamepad vibration: distinct **soft** (45ms, light motor) vs **hard** (140ms, full strong motor) profiles
- Agent system prompt now loads phase knowledge from `lib/protocol-knowledge.ts` (grounding tools, NC themes, set language)
- **Admin shell** — dark sidebar; routes `/admin`, `/admin/users`, `/admin/users/[id]`, `/admin/activity`, `/admin/email`, `/admin/platform`, `/admin/billing`
- **Platform settings** (`PlatformSettings` in `app_settings`): site name, public URL, invites, maintenance, sender, feature flags; API `/api/admin/platform`
- **Email admin** — provider health, sender, test send, template preview/editor, broadcast, send log (`email_events`)
- Role **`support`** (read-only admin); user **`status`** active/disabled; user detail + resend invite
- Stripe scaffold — `/api/billing/checkout`, `/api/webhooks/stripe`, `stripe` package
- **Admin AI & Voice** (`/admin/ai`) — platform-wide LLM providers, default model, and TTS Voice API key / voice ID for all users
- User Settings: removed AI and ElevenLabs tabs; users only keep auto-voice preference; chat/`/api/voice` use platform `getLlmRuntimeConfig()` (env keys remain fallback)
- Removed Settings footer disclaimer (“self-help guide…”) from `/app/settings`
- Admin **AI & Voice** UI: provider cards + Configure modal; model/voice dropdowns from provider list APIs; live **Connection OK / Failed** check on API key (`POST /api/admin/ai/models`, `/api/admin/ai/test-connection`)
- Default provider dropdown disables providers without an API key (or with a failed connection)
- Auth + session URLs moved under `/app` (`/app/login`, `/app/settings`, `/app/billing`); legacy paths 308-redirect; admin still `/admin` (blocked from `/app`); invite/reset emails and Stripe return URLs updated; `fetchJson` 401 only redirects from console paths

### Fixed
- Guided BLS: Space/click only start a set in desensitization / installation / body_scan while idle; check-in offers **Repeat set** if the last set was missed; free sessions still start anytime
- Guided chat phases: hide BLS toolbar / gear until a set is ready or running (chat sits lower without the dock)
- Guided canvas: removed idle placeholder “The guide will invite you when it is time for a set”
- Agent overlay text: removed top fade mask that washed out the first line
- Agent overlay: centered in the stage (accounts for BLS dock height when visible)
- Agent overlay: card removed — fade-up guide text + single pill composer (ChatGPT/Gemini style)
- Session header: replace control hints with editable **description** (`threads.description`; click to edit)
- Guide copy: short line chunks + balanced typography for readability (ADHD-friendly spacing)
- Guide text: continuous paragraph with `text-wrap: pretty` (no choppy one-line-per-sentence layout)
- Chat LLM: fall back to any enabled provider with an API key; remove user-facing “configure AI in Settings” fallback copy
- OpenAI chat: send `max_completion_tokens` (gpt-5* rejects `max_tokens`); LLM failure uses phase-aware `guidedFallbackReply` instead of generic “I'm here with you…”
- Default LLM: OpenAI **`gpt-4.1-mini`** (chat-tuned for short guided turns); platform default provider OpenAI; `gpt-5*` models remapped away (reasoning / empty replies)
- OpenAI gpt-5*: omit `temperature` (only default 1 is allowed); raise `max_completion_tokens` to 2048 so reasoning models still return visible guide text
- Guided fallback: never echo the user’s words in parentheses; guide prompt forbids robotic quoting
- Guided grounding prompt: acknowledge short safe-place answers; strip stale fallback lines from LLM history
- Guided chat: full thread UI (AI left / user right) with avatars; profile photo in Settings + sidebar name (no long email)
- Guided overlay: session open shows centered fade-up prompt text; chat bubbles only after the first user reply
- Thread edit: create memory set inline (**Add set**) + **Open Settings** → `/app/settings?tab=memory`
- User delete audit log: write event before delete (FK on `target_user_id`)
- Demoted/promoted admin redirect loop: JWT role synced from DB on each request
- Legacy `/api/auth/invite` rolls back user on email failure; removed `ADMIN_INVITE_SECRET` bypass
- `create-password` auto-login records `last_login_at` via `recordUserLogin`
- PATCH `/api/admin/users` validates role; blocks self role change
- `fetchJson` throws on 401 instead of returning empty object
- Schema init race: advisory lock + single-flight DDL; audit tables in main migration; fewer sync-session calls in middleware
- Cursor rule `.cursor/rules/verify-before-done.mdc` — lint, tests, runtime smoke before finishing tasks
- EMDR agent knowledge base: `lib/protocol-knowledge.ts` + `knowledge/SOURCES.md` (distilled 8-phase guide for system prompts; PDFs not stored)
- Session **interpreter** agent: JSON SUDs/VoC/phase/distress after each user turn (`lib/session-interpreter.ts`); platform flag + admin knowledge notes
- Session UX: phase / SUDs / VoC status chips; check-in banner + quick replies after BLS sets; no skip from grounding→desensitization on set complete
- Schema DDL race: advisory lock held on one Postgres connection for whole migration; retry on `tuple concurrently updated`; `withAuth` always returns JSON 500
- BLS toggle: do not call `setSessionMode` inside `setRunning` updater (React nested-update warning)
- Chat overlay hidden under BLS bar: dock height now measured on `.bls-dock` (was 0px wrapper); chat z-index 30; input row always visible outside scroll/mask
- Internal Server Error on `/` from stale `.next` cache — clean rebuild fixes it; `start.bat` now frees port 3471 before dev
- Dev server HMR crashes on Windows — Turbopack dev by default (`npm run dev`), pinned Next **15.2.4**, auto-restart once on crash, `WATCHPACK_POLLING`; fallback `npm run dev:webpack`; `scripts/recover-dev.bat` clears cache
- Admin login crash: middleware nested `/api/auth/sync-session` on every admin request (page + parallel APIs), which overloaded Turbopack on Windows until the process exited (`start.bat` then showed “Press any key”). Sync now only on document navigations, with a 120s `emdr_role_sync` cookie; JWT `support` role is no longer dropped; AdminShell sends unauthenticated users to `/login` instead of bouncing `/` ↔ `/admin`.

- Ball dot hidden until BLS starts (no overlap with idle hint text)
- BallCanvas animation loop (refs instead of stale React state for direction)
- SQLite `app_settings` schema migration issue (replaced by Postgres)
- Onboarding welcome on mobile: less vertical chrome (top-align, tighter type, shorter copy, no duplicate home/billing links) so the first screen fits without odd empty scroll
- Settings on mobile: sticky header + horizontal scrollable tabs (no wrap chaos); stacked memory/profile controls; safe-area padding for help FAB
- Cursor rule `.cursor/rules/mobile-shell-check.mdc` — page/UI work must verify ~390×844 shell; hooked into `verify-before-done`
- Onboarding bypass: schema no longer re-grandfathers every password user as `legacy` on boot; self-registered unpaid users reset to `access_tier=none` + null `onboarding_completed_at`; `/api/auth/access` + middleware/AppAccessGate enforce DB-backed gate
- Stripe webhook: release claimed `stripe_webhook_events` on handler failure / unresolved user so Stripe retries can sync; checkout blocks `past_due`/`unpaid`/`incomplete`; onboarding tutorial only after `canUseApp`; invite create-password grants legacy access
- Cloudflare Access redirect loop: middleware no longer nested-fetches `/api/auth/access` via `dev.nurahelp.com`; sync-session uses loopback; AppAccessGate + APIs still enforce onboarding
- Main `/app` mobile shell: ChatGPT-style off-canvas sidebar (menu opens drawer; backdrop / X / Escape close; closes on New chat or thread select); main canvas uses full width when closed
- Empty workspace: removed instructional “tap the menu…” copy; show a **New chat** button instead
- Billing page: Plan/Status rows use spaced label–value layout (no “Statustrialing”); action buttons stacked with clear gaps
- Mobile session canvas: idle hint is **Tap to start** (not Press Space); BLS bar stays one compact scrollable row (no wrap), clears Help FAB
- Session `/app` on mobile: Help FAB hidden; BLS dock edge-to-edge full width (no cut-off options); shell uses `dvh` to avoid page vertical scroll
- Cursor rule `.cursor/rules/git-commit-push.mdc` — commit/push when asked; remind if many local changes or push is stale
- **BLS mobile toolbar**: Control Center–style panel (like reference apps) — labeled groups (Speed / Repeats / Stereo sound / Animation / Vibrations / Adjustments), large segmented tap targets, icon options; replaces cramped single-row steppers; fine speed still via gear + gamepad/keyboard

---

<!-- Agent: append new bullets under [Unreleased] after each change session, then sync summary to Mem0 user_id "emdr". -->
