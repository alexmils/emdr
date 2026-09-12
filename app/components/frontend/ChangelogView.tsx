import { Check, Minus, Sparkles, Wrench } from "lucide-react";
import type { ChangelogKind, ChangelogRelease } from "@/lib/changelog-public";
import "./changelog.css";

const KIND_ICON: Record<
  ChangelogKind,
  typeof Sparkles
> = {
  added: Sparkles,
  changed: Wrench,
  fixed: Check,
  removed: Minus,
};

function ReleaseRow({ release }: { release: ChangelogRelease }) {
  return (
    <article className="fe-changelog-row">
      <header className="fe-changelog-meta">
        <p className="fe-changelog-kind">{release.kindLabel}</p>
        <p className="fe-changelog-date">{release.dateLabel}</p>
        {release.versionLabel ? (
          <p className="fe-changelog-ver">{release.versionLabel}</p>
        ) : null}
      </header>
      <div className="fe-changelog-body">
        {release.sections.map((section) => {
          const Icon = KIND_ICON[section.kind];
          return (
            <section
              key={section.kind}
              className={`fe-changelog-block fe-changelog-block--${section.kind}`}
            >
              <h2 className="fe-changelog-h">
                <Icon aria-hidden size={16} strokeWidth={1.75} />
                {section.heading}
              </h2>
              <ul>
                {section.items.map((item, i) => (
                  <li key={`${section.kind}-${i}`}>{item}</li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </article>
  );
}

export function ChangelogView({ releases }: { releases: ChangelogRelease[] }) {
  return (
    <div className="fe-changelog">
      <header className="fe-changelog-hero">
        <h1>What&apos;s new</h1>
      </header>
      {releases.length === 0 ? (
        <p className="fe-changelog-empty">Nothing listed yet.</p>
      ) : (
        <div className="fe-changelog-list">
          {releases.map((release) => (
            <ReleaseRow key={release.id} release={release} />
          ))}
        </div>
      )}
    </div>
  );
}
