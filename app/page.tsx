import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { LOGIN_PATH } from "@/lib/app-base";
import { getPlatformSettings } from "@/lib/platform-settings";
import Link from "next/link";

export default async function HomePage() {
  const settings = await getPlatformSettings();
  const siteName = settings.siteName || "NuraHelp AI";

  return (
    <FrontendShell siteName={siteName}>
      <section className="frontend-hero">
        <p className="frontend-eyebrow">{siteName}</p>
        <h1 className="frontend-hero-title">
          EMDR Support with bilateral stimulation
        </h1>
        <p className="frontend-hero-sub">
          A calm workspace for EMDR Support — visual BLS, voice, and an
          on-protocol session guide. Invite-only for now.
        </p>
        <div className="frontend-hero-actions">
          <Link href={LOGIN_PATH} className="frontend-btn-primary">
            Get started
          </Link>
          <Link href="/privacy" className="frontend-btn-ghost">
            Privacy
          </Link>
        </div>
      </section>
    </FrontendShell>
  );
}
