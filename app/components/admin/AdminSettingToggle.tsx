"use client";

import type { ReactNode } from "react";
import { AppleToggle } from "@/app/components/AppleToggle";

export type AdminSettingToggleTone = "neutral" | "caution" | "danger" | "ok";

type Props = {
  id?: string;
  title: string;
  /** Short line under the title — what On/Off means right now. */
  status: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Visual weight. Default: caution when on, neutral when off. */
  tone?: AdminSettingToggleTone;
};

export function AdminSettingToggle({
  id,
  title,
  status,
  checked,
  onChange,
  disabled,
  tone,
}: Props) {
  const resolvedTone: AdminSettingToggleTone =
    tone ?? (checked ? "caution" : "neutral");

  return (
    <div
      className={`admin-setting-toggle admin-setting-toggle-${resolvedTone}`}
    >
      <div className="admin-setting-toggle-row">
        <div className="admin-setting-toggle-copy">
          <p className="admin-setting-toggle-title">{title}</p>
          <p className="admin-setting-toggle-status">{status}</p>
        </div>
        <AppleToggle
          id={id}
          checked={checked}
          disabled={disabled}
          label={title}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

/** Vertical stack of setting toggles. */
export function AdminSettingToggleStack({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="admin-setting-toggle-stack">{children}</div>;
}
