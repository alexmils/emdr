import type { Metadata } from "next";
import { AppAccessGate } from "@/app/components/AppAccessGate";
import { HelpChatWidget } from "@/app/components/HelpChatWidget";

/** Console under /app — do not index; do not reuse frontend OG url. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  openGraph: {
    url: "/app",
    title: "NuraHelp AI",
    description: "EMDR Support sessions",
  },
};

export default function AppConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppAccessGate>
      {children}
      <HelpChatWidget showFab />
    </AppAccessGate>
  );
}
