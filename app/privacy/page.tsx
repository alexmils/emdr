import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { BRAND_LEGAL } from "@/lib/brand";
import { getPlatformSettings } from "@/lib/platform-settings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: `Privacy policy for ${BRAND_LEGAL}`,
};

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
      </article>
    </FrontendShell>
  );
}
