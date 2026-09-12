import { ClusterArticleView } from "@/app/components/frontend/ClusterArticleView";
import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { BRAND_LEGAL, BRAND_SPOKEN } from "@/lib/brand";
import {
  getClusterArticle,
  listClusterArticles,
} from "@/lib/content-cluster";
import { getPublicAppUrl } from "@/lib/platform-settings";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/public-page-cache";
import {
  breadcrumbJsonLd,
  localeAlternates,
  stringifyJsonLd,
} from "@/lib/seo-jsonld";
import { siteOrigin } from "@/lib/site-seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;
export const dynamicParams = false;

export function generateStaticParams() {
  return listClusterArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getClusterArticle(slug);
  if (!article) return { title: "Guide not found" };
  return {
    title: article.title,
    description: article.description,
    alternates: localeAlternates(`/blog/${article.slug}`),
    openGraph: {
      title: `${article.title} — ${BRAND_SPOKEN}`,
      description: article.description,
      type: "article",
      locale: "en",
      publishedTime: article.publishedAt,
      modifiedTime: article.publishedAt,
    },
  };
}

function articleJsonLd(slug: string, origin: string) {
  const article = getClusterArticle(slug);
  if (!article) return null;
  const url = `${origin}/blog/${article.slug}`;
  const editorial = `${origin}/editorial`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: article.title,
        description: article.description,
        datePublished: article.publishedAt,
        dateModified: article.publishedAt,
        inLanguage: "en",
        url,
        mainEntityOfPage: url,
        author: {
          "@type": "Organization",
          name: BRAND_LEGAL,
          url: editorial,
        },
        publisher: {
          "@type": "Organization",
          name: BRAND_LEGAL,
          url: `${origin}/`,
        },
      },
      breadcrumbJsonLd(origin, [
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
        { name: article.title, path: `/blog/${article.slug}` },
      ]),
    ],
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getClusterArticle(slug);
  if (!article) notFound();

  let publicUrl: string | undefined;
  try {
    publicUrl = await getPublicAppUrl();
  } catch {
    publicUrl = undefined;
  }
  const jsonLd = articleJsonLd(slug, siteOrigin(publicUrl));

  return (
    <FrontendShell>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: stringifyJsonLd(jsonLd),
          }}
        />
      ) : null}
      <ClusterArticleView article={article} />
    </FrontendShell>
  );
}
