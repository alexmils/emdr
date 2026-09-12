"use client";

import { BRAND_DOMAIN } from "@/lib/brand";
import { parseHelpBubbleSegments } from "@/lib/help-format";

type Props = {
  text: string;
};

function isSameSiteHref(href: string): boolean {
  if (href.startsWith("/") || href.startsWith("#")) return true;
  try {
    const host = new URL(href).hostname.replace(/^www\./, "");
    return host === BRAND_DOMAIN || host.endsWith(`.${BRAND_DOMAIN}`);
  } catch {
    return false;
  }
}

/** Renders help chat text with markdown and bare URL links clickable. */
export default function HelpBubbleText({ text }: Props) {
  const segments = parseHelpBubbleSegments(text);
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          return <span key={i}>{seg.value}</span>;
        }
        const sameSite = isSameSiteHref(seg.href);
        return (
          <a
            key={i}
            className="help-bubble-link"
            href={seg.href}
            target={sameSite ? undefined : "_blank"}
            rel={sameSite ? undefined : "noopener noreferrer"}
          >
            {seg.label}
          </a>
        );
      })}
    </>
  );
}
