import type { ProtocolPhase, SessionKind } from "./types";
import type { SessionMode } from "./protocol";

/** Protocol phases where bilateral sets are part of the guided flow. */
export const BLS_SET_PHASES: readonly ProtocolPhase[] = [
  "desensitization",
  "installation",
  "body_scan",
] as const;

export function phaseAllowsBlsSet(phase: ProtocolPhase): boolean {
  return (BLS_SET_PHASES as readonly string[]).includes(phase);
}

export function shouldBootstrapAgent(
  mode: SessionKind,
  messageCount: number
): boolean {
  return mode === "guided" && messageCount === 0;
}

export function showsComposer(mode: SessionKind): boolean {
  return mode === "guided";
}

export function showsBlsControls(mode: SessionKind): boolean {
  return mode !== "pending";
}

/**
 * Bottom BLS dock: always in free sessions; in guided only when a set
 * can start (idle + BLS phase) or is running — chat phases stay chat-only.
 */
export function showsBlsToolbar(opts: {
  sessionKind: SessionKind;
  phase: ProtocolPhase;
  sessionMode: SessionMode;
}): boolean {
  if (opts.sessionKind === "pending") return false;
  if (opts.sessionKind === "free") return true;
  if (opts.sessionMode === "running") return true;
  return canStartBls(opts);
}

export function usesAgent(mode: SessionKind): boolean {
  return mode === "guided";
}

export function isChoosableSessionMode(
  mode: unknown
): mode is Exclude<SessionKind, "pending"> {
  return mode === "guided" || mode === "free";
}

/**
 * Whether the user may *start* a BLS set (not stop a running one).
 * Free: anytime. Guided: only in BLS phases while idle (not during check-in).
 */
export function canStartBls(opts: {
  sessionKind: SessionKind;
  phase: ProtocolPhase;
  sessionMode: SessionMode;
}): boolean {
  if (opts.sessionKind === "pending") return false;
  if (opts.sessionKind === "free") return true;
  if (opts.sessionMode !== "idle") return false;
  return phaseAllowsBlsSet(opts.phase);
}

/** Redo a set after it finished without answering check-in (missed / interrupted). */
export function canRepeatGuidedSet(opts: {
  sessionKind: SessionKind;
  phase: ProtocolPhase;
  sessionMode: SessionMode;
}): boolean {
  return (
    opts.sessionKind === "guided" &&
    opts.sessionMode === "check_in" &&
    phaseAllowsBlsSet(opts.phase)
  );
}

/**
 * Whether Voice Mode may auto-start a set after the guide finishes speaking.
 * Requires interpreter startSet plus the same gates as a manual start.
 */
export function shouldAutoStartSet(opts: {
  startSet: boolean;
  sessionKind: SessionKind;
  phase: ProtocolPhase;
  sessionMode: SessionMode;
  riskFlag?: boolean;
  distress?: "ok" | "elevated" | "overwhelm";
}): boolean {
  if (!opts.startSet) return false;
  if (opts.riskFlag) return false;
  if (opts.distress === "overwhelm") return false;
  return canStartBls({
    sessionKind: opts.sessionKind,
    phase: opts.phase,
    sessionMode: opts.sessionMode,
  });
}
