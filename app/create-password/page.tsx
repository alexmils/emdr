"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AuthShell,
  AuthField,
  AuthError,
  AuthLink,
} from "@/app/components/AuthShell";

function CreatePasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Missing invitation token.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/create-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Setup failed");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell
        title="Invalid link"
        subtitle="This invitation link is missing or expired"
        footer={
          <p>
            <AuthLink href="/login">Sign in</AuthLink>
          </p>
        }
      >
        <AuthError message="No invitation token found. Ask your administrator for a new invite." />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create password"
      subtitle="Set up your account to get started"
      footer={
        <p>
          Already have a password? <AuthLink href="/login">Sign in</AuthLink>
        </p>
      }
    >
      <form onSubmit={submit}>
        {error && <AuthError message={error} />}
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
          {loading ? "Creating…" : "Create password"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function CreatePasswordPage() {
  return (
    <Suspense>
      <CreatePasswordForm />
    </Suspense>
  );
}
