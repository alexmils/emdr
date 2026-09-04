"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminPageHeader } from "@/app/components/admin/AdminPageHeader";
import { formatDate, formatDateTime, formatMoney } from "@/lib/admin-format";
import type { AdminUserDetail } from "@/lib/admin-user-detail";
import { fetchJson } from "@/lib/fetch-json";

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [myRole, setMyRole] = useState("user");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const me = await fetchJson<{ user?: { role?: string } }>("/api/auth/me");
    setMyRole(me.user?.role ?? "user");
    const res = await fetchJson<{ user: AdminUserDetail }>(
      `/api/admin/users/${userId}`
    );
    setDetail(res.user);
  }, [userId]);

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch (err) {
        console.error(err);
        setError("Could not load user.");
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const canWrite = myRole === "platform_admin";

  const toggleStatus = async () => {
    if (!detail) return;
    const next = detail.status === "disabled" ? "active" : "disabled";
    const label = next === "disabled" ? "disable" : "enable";
    if (!window.confirm(`${label} ${detail.email}?`)) return;
    setBusy(true);
    setMsg("");
    try {
      await fetchJson(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      setMsg(`User ${next === "disabled" ? "disabled" : "enabled"}.`);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const resendInvite = async () => {
    setBusy(true);
    setMsg("");
    try {
      await fetchJson(`/api/admin/users/${userId}/resend-invite`, {
        method: "POST",
      });
      setMsg("Invitation resent.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Resend failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page flex min-h-screen items-center justify-center">
        <p className="text-[var(--text-secondary)]">Loading…</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="admin-page flex min-h-screen items-center justify-center p-6">
        <p className="text-[var(--destructive)]">{error || "Not found"}</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        title={detail.email}
        subtitle={detail.name ?? "User profile and usage"}
      />
      <main className="admin-main">
        <p className="admin-back-link">
          <Link href="/admin/users">← Back to users</Link>
        </p>

        <section className="admin-stat-grid">
          <article className="admin-stat-card">
            <p className="admin-stat-label">Threads</p>
            <p className="admin-stat-value">{detail.threadCount}</p>
          </article>
          <article className="admin-stat-card">
            <p className="admin-stat-label">Messages</p>
            <p className="admin-stat-value">{detail.messageCount}</p>
          </article>
          <article className="admin-stat-card">
            <p className="admin-stat-label">Plan</p>
            <p className="admin-stat-value">{detail.plan}</p>
            <p className="admin-stat-hint">{detail.subscriptionStatus}</p>
          </article>
          <article className="admin-stat-card">
            <p className="admin-stat-label">Billing</p>
            <p className="admin-stat-value">
              {formatMoney(detail.amountCents)}
            </p>
          </article>
        </section>

        <section className="admin-panel">
          <h2 className="admin-panel-title">Profile</h2>
          <dl className="admin-dl">
            <div>
              <dt>Role</dt>
              <dd>{detail.role}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{detail.status}</dd>
            </div>
            <div>
              <dt>Joined</dt>
              <dd>{formatDate(detail.createdAt)}</dd>
            </div>
            <div>
              <dt>Last login</dt>
              <dd>{formatDateTime(detail.lastLoginAt)}</dd>
            </div>
            <div>
              <dt>Password</dt>
              <dd>{detail.hasPassword ? "Set" : "Not set"}</dd>
            </div>
            <div>
              <dt>Email verified</dt>
              <dd>{detail.emailVerified ? "Yes" : "No"}</dd>
            </div>
          </dl>

          {canWrite && (
            <div className="admin-actions-row">
              {!detail.hasPassword && (
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busy}
                  onClick={() => void resendInvite()}
                >
                  Resend invite
                </button>
              )}
              <button
                type="button"
                className={
                  detail.status === "disabled" ? "btn-primary" : "btn-secondary"
                }
                disabled={busy}
                onClick={() => void toggleStatus()}
              >
                {detail.status === "disabled" ? "Enable user" : "Disable user"}
              </button>
            </div>
          )}
          {msg && <p className="admin-invite-msg">{msg}</p>}
        </section>
      </main>
    </div>
  );
}
