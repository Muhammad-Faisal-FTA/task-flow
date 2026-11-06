"use client";

import { Timer } from "lucide-react";

interface TaskDurationFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

export function TaskDurationField({ value, onChange }: TaskDurationFieldProps) {
  const invalid = value != null && (!Number.isInteger(value) || value < 1 || value > 1440);
  return (
    <label className="mb-5 flex flex-col gap-2">
      <span className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
        <Timer className="h-4 w-4" /> Timer duration (minutes)
      </span>
      <input type="number" min={1} max={1440} step={1} value={value ?? ""}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
        placeholder="e.g. 25" className="auth-input w-full" />
      {invalid && <span role="alert" className="text-xs" style={{ color: "var(--color-overdue)" }}>Duration must be between 1 and 1440 minutes.</span>}
    </label>
  );
}
