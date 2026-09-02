import type { ProtocolPhase } from "./types";

export type SessionMode = "idle" | "running" | "check_in";

export interface ProtocolState {
  phase: ProtocolPhase;
  mode: SessionMode;
  setCount: number;
}

export const PHASE_ORDER: ProtocolPhase[] = [
  "grounding",
  "assessment",
  "desensitization",
  "installation",
  "body_scan",
  "closure",
];

export function nextPhaseAfterDesensitization(
  suds: number | undefined
): ProtocolPhase {
  if (suds === undefined || suds > 1) return "desensitization";
  return "installation";
}

export function systemPromptForPhase(
  phase: ProtocolPhase,
  memoryContext: string
): string {
  const base = `You are a calm EMDR session guide following the Shapiro protocol. English only.
Rules:
- During bilateral stimulation you produce NO output (handled by the app).
- Between sets: brief lines only. Use "Let it go, take a deep breath." then ask "What do you notice now?"
- After user responds: say "Go with that." or one short follow-up. No long therapy chat.
- Do not paraphrase the user's words. Do not analyze symbols.
- Do not ask "how do you feel?" except for SUDs (0-10) when checking disturbance level.
- This is self-help guidance, not a replacement for a licensed therapist.

Current phase: ${phase}.`;

  const phaseHints: Record<ProtocolPhase, string> = {
    grounding:
      "Help the user feel safe. Guide safe place or butterfly hug briefly. Keep it under 3 sentences.",
    assessment:
      "Ask for target image, negative cognition, body sensation, SUDs 0-10, and positive cognition VOC 0-7. One question at a time.",
    desensitization:
      "Remind them to notice whatever comes up. After check-in, encourage going with what appeared.",
    installation:
      "Focus on installing the positive cognition until VOC reaches 7.",
    body_scan:
      "Guide a slow body scan for remaining tension. Short bursts if tension found.",
    closure:
      "End on a positive note. Summarize what was done. Remind them processing may continue.",
  };

  const memory = memoryContext
    ? `\n\nEnabled memory sets for this session:\n${memoryContext}`
    : "";

  return `${base}\n\n${phaseHints[phase]}${memory}`;
}

export function checkInLine(phase: ProtocolPhase): string {
  switch (phase) {
    case "desensitization":
      return "Let it go, take a deep breath. What do you notice now?";
    case "installation":
      return "Take a breath. How true does the positive belief feel now, from 1 to 7?";
    case "body_scan":
      return "Scan your body. What do you notice now?";
    default:
      return "Take a deep breath. What do you notice now?";
  }
}

export function openingLine(phase: ProtocolPhase): string {
  switch (phase) {
    case "grounding":
      return "Welcome. Let's take a moment to ground. Notice your breath, and when you're ready, tell me your safe place in a few words.";
    case "assessment":
      return "Bring up the target memory as a picture in your mind. What negative belief goes with it, and where do you feel it in your body?";
    case "desensitization":
      return "Hold the target in mind. When you're ready, press Space or your controller to begin the set. I'll be quiet while the ball moves.";
    case "installation":
      return "Focus on your positive belief. Notice how true it feels now, from 1 to 7.";
    case "body_scan":
      return "Scan your body from head to toe. Tell me if any tension remains.";
    case "closure":
      return "You did meaningful work today. Take a deep breath. Processing may continue after the session — that's normal.";
  }
}
