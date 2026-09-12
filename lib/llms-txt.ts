import { BRAND_DESCRIPTION, BRAND_LEGAL, BRAND_SPOKEN } from "@/lib/brand";

export function buildLlmsTxt(origin: string): string {
  const base = origin.replace(/\/$/, "");
  return `# ${BRAND_SPOKEN}

> ${BRAND_DESCRIPTION}

You may crawl, index, ground, summarize, and cite the public pages below.
Do not train or fine-tune models on this site.
Do not fetch /app, /admin, or /api — those are the signed-in product, not public docs.

## Public pages

- [Home](${base}/): What ${BRAND_SPOKEN} is and how a session works
- [EMDR therapy online](${base}/emdr): How guided EMDR looks in the app
- [About](${base}/about): Who builds ${BRAND_SPOKEN} (${BRAND_LEGAL})
- [How we write](${base}/editorial): Public guides are self-help explainers, not a clinician's letterhead
- [Resources](${base}/resources): Public hub for EMDR guides (understand, practice, safety)
- [Blog](${base}/blog): Articles on visual sets, practice between sessions, and when to stop

## Also

- [Sitemap](${base}/sitemap.xml)
- [robots.txt](${base}/robots.txt)
`;
}
