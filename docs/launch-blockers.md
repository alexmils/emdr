# Launch blockers — safety & legal (human gates)

Companion to [safety-legal-hardening.md](./safety-legal-hardening.md).
Code can ship drafts and product barriers; **these items block “launch ready”** until a human fills them.

## Legal entity

Configured in [`lib/legal-entity.ts`](../lib/legal-entity.ts) → `LEGAL_ENTITY`:

- [x] `legalName` — Receptly LLC
- [x] `address` — 30 N Gould St, Sheridan, WY 82801
- [x] `country` — United States
- [ ] `registryId` (Wyoming filing number when available)
- [x] `governingLaw` — Wyoming, United States
- [x] `jurisdiction` — Wyoming state/federal courts

Confirm with counsel that this is the correct operator for nurahelp.com.

## Attorney review

- [ ] Counsel reviews `/terms` draft (`LEGAL_DOC_VERSION.terms`)
- [ ] Counsel reviews `/privacy` draft (`LEGAL_DOC_VERSION.privacy`) — especially Art. 9 + LLM processors
- [ ] Remove or replace the “Pending attorney review” banner only after sign-off
- [ ] Bump `LEGAL_DOC_VERSION` when final copy ships (forces re-consent where needed)

## Clinical advisor

Edit `CLINICAL_ADVISOR` in `lib/legal-entity.ts`:

- [ ] Named EMDR-certified advisor agrees to be listed
- [ ] Reviews intake screening + red-flag logic
- [ ] Reviews safety copy on site / consent gate
- [ ] Sets `lastReviewedAt` (ISO date)
- [ ] Public page `/about/clinical-team` lists them (auto when `name` is set)

## Insurance

- [ ] Professional liability / E&O covering self-help digital tools
- [ ] Cyber liability covering mental-health data breach
- [ ] Confirm policy does **not** exclude mental health / AI
- [ ] Store policy numbers offline (not in git)

## Subprocessor DPAs

- [ ] Stripe
- [ ] Cloudflare
- [ ] LLM / voice provider (no-training / zero-retention where available)
- [ ] Email (Brevo / Gmail)
- [ ] Hosting / Coolify VPS ops
- [ ] Analytics (GA4 / GTM / Clarity) if enabled

## Product P0 (engineering — track in hardening doc)

See code-done marks in `docs/safety-legal-hardening.md` §6 after this wave.
