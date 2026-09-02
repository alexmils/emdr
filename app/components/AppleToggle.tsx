"use client";

interface AppleToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
}

export function AppleToggle({
  checked,
  onChange,
  label,
  disabled,
  id,
}: AppleToggleProps) {
  return (
    <label className={`apple-toggle ${disabled ? "apple-toggle-disabled" : ""}`}>
      <input
        id={id}
        type="checkbox"
        className="apple-toggle-input"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="apple-toggle-track" aria-hidden="true">
        <span className="apple-toggle-thumb" />
      </span>
      {label ? <span className="sr-only">{label}</span> : null}
    </label>
  );
}
