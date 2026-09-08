"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { BrandLockup } from "@/app/components/BrandLockup";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Hide “Back to home” — useful for in-app flows like onboarding. */
  hideHomeLink?: boolean;
};

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  hideHomeLink = false,
}: AuthShellProps) {
  return (
    <div className="auth-shell">
      <div className="auth-shell-inner">
        <header className="auth-shell-header">
          <p className="auth-shell-brand">
            <BrandLockup href="/" showHelp />
          </p>
          <h1 className="auth-shell-title">{title}</h1>
          {subtitle ? <p className="auth-shell-subtitle">{subtitle}</p> : null}
          {!hideHomeLink ? (
            <p className="auth-shell-home">
              <Link href="/">← Back to home</Link>
            </p>
          ) : null}
        </header>

        <div className="auth-shell-card">{children}</div>

        {footer ? <div className="auth-shell-footer">{footer}</div> : null}
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
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && visible ? "text" : type;

  return (
    <div className="mb-4">
      <label htmlFor={id} className="text-footnote mb-1.5 block font-medium">
        {label}
      </label>
      <div className={isPassword ? "auth-field-password" : undefined}>
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          className={`field${isPassword ? " auth-field-password-input" : ""}`}
        />
        {isPassword ? (
          <button
            type="button"
            className="auth-field-eye"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
          >
            {visible ? (
              <EyeOff size={18} strokeWidth={2} aria-hidden />
            ) : (
              <Eye size={18} strokeWidth={2} aria-hidden />
            )}
          </button>
        ) : null}
      </div>
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
