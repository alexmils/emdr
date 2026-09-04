"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";
import {
  AuthShell,
  AuthField,
  AuthError,
  AuthLink,
} from "@/app/components/AuthShell";

function redirectAfterLogin(
  next: string,
  role?: string
): string {
  if (next !== "/") {
    return next.startsWith("/") ? next : "/";
  }
  if (role === "platform_admin" || role === "support") return "/admin";
  return "/";
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Sign in failed");
        return;
      }

      router.push(redirectAfterLogin(next, data.user?.role));
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const signInWithPasskey = async () => {
    setError("");
    setPasskeyLoading(true);
    try {
      const optRes = await fetch("/api/auth/passkey/login/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim() || undefined,
        }),
      });
      const optData = await optRes.json();
      if (!optRes.ok) {
        setError(optData.error ?? "Could not start passkey login");
        return;
      }

      const assertion = await startAuthentication({
        optionsJSON: optData.options,
      });

      const verifyRes = await fetch("/api/auth/passkey/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: assertion }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setError(verifyData.error ?? "Passkey sign-in failed");
        return;
      }

      router.push(redirectAfterLogin(next, verifyData.user?.role));
      router.refresh();
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "NotAllowedError") {
        setError("Passkey sign-in was cancelled");
      } else {
        setError(
          err instanceof Error ? err.message : "Passkey sign-in failed"
        );
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  const busy = loading || passkeyLoading;

  return (
    <AuthShell
      title="Sign in"
      subtitle="Access your EMDR sessions"
      footer={
        <p>
          Forgot your password?{" "}
          <AuthLink href="/forgot-password">Reset it</AuthLink>
        </p>
      }
    >
      <form onSubmit={submit}>
        {error && <AuthError message={error} />}
        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="username webauthn"
          placeholder="you@example.com"
          required={false}
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
        <button
          type="submit"
          disabled={busy}
          className="btn-primary mt-2 w-full disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--separator-opaque)]" />
        <span className="text-caption">or</span>
        <div className="h-px flex-1 bg-[var(--separator-opaque)]" />
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => void signInWithPasskey()}
        className="btn-secondary w-full disabled:opacity-60"
      >
        {passkeyLoading ? "Waiting for passkey…" : "Sign in with passkey"}
      </button>
      <p className="text-caption mt-3 text-center">
        Use Face ID, Touch ID, Windows Hello, or a security key. Add a passkey
        in Settings after signing in with your password.
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
