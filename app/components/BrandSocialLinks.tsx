import { Facebook, Instagram } from "lucide-react";
import { BRAND_SOCIAL } from "@/lib/brand";

const LINKS = [
  {
    href: BRAND_SOCIAL.instagram,
    label: "Follow Nura on Instagram",
    icon: Instagram,
  },
  {
    href: BRAND_SOCIAL.facebook,
    label: "Follow Nura on Facebook",
    icon: Facebook,
  },
] as const;

type BrandSocialLinksProps = {
  className?: string;
  linkClassName?: string;
  iconSize?: number;
  /** When false, parent already labels the group (e.g. footer). Default true. */
  labelled?: boolean;
};

/** Instagram + Facebook — shared brand social row (footer, auth). */
export function BrandSocialLinks({
  className = "brand-social",
  linkClassName = "brand-social-link",
  iconSize = 18,
  labelled = true,
}: BrandSocialLinksProps) {
  return (
    <div className={className} {...(labelled ? { "aria-label": "Follow Nura" } : {})}>
      {LINKS.map(({ href, label, icon: Icon }) => (
        <a
          key={label}
          href={href}
          className={linkClassName}
          aria-label={label}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon size={iconSize} strokeWidth={1.6} aria-hidden />
        </a>
      ))}
    </div>
  );
}
