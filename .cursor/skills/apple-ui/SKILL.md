---
name: apple-ui
description: RETIRED for Nura. Use nura-ui-designer instead. Legacy Apple HIG notes only.
---

# Apple UI — RETIRED

**Do not use for Nura UI/UX.** Load `.cursor/skills/nura-ui-designer/SKILL.md` (`/nura-ui-designer`).

Legacy notes below are historical (Inter / `#007AFF` / glass) and conflict with pistachio brand.

---

Use together with the global **`apple-design`** skill (`billythekidz/apple-design-skill`) — **only if resurrecting old Apple chrome (do not)**.

## Web font

**Inter** via `next/font/google` — SF Pro is not licensed for web. Stack:

`Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif`

On macOS, `-apple-system` still resolves to SF for users who have it.

## Project tokens

Defined in `app/globals.css` — aligned with Apple system colors (`#F2F2F7` grouped bg, `#007AFF` blue, hairline separators).

## Components

`.glass-sidebar`, `.glass-toolbar`, `.glass-overlay`, `.seg-group`, `.btn-primary`, `.field`, `.settings-group`

## Rules

- No logo/icon in sidebar header until provided
- Min 44px touch targets on primary controls
- `scale(0.965)` on button active state
- English UI, sentence case
