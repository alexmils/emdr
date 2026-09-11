# Nura / NuraHelp — brand system

Use this file as the source of truth for naming, color, type, and voice.
Agents: follow `.cursor/rules/nura-brand.mdc` (always on). Code constants live in `lib/brand.ts`.

## Name

**Say Nura. Write NuraHelp. URL is nurahelp.com.**

| Layer | Name | Where |
|---|---|---|
| Spoken / UI chrome | Nura | Header, sidebar, email from-name, Stripe Checkout |
| Lockup / legal | NuraHelp | Logo, Terms, copyright, App Store, Stripe legal |
| Domain | nurahelp.com | Keep. Do not buy nura.com. |
| Current product | Nura · EMDR Support | Feature, not the company name |
| Never in public | NuraHelp AI | Sounds like a ChatGPT clone |

Do not lead with “AI” in titles, hero copy, or the wordmark.

## Position

Nura is a calm place for guided therapy support — EMDR sessions and resources in the app.

Not an AI therapist. Not an EHR. Not emergency care.

Hero: **Support for therapy. Starting with EMDR.**

Disclaimer (always visible on marketing): self-help tool, not a licensed therapist.

## Color

**Pistachio** palette — mint, sage, and olive (modern, calm green).

| Token | Hex | Use |
|---|---|---|
| Paper (mint) | `#A4EDA5` | Highlights, canvas tint, light surfaces |
| Pistachio | `#C6D67E` | Focus, hover, selection — never body text or default borders |
| Sage (earth) | `#84B067` | Wordmark, icons, primary buttons |
| Olive | `#948F4E` | Muted text, secondary chrome |
| Ink | `#2A3020` | Body text |
| Sidebar | `#3D4129` | App / admin sidebar (dark olive) |

Page background uses a softened mint (`#EDF9ED`). Constants: `lib/brand.ts` → `BRAND_COLORS`.

Forbidden: OpenAI `#10a37f`, Apple `#007AFF`, purple “wellness”, hospital blue.

## Type

### Product (`/app`, `/admin`)

- Display: **Fraunces** via `next/font/google` (`--font-display`)
- UI: **Source Sans 3** (`--font-sans`)

### Marketing (`.frontend-home`)

Same pair as product — contrasts the rounded wave wordmark (do not echo it with soft grotesks):

| Role | Font | Notes |
|---|---|---|
| Headings | **Fraunces** | h1–h6, hero, pricing; weight 400; italic for emphasis |
| Body / UI | **Source Sans 3** | Nav, buttons, paragraphs |
| Labels | **Roboto Mono** | Kickers, marquee, uppercase ~0.9375rem |

Loaded via `next/font` in `app/layout.tsx` (`--font-fraunces`, `--font-source-sans`, `--font-fe-alt`). Scoped on `.frontend-home` in `app/globals.css`.

Do not use Inter on any surface. Avoid rounded soft grotesks (Nunito, Manrope, retired BDOGrotesk) next to the wave lockup.

## Logo

- **Wordmark**: wave ribbon flowing into lowercase **nura** (green→gold gradient). UI chrome shows the wave wordmark only — no “help” suffix next to the logo (legal name remains NuraHelp in copy/aria).
- **Mark**: single tapered S-ribbon (pointed both ends). Files: `mark.png` / `mark-black.png` / `mark-white.png` (+ `mark.svg`).
- Favicon / apple-touch: **white wave on sage** `#84B067` (high contrast at small sizes — not mint+muddy gradient). Files: `favicon.png`, `favicon-32.png`, `apple-touch-icon.png`, `app/icon.svg`, `app/icon.png`, `app/apple-icon.png`.
- Square lockups (500 / 2500):
  - Black/white transparent: `nura-wave-logo-black|white-{500,2500}.png`
  - Black on white / white on black: `nura-wave-logo-black-on-white-*`, `nura-wave-logo-white-on-black-*`
  - Color transparent: `nura-wave-logo-color-{500,2500}.png`
  - Color on white / black: `nura-wave-logo-color-on-white-*`, `nura-wave-logo-color-on-black-*`
- Wordmark only (no wave) — solid letterforms (`nura-text.svg` / filled masters):
  - Transparent: `nura-text.png`, `nura-text-black.png`, `nura-text-white.png` (+ `-500` / `-2500` squares)
  - On backgrounds: `nura-text-color-on-white|black-*`, `nura-text-black-on-white-*`, `nura-text-white-on-black-*`
- Never: brain, lotus, chat bubble, cross, heart, or the retired two-dots arc.

Files: `public/brand/nura-wave-logo.png` (+ `-black` / `-white` / color squares), `nura-text*.png`, `mark.png`, `lockup.png` / `lockup.svg`, `mark.svg`. Component: `app/components/BrandLockup.tsx` (`tone="color" | "black" | "white"`).

## Voice

English, sentence case, short sentences. No hype (“revolutionary”, “neural networks”, “blockchain”). Clinic-quiet, not a startup pitch.

**Never say BLS to users.** Prefer **Free** / **Free mode** / **Set running** / **moving ball**. Internal code names (`bls`, `TRIAL_BLS_SECONDS`) are fine. See `.cursor/rules/nura-brand.mdc`.

## SEO

The brand name does not need to contain “EMDR”. Pages do.

| URL | Intent |
|---|---|
| `/` | Brand + EMDR primary CTA |
| `/about` | Who Nura is, what the app offers, disclaimers |
| `/emdr` | What EMDR is, visual sets / moving ball, how a session works |
| `/resources` | Guides |

Retired: `/therapy`, `/therapists` → redirect to `/resources`.

Default document title: `Nura — guided EMDR, therapy resources, and support`.
