"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/help", label: "Help" },
  { href: "/admin/activity", label: "Activity" },
  { href: "/admin/email", label: "Email", adminOnly: true },
  { href: "/admin/ai", label: "AI & Voice", adminOnly: true },
  { href: "/admin/platform", label: "Platform", adminOnly: true },
  { href: "/admin/billing", label: "Billing" },
];

type AdminUser = {
  email: string;
  name: string | null;
  role?: string;
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [helpUnread, setHelpUnread] = useState(0);

  useEffect(() => {
    void fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        // null user → login (not "/app") — admin middleware would bounce /app → /admin forever
        if (!d.user) {
          router.replace("/app/login");
          return;
        }
        if (d.user.role !== "platform_admin" && d.user.role !== "support") {
          router.replace("/app");
          return;
        }
        setUser(d.user);
      })
      .catch(() => router.replace("/app/login"));
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      try {
        const res = await fetch("/api/admin/help?view=unread");
        const data = await res.json();
        if (!cancelled && res.ok) setHelpUnread(Number(data.unread ?? 0));
      } catch {
        /* ignore */
      }
    };
    void pull();
    const id = window.setInterval(() => void pull(), 20000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/app/login");
    router.refresh();
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-head">
          <p className="admin-sidebar-kicker">NuraHelp admin</p>
          <p className="admin-sidebar-title">Control panel</p>
        </div>
        <nav className="admin-sidebar-nav">
          {NAV.filter(
            (item) =>
              !item.adminOnly || user?.role === "platform_admin"
          ).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item ${
                isActive(item.href, item.exact) ? "admin-nav-item-active" : ""
              }`}
            >
              {item.label}
              {item.href === "/admin/help" && helpUnread > 0 && (
                <span className="admin-nav-badge">{helpUnread}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <p className="admin-sidebar-user">
            {user?.name ?? user?.email ?? "Admin"}
          </p>
          {user?.role === "support" && (
            <p className="admin-sidebar-role">Support (help replies allowed)</p>
          )}
          <button
            type="button"
            onClick={() => void logout()}
            className="admin-sidebar-logout"
          >
            Logout
          </button>
        </div>
      </aside>
      <div className="admin-canvas">{children}</div>
    </div>
  );
}
