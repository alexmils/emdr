import { createHash, randomUUID } from "crypto";

export const HELP_VISITOR_COOKIE = "nura_help_visitor";
export const HELP_VISITOR_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days
export const GUEST_HELP_MSG_LIMIT_PER_HOUR = 20;
export const GUEST_TRANSCRIPT_IDLE_MS = 60 * 60 * 1000; // 1 hour

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidVisitorKey(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function hashIp(ip: string | null | undefined): string | null {
  const trimmed = ip?.trim();
  if (!trimmed) return null;
  const pepper = process.env.AUTH_SECRET?.trim() || "nura-help-visitor";
  return createHash("sha256").update(`${pepper}:${trimmed}`).digest("hex");
}

export function isGuestEmailValid(email: unknown): email is string {
  if (typeof email !== "string") return false;
  const t = email.trim();
  if (t.length < 3 || t.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

export function normalizeGuestName(name: unknown): string | null {
  if (typeof name !== "string") return null;
  const t = name.trim().replace(/\s+/g, " ");
  if (t.length < 1 || t.length > 120) return null;
  return t;
}

/** Pure gate used by cron + tests. */
export function isGuestTranscriptDue(input: {
  guestEmail: string | null | undefined;
  transcriptSentAt: string | null | undefined;
  lastActivityAt: string | null | undefined;
  hasUserMessage: boolean;
  nowMs?: number;
  idleMs?: number;
}): boolean {
  if (!input.guestEmail?.trim()) return false;
  if (input.transcriptSentAt) return false;
  if (!input.hasUserMessage) return false;
  if (!input.lastActivityAt) return false;
  const last = Date.parse(input.lastActivityAt);
  if (!Number.isFinite(last)) return false;
  const now = input.nowMs ?? Date.now();
  const idle = input.idleMs ?? GUEST_TRANSCRIPT_IDLE_MS;
  return now - last >= idle;
}

export function mintVisitorKey(): string {
  return randomUUID();
}
