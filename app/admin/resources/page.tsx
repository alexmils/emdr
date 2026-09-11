"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/app/components/admin/AdminPageHeader";
import { AdminTabs, useAdminTab } from "@/app/components/admin/AdminTabs";
import {
  AdminSettingToggle,
  AdminSettingToggleStack,
} from "@/app/components/admin/AdminSettingToggle";
import { fileToResourceCoverDataUrl } from "@/lib/avatar-client";
import {
  RESOURCE_KINDS,
  slugifyTitle,
  type ResourceKind,
  type ResourcePost,
} from "@/lib/resources";

type FormState = {
  id: string;
  slug: string;
  kind: ResourceKind;
  title: string;
  summary: string;
  body: string;
  coverUrl: string;
  videoUrl: string;
  readMinutes: string;
  featured: boolean;
  enabled: boolean;
  sortOrder: string;
};

const EMPTY: FormState = {
  id: "",
  slug: "",
  kind: "article",
  title: "",
  summary: "",
  body: "",
  coverUrl: "",
  videoUrl: "",
  readMinutes: "",
  featured: false,
  enabled: true,
  sortOrder: "0",
};

const TABS = ["library", "editor"] as const;
type Tab = (typeof TABS)[number];
const ALL_TAB_ITEMS = [
  { id: "library", label: "Library" },
  { id: "editor", label: "Editor" },
] as const;

function postToForm(p: ResourcePost): FormState {
  return {
    id: p.id,
    slug: p.slug,
    kind: p.kind,
    title: p.title,
    summary: p.summary,
    body: p.body ?? "",
    coverUrl: p.coverUrl ?? "",
    videoUrl: p.videoUrl ?? "",
    readMinutes: p.readMinutes != null ? String(p.readMinutes) : "",
    featured: p.featured,
    enabled: p.enabled,
    sortOrder: String(p.sortOrder ?? 0),
  };
}

