/**
 * Campaign daily send time: UI uses the user's local clock (browser timezone).
 * API / DB store UTC "HH:MM" aligned with sender quota day boundaries (UTC midnight).
 */

function padTime(n: number): string {
  return String(n).padStart(2, "0");
}

export function localTimeToUtcHHMM(localTime: string): string {
  if (!/^\d{2}:\d{2}$/.test(localTime)) return localTime;
  const [hours, minutes] = localTime.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return `${padTime(date.getUTCHours())}:${padTime(date.getUTCMinutes())}`;
}

export function utcTimeToLocalHHMM(utcTime: string): string {
  if (!/^\d{2}:\d{2}$/.test(utcTime)) return utcTime;
  const [hours, minutes] = utcTime.split(":").map(Number);
  const date = new Date();
  date.setUTCHours(hours, minutes, 0, 0);
  return `${padTime(date.getHours())}:${padTime(date.getMinutes())}`;
}

/** Human-readable hint for the review step (local pick → UTC stored). */
export function formatDailySendTimeHint(localTime: string): string {
  if (!/^\d{2}:\d{2}$/.test(localTime)) return "";
  const utc = localTimeToUtcHHMM(localTime);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "local";
  return `Starts at ${localTime} your time (${tz}) · stored as ${utc} UTC`;
}
