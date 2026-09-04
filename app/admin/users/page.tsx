"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/app/components/admin/AdminPageHeader";
import { InviteForm } from "@/app/components/admin/InviteForm";
import { formatDate, formatDateTime } from "@/lib/admin-format";
import type { AdminUserRow } from "@/lib/admin-stats";
import { fetchJson } from "@/lib/fetch-json";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string>("user");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"user" | "platform_admin" | "support">("user");
  const [editBusy, setEditBusy] = useState(false);
  const [editMsg, setEditMsg] = useState("");

  const load = useCallback(async () => {
    const me = await fetchJson<{ user?: { id?: string; role?: string } }>(
      "/api/auth/me"
    );
    setMeId(me.user?.id ?? null);
    setMyRole(me.user?.role ?? "user");
    const usersRes = await fetchJson<{ users: AdminUserRow[] }>(
      "/api/admin/users"
    );
    setUsers(usersRes.users ?? []);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch (err) {
        console.error(err);
        setError("Could not load users.");
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        u.email.toLowerCase().includes(q) ||
        (u.name ?? "").toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const deleteUser = async (u: AdminUserRow) => {
    if (
      !window.confirm(
        `Delete ${u.email}? All their sessions and data will be removed.`
      )
    ) {
      return;
    }
    try {
      await fetchJson(`/api/admin/users?id=${encodeURIComponent(u.id)}`, {
        method: "DELETE",
      });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const openEditUser = (u: AdminUserRow) => {
    setEditingUser(u);
    setEditName(u.name ?? "");
    setEditRole(
      u.role === "platform_admin"
        ? "platform_admin"
        : u.role === "support"
          ? "support"
          : "user"
    );
    setEditMsg("");
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditBusy(true);
    setEditMsg("");
    try {
      await fetchJson("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser.id,
          name: editName,
          role: editRole,
        }),
      });
      setEditingUser(null);
      await load();
    } catch (err) {
      setEditMsg(err instanceof Error ? err.message : "Update failed");
    } finally {
      setEditBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page flex min-h-screen items-center justify-center">
        <p className="text-[var(--text-secondary)]">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page flex min-h-screen items-center justify-center p-6">
        <p className="text-[var(--destructive)]">{error}</p>
      </div>
    );
  }

  const canWrite = myRole === "platform_admin";

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Users"
        subtitle="Invite, manage roles, and review subscriptions."
      />
      <main className="admin-main">
        {canWrite && (
          <section className="admin-panel">
            <h2 className="admin-panel-title">Add user</h2>
            <p className="admin-panel-sub">
              Sends an invite email with a create-password link.
            </p>
            <InviteForm onSuccess={() => void load()} />
          </section>
        )}

        <section className="admin-panel">
          <div className="admin-filters">
            <input
              type="search"
              placeholder="Search by email or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field admin-filter-field"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="field admin-filter-field"
            >
              <option value="all">All roles</option>
              <option value="user">User</option>
              <option value="support">Support</option>
              <option value="platform_admin">Admin</option>
            </select>
          </div>

          {editingUser && canWrite && (
            <form className="admin-edit-form" onSubmit={(e) => void saveUser(e)}>
              <p className="admin-panel-sub">Edit {editingUser.email}</p>
              <div className="admin-edit-fields">
                <input
                  type="text"
                  placeholder="Name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="field"
                />
                <select
                  value={editRole}
                  onChange={(e) =>
                    setEditRole(
                      e.target.value as "user" | "platform_admin" | "support"
                    )
                  }
                  className="field"
                  disabled={editingUser.id === meId}
                >
                  <option value="user">User</option>
                  <option value="support">Support</option>
                  <option value="platform_admin">Admin</option>
                </select>
                <button
                  type="submit"
                  disabled={editBusy}
                  className="btn-primary shrink-0"
                >
                  {editBusy ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  className="btn-secondary shrink-0"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>
              </div>
              {editingUser.id === meId && (
                <p className="admin-invite-msg">
                  You cannot change your own role.
                </p>
              )}
              {editMsg && <p className="admin-invite-msg">{editMsg}</p>}
            </form>
          )}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Plan</th>
                  <th>Joined</th>
                  <th>Last login</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <Link href={`/admin/users/${u.id}`} className="admin-link">
                        {u.email}
                      </Link>
                    </td>
                    <td>{u.name ?? "—"}</td>
                    <td>
                      <span
                        className={`admin-badge ${
                          u.role === "platform_admin"
                            ? "admin-badge-admin"
                            : u.role === "support"
                              ? "admin-badge-support"
                              : "admin-badge-user"
                        }`}
                      >
                        {u.role === "platform_admin"
                          ? "Admin"
                          : u.role === "support"
                            ? "Support"
                            : "User"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`admin-badge ${
                          u.status === "disabled"
                            ? "admin-badge-disabled"
                            : "admin-badge-user"
                        }`}
                      >
                        {u.status === "disabled" ? "Disabled" : "Active"}
                      </span>
                    </td>
                    <td>{u.plan}</td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>{formatDateTime(u.lastLoginAt)}</td>
                    <td className="admin-table-actions">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="admin-btn-edit"
                      >
                        View
                      </Link>
                      {canWrite && (
                        <>
                          <button
                            type="button"
                            className="admin-btn-edit"
                            onClick={() => openEditUser(u)}
                          >
                            Edit
                          </button>
                          {u.id !== meId && (
                            <button
                              type="button"
                              className="admin-btn-danger"
                              onClick={() => void deleteUser(u)}
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
