"use client";

export function Avatar({
  src,
  alt,
  fallback,
  className = "",
}: {
  src?: string | null;
  alt: string;
  /** Letter or short text when no image */
  fallback: string;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={`avatar-img ${className}`}
        draggable={false}
      />
    );
  }
  return (
    <span className={`avatar-fallback ${className}`} aria-hidden>
      {fallback.slice(0, 1).toUpperCase()}
    </span>
  );
}
