"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import type { BlsSettings } from "@/lib/types";

interface BlsToolbarProps {
  bls: BlsSettings;
  onChange: (patch: Partial<BlsSettings>) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  dimmed?: boolean;
}

function Seg({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="seg-label">{label}</span>
      <div className="seg-group">{children}</div>
    </div>
  );
}

function SegBtn({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`seg-btn ${active ? "seg-btn-active" : ""}`}
    >
      {children}
    </button>
  );
}

export function BlsToolbar({
  bls,
  onChange,
  collapsed,
  onToggleCollapse,
  dimmed,
}: BlsToolbarProps) {
  if (collapsed) {
    return (
      <div className="bls-dock bls-dock--collapsed">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="bls-collapse-pill apple-spring-interactive pointer-events-auto"
          aria-label="Show BLS controls"
          aria-expanded={false}
        >
          <ChevronUp size={16} strokeWidth={2.25} />
          <span>BLS controls</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`bls-dock transition-opacity duration-300 ${
        dimmed ? "pointer-events-none opacity-35" : ""
      }`}
    >
      <div className="glass-toolbar bls-toolbar-inner">
        <div className="flex flex-1 flex-wrap items-end gap-x-5 gap-y-3">
          <Seg label="Speed">
            {[0.8, 1.0, 1.2].map((hz) => (
              <SegBtn
                key={hz}
                active={bls.speedHz === hz}
                onClick={() => onChange({ speedHz: hz })}
              >
                {hz}
              </SegBtn>
            ))}
          </Seg>
          <Seg label="Repeats">
            <SegBtn
              active={bls.repeats === "24"}
              onClick={() => onChange({ repeats: "24" })}
            >
              24
            </SegBtn>
            <SegBtn
              active={bls.repeats === "infinity"}
              onClick={() => onChange({ repeats: "infinity" })}
            >
              ∞
            </SegBtn>
          </Seg>
          <Seg label="Sound">
            {(["mute", "click", "pulse", "tone"] as const).map((s) => (
              <SegBtn
                key={s}
                active={bls.sound === s}
                onClick={() => onChange({ sound: s })}
              >
                {s}
              </SegBtn>
            ))}
          </Seg>
          <Seg label="Animation">
            <SegBtn
              active={bls.animation === "dot"}
              onClick={() => onChange({ animation: "dot" })}
            >
              dot
            </SegBtn>
            <SegBtn
              active={bls.animation === "flash"}
              onClick={() => onChange({ animation: "flash" })}
            >
              flash
            </SegBtn>
          </Seg>
          <Seg label="Vibration">
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={bls.vibrationIntensity}
              onChange={(e) =>
                onChange({ vibrationIntensity: parseFloat(e.target.value) })
              }
              className="range-apple"
            />
          </Seg>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="btn-icon bls-hide-btn shrink-0"
          aria-label="Hide BLS controls"
          aria-expanded={true}
        >
          <ChevronDown size={17} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}
