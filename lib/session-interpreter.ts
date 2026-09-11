import type { ProtocolPhase, Thread } from "./types";
import { PHASE_ORDER } from "./protocol";

export type DistressLevel = "ok" | "elevated" | "overwhelm";

export type SessionInterpretation = {
  suds: number | null;
  voc: number | null;
  target: string | null;
  negativeCognition: string | null;
  positiveCognition: string | null;
  suggestedPhase: ProtocolPhase | null;
  distress: DistressLevel;
  needsGrounding: boolean;
  summary: string;
  userFacingHint: string | null;
  presentingProblem: string | null;
  historyNotes: string | null;
  triggers: string | null;
  resources: string | null;
  goals: string | null;
  riskFlag: boolean;
  riskNotes: string | null;
  intakeComplete: boolean;
  /** True when the guide should start a bilateral set after this turn. */
  startSet: boolean;
};

export const EMPTY_INTERPRETATION: SessionInterpretation = {
  suds: null,
  voc: null,
  target: null,
  negativeCognition: null,
  positiveCognition: null,
  suggestedPhase: null,
  distress: "ok",
  needsGrounding: false,
  summary: "",
  userFacingHint: null,
  presentingProblem: null,
  historyNotes: null,
  triggers: null,
  resources: null,
  goals: null,
  riskFlag: false,
  riskNotes: null,
  intakeComplete: false,
  startSet: false,
};

const PHASE_SET = new Set<string>(PHASE_ORDER);

function clampInt(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const n = Math.round(value);
  if (n < min || n > max) return null;
  return n;
}

function asTrimmedString(value: unknown, maxLen = 280): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (!t) return null;
  return t.slice(0, maxLen);
}

function asPhase(value: unknown): ProtocolPhase | null {
  if (typeof value !== "string") return null;
  return PHASE_SET.has(value) ? (value as ProtocolPhase) : null;
}

function asDistress(value: unknown): DistressLevel {
  if (value === "elevated" || value === "overwhelm" || value === "ok") {
    return value;
  }
  return "ok";
}

/** Extract first JSON object from model output (allows markdown fences). */
export function extractJsonObject(text: string): unknown | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced?.[1] ?? text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function parseSessionInterpretation(
  raw: unknown
): SessionInterpretation {
  if (!raw || typeof raw !== "object") return { ...EMPTY_INTERPRETATION };
  const o = raw as Record<string, unknown>;
  const distress = asDistress(o.distress);
  const riskFlag = Boolean(o.riskFlag);
  return {
    suds: clampInt(o.suds, 0, 10),
    voc: clampInt(o.voc, 0, 7),
    target: asTrimmedString(o.target),
    negativeCognition: asTrimmedString(o.negativeCognition),
    positiveCognition: asTrimmedString(o.positiveCognition),
    suggestedPhase: asPhase(o.suggestedPhase),
    distress,
    needsGrounding:
      Boolean(o.needsGrounding) || distress === "overwhelm" || riskFlag,
    summary: asTrimmedString(o.summary, 400) ?? "",
    userFacingHint: asTrimmedString(o.userFacingHint, 200),
    presentingProblem: asTrimmedString(o.presentingProblem, 400),
    historyNotes: asTrimmedString(o.historyNotes, 600),
    triggers: asTrimmedString(o.triggers, 400),
    resources: asTrimmedString(o.resources, 400),
    goals: asTrimmedString(o.goals, 400),
    riskFlag,
    riskNotes: asTrimmedString(o.riskNotes, 400),
    intakeComplete: Boolean(o.intakeComplete),
    startSet: Boolean(o.startSet),
  };
}

export function interpreterSystemPrompt(phase: ProtocolPhase): string {
  return `You are an EMDR session interpreter for a self-help app. English only.
Analyze the latest user message in context of the current phase and thread state.
Return ONLY a single JSON object (no markdown, no prose) with this exact shape:
{
  "suds": number|null,
  "voc": number|null,
  "target": string|null,
  "negativeCognition": string|null,
  "positiveCognition": string|null,
  "suggestedPhase": "intake"|"grounding"|"assessment"|"desensitization"|"installation"|"body_scan"|"closure"|null,
  "distress": "ok"|"elevated"|"overwhelm",
  "needsGrounding": boolean,
  "summary": string,
  "userFacingHint": string|null,
  "presentingProblem": string|null,
  "historyNotes": string|null,
  "triggers": string|null,
  "resources": string|null,
  "goals": string|null,
  "riskFlag": boolean,
  "riskNotes": string|null,
  "intakeComplete": boolean,
  "startSet": boolean
}

Rules:
- suds is 0-10 disturbance; voc is 0-7 validity of positive cognition. Use null if not clearly stated.
- Extract target/NC/PC only when the user clearly names them; do not invent.
- During intake: fill presentingProblem/historyNotes/triggers/resources/goals when the user shares them; set intakeComplete true only when a concrete starting target is agreed AND safety screening is OK (no crisis).
- riskFlag true if suicidality, active crisis, severe dissociation, or feels unsafe — also set riskNotes briefly.
- suggestedPhase: only when the conversation clearly warrants advancing or returning (e.g. intakeComplete → grounding; SUDs 0-1 in desensitization → installation; overwhelm → grounding). Prefer null if unsure.
- needsGrounding true if user asks for safe place, feels flooded, dissociated, or unsafe.
- startSet: true only when a bilateral set should begin now — phase is (or this turn advances to) desensitization, installation, or body_scan; distress is not overwhelm; riskFlag is false; and the user is ready to continue / go with that / begin the set. Never true during intake, grounding, assessment, or closure. Prefer false if unsure.
- summary: one short clinical note for the guide agent (not shown verbatim to user unless needed).
- userFacingHint: optional one short line the guide may use; null if none.
- Current phase is ${phase}. Do not output anything except JSON.`;
}

