"use client";

import { forwardRef } from "react";
import { ChevronDown, ChevronUp, Settings } from "lucide-react";
import type { BlsSettings, SpeedPresetIndex } from "@/lib/types";
import { adjustSpeedPreset } from "@/lib/bls-speed";
import type { BlsToolbarField } from "@/lib/bls-toolbar-nav";
import { useGamepadConnected } from "@/lib/useGamepadConnected";

interface BlsToolbarProps {
  bls: BlsSettings;
  onChange: (patch: Partial<BlsSettings>) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenGear: () => void;
  dimmed?: boolean;
  focusedField: BlsToolbarField;
  onFocusField: (field: BlsToolbarField) => void;
}

function BlsChip({
  label,
  value,
  focused,
  onSelect,
}: {
  label: string;
  value: string;
  focused?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`bls-chip ${focused ? "bls-chip-focused" : ""}`}
    >
      <span className="bls-chip-label">{label}</span>
      <span className="bls-chip-value">{value}</span>
    </button>
  );
}

function SpeedPresetChip({
  index,
  value,
  active,
  focused,
  onSelect,
  onAdjust,
}: {
  index: SpeedPresetIndex;
  value: number;
  active: boolean;
  focused: boolean;
  onSelect: () => void;
  onAdjust: (direction: 1 | -1) => void;
}) {
  return (
    <div
      className={`bls-speed-preset ${active ? "bls-speed-preset-active" : ""} ${
        focused ? "bls-speed-preset-focused" : ""
      }`}
    >
      <button
        type="button"
        className="bls-speed-arrow"
        aria-label={`Increase speed preset ${index + 1}`}
        onClick={() => onAdjust(1)}
      >
        <ChevronUp size={14} strokeWidth={2.25} />
      </button>
      <button
        type="button"
        className="bls-speed-value"
        onClick={onSelect}
        aria-label={`Speed preset ${value.toFixed(1)} Hz`}
      >
        {value.toFixed(1)}
      </button>
      <button
        type="button"
        className="bls-speed-arrow"
        aria-label={`Decrease speed preset ${index + 1}`}
        onClick={() => onAdjust(-1)}
      >
        <ChevronDown size={14} strokeWidth={2.25} />
      </button>
    </div>
  );
}

const SPEED_FIELDS: BlsToolbarField[] = ["speed0", "speed1", "speed2"];

export const BlsToolbar = forwardRef<HTMLDivElement, BlsToolbarProps>(
  function BlsToolbar(
    {
      bls,
      onChange,
      collapsed,
      onToggleCollapse,
      onOpenGear,
      dimmed,
      focusedField,
      onFocusField,
    },
    ref
  ) {
  const gamepadConnected = useGamepadConnected();

  const selectSpeed = (index: SpeedPresetIndex, field: BlsToolbarField) => {
    onFocusField(field);
    onChange({ activeSpeedPreset: index });
  };

  const adjustSpeed = (index: SpeedPresetIndex, direction: 1 | -1) => {
    onChange({
      speedPresets: adjustSpeedPreset(bls.speedPresets, index, direction),
      activeSpeedPreset: index,
    });
    onFocusField(SPEED_FIELDS[index]);
  };

  if (collapsed) {
    return (
      <div ref={ref} className="bls-dock bls-dock--collapsed">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="bls-expand-btn pointer-events-auto"
          aria-label="Show controls"
          aria-expanded={false}
        >
          <ChevronUp size={14} strokeWidth={2} />
          Controls
        </button>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`bls-dock ${dimmed ? "pointer-events-none opacity-40" : ""}`}
    >
      <div className="bls-bar">
        <div className="bls-speed-group">
          {bls.speedPresets.map((hz, index) => {
            const i = index as SpeedPresetIndex;
            const field = SPEED_FIELDS[index];
            return (
              <SpeedPresetChip
                key={field}
                index={i}
                value={hz}
                active={bls.activeSpeedPreset === i}
                focused={focusedField === field}
                onSelect={() => selectSpeed(i, field)}
                onAdjust={(dir) => adjustSpeed(i, dir)}
              />
            );
          })}
        </div>

        <span className="bls-bar-sep" aria-hidden="true" />

        <BlsChip
          label="Repeats"
          value={bls.repeats === "infinity" ? "∞" : bls.repeats}
          focused={focusedField === "repeats"}
          onSelect={() => onFocusField("repeats")}
        />
        <BlsChip
          label="Sound"
          value={bls.sound}
          focused={focusedField === "sound"}
          onSelect={() => onFocusField("sound")}
        />
        <BlsChip
          label="Animation"
          value={bls.animation}
          focused={focusedField === "animation"}
          onSelect={() => onFocusField("animation")}
        />
        <button
          type="button"
          onClick={onOpenGear}
          className="btn-icon-sm bls-gear-btn"
          aria-label="Ball adjustments"
          title="Ball adjustments"
        >
          <Settings size={16} strokeWidth={2} />
        </button>
        {gamepadConnected ? (
          <BlsChip
            label="Vibration"
            value={bls.vibration}
            focused={focusedField === "vibration"}
            onSelect={() => onFocusField("vibration")}
          />
        ) : null}

        <div className="bls-bar-spacer" />

        <button
          type="button"
          onClick={onToggleCollapse}
          className="btn-icon-sm"
          aria-label="Hide controls"
          aria-expanded={true}
        >
          <ChevronDown size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
});
