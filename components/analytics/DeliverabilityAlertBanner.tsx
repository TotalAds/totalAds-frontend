import React from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import type { DeliverabilityAlert } from "@/types/analytics";

interface DeliverabilityAlertBannerProps {
  alerts: DeliverabilityAlert[];
  throttledPendingCount?: number;
}

function formatRate(rate?: number): string {
  if (typeof rate !== "number") return "N/A";
  return `${(rate * 100).toFixed(2)}%`;
}

export const DeliverabilityAlertBanner: React.FC<DeliverabilityAlertBannerProps> = ({
  alerts,
  throttledPendingCount = 0,
}) => {
  if (!alerts.length && throttledPendingCount <= 0) return null;

  const primary =
    alerts.find((alert) => alert.severity === "critical") ||
    alerts.find((alert) => alert.severity === "warning") ||
    alerts[0];

  const isCritical = primary?.severity === "critical";
  const containerClass = isCritical
    ? "border-rose-200 bg-rose-50"
    : "border-amber-200 bg-amber-50";
  const titleClass = isCritical ? "text-rose-900" : "text-amber-900";
  const bodyClass = isCritical ? "text-rose-800" : "text-amber-800";
  const iconClass = isCritical ? "text-rose-700" : "text-amber-700";

  return (
    <div className={`mb-6 rounded-xl border p-5 ${containerClass}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${iconClass}`}>
          {isCritical ? <ShieldAlert size={18} /> : <AlertTriangle size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={`text-sm font-semibold ${titleClass}`}>
            {isCritical
              ? "Sending paused to protect deliverability"
              : "Sender quota was automatically reduced"}
          </h3>
          {primary && (
            <div className={`mt-2 space-y-2 text-xs leading-relaxed ${bodyClass}`}>
              <p>
                <span className="font-medium">{primary.senderEmail}</span> is currently limited to{" "}
                <span className="font-medium">{primary.currentCap}</span> emails/day. Used today:{" "}
                <span className="font-medium">{primary.usedToday}</span>, remaining:{" "}
                <span className="font-medium">{primary.remainingToday}</span>.
              </p>
              {primary.reasons.map((reason) => (
                <p key={reason}>{reason}</p>
              ))}
              <p>
                Health: <span className="font-medium">{primary.healthStatus || "unknown"}</span>
                {" · "}7-day bounce: <span className="font-medium">{formatRate(primary.bounceRate7d)}</span>
                {" · "}7-day complaints:{" "}
                <span className="font-medium">{formatRate(primary.complaintRate7d)}</span>
              </p>
            </div>
          )}
          {throttledPendingCount > 0 && (
            <p className={`mt-3 text-xs ${bodyClass}`}>
              <span className="font-medium">{throttledPendingCount}</span> emails are waiting for the
              next send window because today&apos;s sender cap was reached.
            </p>
          )}
          {alerts.length > 1 && (
            <div className={`mt-3 space-y-1 text-xs ${bodyClass}`}>
              {alerts.slice(1, 3).map((alert) => (
                <p key={alert.id}>
                  {alert.senderEmail}: cap {alert.currentCap}/day ({alert.usedToday} sent today)
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
