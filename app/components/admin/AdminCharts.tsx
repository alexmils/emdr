"use client";

import { useId, useState } from "react";

/** Lightweight SVG charts for admin overview — no chart library. */

export type StackedBarPoint = {
  label: string;
  /** Display heights (already scaled). */
  a: number;
  b: number;
  c: number;
  /** Raw values for hover tooltip. */
  tip?: {
    messages: number;
    tokens: number;
    newUsers: number;
  };
};

const COLORS = {
  a: "#84B067",
  b: "#C6D67E",
  c: "#E8A87C",
};

const SERIES = [
  { key: "a" as const, label: "Messages", color: COLORS.a },
  { key: "b" as const, label: "Tokens", color: COLORS.b },
  { key: "c" as const, label: "New users", color: COLORS.c },
];

export function AdminStackedBars({
  points,
  height = 180,
}: {
  points: StackedBarPoint[];
  height?: number;
}) {
  const tipId = useId();
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...points.map((p) => p.a + p.b + p.c));
  const active = hover != null ? points[hover] : null;

  return (
    <div
      className="admin-stacked"
      onMouseLeave={() => setHover(null)}
    >
      <div className="admin-stacked-plot" style={{ height }}>
        {points.map((p, i) => {
          const total = p.a + p.b + p.c;
          const pct = Math.max(
            total > 0 ? (total / max) * 100 : 0,
            total > 0 ? 2 : 0
          );
          const isOn = hover === i;
          return (
            <div
              key={`${p.label}-${i}`}
              className={`admin-stacked-col${isOn ? " is-on" : ""}`}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              tabIndex={0}
              role="group"
              aria-label={`${p.label}: ${p.tip?.messages ?? p.a} messages, ${p.tip?.tokens ?? p.b} tokens, ${p.tip?.newUsers ?? p.c} new users`}
              aria-describedby={isOn ? tipId : undefined}
            >
              <div className="admin-stacked-track">
                {total > 0 ? (
                  <div
                    className="admin-stacked-bar"
                    style={{ height: `${pct}%` }}
                  >
                    {p.a > 0 && (
                      <div
                        className="admin-stacked-seg"
                        style={{ flexGrow: p.a, background: COLORS.a }}
                      />
                    )}
                    {p.b > 0 && (
                      <div
                        className="admin-stacked-seg"
                        style={{ flexGrow: p.b, background: COLORS.b }}
                      />
                    )}
                    {p.c > 0 && (
                      <div
                        className="admin-stacked-seg"
                        style={{ flexGrow: p.c, background: COLORS.c }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="admin-stacked-empty" aria-hidden />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="admin-stacked-days" aria-hidden>
        {points.map((p, i) => (
          <span
            key={`day-${p.label}-${i}`}
            className={`admin-stacked-day${hover === i ? " is-on" : ""}`}
          >
            {p.label}
          </span>
        ))}
      </div>

      {active && hover != null && (
        <div
          id={tipId}
          className="admin-chart-tooltip"
          role="tooltip"
          style={{
            left: `${Math.min(
              88,
              Math.max(12, ((hover + 0.5) / Math.max(points.length, 1)) * 100)
            )}%`,
          }}
        >
          <p className="admin-chart-tooltip-title">{active.label}</p>
          <ul className="admin-chart-tooltip-list">
            {SERIES.map((s) => {
              const raw =
                s.key === "a"
                  ? (active.tip?.messages ?? active.a)
                  : s.key === "b"
                    ? (active.tip?.tokens ?? active.b)
                    : (active.tip?.newUsers ?? active.c);
              const display =
                s.key === "b" && active.tip
                  ? formatTipTokens(raw)
                  : String(raw);
              return (
                <li key={s.key}>
                  <i style={{ background: s.color }} />
                  <span>{s.label}</span>
                  <strong>{display}</strong>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function formatTipTokens(n: number) {
  if (n < 1000) return String(Math.round(n));
  if (n < 1_000_000) {
    return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  }
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export function AdminSegmentBar({
  slices,
}: {
  slices: { key: string; label: string; value: number; color: string }[];
}) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="admin-segment-bar" role="img" aria-label="Cost breakdown">
      {slices.map((s) => (
        <div
          key={s.key}
          className="admin-segment-slice"
          style={{
            width: `${Math.max(2, (s.value / total) * 100)}%`,
            background: s.color,
          }}
          title={`${s.label}: ${Math.round((s.value / total) * 100)}%`}
        />
      ))}
    </div>
  );
}

export function AdminGauge({
  value,
  label,
  display,
  tone = "ok",
}: {
  value: number;
  label: string;
  display?: string;
  tone?: "ok" | "warn" | "down";
}) {
  const pct = Math.max(0, Math.min(100, value));
  const r = 54;
  const circ = Math.PI * r;
  const dash = (pct / 100) * circ;
  const stroke =
    tone === "down" ? "#A65D4A" : tone === "warn" ? "#948F4E" : "#84B067";
  return (
    <div className="admin-gauge">
      <svg viewBox="0 0 140 90" className="admin-gauge-svg" aria-hidden>
        <path
          d="M 16 78 A 54 54 0 0 1 124 78"
          fill="none"
          stroke="var(--border)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 16 78 A 54 54 0 0 1 124 78"
          fill="none"
          stroke={stroke}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div className="admin-gauge-center">
        <p className="admin-gauge-value">{display ?? `${Math.round(pct)}%`}</p>
        <p className="admin-gauge-label">{label}</p>
      </div>
    </div>
  );
}

export function DeltaBadge({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  const delta =
    previous <= 0
      ? current > 0
        ? 100
        : 0
      : Math.round(((current - previous) / previous) * 1000) / 10;
  const up = delta >= 0;
  return (
    <span className={`admin-delta ${up ? "admin-delta-up" : "admin-delta-down"}`}>
      {up ? "↑" : "↓"} {Math.abs(delta)}% vs last month
    </span>
  );
}

export const CHART_SLICE_COLORS = [
  "#84B067",
  "#C6D67E",
  "#E8A87C",
  "#948F4E",
  "#6B8F71",
  "#D4A574",
];

export type LineChartPoint = { label: string; value: number };

function lineCoords(
  points: LineChartPoint[],
  width: number,
  chartH: number,
  padX: number,
  padTop: number,
  max: number
) {
  const chartW = width - padX * 2;
  return points.map((p, i) => {
    const x =
      points.length <= 1
        ? padX + chartW / 2
        : padX + (i / (points.length - 1)) * chartW;
    const y = padTop + chartH - (p.value / max) * chartH;
    return { x, y, label: p.label };
  });
}

function pathFromCoords(coords: { x: number; y: number }[]) {
  return coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
}

export function AdminLineChart({
  points,
  compare,
  height = 220,
  ariaLabel = "Revenue over time",
  markers = true,
  fill = true,
}: {
  points: LineChartPoint[];
  compare?: LineChartPoint[];
  height?: number;
  ariaLabel?: string;
  markers?: boolean;
  fill?: boolean;
}) {
  const width = 640;
  const padX = 16;
  const padTop = 18;
  const padBottom = 28;
  const chartH = height - padTop - padBottom;
  const max = Math.max(
    1,
    ...points.map((p) => p.value),
    ...(compare ?? []).map((p) => p.value)
  );
  const coords = lineCoords(points, width, chartH, padX, padTop, max);
  const compareCoords = compare
    ? lineCoords(compare, width, chartH, padX, padTop, max)
    : [];
  const line = pathFromCoords(coords);
  const area = coords.length
    ? `${line} L ${coords[coords.length - 1].x} ${padTop + chartH} L ${coords[0].x} ${padTop + chartH} Z`
    : "";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="admin-fin-chart-svg"
      role="img"
      aria-label={ariaLabel}
    >
      {fill && <path d={area} fill="rgba(132, 176, 103, 0.12)" />}
      {compareCoords.length > 1 && (
        <path
          d={pathFromCoords(compareCoords)}
          fill="none"
          stroke="#b7bdb0"
          strokeWidth="1.6"
          strokeDasharray="4 4"
          strokeLinejoin="round"
        />
      )}
      <path
        d={line}
        fill="none"
        stroke="#2A3020"
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {coords.map((c, i) => (
        <g key={`${c.label}-${i}`}>
          {markers && <circle cx={c.x} cy={c.y} r="3.2" fill="#2A3020" />}
          {c.label ? (
            <text
              x={c.x}
              y={height - 8}
              textAnchor="middle"
              className="admin-chart-axis"
            >
              {c.label}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

export function AdminGroupedBars({
  points,
  height = 160,
  ariaLabel = "Hourly activity",
}: {
  points: { label: string; a: number; b: number }[];
  height?: number;
  ariaLabel?: string;
}) {
  const width = 640;
  const padX = 8;
  const padTop = 8;
  const padBottom = 10;
  const chartH = height - padTop - padBottom;
  const max = Math.max(1, ...points.map((p) => Math.max(p.a, p.b)));
  const slot = points.length ? (width - padX * 2) / points.length : 1;
  const barW = Math.max(3, Math.min(10, slot * 0.32));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="admin-fin-chart-svg"
      role="img"
      aria-label={ariaLabel}
    >
      <line
        x1={padX}
        x2={width - padX}
        y1={padTop + chartH * 0.55}
        y2={padTop + chartH * 0.55}
        stroke="#d7ddd0"
        strokeDasharray="4 4"
      />
      {points.map((p, i) => {
        const x = padX + i * slot + slot / 2;
        const ha = (p.a / max) * chartH;
        const hb = (p.b / max) * chartH;
        return (
          <g key={`${p.label}-${i}`}>
            <rect
              x={x - barW - 1}
              y={padTop + chartH - ha}
              width={barW}
              height={Math.max(ha, 1)}
              fill="#2A3020"
              rx={1}
            />
            <rect
              x={x + 1}
              y={padTop + chartH - hb}
              width={barW}
              height={Math.max(hb, 1)}
              fill="#c5cbb8"
              rx={1}
            />
          </g>
        );
      })}
    </svg>
  );
}

export function AdminDonut({
  slices,
  centerValue,
  centerLabel,
  ariaLabel = "Allocation",
}: {
  slices: { key: string; label: string; value: number; color: string }[];
  centerValue: string;
  centerLabel: string;
  ariaLabel?: string;
}) {
  const size = 180;
  const r = 58;
  const cx = 90;
  const cy = 90;
  const circ = 2 * Math.PI * r;
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;

  return (
    <div className="admin-fin-donut">
      <svg viewBox={`0 0 ${size} ${size}`} className="admin-fin-donut-svg" role="img" aria-label={ariaLabel}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth="18"
        />
        {slices.map((s) => {
          const len = (s.value / total) * circ;
          const dash = `${len} ${circ - len}`;
          const el = (
            <circle
              key={s.key}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="18"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="admin-fin-donut-center">
        <p className="admin-fin-donut-kicker">{centerLabel}</p>
        <p className="admin-fin-donut-value">{centerValue}</p>
      </div>
    </div>
  );
}
