"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminPageHeader } from "@/app/components/admin/AdminPageHeader";
import { AdminTabs, useAdminTab } from "@/app/components/admin/AdminTabs";
import { fetchJson } from "@/lib/fetch-json";
import { BRAND_DOMAIN } from "@/lib/brand";
import type { SeoAdminView, SeoConfigPatch } from "@/lib/seo-admin-settings";
import type { SiteSeoPage, MarketingSeoStatus, ConnectionStatus } from "@/lib/site-seo";
import type { SiteAnalytics, SiteAnalyticsRange } from "@/lib/site-analytics";
import type { SeoPageId } from "@/lib/seo-config";

const TABS = [
  "overview",
  "pages",
  "analytics",
  "connections",
  "indexing",
  "cookies",
] as const;
type Tab = (typeof TABS)[number];
const TAB_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "pages", label: "Pages" },
  { id: "analytics", label: "Analytics" },
  { id: "connections", label: "Connections" },
  { id: "indexing", label: "Indexing" },
  { id: "cookies", label: "Cookies" },
] as const;

function statusLabel(status: ConnectionStatus): string {
  if (status === "connected") return "Connected";
  if (status === "via_tag_manager") return "In Tag Manager";
  return "Not connected";
}

function statusClass(status: ConnectionStatus): string {
  if (status === "connected") return "admin-seo-status-ok";
  if (status === "via_tag_manager") return "admin-seo-status-alt";
  return "admin-seo-status-off";
}

function hostLabel(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return BRAND_DOMAIN;
  }
}

function fmt(n: number) {
  return new Intl.NumberFormat("en").format(n);
}

function pageLabel(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname === "/" ? u.host : `${u.host}${u.pathname}`;
  } catch {
    return url;
  }
}

