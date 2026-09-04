# EMDR protocol knowledge — sources

The in-app agent prompt is built from `lib/protocol-knowledge.ts`.

That file is an **original condensation** of the standard Shapiro 8-phase session structure and common self-guided practices (safe place, butterfly hug, SUDs/VoC check-ins, “Go with that” language). It is **not** a verbatim copy of any book.

## Reference materials used for distillation (local only — not in repo)

- Katherine Andler — *Self-Guided EMDR Therapy* workbook (user-provided PDF)
- EMDR training manual PDF (user-provided, ~249 pages; clinician training notes)

PDFs are **not** committed. Do not paste large copyrighted excerpts into the codebase.

## Mapping to app phases

| App phase | Protocol focus |
|-----------|----------------|
| `grounding` | Preparation / grounding tools |
| `assessment` | Access & activate (image, NC, PC, VoC, SUDs, body) |
| `desensitization` | Desensitization / reprocessing sets |
| `installation` | Positive cognition installation |
| `body_scan` | Body scan |
| `closure` | Closure (+ next-session re-evaluation hint) |

## Safety

The agent must treat this as self-help guidance, stop for overwhelm/crisis, and never claim to replace a licensed clinician.

## Session interpreter

On each user chat turn (when platform flag `sessionInterpreter` is on), `/api/chat` runs a second LLM call that returns strict JSON (`lib/session-interpreter.ts`): SUDs, VoC, target/NC/PC, suggested phase, distress. That updates the thread and is injected into the guide prompt. Admin can add extra notes in **Platform → Agent protocol notes**.
