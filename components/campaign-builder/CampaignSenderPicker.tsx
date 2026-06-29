"use client";

import Link from "next/link";

import { DeliverabilitySafeguardsInfo } from "@/components/email/DeliverabilitySafeguardsInfo";
import { SenderTrustIndicators } from "@/components/email/SenderTrustIndicators";
import { groupCampaignSenders } from "@/lib/groupCampaignSenders";
import {
  accountTypeLabel,
  capResponsibilityNote,
  coldOutreachWarning,
  isPersonalInbox,
  providerDisplayName,
  providerEducationTip,
  type SenderProvider,
} from "@/lib/senderProviderEducation";
import { getSenderConfiguredDailyCap } from "@/lib/senderPacing";
import {
  senderHealthBadge,
} from "@/lib/deliverabilitySafeguards";
import type {
  DomainAuthRecord,
  SenderCategoryInfo,
  SenderReputationBadge,
} from "@/lib/senderTrustTypes";

interface Domain {
  id: string;
  domain: string;
}

interface EmailSender {
  id: string;
  email: string;
  displayName?: string;
  domainId?: string | null;
  domainName?: string | null;
  provider?: SenderProvider | string;
  accountType?: string | null;
  usageTier?: string | null;
  coldOutreachRecommended?: boolean;
  status?: string;
  verificationStatus?: string;
  senderCategory?: SenderCategoryInfo;
  reputation?: SenderReputationBadge;
  domainAuth?: DomainAuthRecord;
  quota?: {
    dailyCap: number;
    used: number;
    remaining: number;
    healthStatus?: string;
    bounceRate7d?: number;
    complaintRate7d?: number;
    sent7d?: number;
    deliverabilityAction?: string;
    quotaMode?: "byo" | "managed";
    provider?: string;
    accountType?: string | null;
    status?: string;
    pauseReason?: string | null;
    configuredDailyLimit?: number | null;
  };
   campaignDailyLimit?: number | null;
  slowRampEnabled?: boolean | null;
}

