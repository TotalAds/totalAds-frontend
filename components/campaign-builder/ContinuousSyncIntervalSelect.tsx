"use client";

import {
  CONTINUOUS_SYNC_INTERVAL_OPTIONS,
  DEFAULT_CONTINUOUS_SYNC_INTERVAL_MINUTES,
  formatContinuousSyncInterval,
} from "@/lib/continuousSyncInterval";

interface ContinuousSyncIntervalSelectProps {
  value?: number | null;
  onChange: (minutes: number) => void;
  disabled?: boolean;
  id?: string;
}

export function ContinuousSyncIntervalSelect({
  value,
  onChange,
  disabled,
  id = "continuous-sync-interval",
}: ContinuousSyncIntervalSelectProps) {
  const selected =
    value && CONTINUOUS_SYNC_INTERVAL_OPTIONS.some((o) => o.minutes === value)
      ? value
      : DEFAULT_CONTINUOUS_SYNC_INTERVAL_MINUTES;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-medium text-slate-700"
      >
        Source sync interval
      </label>
      <select
        id={id}
        disabled={disabled}
        value={selected}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:bg-slate-50 disabled:text-slate-400"
      >
        {CONTINUOUS_SYNC_INTERVAL_OPTIONS.map((option) => (
          <option key={option.minutes} value={option.minutes}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="text-[11px] text-slate-500">
        LeadHub and Google Sheets auto-sync on this schedule:{" "}
        {formatContinuousSyncInterval(selected).toLowerCase()}.
      </p>
    </div>
  );
}
