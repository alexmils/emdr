"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AuthShell,
  AuthField,
  AuthError,
  AuthLink,
} from "@/app/components/AuthShell";
import { APP_BASE, LOGIN_PATH, safeAppNext } from "@/lib/app-base";

function CreateAccountForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: name.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create account");
        return;
      }

      // New consumers go through onboarding; honor deep links only under /app.
      const dest = next
        ? safeAppNext(next, `${APP_BASE}/onboarding`)
        : `${APP_BASE}/onboarding`;
      router.push(dest);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create account"
      subtitle="Start your EMDR Support trial"
      footer={
        <p>
          Already have an account?{" "}
          <AuthLink href={LOGIN_PATH}>Sign in</AuthLink>
        </p>
      }
    >
      <form onSubmit={submit}>
        {error && <AuthError message={error} />}
        <AuthField
          id="name"
          label="Name"
          type="text"
          value={name}
          onChange={setName}
          autoComplete="name"
          placeholder="Optional"
          required={false}
        />
        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          placeholder="you@example.com"
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />
        <AuthField
          id="confirm"
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />
        <p className="text-caption mb-4">
          Use at least 8 characters with a letter and a number.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-2 w-full disabled:opacity-60"
        >
          {loading ? "Creating…" : "Create account"}
        </button>
        <p className="text-caption mt-4 text-center">
          By creating an account you agree to our{" "}
          <AuthLink href="/terms">Terms</AuthLink> and{" "}
          <AuthLink href="/privacy">Privacy</AuthLink>.
        </p>
      </form>
    </AuthShell>
  );
}

export default function CreateAccountPage() {
  return (
    <Suspense>
      <CreateAccountForm />
    </Suspense>
  );
}
