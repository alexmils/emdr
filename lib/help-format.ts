import type { HelpMessage, HelpThread } from "@/lib/help-db";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Strip CR/LF so email subjects cannot be injected. */
export function sanitizeEmailHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, 200);
}

export function formatHelpTranscript(messages: HelpMessage[]): {
  text: string;
  html: string;
} {
  const lines = messages.map((m) => {
    const who =
      m.role === "user" ? "You" : m.role === "admin" ? "Support" : "Nura";
    return `${who}: ${m.content}`;
  });
  const text = lines.join("\n\n");
  const html = messages
    .map((m) => {
      const who =
        m.role === "user" ? "You" : m.role === "admin" ? "Support" : "Nura";
      const safe = escapeHtml(m.content).replace(/\n/g, "<br>");
      return `<p><strong>${who}:</strong><br>${safe}</p>`;
    })
    .join("");
  return { text, html };
}

/** Inbox label for admin UI. */
export function helpThreadDisplayLabel(thread: HelpThread): string {
  if (thread.userId) {
    return thread.userName?.trim() || thread.userEmail?.trim() || "User";
  }
  return (
    thread.guestName?.trim() ||
    thread.guestEmail?.trim() ||
    "Guest visitor"
  );
}

/** Client-safe thread payload (no visitorKey / ip hash). */
export function toPublicHelpThread(thread: HelpThread): Omit<
  HelpThread,
  "visitorKey"
> & { visitorKey?: never } {
  const { visitorKey: _omit, ...rest } = thread;
  return rest;
}
