"use client";

/** Lightweight SVG charts for admin overview — no chart library. */

export type StackedBarPoint = {
  label: string;
  a: number;
  b: number;
  c: number;
};

const COLORS = {
  a: "#84B067",
  b: "#C6D67E",
  c: "#E8A87C",
};

export function AdminStackedBars({
  points,
  height = 180,
}: {
  points: StackedBarPoint[];
  height?: number;
}) {
  const max = Math.max(1, ...points.map((p) => p.a + p.b + p.c));
  const barW = 28;
  const gap = 18;
  const padX = 12;
  const padTop = 12;
  const padBottom = 28;
  const chartH = height - padTop - padBottom;
  const width = padX * 2 + points.length * barW + (points.length - 1) * gap;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="admin-chart-svg"
      role="img"
      aria-label="Activity last 7 days"
    >
      {points.map((p, i) => {
        const x = padX + i * (barW + gap);
        const total = p.a + p.b + p.c;
        const h = (total / max) * chartH;
        const yBase = padTop + chartH;
        const ha = total ? (p.a / max) * chartH : 0;
        const hb = total ? (p.b / max) * chartH : 0;
        const hc = total ? (p.c / max) * chartH : 0;
        const yA = yBase - h;
        const yB = yA + ha;
        const yC = yB + hb;
        return (
          <g key={`${p.label}-${i}`}>
            {ha > 0 && (
              <rect x={x} y={yA} width={barW} height={ha} fill={COLORS.a} />
            )}
            {hb > 0 && (
              <rect x={x} y={yB} width={barW} height={hb} fill={COLORS.b} />
            )}
            {hc > 0 && (
              <rect x={x} y={yC} width={barW} height={hc} fill={COLORS.c} />
            )}
            {total === 0 && (
              <rect
                x={x}
                y={yBase - 4}
                width={barW}
                height={4}
                rx={2}
                fill="var(--border)"
              />
            )}
            <rect
              x={x}
              y={yA}
              width={barW}
              height={Math.max(h, 4)}
              rx={6}
              fill="transparent"
              stroke="none"
            />
            <text
              x={x + barW / 2}
              y={height - 8}
              textAnchor="middle"
              className="admin-chart-axis"
            >
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
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
}: {
  value: number;
  label: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const r = 54;
  const circ = Math.PI * r;
  const dash = (pct / 100) * circ;
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
          stroke="#84B067"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div className="admin-gauge-center">
        <p className="admin-gauge-value">{Math.round(pct)}%</p>
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
