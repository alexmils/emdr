/** Max chars injected into the guided-chat system prompt from enabled sets. */
export const MEMORY_CONTEXT_MAX_CHARS = 3000;

/** Join memory context lines and cap length without cutting mid-line when possible. */
export function formatMemoryContext(
  lines: string[],
  maxChars = MEMORY_CONTEXT_MAX_CHARS
): string {
  if (!lines.length || maxChars <= 0) return "";
  const out: string[] = [];
  let used = 0;
  for (const line of lines) {
    const next = out.length ? used + 1 + line.length : line.length;
    if (next <= maxChars) {
      out.push(line);
      used = next;
      continue;
    }
    const remaining = maxChars - used - (out.length ? 1 : 0);
    if (remaining >= 8) {
      out.push(`${line.slice(0, remaining - 1)}…`);
    }
    break;
  }
  return out.join("\n");
}
