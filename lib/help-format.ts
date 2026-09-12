import type { HelpMessage, HelpThread } from "@/lib/help-db";

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
      const safe = m.content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<p><strong>${who}:</strong><br>${safe.replace(/\n/g, "<br>")}</p>`;
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
