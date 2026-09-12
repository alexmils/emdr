import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import type { Metadata } from "next";
import {
  PUBLIC_ISR_PATHS,
  PUBLIC_PAGE_REVALIDATE_SECONDS,
  SEO_CACHE_TAG,
} from "@/lib/public-page-cache";
import type { SeoPageId } from "@/lib/seo-config";
import { DEFAULT_PLATFORM_SEO } from "@/lib/seo-config";
import {
  getResolvedSiteSeoPages,
  metadataFromResolved,
  resolveSiteSeoPages,
  SEO_COPY_REVISION,
} from "@/lib/site-seo";

/** Tagged fetch so Admin → SEO save can `revalidateTag("seo")`. */
export const getCachedResolvedSiteSeoPages = unstable_cache(
  async () => getResolvedSiteSeoPages(),
  ["resolved-site-seo", SEO_COPY_REVISION],
  { tags: [SEO_CACHE_TAG], revalidate: PUBLIC_PAGE_REVALIDATE_SECONDS }
);

export async function buildCachedPageMetadata(
  pageId: SeoPageId
): Promise<Metadata> {
  try {
    let resolved = await getCachedResolvedSiteSeoPages();
    if (!resolved.pages.some((page) => page.id === pageId)) {
      // Stale cache from before a new public page id was added.
      resolved = await getResolvedSiteSeoPages();
    }
    return metadataFromResolved(pageId, resolved.pages, resolved.seo);
  } catch {
    return metadataFromResolved(
      pageId,
      resolveSiteSeoPages(DEFAULT_PLATFORM_SEO)
    );
  }
}

/** Instant HTML + data refresh after admin SEO overrides (do not wait the ISR window). */
export function revalidatePublicSeo(): void {
  revalidateTag(SEO_CACHE_TAG);
  for (const path of PUBLIC_ISR_PATHS) {
    revalidatePath(path);
  }
}
