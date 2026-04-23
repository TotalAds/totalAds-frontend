import { CampaignLeadSequenceRow } from "@/utils/api/emailClient";

import { LeadSequenceTable } from "./LeadSequenceTable";
import { SequenceStepMetrics } from "./SequenceStepMetrics";

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

export function SequenceTreeOverview({
  steps,
  rows,
  markingReplied,
  onMarkReplied,
}: {
  steps: SequenceStepMetric[];
  rows: CampaignLeadSequenceRow[];
  markingReplied: string | null;
  onMarkReplied: (leadId: string) => void;
}) {
  const totalSteps = steps.length;
  const totalRemaining = steps.reduce(
    (sum, step) => sum + Number(step.remaining ?? step.pending ?? 0) + Number(step.processing ?? 0),
    0
  );
  const totalSent = steps.reduce((sum, step) => sum + Number(step.sent || 0), 0);
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <h3 className="text-sm font-semibold text-slate-900">Sequence performance</h3>
        <p className="mt-1 text-xs text-slate-600">
          {totalSteps} emails in sequence • {totalSent.toLocaleString()} sent •{" "}
          {totalRemaining.toLocaleString()} remaining.
        </p>
      </div>
      <SequenceStepMetrics steps={steps} />
      <div className="space-y-4">
        {steps.map((step) => {
          const stepRows = rows.filter(
            (row) => Number(row.sequenceStepIndex || 0) === Number(step.stepIndex || 0)
          );
          return (
            <LeadSequenceTable
              key={step.stepIndex}
              title={`Step ${step.stepIndex + 1} lead list`}
              rows={stepRows}
              markingReplied={markingReplied}
              onMarkReplied={onMarkReplied}
            />
          );
        })}
      </div>
    </div>
  );
}

