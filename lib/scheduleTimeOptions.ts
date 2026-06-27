/** 30-minute slots covering the full 24-hour day (12:00 AM – 11:30 PM). */
export const FULL_DAY_TIME_OPTIONS = build24HourTimeOptions(30);

export function build24HourTimeOptions(stepMinutes = 30): string[] {
  const options: string[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += stepMinutes) {
    options.push(minutesToDisplayTime12h(minutes));
  }
  return options;
}

export function minutesToDisplayTime12h(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const ampm = hours24 >= 12 ? "PM" : "AM";
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

export function displayTime12hToMinutes(time: string): number | null {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const ampm = match[3].toUpperCase();
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
  if (ampm === "AM") {
    if (hours === 12) hours = 0;
  } else if (hours !== 12) {
    hours += 12;
  }
  return hours * 60 + minutes;
}

export function isValidScheduleTime(time: string): boolean {
  return displayTime12hToMinutes(time) != null;
}

/** Snap unknown saved values to the nearest 30-minute slot, or return fallback. */
export function normalizeScheduleTime(
  time: string | null | undefined,
  fallback: string
): string {
  const minutes = displayTime12hToMinutes(String(time || ""));
  if (minutes == null) return fallback;
  const snapped = Math.round(minutes / 30) * 30;
  return minutesToDisplayTime12h(snapped % (24 * 60));
}

export interface SplitToTimeOptions {
  sameDay: string[];
  overnight: string[];
  all: string[];
}

/**
 * Valid "To" times for a given "From" — excludes the same instant.
 * Same-day window first, then overnight (wraps past midnight).
 */
export function splitToTimeOptions(
  fromTime: string,
  allOptions: string[] = FULL_DAY_TIME_OPTIONS
): SplitToTimeOptions {
  const fromMin = displayTime12hToMinutes(fromTime);
  if (fromMin == null) {
    const all = allOptions.filter((t) => t !== fromTime);
    return { sameDay: all, overnight: [], all };
  }

  const sameDay: string[] = [];
  const overnight: string[] = [];

  for (const option of allOptions) {
    if (option === fromTime) continue;
    const optionMin = displayTime12hToMinutes(option);
    if (optionMin == null) continue;
    if (optionMin > fromMin) {
      sameDay.push(option);
    } else {
      overnight.push(option);
    }
  }

  return { sameDay, overnight, all: [...sameDay, ...overnight] };
}

/** Next 30-minute slot after `fromTime`, wrapping at end of day. */
export function getNextTimeSlotAfter(
  fromTime: string,
  allOptions: string[] = FULL_DAY_TIME_OPTIONS
): string {
  const split = splitToTimeOptions(fromTime, allOptions);
  if (split.sameDay.length > 0) return split.sameDay[0];
  if (split.overnight.length > 0) return split.overnight[0];
  return allOptions[1] || allOptions[0];
}

export function coerceToTimeForFromChange(
  fromTime: string,
  currentToTime: string,
  allOptions: string[] = FULL_DAY_TIME_OPTIONS
): string {
  const split = splitToTimeOptions(fromTime, allOptions);
  if (currentToTime === fromTime) {
    return getNextTimeSlotAfter(fromTime, allOptions);
  }
  if (split.all.includes(currentToTime)) {
    return currentToTime;
  }
  return getNextTimeSlotAfter(fromTime, allOptions);
}
