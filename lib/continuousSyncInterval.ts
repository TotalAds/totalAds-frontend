/** Frontend copy of continuous sync interval options (backend: totalads-shared continuousCampaign.ts). */

export const MIN_CONTINUOUS_SYNC_INTERVAL_MINUTES = 30;
export const MAX_CONTINUOUS_SYNC_INTERVAL_MINUTES = 24 * 60;
export const DEFAULT_CONTINUOUS_SYNC_INTERVAL_MINUTES = 12 * 60;

export const CONTINUOUS_SYNC_INTERVAL_OPTIONS: ReadonlyArray<{
  minutes: number;
  label: string;
}> = [
  { minutes: 30, label: "Every 30 minutes" },
  { minutes: 60, label: "Every 1 hour" },
  { minutes: 90, label: "Every 1.5 hours" },
  { minutes: 120, label: "Every 2 hours" },
  { minutes: 180, label: "Every 3 hours" },
  { minutes: 240, label: "Every 4 hours" },
  { minutes: 360, label: "Every 6 hours" },
  { minutes: 480, label: "Every 8 hours" },
  { minutes: 720, label: "Every 12 hours" },
  { minutes: 1440, label: "Every 24 hours" },
];

export function formatContinuousSyncInterval(minutes?: number | null): string {
  const value =
    minutes != null && Number.isFinite(minutes)
      ? minutes
      : DEFAULT_CONTINUOUS_SYNC_INTERVAL_MINUTES;
  const option = CONTINUOUS_SYNC_INTERVAL_OPTIONS.find(
    (o) => o.minutes === value
  );
  if (option) return option.label;
  if (value < 60) return `Every ${value} minutes`;
  if (value % 60 === 0) {
    const hours = value / 60;
    return hours === 1 ? "Every 1 hour" : `Every ${hours} hours`;
  }
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  return `Every ${hours}h ${mins}m`;
}
