/**
 * When to email admins about a new help chat user message.
 * Email at most once per thread, and for guests only from a new IP
 * (IP that has never received an admin email notification).
 */
export function shouldSendHelpAdminEmail(input: {
  /** User messages already on the thread before this one. */
  priorUserMessageCount: number;
  threadEmailAlreadySent: boolean;
  /** Guest IP hash when known; null for signed-in users. */
  ipHash: string | null;
  /** True if any help thread for this IP already emailed admins. */
  ipEmailAlreadySent: boolean;
}): boolean {
  if (input.priorUserMessageCount > 0) return false;
  if (input.threadEmailAlreadySent) return false;
  if (input.ipHash && input.ipEmailAlreadySent) return false;
  return true;
}
