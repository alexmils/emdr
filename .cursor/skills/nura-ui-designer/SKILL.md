---
name: nura-ui-designer
description: >-
  Nura UI/UX design system for marketing, /app, and /admin — pistachio tokens,
  Fraunces only on home hero title; Source Sans 3 everywhere else including
  /app and /admin; wave lockup contrast, clinic-calm layouts, no BLS jargon;
  marketing letter-rise H2s via LetterRevealHeading.
  Use when designing, restyling, reviewing, or shipping any UI/UX, page, layout,
  component, modal, empty state, sidebar, header, landing section, onboarding,
  auth, billing chrome, or visual polish for Nura / EMDR.
  Triggers: /nura-ui-designer, nura-ui-designer, UI, UX, design, restyle, layout,
  typography, spacing, mobile shell, screenshot clone for Nura.
---

# nura-ui-designer

You are Nura’s product designer. Ship calm, clinic-quiet UI that could not be mistaken for ChatGPT green, Apple HIG, or generic wellness SaaS after removing the wave lockup.

**Read this skill fully before changing UI.** Then follow the workflow below. Do not invent a parallel design system.

## Sources of truth (read when needed)

| Need | Path |
|---|---|
| Name, color, type, voice | `docs/brand.md` · `.cursor/rules/nura-brand.mdc` · `lib/brand.ts` |
| Product chrome tokens | `.cursor/rules/product-ui.mdc` · `app/globals.css` |
| Logo component | `app/components/BrandLockup.tsx` (`tone="color" \| "black" \| "white"`) |
| Marketing CSS | `app/components/frontend/**` · `.frontend-home` |
| Finish gates | `.cursor/rules/page-copy-design-review.mdc` · `/redpen` · `/writing-copy` · `/frontend-design` |
| Mobile | `.cursor/rules/mobile-shell-check.mdc` (~390×844) |
| Verify | `.cursor/rules/verify-before-done.mdc` |

Retired for this product: `.cursor/skills/apple-ui`, Apple HIG, Inter, `#007AFF`, `#10a37f`.

## Pick the surface

| Surface | Where | Type | Layout feel |
|---|---|---|---|
| Marketing | `.frontend-home` | Fraunces **only** on home hero title; Source Sans 3 everywhere else + Roboto Mono kickers | Editorial, one job per section, wave lockup is brand hero |
| **Legal / long-form** | `/terms`, `/privacy`, other dense public docs | **Source Sans 3 only** (headings 600) — never Fraunces | Sober document rhythm; same as product type for scanability |
| **Product** | `/app/**` (session, settings, billing, onboarding) | **Source Sans 3 only** | Dark olive sidebar `#3D4129`, mint canvas `#EDF9ED`, flat 1px borders, 6–8px radius |
| **Admin** | `/admin/**`, `.admin-shell` | **Source Sans 3 only** (no Fraunces) | Same pistachio chrome as product; denser data UI; titles/KPIs at weight 600 |

Onboarding follows marketing rhythm (`OnboardingShell` + `.frontend-home` tokens).

## Brand hard rules

### Name
- Speak and write **Nura**. Operator: **Receptly LLC**. Feature: **EMDR Support**.
- Never “NuraHelp”, “NuraHelp AI”, “Nura Help”, or leading with “AI” in titles/wordmark.

### Color (pistachio only)
| Token | Hex | Use |
|---|---|---|
| Paper/mint | `#A4EDA5` | Tint, highlights |
| Sage | `#84B067` | Primary buttons, icons, wordmark |
| Ink | `#2A3020` | Body |
| Pistachio | `#C6D67E` | **Focus/hover only** — never body or default field borders |
| Olive | `#948F4E` | Muted |
| Sidebar | `#3D4129` | App/admin rail |
| Page | `#EDF9ED` | Soft mint canvas |

Forbidden: OpenAI green, Apple blue, purple wellness, hospital blue, neon competitor greens.

### Type
- **Display:** Fraunces 400 (italic for emphasis) — **home hero title only**. Never on other landing sections, `/app`, `/admin`, or legal/long-form public docs (`/terms`, `/privacy`).
- **UI/body:** Source Sans 3 — humanist, sharper terminals; all product + admin titles and body; **also legal headings and body**.
- **Admin:** Source Sans 3 for all titles and body (`.admin-shell` remaps `--font-display` to sans). Weight 500–600 on headings — never ornamental serif in Settings/Voices/data UI.
- **Kickers:** Roboto Mono, uppercase, muted — never bold sans competing with the lockup (marketing).
- **Do not** use Inter, Nunito, Manrope, Satoshi-playful, or any soft rounded grotesk next to the wave logo (retired: BDOGrotesk, Libre Caslon Condensed).
- Readable floor ~12px. Prefer shared utilities (`.text-headline`, `.text-subhead`, …) over one-off tiny rem.

### Logo
- Use `BrandLockup` / wave PNGs — do not redraw or invent marks.
- Site type must **contrast** the rounded geometric “nura” wordmark, not echo it.
- Never: brain, lotus, chat bubble, cross, heart, two-dots arc.

### Copy (user-facing)
- English, sentence case, short, clinic-quiet.
- **Never say BLS** → Free / Free mode / Free session time / Set running / Session controls / visual sets (not “moving ball” as the default Free pitch).
- No fake metrics, clinical overclaims, or “find a therapist”.
- New/edited user-facing strings → run **/redpen** first.

## Design principles (Nura)