interface CampaignSenderPickerProps {
  senders: EmailSender[];
  domains: Domain[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  loading?: boolean;
  isManagedSes: boolean;
}

export function CampaignSenderPicker({
  senders,
  domains,
  selectedIds,
  onChange,
  loading = false,
  isManagedSes,
}: CampaignSenderPickerProps) {
  const groups = groupCampaignSenders(senders, domains);

  const toggleSender = (id: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedIds, id]);
    } else {
      onChange(selectedIds.filter((sid) => sid !== id));
    }
  };

  if (loading) {
    return <div className="text-text-200 text-xs py-2">Loading senders...</div>;
  }

  if (senders.length === 0) {
    return (
      <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 space-y-2">
        <p className="text-sm font-medium text-text-100">No verified senders</p>
        <p className="text-xs text-text-200">
          Connect Gmail, Microsoft, SMTP, or AWS SES senders before launching a campaign.
        </p>
        <Link
          href="/email/sending-accounts"
          className="inline-block text-xs font-medium text-brand-main hover:underline"
        >
          Add sending account →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 space-y-2">
        <p className="text-xs text-text-200">
          Select one or more sending accounts to rotate volume. Each provider enforces its own
          daily limits — LeadSnipper shows remaining capacity and pauses accounts that hit caps.
        </p>
        <p className="text-[11px] text-text-200/90 leading-relaxed">
          {capResponsibilityNote(isManagedSes)}
        </p>
        {isManagedSes && (
          <p className="text-[11px] text-text-200/80 leading-relaxed">
            High bounce or complaint rates reduce caps automatically.{" "}
            <DeliverabilitySafeguardsInfo variant="link" className="inline" />
          </p>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto space-y-4 border border-brand-main/20 rounded-lg p-3 bg-brand-main/5">
        {groups.map((group) => (
          <div key={group.key} className="space-y-2">
            <div className="pb-1 border-b border-brand-main/10">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-main">
                  {providerDisplayName(group.provider)}
                </span>
                <span className="text-xs font-semibold text-text-100">{group.label}</span>
                <span className="text-xs text-text-200/60">
                  ({group.senders.length})
                </span>
              </div>
              <p className="text-[10px] text-text-200/80 mt-1 leading-snug">
                {providerEducationTip(group.provider)}
              </p>
            </div>

            {group.senders.map((sender) => {
              const full = senders.find((s) => s.id === sender.id);
              const quota = full?.quota;
              const isSelected = selectedIds.includes(sender.id);
              const isPaused =
                full?.status === "paused" ||
                full?.status === "error" ||
                quota?.status === "paused" ||
                quota?.status === "error";
              const configuredCap = getSenderConfiguredDailyCap(full);
              const effectiveCap = quota?.dailyCap ?? configuredCap;
              const remaining = quota?.remaining ?? effectiveCap;
              const usedToday = Math.max(0, quota?.used ?? effectiveCap - remaining);
              const healthBadge =
                isManagedSes && quota
                  ? senderHealthBadge(
                      quota.healthStatus,
                      quota.bounceRate7d,
                      quota.complaintRate7d,
                      quota.sent7d,
                      quota.deliverabilityAction as any
                    )
                  : null;
              const typeLabel =
                accountTypeLabel(full?.accountType ?? quota?.accountType) ??
                (group.provider === "smtp" ? "Single inbox" : null);
              const personal = isPersonalInbox(full?.usageTier, full?.accountType);
              const usageWarning = coldOutreachWarning(
                full?.coldOutreachRecommended,
                full?.accountType
              );

              return (
                <label
                  key={sender.id}
                  className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-all ml-1 ${
                    isSelected
                      ? "bg-brand-main/20 border-2 border-brand-main"
                      : "bg-transparent border-2 border-transparent hover:bg-brand-main/10"
                  } ${isPaused ? "opacity-70" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isPaused && remaining <= 0}
                    onChange={(e) => toggleSender(sender.id, e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-brand-main/20 text-brand-main focus:ring-brand-main"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-text-100">
                          {full?.displayName || full?.email}
                        </p>
                        {full?.displayName && (
                          <p className="text-[11px] text-text-200/70">{full.email}</p>
                        )}
                        {typeLabel && (
                          <p className="text-[10px] text-text-200/60 mt-0.5">
                            {typeLabel}
                            {personal ? " · not for cold outreach" : ""}
                          </p>
                        )}
                        {(full?.senderCategory || full?.reputation || full?.domainAuth) && (
                          <div className="mt-1.5">
                            <SenderTrustIndicators
                              senderCategory={full?.senderCategory}
                              reputation={full?.reputation}
                              domainAuth={full?.domainAuth}
                              compact
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {healthBadge && (
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              healthBadge.tone === "critical"
                                ? "bg-rose-100 text-rose-800"
                                : healthBadge.tone === "warn"
                                  ? "bg-amber-100 text-amber-900"
                                  : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {healthBadge.label}
                          </span>
                        )}
                         <span className="text-[10px] text-text-200 whitespace-nowrap text-right">
                          Cap {effectiveCap.toLocaleString()}/day
                          {effectiveCap !== configuredCap && ` (target ${configuredCap.toLocaleString()}/day)`}
                        </span>
                        <span className="text-[10px] text-text-200 whitespace-nowrap text-right">
                          {remaining.toLocaleString()} left · {usedToday.toLocaleString()} sent
                        </span>
                      </div>
                    </div>

                    {effectiveCap !== configuredCap && full?.slowRampEnabled && (
                      <p className="text-[10px] text-amber-700 mt-1">
                        ℹ️ Warming up (starts at 30/day and increases slowly). Disable &quot;Increase volume slowly&quot; in Inbox Settings to send {configuredCap.toLocaleString()}/day immediately.
                      </p>
                    )}

                    {usageWarning && isSelected && (
                      <p className="text-[10px] text-amber-800 mt-1 leading-snug">
                        {usageWarning}
                      </p>
                    )}

                    {isPaused && (
                      <p className="text-[10px] text-amber-700 mt-1">
                        Paused or at limit — resume in Sending Accounts before using this inbox.
                        {quota?.pauseReason ? ` ${quota.pauseReason}` : ""}
                      </p>
                    )}

                    {!isManagedSes && quota && remaining === 0 && !isPaused && (
                      <p className="text-[10px] text-amber-700 mt-1">
                        Daily cap reached. Campaign continues tomorrow or add another account.
                      </p>
                    )}

                    <div className="mt-1.5">
                      <div className="w-full bg-brand-main/10 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            remaining === 0
                              ? "bg-red-500"
                              : remaining < configuredCap * 0.2
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              ((configuredCap - remaining) / Math.max(configuredCap, 1)) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        ))}
      </div>

      {selectedIds.length > 0 && (
        <p className="text-[11px] text-text-200">
          {selectedIds.length} account{selectedIds.length !== 1 ? "s" : ""} selected ·{" "}
          <Link href="/email/sending-accounts" className="text-brand-main hover:underline">
            Add more inboxes
          </Link>
        </p>
      )}
    </div>
  );
}
