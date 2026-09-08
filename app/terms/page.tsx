import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { getPlatformSettings } from "@/lib/platform-settings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms — NuraHelp AI",
  description: "Terms of service for NuraHelp AI",
};

export default async function TermsPage() {
  const settings = await getPlatformSettings();
  const siteName = settings.siteName || "NuraHelp AI";

  return (
    <FrontendShell siteName={siteName}>
      <article className="frontend-legal">
        <h1>Terms of service</h1>
        <p>
          This is a placeholder terms page for {siteName}. The product is
          invite-only and intended as an EMDR Support tool — not a
          substitute for professional clinical care.
        </p>
        <p>Replace this stub with your full terms before production launch.</p>
      </article>
    </FrontendShell>
  );
}
