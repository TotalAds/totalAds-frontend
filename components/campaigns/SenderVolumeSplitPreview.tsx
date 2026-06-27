"use client";

import {
  calculateSenderRotationDistribution,
  estimateSendDays,
  getSenderDailyCapDisplay,
  type RotationSender,
} from "@/lib/campaignSenderRotation";
import { providerDisplayName } from "@/lib/senderProviderEducation";

interface SenderVolumeSplitPreviewProps {
  senders: RotationSender[];
  selectedIds: string[];
  totalLeads: number;
  campaignDailyLimit?: number | null;
  variant?: "slate" | "brand";
}

export function SenderVolumeSplitPreview({
  senders,
  selectedIds,
  totalLeads,
  campaignDailyLimit,
  variant = "slate",
}: SenderVolumeSplitPreviewProps) {
  const rotation = calculateSenderRotationDistribution(
    senders,
    selectedIds,
    totalLeads,
    { campaignDailyLimit }
  );

  if (!rotation || selectedIds.length === 0) return null;

  const estimatedDays = estimateSendDays(totalLeads, rotation.totalCapacity);
  const isSlate = variant === "slate";

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 ${
        isSlate
          ? "border-blue-200 bg-blue-50/60"
          : "border-success/30 bg-success/10"
      }`}
    >
      <div>
        <h4
          className={`text-sm font-semibold ${
            isSlate ? "text-slate-800" : "text-text-100"
          }`}
        >
          Volume split
        </h4>
        <p
          className={`text-xs mt-0.5 ${
            isSlate ? "text-slate-500" : "text-text-200"
          }`}
        >
          {totalLeads > 0
            ? `${totalLeads.toLocaleString()} leads across ${selectedIds.length} account${
                selectedIds.length !== 1 ? "s" : ""
              }`
            : "Select leads to see how volume is distributed"}
        </p>
      </div>

      {totalLeads > 0 && (
        <>
          <div className="space-y-2">
            {rotation.distribution.map((entry) => {
              const pct =
                totalLeads > 0
                  ? Math.round((entry.leads / totalLeads) * 100)
                  : 0;
              const { configuredCap } = getSenderDailyCapDisplay(entry.sender);
              return (
                <div
                  key={entry.sender.id}
                  className={`flex items-center justify-between gap-3 text-xs rounded-lg px-3 py-2 ${
                    isSlate ? "bg-white/80 border border-slate-100" : "bg-brand-main/5"
                  }`}
                >
                  <div className="min-w-0">
                    <p
                      className={`font-medium truncate ${
                        isSlate ? "text-slate-800" : "text-text-100"
                      }`}
                    >
                      {providerDisplayName(entry.sender.provider)} ·{" "}
                      {entry.sender.displayName || entry.sender.email}
                    </p>
                    <p className={isSlate ? "text-slate-400" : "text-text-200/70"}>
                      Daily cap {configuredCap.toLocaleString()}/day
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`font-semibold ${
                        isSlate ? "text-blue-700" : "text-success"
                      }`}
                    >
                      {entry.leads.toLocaleString()} leads
                    </p>
                    <p className={isSlate ? "text-slate-400" : "text-text-200/70"}>
                      {pct}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className={`pt-3 border-t space-y-1 text-xs ${
              isSlate
                ? "border-blue-100 text-slate-600"
                : "border-success/20 text-text-200"
            }`}
          >
            {rotation.totalCapacity > 0 && (
              <p>
                Combined capacity today:{" "}
                <span className="font-semibold">
                  {rotation.totalCapacity.toLocaleString()} emails/day
                </span>
                {campaignDailyLimit != null && campaignDailyLimit > 0 && (
                  <>
                    {" "}
                    (campaign limit{" "}
                    <span className="font-semibold">
                      {campaignDailyLimit.toLocaleString()}/day
                    </span>
                    )
                  </>
                )}
              </p>
            )}
            {rotation.totalCapacity > 0 && estimatedDays > 0 && (
              <p>
                At today&apos;s remaining capacity, sending{" "}
                <span className="font-semibold">
                  {totalLeads.toLocaleString()} leads
                </span>{" "}
                takes about{" "}
                <span className="font-semibold">
                  {estimatedDays} day{estimatedDays !== 1 ? "s" : ""}
                </span>
                .
              </p>
            )}
            {!rotation.canSend && rotation.totalCapacity === 0 && (
              <p className="text-amber-700 font-medium">
                Selected accounts have no remaining capacity today. Sending continues
                when caps reset or you add more inboxes.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
