"use client";

import type { BlsSettings } from "@/lib/types";
import { clampBlsSpeed, getActiveSpeedHz } from "@/lib/bls-speed";

export function GearPanel({
  bls,
  onChange,
  onClose,
}: {
  bls: BlsSettings;
  onChange: (patch: Partial<BlsSettings>) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/25 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="apple-sheet w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1 text-[17px] font-semibold tracking-[-0.02em]">
          Ball adjustments
        </h3>
        <p className="mb-5 text-[12px] text-[var(--text-secondary)]">
          Fine-tune appearance and set timing
        </p>
        <div className="space-y-5 text-[13px]">
          <label className="block">
            <span className="mb-2 block font-medium">Color</span>
            <input
              type="color"
              value={bls.ballColor}
              onChange={(e) => onChange({ ballColor: e.target.value })}
              className="h-11 w-full cursor-pointer rounded-[10px] border border-[var(--separator)]"
            />
          </label>
          <label className="block">
            <span className="mb-2 block font-medium">Size — {bls.ballSize}px</span>
            <input
              type="range"
              min={24}
              max={80}
              value={bls.ballSize}
              onChange={(e) =>
                onChange({ ballSize: parseInt(e.target.value, 10) })
              }
              className="range-apple w-full"
            />
          </label>
          <label className="block">
            <span className="mb-2 block font-medium">Background</span>
            <input
              type="color"
              value={bls.background}
              onChange={(e) => onChange({ background: e.target.value })}
              className="h-11 w-full cursor-pointer rounded-[10px] border border-[var(--separator)]"
            />
          </label>
          <label className="block">
            <span className="mb-2 block font-medium">
              Active speed — {getActiveSpeedHz(bls).toFixed(2)} Hz
            </span>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={bls.speedPresets[bls.activeSpeedPreset]}
              onChange={(e) => {
                const next = [...bls.speedPresets] as [number, number, number];
                next[bls.activeSpeedPreset] = clampBlsSpeed(
                  parseFloat(e.target.value)
                );
                onChange({ speedPresets: next });
              }}
              className="range-apple w-full"
            />
          </label>
          <label className="block">
            <span className="mb-2 block font-medium">
              Set length — {bls.setLengthSec}s
            </span>
            <input
              type="range"
              min={20}
              max={60}
              value={bls.setLengthSec}
              onChange={(e) =>
                onChange({ setLengthSec: parseInt(e.target.value, 10) })
              }
              className="range-apple w-full"
            />
          </label>
        </div>
        <button type="button" onClick={onClose} className="btn-primary mt-6 w-full">
          Done
        </button>
      </div>
    </div>
  );
}
