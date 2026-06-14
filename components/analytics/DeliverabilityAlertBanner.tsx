import React from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import type { DeliverabilityAlert } from "@/types/analytics";
import { DeliverabilitySafeguardsInfo } from "@/components/email/DeliverabilitySafeguardsInfo";
import {
  buildDeliverabilityTriggerExplanation,
  deliverabilityActionLabel,
  resolveEffectiveDeliverabilityAction,
} from "@/lib/deliverabilitySafeguards";

interface DeliverabilityAlertBannerProps {
  alerts: DeliverabilityAlert[];
  throttledPendingCount?: number;
}

function alertTitle(alert: DeliverabilityAlert): string {
  const effective = resolveEffectiveDeliverabilityAction({
    deliverabilityAction: alert.deliverabilityAction,
    rollingBounceAction: alert.rollingBounceAction,
  });

  if (alert.rollingBounceAction === "pause") {
    return "Bad batch — sending paused";
  }
  if (alert.type === "campaign_auto_paused") {
    return `${deliverabilityActionLabel(effective)} — campaign paused`;
  }
  if (effective === "emergency") {
    return "Emergency deliverability stop";
  }
  if (effective === "pause" || alert.type === "sender_paused") {
    return `${deliverabilityActionLabel(effective)} — sending paused`;
  }
  if (effective === "slow" || alert.type === "quota_reduced") {
    return `${deliverabilityActionLabel(effective)} — daily cap reduced`;
  }
  if (effective === "warn" || alert.severity === "info") {
    return "Deliverability monitoring — no pause yet";
  }
  return "Deliverability notice";
}

export const DeliverabilityAlertBanner: React.FC<DeliverabilityAlertBannerProps> = ({
  alerts,
  throttledPendingCount = 0,
}) => {
  if (!alerts.length && throttledPendingCount <= 0) return null;

  const primary =
    alerts.find((alert) => alert.type === "campaign_auto_paused") ||
    alerts.find((alert) => alert.severity === "critical") ||
    alerts.find((alert) => alert.severity === "warning") ||
    alerts[0];

  const effective = primary
    ? resolveEffectiveDeliverabilityAction({
        deliverabilityAction: primary.deliverabilityAction,
        rollingBounceAction: primary.rollingBounceAction,
      })
    : "none";

  const isInfo = effective === "warn" || primary?.severity === "info";
  const isCritical =
    primary?.severity === "critical" ||
    primary?.type === "campaign_auto_paused" ||
    primary?.rollingBounceAction === "pause" ||
    effective === "pause" ||
    effective === "emergency";

  const containerClass = isCritical
    ? "border-rose-200 bg-rose-50"
    : isInfo
      ? "border-sky-200 bg-sky-50"
      : "border-amber-200 bg-amber-50";
  const titleClass = isCritical
    ? "text-rose-900"
    : isInfo
      ? "text-sky-900"
      : "text-amber-900";
  const bodyClass = isCritical
    ? "text-rose-800"
    : isInfo
      ? "text-sky-800"
      : "text-amber-800";
  const iconClass = isCritical
    ? "text-rose-700"
    : isInfo
      ? "text-sky-700"
      : "text-amber-700";

  const fallbackExplanation = primary
    ? buildDeliverabilityTriggerExplanation({
        sent7d: primary.sent7d,
        bounceRate7d: primary.bounceRate7d,
        complaintRate7d: primary.complaintRate7d,
        deliverabilityAction: primary.deliverabilityAction,
        rollingBounceAction: primary.rollingBounceAction,
      })
    : null;

  return (
    <div className={`mb-6 rounded-xl border p-5 ${containerClass}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 shrink-0 ${iconClass}`}>
          {isCritical ? <ShieldAlert size={18} /> : <AlertTriangle size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className={`text-sm font-semibold ${titleClass}`}>
              {primary ? alertTitle(primary) : "Deliverability notice"}
            </h3>
            <DeliverabilitySafeguardsInfo variant="link" />
          </div>
          {primary && (
            <div className={`mt-2 space-y-2 text-sm leading-relaxed ${bodyClass}`}>
              {primary.userMessage ? (
                <p className="font-medium">{primary.userMessage}</p>
              ) : (
                <>
                  {fallbackExplanation ? <p className="font-medium">{fallbackExplanation}</p> : null}
                  {primary.reasons.map((reason) => (
                    <p key={reason}>{reason}</p>
                  ))}
                </>
              )}
            </div>
          )}
          {throttledPendingCount > 0 && (
            <p className={`mt-3 text-xs ${bodyClass}`}>
              <span className="font-medium">{throttledPendingCount}</span> emails are waiting for the
              next send window because today&apos;s sender cap was reached.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