export function interpretationContextBlock(
  interp: SessionInterpretation
): string {
  const lines = [
    "Structured interpretation of the latest user turn (for your guidance only):",
    `- distress: ${interp.distress}`,
    `- needsGrounding: ${interp.needsGrounding}`,
    `- riskFlag: ${interp.riskFlag}`,
    `- intakeComplete: ${interp.intakeComplete}`,
    `- startSet: ${interp.startSet}`,
    interp.suds != null ? `- suds: ${interp.suds}` : null,
    interp.voc != null ? `- voc: ${interp.voc}` : null,
    interp.target ? `- target: ${interp.target}` : null,
    interp.negativeCognition
      ? `- negativeCognition: ${interp.negativeCognition}`
      : null,
    interp.positiveCognition
      ? `- positiveCognition: ${interp.positiveCognition}`
      : null,
    interp.presentingProblem
      ? `- presentingProblem: ${interp.presentingProblem}`
      : null,
    interp.historyNotes ? `- historyNotes: ${interp.historyNotes}` : null,
    interp.triggers ? `- triggers: ${interp.triggers}` : null,
    interp.resources ? `- resources: ${interp.resources}` : null,
    interp.goals ? `- goals: ${interp.goals}` : null,
    interp.riskNotes ? `- riskNotes: ${interp.riskNotes}` : null,
    interp.suggestedPhase
      ? `- suggestedPhase: ${interp.suggestedPhase}`
      : null,
    interp.summary ? `- summary: ${interp.summary}` : null,
    interp.userFacingHint
      ? `- userFacingHint: ${interp.userFacingHint}`
      : null,
  ].filter(Boolean);
  return lines.join("\n");
}

export function threadPatchFromInterpretation(
  thread: Thread,
  interp: SessionInterpretation
): Partial<Omit<Thread, "id" | "createdAt">> {
  const patch: Partial<Omit<Thread, "id" | "createdAt">> = {};

  if (interp.suds != null) patch.suds = interp.suds;
  if (interp.voc != null) patch.voc = interp.voc;
  if (interp.target) patch.target = interp.target;
  if (interp.negativeCognition) {
    patch.negativeCognition = interp.negativeCognition;
  }
  if (interp.positiveCognition) {
    patch.positiveCognition = interp.positiveCognition;
  }

  if (interp.riskFlag || interp.needsGrounding || interp.distress === "overwhelm") {
    if (thread.phase === "intake" && interp.riskFlag) {
      // Stay in resourcing: still force grounding + incomplete
      patch.phase = "grounding";
      patch.incomplete = true;
      return patch;
    }
    if (interp.needsGrounding || interp.distress === "overwhelm") {
      patch.phase = "grounding";
      patch.incomplete = true;
      return patch;
    }
  }

  if (interp.intakeComplete) {
    patch.intakeComplete = true;
  }

  if (interp.suggestedPhase) {
    // Intake may only advance to grounding when complete + target exists
    if (thread.phase === "intake") {
      const hasTarget = Boolean(interp.target || thread.target);
      if (
        interp.intakeComplete &&
        hasTarget &&
        !interp.riskFlag &&
        (interp.suggestedPhase === "grounding" ||
          interp.suggestedPhase === "assessment")
      ) {
        patch.phase = "grounding";
        patch.intakeComplete = true;
      }
      // else stay in intake
    } else {
      patch.phase = interp.suggestedPhase;
    }
  } else {
    // Heuristic phase advances when interpreter left suggestedPhase null
    if (thread.phase === "intake") {
      const hasTarget = Boolean(interp.target || thread.target);
      if (interp.intakeComplete && hasTarget && !interp.riskFlag) {
        patch.phase = "grounding";
        patch.intakeComplete = true;
      }
    } else if (
      thread.phase === "grounding" &&
      (interp.target || interp.negativeCognition)
    ) {
      patch.phase = "assessment";
    } else if (
      thread.phase === "assessment" &&
      interp.suds != null &&
      interp.suds >= 0
    ) {
      patch.phase = "desensitization";
    } else if (
      thread.phase === "desensitization" &&
      interp.suds != null &&
      interp.suds <= 1
    ) {
      patch.phase = "installation";
    } else if (
      thread.phase === "installation" &&
      interp.voc != null &&
      interp.voc >= 7
    ) {
      patch.phase = "body_scan";
    }
  }

  return patch;
}

/** Build a client_profiles upsert patch from an interpretation. */
export function clientProfilePatchFromInterpretation(
  interp: SessionInterpretation,
  hadCompletedIntake: boolean
): {
  presentingProblem?: string;
  historyNotes?: string;
  triggers?: string;
  resources?: string;
  goals?: string;
  riskNotes?: string;
  redFlag?: boolean;
  intakeCompletedAt?: string;
} {
  const patch: ReturnType<typeof clientProfilePatchFromInterpretation> = {};
  if (interp.presentingProblem) patch.presentingProblem = interp.presentingProblem;
  if (interp.historyNotes) patch.historyNotes = interp.historyNotes;
  if (interp.triggers) patch.triggers = interp.triggers;
  if (interp.resources) patch.resources = interp.resources;
  if (interp.goals) patch.goals = interp.goals;
  if (interp.riskNotes) patch.riskNotes = interp.riskNotes;
  if (interp.riskFlag) patch.redFlag = true;
  if (interp.intakeComplete && !hadCompletedIntake) {
    patch.intakeCompletedAt = new Date().toISOString();
  }
  return patch;
}
