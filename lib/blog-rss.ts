import { BRAND_SPOKEN, BRAND_TAGLINE } from "@/lib/brand";
import { listClusterArticles } from "@/lib/content-cluster";

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** RSS 2.0 for /blog guides (newest first). */
export function buildBlogRssXml(origin: string): string {
  const base = origin.replace(/\/$/, "");
  const articles = listClusterArticles();
  const lastBuild =
    articles[0]?.publishedAt ?? new Date().toISOString();

  const items = articles
    .map((article) => {
      const link = `${base}/blog/${article.slug}`;
      return `    <item>
      <title>${xmlEscape(article.title)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
      <description>${xmlEscape(article.description)}</description>
      <category>${xmlEscape(article.topic)}</category>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(`${BRAND_SPOKEN} — EMDR guides`)}</title>
    <link>${xmlEscape(`${base}/blog`)}</link>
    <description>${xmlEscape(BRAND_TAGLINE)}</description>
    <language>en</language>
    <lastBuildDate>${new Date(lastBuild).toUTCString()}</lastBuildDate>
    <atom:link href="${xmlEscape(`${base}/blog/rss.xml`)}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}
