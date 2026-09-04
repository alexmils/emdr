"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/users", label: "Users" },
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

  useEffect(() => {
    void fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        // null user → login (not "/") — admin middleware would bounce / → /admin forever
        if (!d.user) {
          router.replace("/login");
          return;
        }
        if (d.user.role !== "platform_admin" && d.user.role !== "support") {
          router.replace("/");
          return;
        }
        setUser(d.user);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-head">
          <p className="admin-sidebar-kicker">EMDR admin</p>
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
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <p className="admin-sidebar-user">
            {user?.name ?? user?.email ?? "Admin"}
          </p>
          {user?.role === "support" && (
            <p className="admin-sidebar-role">Support (read-only)</p>
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
