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
| Never in public | NuraHelp AI | Sounds like a ChatGPT clone; ages out when live therapists ship |

Do not lead with “AI” in titles, hero copy, or the wordmark.

## Position

Nura is a calm place for therapy support — guided EMDR today, resources and real clinicians as you grow.

Not an AI therapist. Not an EHR. Not emergency care.

Hero: **Support for therapy. Starting with EMDR.**

Disclaimer (always visible on marketing): self-help tool, not a licensed therapist.

## Color

| Token | Hex | Use |
|---|---|---|
| Paper | `#F8F2D2` | Marketing, auth, page background |
| Gold | `#D3BC84` | Accent only (mark highlight, focus, hover). Never body text. |
| Earth | `#785135` | Wordmark, icons, primary buttons |
| Ink | `#2A2118` | Body text |
| Sidebar | `#1C1814` | App / admin sidebar |

Forbidden: OpenAI `#10a37f`, Apple `#007AFF`, purple “wellness”, hospital blue.

## Type

- Display (hero, lockup): **Fraunces** via `next/font/google` (`--font-display`)
- UI: **Source Sans 3** (`--font-sans`)
- Do not use Inter.

## Logo

- Mark: two dots joined by a gentle arc (BLS path; also “two sides of care”).
- Wordmark: lowercase **nura** in Fraunces; **help** in Source Sans 3, smaller.
- On Paper: Earth. On sidebar: Paper / Gold on `#1C1814`.
- Favicon: mark only (`app/icon.svg`, `public/brand/mark.svg`).
- Never: brain, lotus, chat bubble, cross, heart.

Files: `public/brand/mark.svg`, `public/brand/lockup.svg`. Component: `app/components/BrandLockup.tsx`.

## Voice

English, sentence case, short sentences. No hype (“revolutionary”, “neural networks”, “blockchain”). Clinic-quiet, not a startup pitch.

## SEO

The brand name does not need to contain “EMDR”. Pages do.

| URL | Intent |
|---|---|
| `/` | Brand + EMDR primary CTA |
| `/emdr` | What EMDR is, BLS, how a session works |
| `/therapy` | Hub for future modalities |
| `/resources` | Guides |
| `/therapists` | Find a therapist (coming) |

Default document title: `Nura — guided EMDR, therapy resources, and support`.
