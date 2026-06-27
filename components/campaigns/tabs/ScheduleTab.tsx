"use client";

import { Calendar, Check, Clock, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
  buildScheduleConfigPayload,
  createDefaultSchedule,
  createDefaultScheduleConfig,
  normalizeScheduleConfig,
  type CampaignScheduleConfig,
  type CampaignScheduleWindow,
} from "@/lib/campaignSchedule";
import {
  coerceToTimeForFromChange,
  FULL_DAY_TIME_OPTIONS,
  splitToTimeOptions,
} from "@/lib/scheduleTimeOptions";
import { INBOX_CAMPAIGN_DOMAIN_ID } from "@/lib/campaignDomain";
import { getCampaignById, patchCampaign } from "@/utils/api/emailClient";
import { buildTimezoneSelectOptions } from "@/utils/timezones";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface ScheduleTabProps {
  campaignId: string;
  domainId?: string;
  campaignStatus?: string;
}

function configToState(config: CampaignScheduleConfig) {
  return {
    startMode: config.startMode,
    startDate: config.startDate || "",
    schedules: config.schedules,
    selectedScheduleId: config.schedules[0]?.id || "",
  };
}

export function ScheduleTab({ campaignId, domainId, campaignStatus }: ScheduleTabProps) {
  const effectiveDomainId = domainId || INBOX_CAMPAIGN_DOMAIN_ID;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [startMode, setStartMode] = useState<"now" | "date">("now");
  const [startDate, setStartDate] = useState("");
  const [schedules, setSchedules] = useState<CampaignScheduleWindow[]>([
    createDefaultSchedule(),
  ]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(schedules[0].id);
  const [timezoneSearch, setTimezoneSearch] = useState("");

  const isLocked = campaignStatus === "sending" || campaignStatus === "verifying_leads";
  const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId) || schedules[0];

  const filteredTimezones = useMemo(
    () => buildTimezoneSelectOptions(selectedSchedule?.timezone, timezoneSearch),
    [timezoneSearch, selectedSchedule?.timezone]
  );

  const toTimeGroups = useMemo(() => {
    if (!selectedSchedule) {
      return { sameDay: [] as string[], overnight: [] as string[] };
    }
    return splitToTimeOptions(selectedSchedule.fromTime, FULL_DAY_TIME_OPTIONS);
  }, [selectedSchedule]);

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const campaign = await getCampaignById(effectiveDomainId, campaignId);
      const rawConfig =
        campaign.scheduleConfig ??
        (campaign as { schedule_config?: unknown }).schedule_config;
      const config =
        normalizeScheduleConfig(rawConfig) || createDefaultScheduleConfig();
      const state = configToState(config);
      setStartMode(state.startMode);
      setStartDate(state.startDate);
      setSchedules(
        state.schedules.map((schedule) => ({
          ...schedule,
          toTime: coerceToTimeForFromChange(schedule.fromTime, schedule.toTime),
        }))
      );
      setSelectedScheduleId(state.selectedScheduleId);
      setTimezoneSearch("");
    } catch {
      toast.error("Could not load campaign schedule");
    } finally {
      setLoading(false);
    }
  }, [campaignId, effectiveDomainId]);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  const updateSchedule = (id: string, changes: Partial<CampaignScheduleWindow>) => {
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...changes } : s)));
    setSaved(false);
  };

  const handleFromTimeChange = (id: string, fromTime: string) => {
    const schedule = schedules.find((s) => s.id === id);
    if (!schedule) return;
    const toTime = coerceToTimeForFromChange(fromTime, schedule.toTime, FULL_DAY_TIME_OPTIONS);
    updateSchedule(id, { fromTime, toTime });
  };

  const handleToTimeChange = (id: string, toTime: string) => {
    updateSchedule(id, { toTime });
  };

  const addSchedule = () => {
    const newSchedule = createDefaultSchedule(`Schedule ${schedules.length + 1}`);
    setSchedules((prev) => [...prev, newSchedule]);
    setSelectedScheduleId(newSchedule.id);
    setSaved(false);
  };

  const deleteSchedule = (id: string) => {
    if (schedules.length <= 1) {
      toast.error("At least one schedule is required");
      return;
    }
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    if (selectedScheduleId === id) {
      setSelectedScheduleId(schedules.find((s) => s.id !== id)?.id || "");
    }
    setSaved(false);
  };

  const toggleDay = (id: string, day: string) => {
    const schedule = schedules.find((s) => s.id === id);
    if (!schedule) return;
    const active = schedule.activeDays.includes(day)
      ? schedule.activeDays.filter((d) => d !== day)
      : [...schedule.activeDays, day];
    if (active.length === 0) {
      toast.error("At least one active day is required");
      return;
    }
    updateSchedule(id, { activeDays: active });
  };

  const buildPayload = (): CampaignScheduleConfig =>
    buildScheduleConfigPayload({
      startMode,
      startDate,
      endMode: "none",
      schedules,
    });

  const handleSave = async () => {
    if (isLocked) {
      toast.error("Schedule cannot be changed while the campaign is sending");
      return;
    }
    if (startMode === "date" && !startDate) {
      toast.error("Select a start date");
      return;
    }

    setSaving(true);
    try {
      await patchCampaign(effectiveDomainId, campaignId, {
        scheduleConfig: buildPayload(),
      });
      setSaved(true);
      toast.success("Schedule saved");
      setTimeout(() => setSaved(false), 2500);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not save schedule");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[560px] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading schedule…
      </div>
    );
  }

  return (
    <div className="flex min-h-[560px]">
      <div className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
        <div className="space-y-3 border-b border-slate-200 p-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Start
              </span>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={isLocked}
                onClick={() => {
                  setStartMode("now");
                  setSaved(false);
                }}
                className={`flex-1 rounded-md py-1 text-[11px] font-medium transition-colors ${
                  startMode === "now"
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                Now
              </button>
              <button
                type="button"
                disabled={isLocked}
                onClick={() => {
                  setStartMode("date");
                  setSaved(false);
                }}
                className={`flex-1 rounded-md py-1 text-[11px] font-medium transition-colors ${
                  startMode === "date"
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                Date
              </button>
            </div>
            {startMode === "date" && (
              <input
                type="date"
                disabled={isLocked}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSaved(false);
                }}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-none disabled:opacity-60"
              />
            )}
            <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
              Send windows use the timezone selected below. Times apply in that timezone (saved as
              UTC for delivery).
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              onClick={() => setSelectedScheduleId(schedule.id)}
              className={`group flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                selectedScheduleId === schedule.id
                  ? "border-blue-300 bg-white shadow-sm ring-1 ring-blue-200"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate text-xs font-medium text-slate-700">
                  {schedule.name}
                </span>
              </div>
              {schedules.length > 1 && !isLocked && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSchedule(schedule.id);
                  }}
                  className="hidden h-5 w-5 items-center justify-center text-slate-400 hover:text-red-500 group-hover:flex"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            disabled={isLocked}
            onClick={addSchedule}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-500 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" />
            Add schedule
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col bg-white">
        {selectedSchedule && (
          <>
            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {isLocked ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Schedule is locked while this campaign is sending. Pause or stop the campaign to
                  edit timing.
                </div>
              ) : null}

              <div className="rounded-xl border border-slate-200 p-5">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Schedule Name
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={selectedSchedule.name}
                  onChange={(e) => updateSchedule(selectedSchedule.id, { name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                />
              </div>

              <div className="rounded-xl border border-slate-200 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-700">Timing</h3>
                </div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-500">From</label>
                    <select
                      disabled={isLocked}
                      value={selectedSchedule.fromTime}
                      onChange={(e) =>
                        handleFromTimeChange(selectedSchedule.id, e.target.value)
                      }
                      className="w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                    >
                      {FULL_DAY_TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-500">To</label>
                    <select
                      disabled={isLocked}
                      value={selectedSchedule.toTime}
                      onChange={(e) =>
                        handleToTimeChange(selectedSchedule.id, e.target.value)
                      }
                      className="w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                    >
                      {toTimeGroups.sameDay.length > 0 ? (
                        <optgroup label="Same day">
                          {toTimeGroups.sameDay.map((t) => (
                            <option key={`same-${t}`} value={t}>
                              {t}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                      {toTimeGroups.overnight.length > 0 ? (
                        <optgroup label="Overnight (ends next day)">
                          {toTimeGroups.overnight.map((t) => (
                            <option key={`overnight-${t}`} value={t}>
                              {t}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-500">
                      Timezone
                    </label>
                    <div className="relative mb-1.5">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="search"
                        disabled={isLocked}
                        value={timezoneSearch}
                        onChange={(e) => setTimezoneSearch(e.target.value)}
                        placeholder="Search timezones…"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                      />
                    </div>
                    <select
                      disabled={isLocked}
                      value={selectedSchedule.timezone}
                      onChange={(e) =>
                        updateSchedule(selectedSchedule.id, { timezone: e.target.value })
                      }
                      className="w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                    >
                      {filteredTimezones.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.offset ? `${tz.label} (${tz.offset})` : tz.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  Full 24-hour window in 30-minute steps. Pick <strong>To</strong> after{" "}
                  <strong>From</strong> for same-day sends, or choose an overnight time to wrap past
                  midnight.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-5">
                <h3 className="mb-4 text-sm font-semibold text-slate-700">Active Days</h3>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => {
                    const active = selectedSchedule.activeDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={isLocked}
                        onClick={() => toggleDay(selectedSchedule.id, day)}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all disabled:opacity-60 ${
                          active
                            ? "border-blue-300 bg-blue-600 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {active && <Check className="h-3.5 w-3.5" />}
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  Emails only send on selected days within the timing window in the selected
                  timezone. The campaign runs until all leads are processed — no end date is
                  required.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-3">
              <button
                type="button"
                disabled={isLocked || saving}
                onClick={() => void handleSave()}
                className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                  saved
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving…
                  </>
                ) : saved ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Saved
                  </>
                ) : (
                  "Save Schedule"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
