import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  PUBLIC_ISR_PATHS,
  PUBLIC_PAGE_REVALIDATE_SECONDS,
  SEO_CACHE_TAG,
} from "../lib/public-page-cache.ts";
import { SITE_SEO_DEFAULTS } from "../lib/site-seo.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const PUBLIC_PAGE_FILES = [
  "app/page.tsx",
  "app/about/page.tsx",
  "app/about/clinical-team/page.tsx",
  "app/editorial/page.tsx",
  "app/emdr/page.tsx",
  "app/resources/page.tsx",
  "app/blog/page.tsx",
  "app/privacy/page.tsx",
  "app/terms/page.tsx",
] as const;

describe("public page ISR", () => {
  it("keeps the seo tag and hourly window", () => {
    assert.equal(SEO_CACHE_TAG, "seo");
    assert.equal(PUBLIC_PAGE_REVALIDATE_SECONDS, 3600);
  });

  it("covers the same paths as site SEO defaults", () => {
    assert.deepEqual(
      [...PUBLIC_ISR_PATHS],
      SITE_SEO_DEFAULTS.map((page) => page.path)
    );
  });

  it("does not force-dynamic the public marketing pages", () => {
    for (const file of PUBLIC_PAGE_FILES) {
      const src = readFileSync(join(root, file), "utf8");
      assert.equal(
        src.includes('export const dynamic = "force-dynamic"'),
        false,
        file
      );
      assert.match(
        src,
        /export const revalidate = 3600(?:\s*;|\s*\/\/)/
      );
    }
  });
});
