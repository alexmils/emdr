import type { ProtocolPhase, Thread } from "@/lib/types";

/** Phases where stopping mid-work risks incomplete processing. */
export const CLOSURE_REQUIRED_PHASES: ProtocolPhase[] = [
  "desensitization",
  "installation",
  "body_scan",
];

export function phaseNeedsClosureGate(phase: ProtocolPhase): boolean {
  return CLOSURE_REQUIRED_PHASES.includes(phase);
}

/**
 * True when leaving the session should prompt containment / closure first.
 */
export function shouldPromptSessionClosure(opts: {
  thread: Pick<Thread, "mode" | "phase" | "incomplete"> | null | undefined;
  setRunning?: boolean;
}): boolean {
  const { thread, setRunning } = opts;
  if (!thread || thread.mode === "pending") return false;
  if (setRunning) return true;
  if (thread.incomplete && thread.phase !== "closure") return true;
  if (thread.mode === "guided" && phaseNeedsClosureGate(thread.phase)) {
    return true;
  }
  return false;
}

export function shouldOfferResumeClosure(
  thread: Pick<Thread, "mode" | "phase" | "incomplete"> | null | undefined
): boolean {
  if (!thread || thread.mode === "pending") return false;
  // New threads default incomplete=true in DB — only prompt when left mid-processing.
  return thread.incomplete === true && phaseNeedsClosureGate(thread.phase);
}
