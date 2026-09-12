import Link from "next/link";
import "./public-cluster.css";

export type Crumb = {
  href?: string;
  label: string;
};

export function FrontendBreadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length < 2) return null;

  return (
    <nav className="fe-crumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`}>
              {last || !item.href ? (
                <span aria-current={last ? "page" : undefined}>{item.label}</span>
              ) : (
                <Link href={item.href}>{item.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
