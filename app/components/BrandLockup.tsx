import Image from "next/image";
import Link from "next/link";
import { BRAND_LEGAL } from "@/lib/brand";

/** Logo art — color on light, white on dark, black when mono is clearer. */
export type BrandLogoTone = "color" | "black" | "white";

/** @deprecated Prefer BrandLogoTone; paper→color, inverse→white */
type LegacyTone = "paper" | "inverse";

type BrandLockupProps = {
  href?: string | null;
  /**
   * color — light marketing / auth / onboarding
   * white — dark sidebar, admin, dark footer, hero overlay
   * black — light mono (cards, dense UI)
   * paper / inverse — legacy aliases (color / white)
   */
  tone?: BrandLogoTone | LegacyTone;
  className?: string;
};

const LOGO_SRC: Record<BrandLogoTone, string> = {
  color: "/brand/nura-wave-logo.png",
  black: "/brand/nura-wave-logo-black.png",
  white: "/brand/nura-wave-logo-white.png",
};

const MARK_SRC: Record<BrandLogoTone, string> = {
  color: "/brand/mark.png",
  black: "/brand/mark-black.png",
  white: "/brand/mark-white.png",
};

function resolveTone(tone: BrandLogoTone | LegacyTone): BrandLogoTone {
  if (tone === "paper") return "color";
  if (tone === "inverse") return "white";
  return tone;
}

export function BrandMark({
  className = "",
  tone = "color",
}: {
  className?: string;
  tone?: BrandLogoTone | LegacyTone;
}) {
  const t = resolveTone(tone);
  return (
    <Image
      src={MARK_SRC[t]}
      alt=""
      width={100}
      height={38}
      className={`brand-mark brand-mark-${t} ${className}`.trim()}
      aria-hidden
      unoptimized
    />
  );
}

/** Wave wordmark only — no “help” suffix (legal name stays NuraHelp in aria/copy). */
export function BrandLockup({
  href = null,
  tone = "color",
  className = "",
}: BrandLockupProps) {
  const t = resolveTone(tone);
  const inner = (
    <span className={`brand-lockup brand-lockup-${t} ${className}`.trim()}>
      <Image
        src={LOGO_SRC[t]}
        alt=""
        width={200}
        height={45}
        className={`brand-logo brand-logo-${t}`}
        priority={t === "color" || t === "white"}
        unoptimized
      />
    </span>
  );

  if (!href) {
    return inner;
  }

  return (
    <Link
      href={href}
      className="brand-lockup-link"
      aria-label={href === "/admin" ? "Nura admin" : `${BRAND_LEGAL} home`}
    >
      {inner}
    </Link>
  );
}
