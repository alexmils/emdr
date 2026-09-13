/**
 * Origin robots.txt — search + AI answers on public pages, no training,
 * session app closed. Cloudflare managed robots.txt must stay **off** so this
 * file is not prepended with named-bot `Disallow: /` groups (those override
 * any later Allow for the same user-agent).
 */

export const ROBOTS_CONTENT_SIGNAL =
  "search=yes,ai-input=yes,ai-train=no";

/** Retrieve-and-cite crawlers (not model-training). */
export const AI_GROUNDING_USER_AGENTS = [
  "OAI-SearchBot",
  "PerplexityBot",
  "ChatGPT-User",
] as const;

/** Training / extended-use crawlers — stay off the whole site. */
export const AI_TRAINING_USER_AGENTS = [
  "GPTBot",
  "ClaudeBot",
  "CCBot",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "Bytespider",
  "meta-externalagent",
] as const;

/** Public marketing paths grounding bots may fetch (`$` = exact home). */
export const AI_GROUNDING_ALLOW = [
  "/$",
  "/emdr",
  "/about",
  "/editorial",
  "/learn",
  "/knowledge",
  "/blog",
  "/changelog",
  "/safety",
  "/limits",
  "/llms.txt",
  "/sitemap.xml",
] as const;

export const ROBOTS_DISALLOW = ["/app", "/admin", "/api", "/health"] as const;

export function buildRobotsTxt(origin: string): string {
  const lines: string[] = [
    "# Nura: crawl public pages for search and AI answers. Do not train.",
    "# /app, /admin, /api, and /health are not marketing pages — stay out.",
    "",
    "User-agent: *",
    `Content-Signal: ${ROBOTS_CONTENT_SIGNAL}`,
    "Allow: /",
    ...ROBOTS_DISALLOW.map((path) => `Disallow: ${path}`),
    "",
  ];

  for (const agent of AI_GROUNDING_USER_AGENTS) {
    lines.push(`User-agent: ${agent}`);
    lines.push(`Content-Signal: ${ROBOTS_CONTENT_SIGNAL}`);
    for (const path of AI_GROUNDING_ALLOW) {
      lines.push(`Allow: ${path}`);
    }
    lines.push("Disallow: /");
    lines.push("");
  }

  for (const agent of AI_TRAINING_USER_AGENTS) {
    lines.push(`User-agent: ${agent}`);
    lines.push("Disallow: /");
    lines.push("");
  }

  lines.push(`Sitemap: ${origin.replace(/\/$/, "")}/sitemap.xml`);
  lines.push("");
  return lines.join("\n");
}
