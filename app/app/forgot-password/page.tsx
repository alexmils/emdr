"use client";

import { useRef, useState } from "react";
import {
  AuthShell,
  AuthField,
  AuthError,
  AuthSuccess,
  AuthLink,
} from "@/app/components/AuthShell";
import {
  TurnstileField,
  type TurnstileFieldHandle,
} from "@/app/components/TurnstileField";
import { TURNSTILE_TOKEN_FIELD } from "@/lib/turnstile-shared";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileFieldHandle>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!turnstileToken) {
      setError("Complete the verification check, then try again.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          [TURNSTILE_TOKEN_FIELD]: turnstileToken,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Request failed");
        turnstileRef.current?.reset();
        return;
      }

      setSuccess(data.message);
    } catch {
      setError("Network error. Try again.");
      turnstileRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Forgot password?"
      subtitle="Enter your email and we'll send a reset link."
      footer={
        <p>
          Remember your password?{" "}
          <AuthLink href="/app/login">Sign in</AuthLink>
        </p>
      }
    >
      <form onSubmit={submit}>
        {error && <AuthError message={error} />}
        {success && <AuthSuccess message={success} />}
        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          placeholder="you@example.com"
        />
        {!success ? (
          <TurnstileField
            ref={turnstileRef}
            action="forgot-password"
            onToken={setTurnstileToken}
          />
        ) : null}
        <button
          type="submit"
          disabled={loading || Boolean(success) || !turnstileToken}
          className="btn-primary mt-2 w-full disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
