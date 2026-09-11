import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { BRAND_LEGAL } from "@/lib/brand";
import { getPlatformSettings } from "@/lib/platform-settings";
import { buildPageMetadata } from "@/lib/site-seo";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("privacy");
}

export default async function PrivacyPage() {
  const settings = await getPlatformSettings();

  return (
    <FrontendShell>
      <article className="frontend-legal">
        <h1>Privacy</h1>
        <p>
          This is a placeholder privacy policy. {BRAND_LEGAL} stores account and
          session data needed to run EMDR Support sessions. Replace this page
          with your full policy before production launch.
        </p>
        <p>
          Contact: {settings.supportEmail || "your support email"} for data
          requests.
        </p>
        <p>
          On the public marketing site, analytics and marketing cookies load
          only after you choose them. Sign-in and the logged-in app do not load
          Clarity, Google Analytics, or Tag Manager.
        </p>
      </article>
    </FrontendShell>
  );
}
