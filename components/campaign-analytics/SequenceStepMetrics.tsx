interface SequenceStepMetric {
  stepIndex: number;
  delayMinutes: number;
  subject: string;
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  read: number;
  replied: number;
  failed: number;
  pending?: number;
  processing?: number;
  remaining?: number;
  scheduledToday?: number;
  scheduledTomorrow?: number;
  nextPlannedSendAt?: string | null;
}

const formatNextWindow = (rawDate?: string | null): string => {
  if (!rawDate) return "Ready to send";
  const dt = new Date(rawDate);
  if (Number.isNaN(dt.getTime())) return "Ready to send";
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startTomorrow = new Date(startToday);
  startTomorrow.setDate(startTomorrow.getDate() + 1);
  const timeLabel = dt.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (dt < startTomorrow) return `Starts today at ${timeLabel}`;
  return `Starts tomorrow at ${timeLabel}`;
};

export function SequenceStepMetrics({ steps }: { steps: SequenceStepMetric[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      {steps.map((step) => (
        <div key={step.stepIndex} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Sequence step {step.stepIndex + 1}
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-900">{step.subject || "Untitled step"}</p>
          <p className="mt-1 text-xs text-slate-600">
            Day {Math.round((step.delayMinutes || 0) / 1440)} follow-up • {formatNextWindow(step.nextPlannedSendAt)}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
            <div className="rounded-md bg-slate-50 p-2">
              <p className="text-slate-500">Total in step</p>
              <p className="font-semibold text-slate-900">{step.total}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-2">
              <p className="text-slate-500">Sent</p>
              <p className="font-semibold text-slate-900">{step.sent}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-2">
              <p className="text-slate-500">Remaining</p>
              <p className="font-semibold text-slate-900">{step.remaining ?? 0}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-2">
              <p className="text-slate-500">Tomorrow queue</p>
              <p className="font-semibold text-slate-900">{step.scheduledTomorrow ?? 0}</p>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-slate-500">Delivered</p>
              <p className="font-semibold text-slate-900">{step.delivered}</p>
            </div>
            <div>
              <p className="text-slate-500">Opened</p>
              <p className="font-semibold text-slate-900">{step.opened}</p>
            </div>
            <div>
              <p className="text-slate-500">Replied</p>
              <p className="font-semibold text-slate-900">{step.replied}</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            A/B outcome insight: this step gets value-focused copy for recipients who did not reply in prior steps.
          </p>
          <div className="mt-1 text-[11px] text-slate-500">
            Failed: <span className="font-medium text-slate-700">{step.failed}</span> • Processing:{" "}
            <span className="font-medium text-slate-700">{step.processing ?? 0}</span> • Scheduled today:{" "}
            <span className="font-medium text-slate-700">{step.scheduledToday ?? 0}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

