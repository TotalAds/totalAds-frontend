import React from "react";
import { Activity, AlertTriangle, Gauge, ShieldAlert } from "lucide-react";
import type { DeliverabilityAlert } from "@/types/analytics";
import {
  deliverabilityActionDescription,
  deliverabilityActionLabel,
  formatDeliverabilityRate,
} from "@/lib/deliverabilitySafeguards";

interface DeliverabilityStatusCardProps {
  alerts?: DeliverabilityAlert[];
}

function statusIcon(action?: DeliverabilityAlert["deliverabilityAction"]) {
  switch (action) {
    case "emergency":
    case "pause":
      return <ShieldAlert className="h-4 w-4 text-rose-600" />;
    case "slow":
      return <Gauge className="h-4 w-4 text-amber-600" />;
    case "warn":
      return <Activity className="h-4 w-4 text-sky-600" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-500" />;
  }
}

function cardTone(alert?: DeliverabilityAlert) {
  if (
    alert?.deliverabilityAction === "emergency" ||
    alert?.deliverabilityAction === "pause" ||
    alert?.rollingBounceAction === "pause" ||
    alert?.severity === "critical"
  ) {
    return "border-rose-200 bg-rose-50/60";
  }
  if (alert?.deliverabilityAction === "slow" || alert?.severity === "warning") {
    return "border-amber-200 bg-amber-50/60";
  }
  if (alert?.deliverabilityAction === "warn" || alert?.severity === "info") {
    return "border-sky-200 bg-sky-50/60";
  }
  return "border-gray-200 bg-white";
}

export const DeliverabilityStatusCard: React.FC<DeliverabilityStatusCardProps> = ({
  alerts = [],
}) => {
  const primary =
    alerts.find((a) => a.deliverabilityAction === "emergency") ||
    alerts.find((a) => a.rollingBounceAction === "pause") ||
    alerts.find((a) => a.deliverabilityAction === "pause") ||
    alerts.find((a) => a.deliverabilityAction === "slow") ||
    alerts.find((a) => a.deliverabilityAction === "warn") ||
    alerts[0];

  if (!primary) return null;

  const label = deliverabilityActionLabel(primary.deliverabilityAction);
  const description = deliverabilityActionDescription({
    action: primary.deliverabilityAction,
    sent7d: primary.sent7d,
    rollingBounceAction: primary.rollingBounceAction,
  });

  return (
    <div className={`mb-6 rounded-xl border p-4 ${cardTone(primary)}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{statusIcon(primary.deliverabilityAction)}</div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">Sender deliverability</h3>
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-700">
              {label}
            </span>
            {primary.rollingBounceAction === "pause" && (
              <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-800">
                Bad batch
              </span>
            )}
          </div>
          <p className="text-xs leading-relaxed text-gray-700">{description}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-600">
            <span>
              7-day sends: <strong>{primary.sent7d ?? "—"}</strong>
            </span>
            <span>
              7-day bounce: <strong>{formatDeliverabilityRate(primary.bounceRate7d)}</strong>
            </span>
            <span>
              Today&apos;s cap: <strong>{primary.currentCap}/day</strong> ({primary.usedToday} used)
            </span>
          </div>
          {primary.reasons.length > 0 && (
            <ul className="list-disc pl-4 text-xs text-gray-600 space-y-1">
              {primary.reasons.slice(0, 3).map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
