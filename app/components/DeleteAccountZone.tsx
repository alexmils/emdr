"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/Toast";

type Props = {
  email: string | null | undefined;
};

export function DeleteAccountZone({ email }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    Boolean(email) &&
    confirmEmail.trim().toLowerCase() === (email ?? "").trim().toLowerCase() &&
    !busy;

  const onDelete = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Could not delete account");
      }
      toast("Account deleted");
      router.replace("/");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not delete account";
      setError(msg);
      toast(msg, "error");
      setBusy(false);
    }
  };

  return (
    <section
      className="settings-danger-zone"
      aria-labelledby="settings-danger-heading"
    >
      <h3 id="settings-danger-heading" className="settings-group-title">
        Danger zone
      </h3>
      <p className="settings-help mt-1">
        Permanently delete your account, sessions, intake notes, and memory
        sets. An active subscription is canceled when billing is configured.
        This cannot be undone.
      </p>

      {!open ? (
        <button
          type="button"
          className="btn-danger mt-3"
          onClick={() => {
            setOpen(true);
            setConfirmEmail("");
            setError(null);
          }}
        >
          Delete account
        </button>
      ) : (
        <div className="settings-danger-confirm mt-3">
          <p className="settings-body-text">
            Type <strong>{email}</strong> to confirm.
          </p>
          <label className="mt-2 block">
            <span className="sr-only">Confirm email</span>
            <input
              className="field"
              type="email"
              autoComplete="off"
              spellCheck={false}
              placeholder="Your account email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              disabled={busy}
            />
          </label>
          {error && (
            <p className="mt-2 settings-body-text text-[var(--destructive)]">
              {error}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-danger"
              disabled={!canSubmit}
              onClick={() => void onDelete()}
            >
              {busy ? "Deleting…" : "Delete forever"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                setConfirmEmail("");
                setError(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
