import Link from "next/link";

type BrandLockupProps = {
  href?: string | null;
  /** paper = marketing/auth; inverse = dark sidebar */
  tone?: "paper" | "inverse";
  showHelp?: boolean;
  className?: string;
};

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 24"
      className={`brand-mark ${className}`.trim()}
      aria-hidden
    >
      <circle cx="5" cy="12" r="4" fill="currentColor" />
      <circle cx="35" cy="12" r="4" fill="currentColor" />
      <path
        d="M10 12 Q 20 3 30 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BrandLockup({
  href = null,
  tone = "paper",
  showHelp = false,
  className = "",
}: BrandLockupProps) {
  const inner = (
    <span className={`brand-lockup brand-lockup-${tone} ${className}`.trim()}>
      <BrandMark />
      <span className="brand-lockup-text">
        <span className="brand-lockup-word">nura</span>
        {showHelp ? <span className="brand-lockup-help">help</span> : null}
      </span>
    </span>
  );

  if (!href) {
    return inner;
  }

  return (
    <Link
      href={href}
      className="brand-lockup-link"
      aria-label={href === "/admin" ? "Nura admin" : "NuraHelp home"}
    >
      {inner}
    </Link>
  );
}
