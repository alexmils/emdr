import type { HelpMessage, HelpThread } from "@/lib/help-db";

/** Segments for help chat bubbles (plain text + clickable links). */
export type HelpTextSegment =
  | { type: "text"; value: string }
  | { type: "link"; href: string; label: string };

const MD_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/(?:[^\s)]*))\)/g;
const BARE_URL_RE = /https?:\/\/[^\s<>\]"'`]+/g;

function trimUrlTrail(url: string): { href: string; trail: string } {
  const m = url.match(/^(.*?)([),.!?;:]+)$/);
  if (!m) return { href: url, trail: "" };
  return { href: m[1], trail: m[2] };
}

/** Split assistant/user text into plain runs and links (markdown + bare URLs). */
export function parseHelpBubbleSegments(text: string): HelpTextSegment[] {
  const out: HelpTextSegment[] = [];
  let cursor = 0;
  const md = new RegExp(MD_LINK_RE.source, "g");
  let match: RegExpExecArray | null;
  const mdSpans: { start: number; end: number; label: string; href: string }[] =
    [];
  while ((match = md.exec(text)) !== null) {
    mdSpans.push({
      start: match.index,
      end: match.index + match[0].length,
      label: match[1],
      href: match[2],
    });
  }

  const pushTextWithBareUrls = (chunk: string) => {
    if (!chunk) return;
    const bare = new RegExp(BARE_URL_RE.source, "g");
    let last = 0;
    let bm: RegExpExecArray | null;
    while ((bm = bare.exec(chunk)) !== null) {
      if (bm.index > last) {
        out.push({ type: "text", value: chunk.slice(last, bm.index) });
      }
      const { href, trail } = trimUrlTrail(bm[0]);
      out.push({ type: "link", href, label: href });
      if (trail) out.push({ type: "text", value: trail });
      last = bm.index + bm[0].length;
    }
    if (last < chunk.length) {
      out.push({ type: "text", value: chunk.slice(last) });
    }
  };

  for (const span of mdSpans) {
    if (span.start > cursor) {
      pushTextWithBareUrls(text.slice(cursor, span.start));
    }
    out.push({ type: "link", href: span.href, label: span.label });
    cursor = span.end;
  }
  if (cursor < text.length) {
    pushTextWithBareUrls(text.slice(cursor));
  }
  if (!out.length && text) {
    out.push({ type: "text", value: text });
  }
  return out;
}

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
