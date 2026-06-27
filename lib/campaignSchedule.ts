import { normalizeScheduleTime } from "./scheduleTimeOptions";
import {
  getBrowserTimezone,
  normalizeTimezoneValue,
} from "@/utils/timezones";

export interface CampaignScheduleWindow {
  id: string;
  name: string;
  fromTime: string;
  toTime: string;
  timezone: string;
  activeDays: string[];
}

export interface CampaignScheduleConfig {
  startMode: "now" | "date";
  startDate?: string;
  endMode: "none" | "date";
  endDate?: string;
  /** Primary timezone (mirrors first schedule window). */
  timezone?: string;
  schedules: CampaignScheduleWindow[];
}

export function createDefaultSchedule(name = "Default schedule"): CampaignScheduleWindow {
  return {
    id: `sched-${Date.now()}`,
    name,
    fromTime: "9:00 AM",
    toTime: "6:00 PM",
    timezone: getBrowserTimezone(),
    activeDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  };
}

export function createDefaultScheduleConfig(): CampaignScheduleConfig {
  const schedule = createDefaultSchedule();
  return {
    startMode: "now",
    endMode: "none",
    timezone: schedule.timezone,
    schedules: [schedule],
  };
}

export function normalizeScheduleConfig(
  raw: unknown
): CampaignScheduleConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<CampaignScheduleConfig> & {
    schedule_config?: Partial<CampaignScheduleConfig>;
  };
  const source = value.schedules?.length ? value : value.schedule_config || value;
  if (!Array.isArray(source.schedules) || source.schedules.length === 0) return null;

  const rootTimezone = normalizeTimezoneValue(
    source.timezone || source.schedules[0]?.timezone
  );

  const schedules = source.schedules.map((schedule) => ({
    id: String(schedule.id || `sched-${Date.now()}`),
    name: String(schedule.name || "Schedule"),
    fromTime: normalizeScheduleTime(schedule.fromTime, "9:00 AM"),
    toTime: normalizeScheduleTime(schedule.toTime, "6:00 PM"),
    timezone: normalizeTimezoneValue(schedule.timezone || rootTimezone),
    activeDays: Array.isArray(schedule.activeDays)
      ? schedule.activeDays.map(String)
      : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  }));

  return {
    startMode: source.startMode === "date" ? "date" : "now",
    startDate: source.startDate || undefined,
    endMode: "none",
    endDate: undefined,
    timezone: schedules[0]?.timezone || rootTimezone,
    schedules,
  };
}

export function buildScheduleConfigPayload(
  config: Pick<CampaignScheduleConfig, "startMode" | "startDate" | "endMode" | "schedules">
): CampaignScheduleConfig {
  const schedules = config.schedules.map((schedule) => ({
    ...schedule,
    timezone: normalizeTimezoneValue(schedule.timezone),
  }));
  const primaryTimezone =
    schedules[0]?.timezone || getBrowserTimezone();

  return {
    startMode: config.startMode,
    startDate: config.startMode === "date" && config.startDate ? config.startDate : undefined,
    endMode: "none",
    timezone: primaryTimezone,
    schedules: schedules.map((schedule) => ({
      ...schedule,
      timezone: schedule.timezone || primaryTimezone,
    })),
  };
}
