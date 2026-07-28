"use client";

import {
  Mail,
  Eye,
  EyeOff,
  Shield,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Check,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

import { SenderVolumeSplitPreview } from "@/components/campaigns/SenderVolumeSplitPreview";
import { INBOX_CAMPAIGN_DOMAIN_ID } from "@/lib/campaignDomain";
import {
  calculateSenderRotationDistribution,
  getSenderDailyCapDisplay,
  type RotationSender,
} from "@/lib/campaignSenderRotation";
import { fetchCampaignSendersWithQuota } from "@/lib/fetchVerifiedSendersWithQuota";
import {
  getCampaignById,
  getEmailServiceErrorMessage,
  patchCampaign,
  type CampaignSenderConfig,
} from "@/utils/api/emailClient";
import {
  buildCampaignPacingOverridePayload,
  getSenderConfiguredDailyCap,
  SENDER_PACING_DEFAULTS,
} from "@/lib/senderPacing";
import { getReoonStatus } from "@/utils/api/reoonClient";
import ReoonApiKeyRequiredModal from "@/components/campaign-builder/ReoonApiKeyRequiredModal";
import { ContinuousSyncIntervalSelect } from "@/components/campaign-builder/ContinuousSyncIntervalSelect";
import { DEFAULT_CONTINUOUS_SYNC_INTERVAL_MINUTES } from "@/lib/continuousSyncInterval";

interface OptionsTabProps {
  campaignId: string;
  domainId?: string;
  campaignStatus: string;
  totalLeads?: number;
  initialDailyLimit?: number;
  initialOpenTracking?: boolean;
  initialLinkTracking?: boolean;
  initialRequireVerification?: boolean;
  initialIsContinuous?: boolean;
  onOptionsSaved?: () => void;
}

function SenderDailyCapBar({
  configuredCap,
  remaining,
}: {
  configuredCap: number;
  remaining: number;
}) {
  const usedPct = Math.min(
    ((configuredCap - remaining) / Math.max(configuredCap, 1)) * 100,
    100,
  );
  const barColor =
    remaining === 0
      ? "bg-red-500"
      : remaining < configuredCap * 0.2
        ? "bg-amber-500"
        : "bg-green-500";

  return (
    <div className="mt-1.5 w-full max-w-[200px]">
      <div className="w-full bg-slate-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${barColor}`}
          style={{ width: `${usedPct}%` }}
        />
      </div>
    </div>
  );
}

export function OptionsTab({
  campaignId,
  domainId,
  campaignStatus,
  totalLeads = 0,
  initialDailyLimit = SENDER_PACING_DEFAULTS.campaignDailyLimit,
  initialOpenTracking = true,
  initialLinkTracking = false,
  initialRequireVerification = false,
  initialIsContinuous = false,
  onOptionsSaved,
}: OptionsTabProps) {
  const effectiveDomainId = domainId || INBOX_CAMPAIGN_DOMAIN_ID;
  const isLocked = [
    "completed",
    "cancelled",
    "verifying_leads",
    "sending",
  ].includes(campaignStatus);

  const [senders, setSenders] = useState<RotationSender[]>([]);
  const [unverifiedSenders, setUnverifiedSenders] = useState<RotationSender[]>(
    [],
  );
  const [loadingSenders, setLoadingSenders] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [selectedSenderIds, setSelectedSenderIds] = useState<string[]>([]);
  const [replyToSenderId, setReplyToSenderId] = useState<string>("");
  const [openTracking, setOpenTracking] = useState(initialOpenTracking);
  const [linkTracking, setLinkTracking] = useState(initialLinkTracking);
  const [dailyLimit, setDailyLimit] = useState(initialDailyLimit);
  const [requireVerification, setRequireVerification] = useState(
    initialRequireVerification,
  );
  const [isContinuous, setIsContinuous] = useState(initialIsContinuous);
  const [continuousSyncIntervalMinutes, setContinuousSyncIntervalMinutes] =
    useState(DEFAULT_CONTINUOUS_SYNC_INTERVAL_MINUTES);
  const [continuousLocked, setContinuousLocked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reoonModalOpen, setReoonModalOpen] = useState(false);
  const [checkingReoon, setCheckingReoon] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadCampaignOptions = async () => {
      setLoadingOptions(true);
      try {
        const campaign = await getCampaignById(effectiveDomainId, campaignId);
        if (cancelled) return;
        setDailyLimit(
          campaign.campaignDailyLimitOverride ??
            initialDailyLimit ??
            SENDER_PACING_DEFAULTS.campaignDailyLimit,
        );
        setOpenTracking(campaign.openTrackingEnabled !== false);
        setLinkTracking(campaign.linkTrackingEnabled === true);
        setRequireVerification(
          campaign.reoonVerificationSummary?.requireLeadVerification === true ||
            initialRequireVerification,
        );
        setIsContinuous(Boolean(campaign.isContinuous ?? initialIsContinuous));
        setContinuousSyncIntervalMinutes(
          campaign.continuousSyncIntervalMinutes ??
            DEFAULT_CONTINUOUS_SYNC_INTERVAL_MINUTES
        );
        setContinuousLocked(
          Boolean(campaign.startedAt) ||
            [
              "sending",
              "completed",
              "cancelled",
              "verifying_leads",
              "paused",
            ].includes(campaign.status),
        );

        const savedSenderConfig = campaign.senderConfig as
          | CampaignSenderConfig
          | null
          | undefined;
        if (savedSenderConfig?.senderIds?.length) {
          setSelectedSenderIds(savedSenderConfig.senderIds.map(String));
        } else if (campaign.senderId && campaign.senderId !== "0") {
          setSelectedSenderIds([String(campaign.senderId)]);
        } else {
          setSelectedSenderIds([]);
        }
        const savedReplyTo = savedSenderConfig?.replyToSenderId
          ? String(savedSenderConfig.replyToSenderId)
          : "";
        setReplyToSenderId(savedReplyTo);
      } catch (error: unknown) {
        if (!cancelled) {
          toast.error(
            getEmailServiceErrorMessage(
              error,
              "Failed to load campaign options",
            ),
          );
        }
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    };
    void loadCampaignOptions();
    return () => {
      cancelled = true;
    };
  }, [
    campaignId,
    effectiveDomainId,
    initialDailyLimit,
    initialRequireVerification,
  ]);

  useEffect(() => {
    const load = async () => {
      setLoadingSenders(true);
      try {
        const { senders: withQuota, unverifiedSenders: pending } =
          await fetchCampaignSendersWithQuota();
        setSenders(withQuota);
        setUnverifiedSenders(pending);
      } catch {
        toast.error("Failed to load email accounts");
      } finally {
        setLoadingSenders(false);
      }
    };
    load();
  }, []);

  // Drop sender IDs that no longer exist (e.g. account was deleted while campaign still referenced it)
  useEffect(() => {
    if (loadingOptions || loadingSenders) return;
    const availableIds = new Set(senders.map((s) => s.id));
    setSelectedSenderIds((prev) => {
      const next = prev.filter((id) => availableIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [senders, loadingOptions, loadingSenders]);

  const hasZohoSelected = useMemo(
    () =>
      selectedSenderIds.some((id) => {
        const s = senders.find((x) => x.id === id);
        return String(s?.provider || "").toLowerCase() === "zoho";
      }),
    [selectedSenderIds, senders]
  );

  /** Reply-to only for multi-sender campaigns that do not include Zoho (Zoho requires Reply-To verification). */
  const replyToEnabled =
    selectedSenderIds.length > 1 && !hasZohoSelected;

  // Keep reply-to in sync with selected accounts (hide/clear when ≤1 sender or Zoho present)
  useEffect(() => {
    if (selectedSenderIds.length <= 1 || hasZohoSelected) {
      if (replyToSenderId) setReplyToSenderId("");
      return;
    }
    if (!replyToSenderId || !selectedSenderIds.includes(replyToSenderId)) {
      setReplyToSenderId(selectedSenderIds[0] || "");
    }
  }, [selectedSenderIds, replyToSenderId, hasZohoSelected]);

  const rotation = useMemo(
    () =>
      calculateSenderRotationDistribution(
        senders,
        selectedSenderIds,
        totalLeads,
        {
          campaignDailyLimit: dailyLimit,
        },
      ),
    [senders, selectedSenderIds, totalLeads, dailyLimit],
  );

  const leadsBySenderId = useMemo(() => {
    const map = new Map<string, number>();
    rotation?.distribution.forEach((d) => map.set(d.sender.id, d.leads));
    return map;
  }, [rotation]);

  const toggleSender = (id: string) => {
    if (isLocked) return;
    setSelectedSenderIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
    setSaved(false);
  };

  const handleSave = async () => {
    if (selectedSenderIds.length === 0) {
      toast.error("Select at least one email account to save");
      return;
    }

    if (
      replyToEnabled &&
      (!replyToSenderId || !selectedSenderIds.includes(replyToSenderId))
    ) {
      toast.error("Select a reply-to mailbox for this campaign");
      return;
    }

    const primarySender = senders.find((s) => s.id === selectedSenderIds[0]);
    const senderDefaults = {
      campaignDailyLimit: getSenderConfiguredDailyCap(primarySender),
      minWaitMinutes: SENDER_PACING_DEFAULTS.minWaitMinutes,
      slowRampEnabled: SENDER_PACING_DEFAULTS.slowRampEnabled,
    };
    const pacingPayload = {
      campaignDailyLimitOverride: dailyLimit,
      minWaitMinutesOverride: null,
      // Campaign Options does not opt into slow ramp — keep it off unless the user
      // enables it on the sending-account settings page.
      slowRampEnabledOverride: false,
    };

    const rotationDistribution = rotation?.distribution.map((entry) => ({
      senderId: entry.sender.id,
      leadCount: entry.leads,
    }));

    const senderConfig: CampaignSenderConfig = {
      senderIds: selectedSenderIds,
      ...(rotationDistribution && rotationDistribution.length > 0
        ? { rotationDistribution }
        : {}),
      ...(replyToEnabled && replyToSenderId ? { replyToSenderId } : {}),
    };

    setSaving(true);
    try {
      await patchCampaign(effectiveDomainId, campaignId, {
        senderId: selectedSenderIds[0],
        senderConfig,
        ...pacingPayload,
        openTrackingEnabled: openTracking,
        linkTrackingEnabled: openTracking ? linkTracking : false,
        isContinuous,
        continuousSyncIntervalMinutes: isContinuous
          ? continuousSyncIntervalMinutes
          : undefined,
        reoonVerificationSummary: {
          requireLeadVerification: requireVerification,
        },
      });
      setSaved(true);
      toast.success("Options saved");
      onOptionsSaved?.();
      setTimeout(() => setSaved(false), 2500);
    } catch (error: unknown) {
      toast.error(getEmailServiceErrorMessage(error, "Failed to save options"));
    } finally {
      setSaving(false);
    }
  };

  const handleRequireVerificationToggle = async () => {
    if (isLocked || checkingReoon) return;
    if (requireVerification) {
      setRequireVerification(false);
      setSaved(false);
      return;
    }

    try {
      setCheckingReoon(true);
      const status = await getReoonStatus();
      if (status.isConfigured) {
        setRequireVerification(true);
        setSaved(false);
        return;
      }

      toast.error("Please add your Reoon API. It is not configured.");
      setReoonModalOpen(true);
    } catch (error: unknown) {
      toast.error(
        getEmailServiceErrorMessage(error, "Failed to check Reoon setup"),
      );
    } finally {
      setCheckingReoon(false);
    }
  };

  const providerBadge = (provider: string) => {
    const map: Record<string, { label: string; color: string }> = {
      gmail: { label: "Gmail", color: "bg-red-100 text-red-700" },
      outlook: { label: "Outlook", color: "bg-blue-100 text-blue-700" },
      smtp: { label: "SMTP", color: "bg-slate-100 text-slate-600" },
      ses: { label: "SES", color: "bg-orange-100 text-orange-700" },
    };
    const info = map[provider] || {
      label: provider,
      color: "bg-slate-100 text-slate-600",
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${info.color}`}
      >
        {info.label}
      </span>
    );
  };

  if (loadingOptions) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* ── Continuous campaign ── */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">
            Campaign mode
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose a standard finite send, or a continuous campaign that keeps
            accepting leads from connected sources.
          </p>
        </div>
        <div className="p-4 space-y-3">
          <label
            className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
              !isContinuous
                ? "border-blue-300 bg-blue-50/50"
                : "border-slate-200"
            } ${continuousLocked || isLocked ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <input
              type="radio"
              name="campaign-mode"
              className="mt-1"
              checked={!isContinuous}
              disabled={continuousLocked || isLocked}
              onChange={() => {
                setIsContinuous(false);
                setSaved(false);
              }}
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Standard campaign
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Add leads (CSV, lists, LeadHub sync, one-time Google Sheet
                import), launch once, and the campaign completes when the queue
                is empty.
              </p>
            </div>
          </label>
          <label
            className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
              isContinuous
                ? "border-blue-300 bg-blue-50/50"
                : "border-slate-200"
            } ${continuousLocked || isLocked ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <input
              type="radio"
              name="campaign-mode"
              className="mt-1"
              checked={isContinuous}
              disabled={continuousLocked || isLocked}
              onChange={() => {
                setIsContinuous(true);
                setSaved(false);
              }}
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Continuous campaign
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Always-on intake: LeadHub and Google Sheets sync on your chosen
                interval, plus an optional webhook API. The campaign stays
                running when the queue is idle until you pause or stop it.
                Configure sources on the Leads tab.
              </p>
            </div>
          </label>
          {isContinuous && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <ContinuousSyncIntervalSelect
                value={continuousSyncIntervalMinutes}
                onChange={(minutes) => {
                  setContinuousSyncIntervalMinutes(minutes);
                  setSaved(false);
                }}
                disabled={continuousLocked || isLocked}
              />
            </div>
          )}
          {(continuousLocked || isLocked) && (
            <p className="text-[11px] text-slate-400">
              Campaign mode is locked after launch.
            </p>
          )}
        </div>
      </div>

      {/* ── Accounts to use ── */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400" />
              Email Accounts
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select sending accounts — daily caps and volume split update as
              you select
            </p>
          </div>
          <Link
            href="/email/sending-accounts"
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            <ExternalLink className="h-3 w-3" />
            Manage accounts
          </Link>
        </div>

        <div className="p-4 space-y-4">
          {loadingSenders ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-2">
              {senders.map((sender) => {
                const isSelected = selectedSenderIds.includes(sender.id);
                const { configuredCap, effectiveCap, remaining, usedToday } =
                  getSenderDailyCapDisplay(sender);
                const assignedLeads = leadsBySenderId.get(sender.id);

                return (
                  <div
                    key={sender.id}
                    onClick={() => !isLocked && toggleSender(sender.id)}
                    className={`flex items-start justify-between gap-3 p-3 rounded-xl border transition-all ${
                      isLocked
                        ? "opacity-60 cursor-not-allowed"
                        : "cursor-pointer"
                    } ${
                      isSelected
                        ? "border-blue-300 bg-blue-50 ring-1 ring-blue-200"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all ${
                          isSelected
                            ? "border-blue-600 bg-blue-600"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-800">
                            {sender.displayName || sender.email}
                          </span>
                          {sender.provider && providerBadge(sender.provider)}
                          {isSelected &&
                            assignedLeads != null &&
                            totalLeads > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                                {assignedLeads.toLocaleString()} leads
                              </span>
                            )}
                        </div>
                        {sender.displayName && (
                          <p className="text-xs text-slate-400">
                            {sender.email}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-500 mt-1">
                          Daily cap{" "}
                          <span className="font-semibold text-slate-700">
                            {effectiveCap.toLocaleString()}/day
                          </span>
                          {effectiveCap !== configuredCap && (
                            <span className="text-slate-400 font-normal">
                              {" "}
                              (target {configuredCap.toLocaleString()}/day)
                            </span>
                          )}
                          {" · "}
                          <span className="text-slate-600">
                            {usedToday.toLocaleString()} sent
                          </span>
                          {" · "}
                          <span
                            className={
                              remaining === 0
                                ? "text-red-600 font-medium"
                                : "text-green-700 font-medium"
                            }
                          >
                            {remaining.toLocaleString()} left today
                          </span>
                        </p>
                        {effectiveCap !== configuredCap &&
                          sender.slowRampEnabled && (
                            <p className="text-[10px] text-amber-600 mt-0.5">
                              ℹ️ Warming up (starts at 30/day and increases
                              slowly). Disable &quot;Increase volume
                              slowly&quot; in Inbox Settings to send{" "}
                              {configuredCap.toLocaleString()}/day immediately.
                            </p>
                          )}
                        <SenderDailyCapBar
                          configuredCap={effectiveCap}
                          remaining={remaining}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {sender.status === "active" ? (
                        <span className="flex items-center gap-1 text-[11px] text-green-600 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {sender.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {senders.length === 0 && unverifiedSenders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Mail className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500 mb-3">
                    No verified sending accounts found
                  </p>
                  <Link
                    href="/email/sending-accounts"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Connect an email account →
                  </Link>
                </div>
              )}
              {unverifiedSenders.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
                  <p className="text-xs font-medium text-amber-800">
                    Connected but not verified — run a connection test before
                    using in campaigns
                  </p>
                  {unverifiedSenders.map((sender) => (
                    <div
                      key={sender.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 opacity-80"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-800">
                            {sender.displayName || sender.email}
                          </span>
                          {sender.provider && providerBadge(sender.provider)}
                        </div>
                        {sender.displayName && (
                          <p className="text-xs text-slate-500">
                            {sender.email}
                          </p>
                        )}
                      </div>
                      <Link
                        href="/email/sending-accounts"
                        className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-700"
                      >
                        Verify →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedSenderIds.length > 0 && (
            <SenderVolumeSplitPreview
              senders={senders}
              selectedIds={selectedSenderIds}
              totalLeads={totalLeads}
              campaignDailyLimit={dailyLimit}
              variant="slate"
            />
          )}

          {selectedSenderIds.length > 1 && hasZohoSelected && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-1.5">
              <p className="text-sm font-semibold text-amber-900">
                Reply-to unavailable for Zoho
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                Zoho requires every Reply-To address to be verified on the From
                mailbox before sending. Campaign-level Reply-To is disabled when
                any Zoho account is selected, so replies stay on each From
                mailbox and you won&apos;t hit Zoho verification errors. Use
                Gmail, Outlook, or SMTP if you need a shared Reply-To inbox.
              </p>
            </div>
          )}

          {replyToEnabled && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <label
                htmlFor="campaign-reply-to"
                className="text-sm font-semibold text-slate-800 block"
              >
                Reply-to mailbox
              </label>
              <p className="text-xs text-slate-500">
                With multiple sending accounts, replies for this campaign go to
                one mailbox you choose — not each From address.
              </p>
              <select
                id="campaign-reply-to"
                value={replyToSenderId}
                disabled={isLocked}
                onChange={(e) => {
                  setReplyToSenderId(e.target.value);
                  setSaved(false);
                }}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
              >
                {selectedSenderIds.map((id) => {
                  const sender = senders.find((s) => s.id === id);
                  if (!sender) return null;
                  return (
                    <option key={id} value={id}>
                      {sender.displayName
                        ? `${sender.displayName} (${sender.email})`
                        : sender.email}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── Open Tracking ── */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              {openTracking ? (
                <Eye className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
              ) : (
                <EyeOff className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
              )}
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Open Tracking
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track when recipients open your emails
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setOpenTracking(false);
                  setSaved(false);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  !openTracking
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Disable
              </button>
              <button
                onClick={() => {
                  setOpenTracking(true);
                  setSaved(false);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  openTracking
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Enable
              </button>
            </div>
          </div>

          {openTracking && (
            <div
              className="mt-4 flex items-center gap-3 pl-8 cursor-pointer"
              onClick={() => {
                setLinkTracking((p) => !p);
                setSaved(false);
              }}
            >
              <div
                className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-all ${
                  linkTracking
                    ? "border-blue-600 bg-blue-600"
                    : "border-slate-300 bg-white"
                }`}
              >
                {linkTracking && <Check className="h-2.5 w-2.5 text-white" />}
              </div>
              <span className="text-xs text-slate-600 font-medium">
                Also track link clicks
              </span>
            </div>
          )}
          <p className="mt-3 text-[11px] text-slate-500">
            Note: Tracking flags apply when emails are queued (launch/resume).
            Changing open/link tracking after launch affects newly queued rows;
            already-queued emails keep their original tracking HTML until
            re-queued.
          </p>
          <p className="mt-2 text-[11px] text-slate-500">
            Open and reply detection work from your connected inbox (Gmail,
            Microsoft, Zoho, or SMTP with IMAP). We filter automated prefetch
            from Google and Microsoft so only real engagement is counted. AWS
            SES uses SNS for opens, bounces, and complaints — not inbox reply
            polling.
          </p>
        </div>
      </div>

      {/* ── Daily Limit ── */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Campaign Daily Limit
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Maximum emails sent per day for this campaign across all
                accounts
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setDailyLimit((prev) => Math.max(1, prev - 5));
                  setSaved(false);
                }}
                disabled={isLocked}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <div className="flex items-center">
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={dailyLimit}
                  disabled={isLocked}
                  onChange={(e) => {
                    setDailyLimit(Math.max(1, parseInt(e.target.value) || 1));
                    setSaved(false);
                  }}
                  className="w-16 text-center text-sm font-semibold text-slate-800 border border-slate-200 rounded-lg py-1.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="ml-1.5 text-xs text-slate-400">/ day</span>
              </div>
              <button
                onClick={() => {
                  setDailyLimit((prev) => prev + 5);
                  setSaved(false);
                }}
                disabled={isLocked}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {dailyLimit <= 30 && (
            <p className="mt-2 text-[11px] text-blue-600 bg-blue-50 rounded-lg px-3 py-1.5">
              💡 Default limit is 30/day. Increase carefully — higher limits can
              affect deliverability for newer accounts.
            </p>
          )}
        </div>
      </div>

      {/* ── Lead Verification (Reoon) ── */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Lead Verification
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                    Reoon
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify email addresses before sending to reduce bounce rate.
                  When enabled, you'll be asked to confirm verification before
                  launching.
                </p>
              </div>
            </div>
            <div
              onClick={() => void handleRequireVerificationToggle()}
              className={`relative inline-flex h-6 w-11 cursor-pointer rounded-full transition-colors ${
                requireVerification ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow-sm transition-transform ${
                  requireVerification ? "translate-x-5.5" : "translate-x-0.5"
                }`}
              />
            </div>
          </div>

          {requireVerification && (
            <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-xs text-blue-700 leading-relaxed">
                ✅ Lead verification is <strong>enabled</strong>. When you
                resume or launch this campaign, you'll be prompted to confirm
                whether to run Reoon email verification on the leads before
                sending.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Save ── */}
      <div className="flex justify-end pt-2">
        {!isLocked ? (
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg shadow-sm transition-all disabled:opacity-60 ${
              saved
                ? "bg-green-100 text-green-700"
                : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md"
            }`}
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : saved ? (
              <>
                <Check className="h-4 w-4" />
                Options saved
              </>
            ) : (
              "Save Options"
            )}
          </button>
        ) : (
          <span className="text-xs text-slate-400">
            {campaignStatus === "sending"
              ? "Options are locked while the campaign is sending"
              : "Options locked for this campaign status"}
          </span>
        )}
      </div>

      <ReoonApiKeyRequiredModal
        open={reoonModalOpen}
        onOpenChange={setReoonModalOpen}
        onConfigured={() => {
          setRequireVerification(true);
          setSaved(false);
        }}
      />
    </div>
  );
}
