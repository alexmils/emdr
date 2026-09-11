import type { ReactNode } from "react";
import { FrontendShellClient } from "@/app/components/frontend/FrontendShellClient";
import { MarketingExtras } from "@/app/components/frontend/MarketingExtras";

export async function FrontendShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  /** Full-width main (home landing). */
  wide?: boolean;
  /** @deprecated chrome uses the brand lockup; kept for call-site compatibility */
  siteName?: string;
}) {
  return (
    <FrontendShellClient wide={wide} marketingExtras={<MarketingExtras />}>
      {children}
    </FrontendShellClient>
  );
}

export { FrontendFooter } from "@/app/components/frontend/FrontendFooter";
