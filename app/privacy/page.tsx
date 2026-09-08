import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { getPlatformSettings } from "@/lib/platform-settings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — NuraHelp AI",
  description: "Privacy policy for NuraHelp AI",
};

export default async function PrivacyPage() {
  const settings = await getPlatformSettings();
  const siteName = settings.siteName || "NuraHelp AI";

  return (
    <FrontendShell siteName={siteName}>
      <article className="frontend-legal">
        <h1>Privacy</h1>
        <p>
          This is a placeholder privacy policy. {siteName} stores account and
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
