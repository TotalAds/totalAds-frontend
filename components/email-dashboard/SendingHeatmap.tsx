"use client";

import { addDays, format, parseISO, startOfWeek, subDays } from "date-fns";

import { DailyCounterRow } from "@/utils/api/emailClient";

interface SendingHeatmapProps {
  counters: DailyCounterRow[];
  days: number;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function intensityClass(value: number, max: number): string {
  if (value <= 0) return "bg-slate-100";
  const ratio = value / Math.max(max, 1);
  if (ratio >= 0.75) return "bg-blue-600";
  if (ratio >= 0.5) return "bg-blue-500";
  if (ratio >= 0.25) return "bg-blue-400";
  return "bg-blue-200";
}

export function SendingHeatmap({ counters, days }: SendingHeatmapProps) {
  const map = new Map(
    counters.map((c) => [
      c.date,
      (c.sentCount || 0) + (c.bounceCount || 0) + (c.complaintCount || 0),
    ])
  );

  const end = new Date();
  const start = subDays(end, days - 1);
  const gridStart = startOfWeek(start, { weekStartsOn: 0 });
  const gridEnd = startOfWeek(addDays(end, 6), { weekStartsOn: 0 });

  const cells: Array<{ date: string; label: string; value: number }> = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    const dateStr = format(cursor, "yyyy-MM-dd");
    const inRange = cursor >= start && cursor <= end;
    cells.push({
      date: dateStr,
      label: format(cursor, "MMM d"),
      value: inRange ? map.get(dateStr) ?? 0 : -1,
    });
    cursor = addDays(cursor, 1);
  }

  const maxValue = Math.max(
    1,
    ...cells.filter((c) => c.value >= 0).map((c) => c.value)
  );
  const weeks: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const hasData = cells.some((c) => c.value > 0);

  if (!hasData) {
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/80 text-center">
        <p className="text-sm font-medium text-slate-600">No activity to map</p>
        <p className="mt-1 text-xs text-slate-500">
          Your sending calendar fills in as you send campaigns.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="mb-1 grid grid-cols-[2.5rem_repeat(7,minmax(2rem,1fr))] gap-1 text-[10px] font-medium text-slate-500">
            <div />
            {WEEKDAY_LABELS.map((d) => (
              <div key={d} className="text-center">
                {d}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div
              key={wi}
              className="mb-1 grid grid-cols-[2.5rem_repeat(7,minmax(2rem,1fr))] gap-1"
            >
              <div className="flex items-center text-[10px] text-slate-400">
                {format(parseISO(week[0]?.date || ""), "MMM d")}
              </div>
              {week.map((cell) => {
                const outOfRange = cell.value < 0;
                return (
                  <div
                    key={cell.date}
                    title={
                      outOfRange
                        ? undefined
                        : `${cell.label}: ${cell.value} emails`
                    }
                    className={`aspect-square rounded-md transition-colors ${
                      outOfRange
                        ? "bg-transparent"
                        : intensityClass(cell.value, maxValue)
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] text-slate-500">
        <span>Less</span>
        <div className="flex gap-1">
          <span className="h-3 w-3 rounded bg-slate-100" />
          <span className="h-3 w-3 rounded bg-blue-200" />
          <span className="h-3 w-3 rounded bg-blue-400" />
          <span className="h-3 w-3 rounded bg-blue-500" />
          <span className="h-3 w-3 rounded bg-blue-600" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