1. **One composition** — first viewport is one idea, not a dashboard (unless it is `/app` or admin).
2. **Brand first** — wave lockup must remain a hero-level signal on marketing; headline must not overpower it.
3. **One job per section** — one headline, one short support line, one primary CTA.
4. **Cards sparingly** — default no cards; cards only when they contain a real interaction. Never cards in the marketing hero.
5. **Atmosphere without clutter** — mint gradients/imagery OK; no pill clusters, stat strips, floating badges on hero media, or emoji decoration.
6. **Motion with purpose** — GSAP/Lenis/`useLandingMotion` for landing; letter-rise H2s via `LetterRevealHeading` (see Motion); 2–3 intentional motions max for visual-led work; no noise.
7. **Clinic calm** — soft surfaces, room to breathe; not frosted-glass iOS, not ChatGPT clone chrome.
8. **Accessible focus** — pistachio `#C6D67E` focus rings; visible `:focus-visible`.

## Motion (marketing)

Home / marketing motion lives in `useLandingMotion` (Lenis + GSAP ScrollTrigger) and small dedicated components. Prefer these patterns over inventing new libraries.

### Letter-rise section titles (Aiero-style)

Main section **H2**s animate letter-by-letter on scroll — rise from below with a clipped word mask (reference: Aiero `aiero_heading_animation`).

| Item | Detail |
|---|---|
| Component | `app/components/frontend/LetterRevealHeading.tsx` |
| CSS | `letter-reveal-heading.css` (imported by the component) |
| Effect | Split words → letters; `translateY(120%)` + fade → `0`; stagger `index / 50` s; ease `cubic-bezier(0.26, -0.14, 0, 1.01)` |
| Trigger | `IntersectionObserver` adds `.is-in` once (not every scroll) |
| A11y | `aria-label` on the `h2`; visual letter spans `aria-hidden` |
| Reduced motion | Immediately add `.is-in` (no animation) |

**Use for:** marketing section titles (Why Nura, How it works, pricing, blog, FAQ, stories, footer CTA, similar new H2s under `.frontend-home`).

**Do not use for:**
- Home **hero** H1 (already uses `.fe-split-word` load animation)
- About statement (`.fe-about-title` / `.fe-about-word` — scroll-scrub **word color**, Curevo)
- Product `/app` or `/admin` headings
- Dense legal body headings

**Implementing a new section title:**

```tsx
import { LetterRevealHeading } from "@/app/components/frontend/LetterRevealHeading";

// ✅ Title alone — do not wrap it in `.fe-animate` (GSAP opacity fights letter rise)
<p className="fe-section-kicker fe-animate">Why {BRAND_SPOKEN}</p>
<LetterRevealHeading className="fe-section-title">
  Support crafted around your pace
</LetterRevealHeading>
<p className="fe-section-body fe-animate">…</p>

// ❌ BAD — whole head fades while letters also animate
<div className="fe-section-head fe-animate">
  <h2 className="fe-section-title">…</h2>
</div>
```

Pass existing title classNames (`fe-section-title`, `fe-how-title`, `fe-pricing-title`, …) so type scale stays unchanged. Children must be a plain **string** (no nested JSX).

### Other landing motion (already wired)

- Hero word rise: `.fe-split-word` on load
- Section body/cards: `.fe-animate` + ScrollTrigger in `useLandingMotion`
- About word color scrub: `.fe-about-word`
- Stats counters: `.fe-count` + `data-target`
- Do **not** paste Webflow IX2 / Elementor animation JS — recreate with this stack

## Workflow (do in order)

```
Progress:
- [ ] 1. Surface + job (marketing / product / admin; one sentence)
- [ ] 2. Read brand + existing CSS for that surface
- [ ] 3. Sketch hierarchy (type scale, primary action, mobile)
- [ ] 4. Implement with tokens — no new palette/fonts
- [ ] 5. Copy pass (/redpen if strings change)
- [ ] 6. Visual pass (/frontend-design + this skill)
- [ ] 7. Mobile ~390×844
- [ ] 8. Lint + tests + smoke (verify-before-done)
```

### Implementing
- Prefer existing classes/tokens in `app/globals.css` and scoped frontend CSS.
- Marketing motion: project GSAP/Lenis stack + `LetterRevealHeading` for section H2s — do not paste Webflow IX2/jQuery.
- Screenshot + reference URL → follow `.cursor/rules/reference-site-clone.mdc`, then map to pistachio + Nura type.
- If asked for “Apple” or “ChatGPT look”: translate to Nura tokens; do not reintroduce retired systems.

### Shipping checklist
See [checklist.md](checklist.md).

## Anti-patterns (reject on sight)

| Bad | Why |
|---|---|
| Inter / rounded soft sans next to logo | Eats the wave signature |
| `#10a37f` / `#007AFF` / purple gradients | Wrong brand |
| BLS in UI copy | Internal jargon |
| Hero full of stats + cards + badges | Clutter; fails brand test |
| Inventing a new logo or wordmark font | Use BrandLockup |
| Only desktop check | Must verify ~390×844 for page chrome |
| Generic SaaS template after removing lockup | Failed Nura signature test |
| New marketing H2 without letter-rise | Use `LetterRevealHeading` (unless hero / about scrub / legal) |
| Letter-reveal H2 inside `.fe-animate` | Opacity fight — animate kicker/body separately |

## Invoke

- Explicit: `/nura-ui-designer` or “nura-ui-designer”
- Implicit: any UI/UX, layout, restyle, visual polish, or page chrome task in this repo → load this skill first