function SeoSnippetPreview({
  canonical,
  title,
  description,
  ogTitle,
  ogImageUrl,
}: {
  canonical: string;
  title: string;
  description: string;
  ogTitle: string;
  ogImageUrl: string;
}) {
  return (
    <div className="admin-seo-previews">
      <section className="admin-panel">
        <h3 className="admin-panel-title">Search preview</h3>
        <div className="admin-seo-serp">
          <p className="admin-seo-serp-url">{hostLabel(canonical)}</p>
          <p className="admin-seo-serp-title">{title}</p>
          <p className="admin-seo-serp-desc">{description}</p>
        </div>
      </section>
      <section className="admin-panel">
        <h3 className="admin-panel-title">Share preview</h3>
        <div className="admin-seo-share">
          <div className="admin-seo-share-img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ogImageUrl} alt="" />
          </div>
          <div className="admin-seo-share-meta">
            <p className="admin-seo-share-host">{hostLabel(canonical)}</p>
            <p className="admin-seo-share-title">{ogTitle || title}</p>
            <p className="admin-seo-share-desc">{description}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function SeoAnalyticsPanel() {
  const [range, setRange] = useState<SiteAnalyticsRange>("7d");
  const [data, setData] = useState<SiteAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchJson<{ analytics: SiteAnalytics }>(
      `/api/admin/seo/analytics?range=${range}`
    )
      .then((res) => {
        if (!cancelled) {
          setData(res.analytics);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const maxCountry = Math.max(
    1,
    ...(data?.countries.map((c) => c.sessions) ?? [0])
  );
  const gaLive = Boolean(data?.ga4.connected);
  const gscLive = Boolean(data?.gsc.connected);

  return (
    <div className="admin-seo-section">
      <div className="admin-seo-section-head">
        <div>
          <h2 className="admin-panel-title">Analytics</h2>
          <p className="admin-panel-sub">
            Visits and search for {BRAND_DOMAIN} — not the logged-in app.
          </p>
          <p className="admin-seo-note">
            Your office IP is ignored for new visits (see Connections → Ignored
            IPs). Numbers below can still include older clicks from before that
            filter.
          </p>
        </div>
        <div className="admin-seo-range">
          {(["7d", "28d"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={
                range === key
                  ? "admin-seo-range-btn is-active"
                  : "admin-seo-range-btn"
              }
            >
              {key === "7d" ? "7 days" : "28 days"}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="admin-invite-msg">
          Could not load analytics. {error}
        </div>
      ) : null}

      {loading && !data ? (
        <p className="text-[var(--text-secondary)]">Loading…</p>
      ) : null}

      {data && !data.connected ? (
        <div className="admin-panel admin-seo-empty">
          <p className="admin-panel-title">Connect Google Analytics</p>
          <p className="admin-panel-sub">{data.setupNote}</p>
          {data.serviceAccountEmail ? (
            <p className="admin-seo-mono">{data.serviceAccountEmail}</p>
          ) : null}
        </div>
      ) : null}

      {data?.connected ? (
        <>
          <section className="admin-seo-block">
            <h3 className="admin-seo-kicker">Visits</h3>
            {gaLive ? (
              <div className="admin-seo-kpi-grid">
                <div className="admin-panel">
                  <div className="admin-seo-kicker">Visits</div>
                  <div className="admin-seo-kpi">{fmt(data.visits.sessions)}</div>
                </div>
                <div className="admin-panel">
                  <div className="admin-seo-kicker">People</div>
                  <div className="admin-seo-kpi">{fmt(data.visits.users)}</div>
                </div>
                <div className="admin-panel">
                  <div className="admin-seo-kicker">Page views</div>
                  <div className="admin-seo-kpi">
                    {fmt(data.visits.pageviews)}
                  </div>
                </div>
              </div>
            ) : (
              <p className="admin-panel-sub">
                Connect Google Analytics to see visits.
              </p>
            )}
            {gaLive && data.visits.sessions === 0 ? (
              <p className="admin-panel-sub">No visits in this period yet.</p>
            ) : null}
          </section>

          <section className="admin-seo-block">
            <h3 className="admin-seo-kicker">Top countries</h3>
            {gaLive && data.countries.length > 0 ? (
              <div className="admin-panel admin-seo-list">
                {data.countries.map((c) => (
                  <div key={c.country} className="admin-seo-list-row">
                    <span className="admin-seo-list-label">{c.country}</span>
                    <div className="admin-seo-bar-track">
                      <div
                        className="admin-seo-bar-fill"
                        style={{
                          width: `${Math.max(6, (c.sessions / maxCountry) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="admin-seo-list-meta">
                      {fmt(c.sessions)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="admin-panel-sub">
                {gaLive
                  ? "No country data yet."
                  : "Connect Google Analytics to see countries."}
              </p>
            )}
          </section>

          <section className="admin-seo-block">
            <h3 className="admin-seo-kicker">What happened</h3>
            {gaLive && data.events.length > 0 ? (
              <div className="admin-panel admin-seo-list">
                {data.events.map((e) => (
                  <div key={e.name} className="admin-seo-list-row">
                    <span className="admin-seo-list-label">{e.label}</span>
                    <span className="admin-seo-list-meta">{fmt(e.count)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="admin-panel-sub">
                {gaLive
                  ? "No events in this period yet."
                  : "Connect Google Analytics to see events."}
              </p>
            )}
          </section>

          <section className="admin-seo-block">
            <h3 className="admin-seo-kicker">New and indexed pages</h3>
            {gscLive && data.indexedPages.length > 0 ? (
              <div className="admin-panel admin-seo-list">
                {data.indexedPages.map((p) => (
                  <div key={p.url} className="admin-seo-list-row">
                    <span className="admin-seo-list-label">
                      {p.isNew ? (
                        <span className="admin-seo-badge">New</span>
                      ) : null}
                      {pageLabel(p.url)}
                    </span>
                    <span className="admin-seo-list-meta">
                      {fmt(p.impressions)} shown · {fmt(p.clicks)} clicks
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="admin-panel-sub">
                {gscLive
                  ? "No page data yet."
                  : "Connect Search Console to see indexed pages."}
              </p>
            )}
          </section>

          <section className="admin-seo-block">
            <h3 className="admin-seo-kicker">Search queries</h3>
            {gscLive && data.queries.length > 0 ? (
              <div className="admin-panel admin-seo-list">
                {data.queries.map((q) => (
                  <div key={q.query} className="admin-seo-list-row">
                    <span className="admin-seo-list-label">{q.query}</span>
                    <span className="admin-seo-list-meta">
                      {fmt(q.clicks)} clicks · {fmt(q.impressions)} shown
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="admin-panel-sub">
                {gscLive
                  ? "No queries yet."
                  : "Connect Search Console to see queries."}
              </p>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

function AdminSeoPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useAdminTab(TABS, "overview");
  const selectedPage = (searchParams.get("page") || "home") as SeoPageId;

  const [seo, setSeo] = useState<SeoAdminView | null>(null);
  const [pages, setPages] = useState<SiteSeoPage[]>([]);
  const [status, setStatus] = useState<MarketingSeoStatus | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [draftPage, setDraftPage] = useState({
    title: "",
    description: "",
    ogTitle: "",
    ogImageUrl: "",
  });

  const [connDraft, setConnDraft] = useState({
    ga4MeasurementId: "",
    gtmId: "",
    clarityId: "",
    gscProperty: "",
    ga4PropertyId: "",
    ignoreIps: "",
    gscVerification: "",
    bingVerification: "",
    googleServiceAccountJson: "",
  });

  const load = useCallback(async () => {
    const res = await fetchJson<{
      seo: SeoAdminView;
      pages: SiteSeoPage[];
      status: MarketingSeoStatus;
      canEdit: boolean;
    }>("/api/admin/seo");
    setSeo(res.seo);
    setPages(res.pages);
    setStatus(res.status);
    setCanEdit(res.canEdit);
    setConnDraft({
      ga4MeasurementId: res.seo.ga4MeasurementId,
      gtmId: res.seo.gtmId,
      clarityId: res.seo.clarityId,
      gscProperty: res.seo.gscProperty,
      ga4PropertyId: res.seo.ga4PropertyId,
      ignoreIps: res.seo.ignoreIps,
      gscVerification: "",
      bingVerification: "",
      googleServiceAccountJson: "",
    });
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Failed to load SEO");
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const activePage = useMemo(
    () => pages.find((p) => p.id === selectedPage) || pages[0],
    [pages, selectedPage]
  );

  useEffect(() => {
    if (!activePage) return;
    setDraftPage({
      title: activePage.title,
      description: activePage.description,
      ogTitle:
        activePage.ogTitle === activePage.title ? "" : activePage.ogTitle,
      ogImageUrl: activePage.ogImageUrl,
    });
  }, [activePage]);

  const setPage = (id: string) => {
    router.replace(`/admin/seo?tab=pages&page=${encodeURIComponent(id)}`, {
      scroll: false,
    });
  };

  const savePatch = async (
    patch: SeoConfigPatch,
    okMsg: string
  ): Promise<boolean> => {
    if (!canEdit) return false;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetchJson<{
        seo: SeoAdminView;
        pages: SiteSeoPage[];
        status: MarketingSeoStatus;
      }>("/api/admin/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      setSeo(res.seo);
      setPages(res.pages);
      setStatus(res.status);
      setMsg(okMsg);
      return true;
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (loading || !seo || !status) {
    return (
      <div className="admin-page flex min-h-screen items-center justify-center">
        <p className="text-[var(--text-secondary)]">Loading…</p>
      </div>
    );
  }

  const home = pages.find((p) => p.id === "home") || pages[0];
  const connectedCount = status.connections.filter(
    (c) => c.status === "connected"
  ).length;

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="SEO"
        subtitle={`How ${BRAND_DOMAIN} looks in search and which tools are connected. Public marketing site — not the logged-in app.`}
      />
      <main className="admin-main admin-main-wide">
        <AdminTabs
          tabs={TAB_ITEMS}
          value={tab}
          onChange={(id) => setTab(id as Tab)}
        />

        {msg ? <p className="admin-invite-msg">{msg}</p> : null}

        {tab === "overview" && home ? (
          <div className="admin-seo-section">
            <SeoSnippetPreview
              canonical={home.canonical}
              title={home.title}
              description={home.description}
              ogTitle={home.ogTitle}
              ogImageUrl={home.ogImageUrl}
            />
            <dl className="admin-seo-stat-grid">
              <div className="admin-panel">
                <dt className="admin-seo-kicker">Page address</dt>
                <dd className="admin-seo-stat-value">{home.canonical}</dd>
              </div>
              <div className="admin-panel">
                <dt className="admin-seo-kicker">Tools connected</dt>
                <dd className="admin-seo-stat-value">
                  {connectedCount} of {status.connections.length}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        {tab === "pages" && activePage ? (
          <div className="admin-seo-pages">
            <div>
              <h2 className="admin-panel-title">Pages</h2>
              <p className="admin-panel-sub">
                Title, description, and share image for each public page.
              </p>
              <div className="admin-seo-page-picker">
                {pages.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={
                      p.id === activePage.id
                        ? "admin-seo-page-chip is-active"
                        : "admin-seo-page-chip"
                    }
                    onClick={() => setPage(p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <form
                className="admin-form-stack admin-panel"
                onSubmit={(e) => {
                  e.preventDefault();
                  void savePatch(
                    {
                      pages: {
                        [activePage.id]: {
                          title: draftPage.title,
                          description: draftPage.description,
                          ogTitle: draftPage.ogTitle,
                          ogImageUrl: draftPage.ogImageUrl,
                        },
                      },
                    },
                    "Page SEO saved."
                  );
                }}
              >
                <label className="admin-field-label">
                  Title
                  <input
                    className="field"
                    value={draftPage.title}
                    disabled={!canEdit || busy}
                    onChange={(e) =>
                      setDraftPage((d) => ({ ...d, title: e.target.value }))
                    }
                  />
                </label>
                <label className="admin-field-label">
                  Description
                  <textarea
                    className="field admin-textarea"
                    rows={3}
                    value={draftPage.description}
                    disabled={!canEdit || busy}
                    onChange={(e) =>
                      setDraftPage((d) => ({
                        ...d,
                        description: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="admin-field-label">
                  Share title (optional)
                  <input
                    className="field"
                    value={draftPage.ogTitle}
                    disabled={!canEdit || busy}
                    placeholder={draftPage.title}
                    onChange={(e) =>
                      setDraftPage((d) => ({ ...d, ogTitle: e.target.value }))
                    }
                  />
                </label>
                <label className="admin-field-label">
                  Share image URL
                  <input
                    className="field"
                    value={draftPage.ogImageUrl}
                    disabled={!canEdit || busy}
                    onChange={(e) =>
                      setDraftPage((d) => ({
                        ...d,
                        ogImageUrl: e.target.value,
                      }))
                    }
                  />
                </label>
                {canEdit ? (
                  <div className="admin-form-actions">
                    <button
                      type="submit"
                      className="admin-btn-edit"
                      disabled={busy}
                    >
                      {busy ? "Saving…" : "Save page"}
                    </button>
                  </div>
                ) : null}
              </form>
            </div>
            <SeoSnippetPreview
              canonical={activePage.canonical}
              title={draftPage.title || activePage.title}
              description={draftPage.description || activePage.description}
              ogTitle={draftPage.ogTitle || draftPage.title || activePage.title}
              ogImageUrl={draftPage.ogImageUrl || activePage.ogImageUrl}
            />
          </div>
        ) : null}

        {tab === "analytics" ? <SeoAnalyticsPanel /> : null}

        {tab === "connections" ? (
          <div className="admin-seo-section">
            <h2 className="admin-panel-title">Connections</h2>
            <p className="admin-panel-sub">
              Public IDs are masked in the cards. Verification codes and the
              service account stay hidden after save.
            </p>
            <div className="admin-seo-conn-grid">
              {status.connections.map((c) => (
                <article key={c.id} className="admin-panel">
                  <div className="admin-seo-conn-head">
                    <h3>{c.name}</h3>
                    <span className={statusClass(c.status)}>
                      {statusLabel(c.status)}
                    </span>
                  </div>
                  {c.detail ? (
                    <p className="admin-seo-mono">{c.detail}</p>
                  ) : null}
                  {c.publicIdMasked ? (
                    <p className="admin-seo-mono muted">{c.publicIdMasked}</p>
                  ) : null}
                  <p className="admin-panel-sub">{c.hint}</p>
                </article>
              ))}
            </div>

            {canEdit ? (
              <form
                className="admin-form-stack admin-panel"
                onSubmit={(e) => {
                  e.preventDefault();
                  void savePatch(
                    {
                      ga4MeasurementId: connDraft.ga4MeasurementId,
                      gtmId: connDraft.gtmId,
                      clarityId: connDraft.clarityId,
                      gscProperty: connDraft.gscProperty,
                      ga4PropertyId: connDraft.ga4PropertyId,
                      ignoreIps: connDraft.ignoreIps,
                      gscVerification: connDraft.gscVerification,
                      bingVerification: connDraft.bingVerification,
                      googleServiceAccountJson:
                        connDraft.googleServiceAccountJson,
                    },
                    "Connections saved."
                  ).then((ok) => {
                    if (!ok) return;
                    setConnDraft((d) => ({
                      ...d,
                      gscVerification: "",
                      bingVerification: "",
                      googleServiceAccountJson: "",
                    }));
                  });
                }}
              >
                <h3 className="admin-panel-title">Edit connections</h3>
                <label className="admin-field-label">
                  Google Analytics measurement ID
                  <input
                    className="field"
                    placeholder="G-XXXXXXXX"
                    value={connDraft.ga4MeasurementId}
                    disabled={busy}
                    onChange={(e) =>
                      setConnDraft((d) => ({
                        ...d,
                        ga4MeasurementId: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="admin-field-label">
                  GA4 property ID (Analytics API)
                  <input
                    className="field"
                    placeholder="123456789"
                    value={connDraft.ga4PropertyId}
                    disabled={busy}
                    onChange={(e) =>
                      setConnDraft((d) => ({
                        ...d,
                        ga4PropertyId: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="admin-field-label">
                  Google Tag Manager ID
                  <input
                    className="field"
                    placeholder="GTM-XXXXXXX"
                    value={connDraft.gtmId}
                    disabled={busy}
                    onChange={(e) =>
                      setConnDraft((d) => ({ ...d, gtmId: e.target.value }))
                    }
                  />
                </label>
                <label className="admin-field-label">
                  Microsoft Clarity ID
                  <input
                    className="field"
                    value={connDraft.clarityId}
                    disabled={busy}
                    onChange={(e) =>
                      setConnDraft((d) => ({
                        ...d,
                        clarityId: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="admin-field-label">
                  Search Console property
                  <input
                    className="field"
                    placeholder={`sc-domain:${BRAND_DOMAIN}`}
                    value={connDraft.gscProperty}
                    disabled={busy}
                    onChange={(e) =>
                      setConnDraft((d) => ({
                        ...d,
                        gscProperty: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="admin-field-label">
                  Search Console verification
                  {seo.hasGscVerification
                    ? " (leave blank to keep; type off to clear)"
                    : ""}
                  <input
                    className="field"
                    type="password"
                    autoComplete="off"
                    value={connDraft.gscVerification}
                    disabled={busy}
                    onChange={(e) =>
                      setConnDraft((d) => ({
                        ...d,
                        gscVerification: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="admin-field-label">
                  Bing verification
                  {seo.hasBingVerification
                    ? " (leave blank to keep; type off to clear)"
                    : ""}
                  <input
                    className="field"
                    type="password"
                    autoComplete="off"
                    value={connDraft.bingVerification}
                    disabled={busy}
                    onChange={(e) =>
                      setConnDraft((d) => ({
                        ...d,
                        bingVerification: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="admin-field-label">
                  Ignored IPs (comma or space separated)
                  <input
                    className="field"
                    value={connDraft.ignoreIps}
                    disabled={busy}
                    onChange={(e) =>
                      setConnDraft((d) => ({
                        ...d,
                        ignoreIps: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="admin-field-label">
                  Google service account JSON
                  {seo.hasGoogleServiceAccount
                    ? " (leave blank to keep; type off to clear)"
                    : ""}
                  {seo.serviceAccountEmail ? (
                    <span className="admin-seo-mono muted">
                      {" "}
                      · {seo.serviceAccountEmail}
                    </span>
                  ) : null}
                  <textarea
                    className="field admin-textarea"
                    rows={5}
                    placeholder='{"type":"service_account",...}'
                    value={connDraft.googleServiceAccountJson}
                    disabled={busy}
                    onChange={(e) =>
                      setConnDraft((d) => ({
                        ...d,
                        googleServiceAccountJson: e.target.value,
                      }))
                    }
                  />
                </label>
                <div className="admin-form-actions">
                  <button
                    type="submit"
                    className="admin-btn-edit"
                    disabled={busy}
                  >
                    {busy ? "Saving…" : "Save connections"}
                  </button>
                </div>
              </form>
            ) : (
              <p className="admin-panel-sub">
                Support can view connections. Platform admin can edit them.
              </p>
            )}
          </div>
        ) : null}

        {tab === "indexing" ? (
          <div className="admin-seo-section">
            <h2 className="admin-panel-title">Indexing</h2>
            <p className="admin-panel-sub">
              Google can read the public homepage, About, EMDR, Resources,
              Privacy, and Terms. The logged-in app is blocked.
            </p>
            <div className="admin-panel admin-seo-list">
              <div className="admin-seo-index-row">
                <p className="admin-panel-title">Sitemap</p>
                <a
                  href={status.sitemapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-seo-link"
                >
                  {status.sitemapUrl}
                </a>
                <p className="admin-panel-sub">{status.sitemapNote}</p>
              </div>
              <div className="admin-seo-index-row">
                <p className="admin-panel-title">robots.txt</p>
                <a
                  href={status.robotsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-seo-link"
                >
                  {status.robotsUrl}
                </a>
                <p className="admin-panel-sub">
                  Allows the public pages. Disallows /app and /admin.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "cookies" ? (
          <div className="admin-seo-section">
            <h2 className="admin-panel-title">Cookies</h2>
            <div className="admin-panel">
              <p className="admin-panel-sub">
                Visitors on the public site choose analytics and marketing
                cookies. Sign-in and the logged-in app do not load Clarity or Tag
                Manager.
              </p>
              <p className="admin-seo-cookie-actions">
                <Link href="/" className="admin-seo-link">
                  Open public site
                </Link>
                <span className="admin-panel-sub">
                  {" "}
                  to change cookie choices
                </span>
              </p>
              <p>
                <Link href="/privacy" className="admin-seo-link muted">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default function AdminSeoPage() {
  return (
    <Suspense
      fallback={
        <div className="admin-page flex min-h-screen items-center justify-center">
          <p className="text-[var(--text-secondary)]">Loading…</p>
        </div>
      }
    >
      <AdminSeoPageInner />
    </Suspense>
  );
}
