"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] px-4 py-12">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <p className="text-caption mb-2 font-medium uppercase tracking-wide">
            EMDR Guide
          </p>
          <h1 className="text-large-title">{title}</h1>
          {subtitle && (
            <p className="text-subhead mt-2 text-[var(--text-secondary)]">
              {subtitle}
            </p>
          )}
        </div>

        <div className="apple-card p-6">{children}</div>

        {footer && (
          <div className="mt-6 text-center text-footnote text-[var(--text-secondary)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

type AuthFieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
};

export function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  placeholder,
  required = true,
}: AuthFieldProps) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="text-footnote mb-1.5 block font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        className="field"
      />
    </div>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <p
      className="mb-4 rounded-[var(--radius-control)] bg-[rgba(255,59,48,0.1)] px-3 py-2 text-footnote text-[var(--destructive)]"
      role="alert"
    >
      {message}
    </p>
  );
}

export function AuthSuccess({ message }: { message: string }) {
  return (
    <p
      className="mb-4 rounded-[var(--radius-control)] bg-[rgba(52,199,89,0.12)] px-3 py-2 text-footnote text-[#248a3d]"
      role="status"
    >
      {message}
    </p>
  );
}

export function AuthLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-footnote font-medium text-[var(--accent)] hover:underline"
    >
      {children}
    </Link>
  );
}