function AdminResourcesPageInner() {
  const [items, setItems] = useState<ResourcePost[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [canWrite, setCanWrite] = useState(false);

  const tabItems = useMemo(
    () =>
      canWrite
        ? ALL_TAB_ITEMS
        : ALL_TAB_ITEMS.filter((t) => t.id === "library"),
    [canWrite]
  );
  const [tab, setTab] = useAdminTab(
    canWrite ? TABS : (["library"] as const),
    "library"
  );

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/resources");
    const data = await res.json();
    if (res.ok) setItems(data.resources ?? []);
  }, []);

  useEffect(() => {
    void load();
    void fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setCanWrite(d.user?.role === "platform_admin"))
      .catch(() => setCanWrite(false));
  }, [load]);

  const resetForm = () => setForm(EMPTY);

  const save = async () => {
    if (!canWrite) {
      setMsg("Only platform admins can edit resources");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          resource: {
            id: form.id || undefined,
            slug: form.slug || slugifyTitle(form.title),
            kind: form.kind,
            title: form.title,
            summary: form.summary,
            body: form.body,
            coverUrl: form.coverUrl || null,
            videoUrl: form.videoUrl || null,
            readMinutes: form.readMinutes
              ? Number(form.readMinutes)
              : null,
            featured: form.featured,
            enabled: form.enabled,
            sortOrder: Number(form.sortOrder) || 0,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "Save failed");
        return;
      }
      setMsg("Resource saved");
      resetForm();
      setTab("library");
      void load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!canWrite) return;
    if (!window.confirm("Delete this resource?")) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", resourceId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "Delete failed");
        return;
      }
      if (form.id === id) resetForm();
      setMsg("Deleted");
      void load();
    } finally {
      setBusy(false);
    }
  };

  const onCover = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    setMsg("");
    try {
      const url = await fileToResourceCoverDataUrl(file);
      setForm((f) => ({ ...f, coverUrl: url }));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Image failed");
    } finally {
      setBusy(false);
    }
  };

  const openEditor = (item?: ResourcePost) => {
    if (item) setForm(postToForm(item));
    else resetForm();
    setTab("editor");
  };

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Resources"
        subtitle="Blog-style library for /app/resources — articles, videos, and safety guides."
      />

      <main className="admin-main">
        {!canWrite && (
          <p className="admin-invite-msg">
            Support can view resources; only platform admins can create or edit.
          </p>
        )}
        {msg && <p className="admin-invite-msg">{msg}</p>}

        <AdminTabs
          tabs={tabItems}
          value={tab}
          onChange={(id) => setTab(id as Tab)}
        />

        {tab === "library" && (
          <section className="admin-panel">
            <div className="admin-filters mb-4">
              {canWrite && (
                <button
                  type="button"
                  className="btn-primary shrink-0"
                  disabled={busy}
                  onClick={() => openEditor()}
                >
                  New resource
                </button>
              )}
            </div>
            <h2 className="admin-panel-title">All resources</h2>
            <ul className="admin-resources-list">
              {items.map((item) => (
                <li key={item.id} className="admin-resources-list-item">
                  <div className="min-w-0">
                    <strong>{item.title}</strong>
                    <p className="admin-panel-sub !mt-1">
                      {item.kind}
                      {!item.enabled ? " · draft" : ""}
                      {item.featured ? " · featured" : ""}
                      {" · "}/{item.slug}
                    </p>
                  </div>
                  <div className="admin-resources-list-actions">
                    <button
                      type="button"
                      className="btn-ghost"
                      disabled={busy}
                      onClick={() => openEditor(item)}
                    >
                      Edit
                    </button>
                    {canWrite ? (
                      <button
                        type="button"
                        className="btn-ghost"
                        disabled={busy}
                        onClick={() => void remove(item.id)}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
              {items.length === 0 ? (
                <li className="admin-panel-sub">No resources yet.</li>
              ) : null}
            </ul>
          </section>
        )}

        {tab === "editor" && canWrite && (
          <section className="admin-panel">
            <h2 className="admin-panel-title">
              {form.id ? "Edit resource" : "New resource"}
            </h2>

            <label className="admin-field-label">
              Title
              <input
                className="field"
                value={form.title}
                disabled={!canWrite || busy}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((f) => ({
                    ...f,
                    title,
                    slug:
                      !f.id && (!f.slug || f.slug === slugifyTitle(f.title))
                        ? slugifyTitle(title)
                        : f.slug,
                  }));
                }}
              />
            </label>

            <label className="admin-field-label">
              Slug
              <input
                className="field"
                value={form.slug}
                disabled={!canWrite || busy}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))
                }
              />
            </label>

            <label className="admin-field-label">
              Kind
              <select
                className="field"
                value={form.kind}
                disabled={!canWrite || busy}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    kind: e.target.value as ResourceKind,
                  }))
                }
              >
                {RESOURCE_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field-label">
              Summary
              <textarea
                className="field admin-textarea"
                rows={2}
                value={form.summary}
                disabled={!canWrite || busy}
                onChange={(e) =>
                  setForm((f) => ({ ...f, summary: e.target.value }))
                }
              />
            </label>

            <label className="admin-field-label">
              Body
              <textarea
                className="field admin-textarea"
                rows={12}
                value={form.body}
                disabled={!canWrite || busy}
                placeholder="Paragraphs separated by blank lines. Use **bold** and ![alt](https://…)."
                onChange={(e) =>
                  setForm((f) => ({ ...f, body: e.target.value }))
                }
              />
            </label>

            <label className="admin-field-label">
              Video URL (YouTube, Vimeo, or https .mp4)
              <input
                className="field"
                value={form.videoUrl}
                disabled={!canWrite || busy}
                placeholder="https://www.youtube.com/watch?v=…"
                onChange={(e) =>
                  setForm((f) => ({ ...f, videoUrl: e.target.value }))
                }
              />
            </label>

            <div className="admin-field-label">
              Cover image
              <div className="admin-resources-cover-row">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={!canWrite || busy}
                  onChange={(e) =>
                    void onCover(e.target.files?.[0] ?? null)
                  }
                />
                {form.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.coverUrl}
                    alt=""
                    className="admin-resources-cover-preview"
                  />
                ) : null}
                {form.coverUrl && canWrite ? (
                  <button
                    type="button"
                    className="btn-ghost"
                    disabled={busy}
                    onClick={() => setForm((f) => ({ ...f, coverUrl: "" }))}
                  >
                    Remove cover
                  </button>
                ) : null}
              </div>
            </div>

            <AdminSettingToggleStack>
              <AdminSettingToggle
                id="resource-published"
                title="Published"
                status={
                  form.enabled
                    ? "On — visible in the Resources library"
                    : "Off — draft, hidden from users"
                }
                checked={form.enabled}
                disabled={!canWrite || busy}
                tone={form.enabled ? "ok" : "neutral"}
                onChange={(enabled) => setForm((f) => ({ ...f, enabled }))}
              />
              <AdminSettingToggle
                id="resource-featured"
                title="Featured"
                status={
                  form.featured
                    ? "On — eligible for the Learn teaser"
                    : "Off — not featured"
                }
                checked={form.featured}
                disabled={!canWrite || busy}
                tone={form.featured ? "ok" : "neutral"}
                onChange={(featured) => setForm((f) => ({ ...f, featured }))}
              />
            </AdminSettingToggleStack>

            <div className="admin-resources-meta-row">
              <label className="admin-field-label">
                Read minutes
                <input
                  className="field"
                  type="number"
                  min={0}
                  max={120}
                  value={form.readMinutes}
                  disabled={!canWrite || busy}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, readMinutes: e.target.value }))
                  }
                />
              </label>
              <label className="admin-field-label">
                Sort order
                <input
                  className="field"
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  disabled={!canWrite || busy}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sortOrder: e.target.value }))
                  }
                />
              </label>
            </div>

            <div className="admin-modal-actions mt-4">
              <button
                type="button"
                className="btn-secondary"
                disabled={busy}
                onClick={() => {
                  resetForm();
                  setTab("library");
                }}
              >
                Clear
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={!canWrite || busy || !form.title.trim()}
                onClick={() => void save()}
              >
                {busy ? "Saving…" : form.id ? "Update" : "Create"}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default function AdminResourcesPage() {
  return (
    <Suspense
      fallback={
        <div className="admin-page flex min-h-screen items-center justify-center">
          <p className="text-[var(--text-secondary)]">Loading…</p>
        </div>
      }
    >
      <AdminResourcesPageInner />
    </Suspense>
  );
}
