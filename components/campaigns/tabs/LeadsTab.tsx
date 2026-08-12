"use client";

import {
  Users,
  Plus,
  Upload,
  Search,
  UserCheck,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Trash2,
  Zap,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import RecipientSelectionModal from "@/components/campaign-builder/RecipientSelectionModal";
import LeadhubAutopilotPanel from "@/components/campaign-builder/LeadhubAutopilotPanel";
import {
  GoogleSheetsSourcePanel,
  type SheetSyncConfigState,
} from "@/components/campaign-builder/GoogleSheetsSourcePanel";
import { CampaignWebhookPanel } from "@/components/campaign-builder/CampaignWebhookPanel";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { BodyPortal } from "@/components/ui/BodyPortal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addLeadsToCampaign,
  createCampaignLeadsFromCsv,
  getCampaignById,
  getCampaignMemberLeads,
  getEmailServiceErrorMessage,
  patchCampaign,
  removeLeadsFromCampaign,
  restartCampaign,
  LeadCategory,
  LeadTag,
} from "@/utils/api/emailClient";
import {
  LeadhubSyncConfig,
  LeadhubSyncLinkRow,
  LeadhubPreviewCounts,
  formatLeadhubSkipReasons,
  getCampaignLeadhubSyncLinks,
  getLeadhubStatus,
  previewLeadhubSync,
  summarizeLeadhubSyncLinks,
  syncLeadhubCampaign,
} from "@/utils/api/leadhubClient";
import { INBOX_CAMPAIGN_DOMAIN_ID } from "@/lib/campaignDomain";
import {
  DEFAULT_CONTINUOUS_SYNC_INTERVAL_MINUTES,
  formatContinuousSyncInterval,
} from "@/lib/continuousSyncInterval";

interface LeadsTabProps {
  campaignId: string;
  domainId?: string;
  campaignStatus: string;
  totalLeads?: number;
  leadsNeedRestart?: boolean;
  onLeadsAdded?: () => void;
  onRefresh?: () => void;
}

type RecipientType = "list" | "filter" | "individual" | "csv";

interface CampaignLeadRow {
  id: string;
  email: string;
  name?: string;
  company?: string;
  status: string;
  sendError?: string | null;
  createdAt?: string;
  verificationStatus?: string | null;
  isSafeToSend?: boolean | null;
}

const MODIFY_LEADS_BLOCKED_STATUSES = new Set([
  "completed",
  "cancelled",
  "verifying_leads",
]);

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSendError(error?: string | null): string | null {
  if (!error) return null;
  return error.trim();
}

function StatusBadge({
  status,
  sendError,
}: {
  status: string;
  sendError?: string | null;
}) {
  const normalized = (status || "new").toLowerCase();
  const styles: Record<string, string> = {
    new: "bg-slate-100 text-slate-700",
    pending: "bg-amber-50 text-amber-800",
    processing: "bg-amber-50 text-amber-800",
    sent: "bg-blue-100 text-blue-700",
    opened: "bg-green-100 text-green-700",
    clicked: "bg-purple-100 text-purple-700",
    bounced: "bg-rose-100 text-rose-700",
    complained: "bg-red-100 text-red-700",
    unsubscribed: "bg-amber-100 text-amber-800",
    failed: "bg-rose-100 text-rose-800",
  };
  const label =
    normalized === "new"
      ? "New"
      : normalized === "failed"
        ? "Not sent"
        : normalized;
  const readableError = formatSendError(sendError);
  return (
    <div className="max-w-[220px] space-y-1">
      <span
        className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-1.5 py-px text-[10px] font-medium leading-none ${
          styles[normalized] ?? "bg-slate-100 text-slate-600"
        }`}
        title={readableError || undefined}
      >
        {label}
      </span>
      {readableError ? (
        <p className="text-[10px] leading-snug text-rose-700" title={readableError}>
          {readableError}
        </p>
      ) : null}
    </div>
  );
}

function VerificationBadge({
  status,
  isSafeToSend,
}: {
  status?: string | null;
  isSafeToSend?: boolean | null;
}) {
  if (isSafeToSend === true) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
        Safe
      </span>
    );
  }
  if (isSafeToSend === false) {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700">
        Risky
      </span>
    );
  }
  if (status) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-600">
        {status.replace(/_/g, " ")}
      </span>
    );
  }
  return <span className="text-xs text-slate-400">Unverified</span>;
}

export function LeadsTab({
  campaignId,
  domainId,
  campaignStatus,
  totalLeads = 0,
  leadsNeedRestart = false,
  onLeadsAdded,
  onRefresh,
}: LeadsTabProps) {
  const effectiveDomainId = domainId || INBOX_CAMPAIGN_DOMAIN_ID;
  const canModifyLeads = !MODIFY_LEADS_BLOCKED_STATUSES.has(campaignStatus);
  const [restarting, setRestarting] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<LeadTag[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<LeadCategory[]>([]);
  const [addingLeads, setAddingLeads] = useState(false);
  const [removingLeads, setRemovingLeads] = useState(false);

  const [leads, setLeads] = useState<CampaignLeadRow[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [leadhubSyncConfig, setLeadhubSyncConfig] =
    useState<LeadhubSyncConfig | null>(null);
  const [isContinuous, setIsContinuous] = useState(false);
  const [continuousSyncIntervalMinutes, setContinuousSyncIntervalMinutes] =
    useState(DEFAULT_CONTINUOUS_SYNC_INTERVAL_MINUTES);
  const [sheetSyncConfig, setSheetSyncConfig] =
    useState<SheetSyncConfigState | null>(null);
  const [leadhubSyncing, setLeadhubSyncing] = useState(false);
  const [leadhubSyncPhase, setLeadhubSyncPhase] = useState<
    "idle" | "fetching" | "enriching" | "complete" | "error"
  >("idle");
  const [leadhubSyncStats, setLeadhubSyncStats] = useState<{
    processed: number;
    ready: number;
    pendingEnrichment: number;
    queued: number;
    skipped: number;
    skippedNoEmail?: number;
    skippedVerification?: number;
    skippedEnrichedOnly?: number;
    failed?: number;
  } | null>(null);
  const [leadhubSyncLinks, setLeadhubSyncLinks] = useState<LeadhubSyncLinkRow[]>([]);
  const [leadhubConnected, setLeadhubConnected] = useState(false);
  const [leadhubStatusLoaded, setLeadhubStatusLoaded] = useState(false);
  const [leadhubModalOpen, setLeadhubModalOpen] = useState(false);
  const [enrichmentChoiceOpen, setEnrichmentChoiceOpen] = useState(false);
  const [enrichmentPreview, setEnrichmentPreview] =
    useState<LeadhubPreviewCounts | null>(null);
  const [enrichmentPreviewLoading, setEnrichmentPreviewLoading] = useState(false);
  const pendingSyncConfigRef = useRef<LeadhubSyncConfig | null>(null);

  const fetchLeadhubSyncLinks = useCallback(async () => {
    if (!leadhubConnected) {
      setLeadhubSyncLinks([]);
      return [];
    }
    try {
      const links = await getCampaignLeadhubSyncLinks(campaignId);
      setLeadhubSyncLinks(links);
      return links;
    } catch {
      setLeadhubSyncLinks([]);
      return [];
    }
  }, [campaignId, leadhubConnected]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await getLeadhubStatus();
        if (cancelled) return;
        setLeadhubConnected(Boolean(status.isConfigured));
      } catch {
        if (!cancelled) setLeadhubConnected(false);
      } finally {
        if (!cancelled) setLeadhubStatusLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const campaign = await getCampaignById(effectiveDomainId, campaignId);
        if (cancelled) return;
        setLeadhubSyncConfig(
          (campaign.leadhubSyncConfig as LeadhubSyncConfig | null) ?? null
        );
        setIsContinuous(Boolean(campaign.isContinuous));
        setContinuousSyncIntervalMinutes(
          campaign.continuousSyncIntervalMinutes ??
            DEFAULT_CONTINUOUS_SYNC_INTERVAL_MINUTES
        );
        setSheetSyncConfig(
          (campaign.sheetSyncConfig as SheetSyncConfigState | null) ?? null
        );
      } catch {
        // Campaign may still be loading / domain placeholder — ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignId, effectiveDomainId]);

  useEffect(() => {
    if (!leadhubStatusLoaded || !leadhubConnected) {
      setLeadhubSyncLinks([]);
      return;
    }
    void fetchLeadhubSyncLinks();
  }, [fetchLeadhubSyncLinks, leadhubConnected, leadhubStatusLoaded]);

  useEffect(() => {
    setPage(1);
    setSelectedLeadIds(new Set());
  }, [debouncedSearch, pageSize, campaignId]);

  useEffect(() => {
    setSelectedLeadIds(new Set());
  }, [page]);

  const fetchCampaignLeads = useCallback(async () => {
    setLoadingLeads(true);
    try {
      const result = await getCampaignMemberLeads(
        campaignId,
        page,
        pageSize,
        debouncedSearch || undefined
      );

      setLeads(result.leads as CampaignLeadRow[]);
      setTotalCount(result.pagination.total ?? 0);
      setTotalPages(result.pagination.pages ?? 0);
    } catch (error: unknown) {
      toast.error(getEmailServiceErrorMessage(error, "Failed to load campaign leads"));
      setLeads([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoadingLeads(false);
    }
  }, [campaignId, page, pageSize, debouncedSearch]);

  useEffect(() => {
    void fetchCampaignLeads();
  }, [fetchCampaignLeads]);

  const resolveLeadIds = async (data: {
    type: RecipientType;
    ids: string[];
    count: number;
    csvData?: Record<string, string>[];
    columns?: string[];
    emailColumn?: string;
  }): Promise<string[]> => {
    if (data.type === "csv" && data.csvData && data.csvData.length > 0) {
      const emailColumn = data.emailColumn || "email";
      const csvDataForApi = data.csvData.map((row) => {
        if (emailColumn !== "email" && row[emailColumn]) {
          return { ...row, email: row[emailColumn] };
        }
        return row;
      });

      const result = await createCampaignLeadsFromCsv(effectiveDomainId, {
        csvData: csvDataForApi,
        tagIds: selectedTags.map((t) => String(t.id)),
        categoryIds: selectedCategories.map((c) => String(c.id)),
      });

      return result.leadIds || [];
    }

    return data.ids;
  };

  const handleSelect = useCallback(
    async (data: {
      type: RecipientType;
      ids: string[];
      count: number;
      csvData?: Record<string, string>[];
      columns?: string[];
      emailColumn?: string;
      csvUploadNote?: string;
    }) => {
      if (!canModifyLeads) {
        toast.error("Leads cannot be added while the campaign is in this status.");
        return;
      }

      if (data.count === 0) {
        toast.error("Please select at least one lead");
        return;
      }

      setAddingLeads(true);
      try {
        const leadIds = await resolveLeadIds(data);

        if (leadIds.length === 0) {
          toast.error("No leads found to add");
          return;
        }

        const result = await addLeadsToCampaign(
          effectiveDomainId,
          campaignId,
          leadIds
        );

        if (result.newLeadsAdded === 0) {
          if (result.duplicatesSkipped > 0) {
            toast.success(
              `All ${result.duplicatesSkipped} selected lead${
                result.duplicatesSkipped !== 1 ? "s are" : " is"
              } already on this campaign`
            );
          } else {
            toast.error("No leads were added");
          }
        } else if (result.duplicatesSkipped > 0) {
          toast.success(
            `Added ${result.newLeadsAdded} new lead${
              result.newLeadsAdded !== 1 ? "s" : ""
            } (${result.duplicatesSkipped} already on campaign)`
          );
        } else {
          toast.success(
            `Added ${result.newLeadsAdded} lead${
              result.newLeadsAdded !== 1 ? "s" : ""
            } to campaign`
          );
        }

        setShowAddModal(false);
        setPage(1);
        onLeadsAdded?.();
        await fetchCampaignLeads();
      } catch (error: unknown) {
        toast.error(getEmailServiceErrorMessage(error, "Failed to add leads to campaign"));
      } finally {
        setAddingLeads(false);
      }
    },
    [
      canModifyLeads,
      campaignId,
      effectiveDomainId,
      fetchCampaignLeads,
      onLeadsAdded,
      selectedCategories,
      selectedTags,
    ]
  );

  const toggleLeadSelection = useCallback((leadId: string, checked: boolean) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(leadId);
      } else {
        next.delete(leadId);
      }
      return next;
    });
  }, []);

  const toggleSelectAllOnPage = useCallback(
    (checked: boolean) => {
      if (!checked) {
        setSelectedLeadIds(new Set());
        return;
      }
      setSelectedLeadIds(new Set(leads.map((lead) => lead.id)));
    },
    [leads]
  );

  const handleRemoveSelected = useCallback(async () => {
    if (!canModifyLeads) {
      toast.error("Leads cannot be removed while the campaign is in this status.");
      return;
    }

    const leadIds = Array.from(selectedLeadIds);
    if (leadIds.length === 0) {
      toast.error("Select at least one lead to remove");
      return;
    }

    setRemovingLeads(true);
    try {
      const result = await removeLeadsFromCampaign(
        effectiveDomainId,
        campaignId,
        leadIds
      );

      toast.success(
        result.message ||
          `Removed ${result.leadsRemoved} lead${result.leadsRemoved !== 1 ? "s" : ""} from campaign`
      );

      setShowRemoveConfirm(false);
      setSelectedLeadIds(new Set());
      onLeadsAdded?.();
      await fetchCampaignLeads();
    } catch (error: unknown) {
      toast.error(
        getEmailServiceErrorMessage(error, "Failed to remove leads from campaign")
      );
    } finally {
      setRemovingLeads(false);
    }
  }, [
    canModifyLeads,
    campaignId,
    effectiveDomainId,
    fetchCampaignLeads,
    onLeadsAdded,
    selectedLeadIds,
  ]);

  const selectedCount = selectedLeadIds.size;
  const allOnPageSelected =
    leads.length > 0 && leads.every((lead) => selectedLeadIds.has(lead.id));
  const someOnPageSelected =
    leads.some((lead) => selectedLeadIds.has(lead.id)) && !allOnPageSelected;

  const displayTotal = totalCount > 0 ? totalCount : totalLeads;
  const rangeStart = displayTotal === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = displayTotal === 0 ? 0 : Math.min(page * pageSize, totalCount || displayTotal);
  const hasLeads = displayTotal > 0 || leads.length > 0;
  const isEmpty = !loadingLeads && !hasLeads && !debouncedSearch;

  const pageNumbers = useMemo(() => {
    const pages = Math.max(1, totalPages || Math.ceil(displayTotal / pageSize) || 1);
    const windowSize = 5;
    let start = Math.max(1, page - Math.floor(windowSize / 2));
    const end = Math.min(pages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages, displayTotal, pageSize]);

  const resolvedTotalPages = Math.max(1, totalPages || Math.ceil(displayTotal / pageSize) || 1);

  const showRestartBanner = campaignStatus !== "draft" && leadsNeedRestart;

  const handleRestartCampaign = async () => {
    setRestarting(true);
    try {
      const res = await restartCampaign(effectiveDomainId, campaignId);
      toast.success(
        res.message ||
          "Campaign restarted! New leads are queued and will be verified before sending."
      );
      onRefresh?.();
      onLeadsAdded?.();
      await fetchCampaignLeads();
    } catch (err: unknown) {
      toast.error(getEmailServiceErrorMessage(err, "Failed to restart campaign"));
    } finally {
      setRestarting(false);
    }
  };

  const persistLeadhubConfig = async (config: LeadhubSyncConfig | null) => {
    await patchCampaign(effectiveDomainId, campaignId, {
      leadhubSyncConfig: config,
    });
    setLeadhubSyncConfig(config);
  };

  const runLeadhubSync = async (config: LeadhubSyncConfig) => {
    try {
      setLeadhubSyncing(true);
      setLeadhubSyncPhase("fetching");
      setEnrichmentChoiceOpen(false);
      const savedConfig: LeadhubSyncConfig = {
        ...config,
        enabled: true,
        source: "leadhub_autopilot",
        enrichmentGate: config.enrichmentGate ?? "import_both",
      };
      await persistLeadhubConfig(savedConfig);
      const stats = await syncLeadhubCampaign(campaignId);
      setLeadhubSyncStats(stats);
      await fetchLeadhubSyncLinks();
      await fetchCampaignLeads();
      onLeadsAdded?.();
      setLeadhubSyncPhase("complete");
      toast.success(
        `LeadHub sync: ${stats.ready + stats.queued} ready · ${stats.skipped} skipped`
      );
    } catch (err: unknown) {
      setLeadhubSyncPhase("error");
      toast.error(getEmailServiceErrorMessage(err, "LeadHub sync failed"));
    } finally {
      setLeadhubSyncing(false);
      pendingSyncConfigRef.current = null;
    }
  };

  const beginLeadhubSyncFlow = async (config: LeadhubSyncConfig | null) => {
    if (!config?.enabled) {
      try {
        await persistLeadhubConfig(null);
        setLeadhubSyncStats(null);
        setLeadhubSyncPhase("idle");
        toast.success("LeadHub Autopilot disabled");
      } catch (err: unknown) {
        toast.error(getEmailServiceErrorMessage(err, "Failed to update Autopilot"));
      }
      return;
    }

    try {
      setEnrichmentPreviewLoading(true);
      const baseConfig: LeadhubSyncConfig = {
        ...config,
        enabled: true,
        source: "leadhub_autopilot",
        enrichmentGate: config.enrichmentGate ?? "import_both",
      };
      pendingSyncConfigRef.current = baseConfig;
      await persistLeadhubConfig(baseConfig);
      const preview = await previewLeadhubSync(campaignId);
      setEnrichmentPreview(preview);
      setEnrichmentChoiceOpen(true);
    } catch (err: unknown) {
      toast.error(getEmailServiceErrorMessage(err, "Failed to preview LeadHub leads"));
      pendingSyncConfigRef.current = null;
    } finally {
      setEnrichmentPreviewLoading(false);
    }
  };

  const confirmEnrichmentChoice = (
    gate: "import_both" | "enriched_only" | "unenriched_only"
  ) => {
    const base = pendingSyncConfigRef.current ?? leadhubSyncConfig;
    if (!base) return;
    void runLeadhubSync({ ...base, enrichmentGate: gate });
  };

  const hasLeadhubImports = leadhubSyncLinks.length > 0;

  const leadhubSummary = useMemo(
    () => summarizeLeadhubSyncLinks(leadhubSyncLinks),
    [leadhubSyncLinks]
  );

  const leadhubSkipReasons = useMemo(
    () => formatLeadhubSkipReasons(leadhubSummary),
    [leadhubSummary]
  );

  const leadhubExcludedCount =
    leadhubSummary.skipped + leadhubSummary.failed + leadhubSummary.pendingEnrichment;

  const leadhubInCampaignCount =
    displayTotal > 0 ? displayTotal : leadhubSummary.addedToCampaign;

  const continuousSyncLabel = formatContinuousSyncInterval(
    continuousSyncIntervalMinutes
  ).toLowerCase();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {showRestartBanner && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-amber-900">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-xs font-semibold text-amber-900">New leads added</p>
                <p className="text-[11px] text-amber-700">
                  Emails for new leads will not send until you click{" "}
                  <strong className="font-semibold">Restart Campaign</strong>. Risky
                  addresses are verified before anything is sent.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRestartCampaign}
              disabled={restarting}
              className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-amber-700 disabled:opacity-50"
            >
              {restarting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              Restart Campaign
            </button>
          </div>
        </div>
      )}

      {isContinuous && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-blue-900">
          <p className="font-semibold">Continuous campaign</p>
          <p className="mt-0.5 text-xs text-blue-800/90">
            LeadHub and Google Sheets sync new leads {continuousSyncLabel}.
            Webhook leads wait 30 minutes before entering the send queue. This
            campaign will not auto-complete while idle — pause or stop it when
            you are done. Change the interval in Options → Campaign mode.
          </p>
        </div>
      )}

      {/* LeadHub — only when integration is connected */}
      {leadhubStatusLoaded && leadhubConnected && (
        <div className="mb-6">
          {hasLeadhubImports ? (
            <button
              type="button"
              onClick={() => setLeadhubModalOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <Zap className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-emerald-900">
                  Imported from LeadHub
                </p>
                <p className="mt-0.5 text-xs text-emerald-800/80">
                  {leadhubSummary.imported.toLocaleString()} contact
                  {leadhubSummary.imported !== 1 ? "s" : ""} synced from LeadHub
                  {" · "}
                  {leadhubInCampaignCount.toLocaleString()} added to this
                  campaign
                  {leadhubExcludedCount > 0 && (
                    <>
                      {" · "}
                      {leadhubExcludedCount.toLocaleString()} not added
                    </>
                  )}
                  {" · "}
                  {isContinuous
                    ? `Auto-sync ${continuousSyncLabel} · click to sync more`
                    : "Click to sync more (manual only)"}
                </p>
                {leadhubExcludedCount > 0 && leadhubSkipReasons && (
                  <p className="mt-1 text-xs text-emerald-900/70">
                    Not added: {leadhubSkipReasons}
                    {leadhubSummary.pendingEnrichment > 0
                      ? " — these may appear after enrichment finishes"
                      : ""}
                  </p>
                )}
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setLeadhubModalOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-left transition hover:border-amber-300 hover:bg-amber-50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white">
                <Zap className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-950">
                  LeadHub needs import
                </p>
                <p className="mt-0.5 text-xs text-amber-900/80">
                  {isContinuous
                    ? `Open filters — continuous campaigns sync LeadHub ${continuousSyncLabel} after setup`
                    : "Open import filters and sync LeadHub contacts (manual Sync only)"}
                </p>
              </div>
            </button>
          )}

          <LeadhubAutopilotPanel
            open={leadhubModalOpen}
            onClose={() => setLeadhubModalOpen(false)}
            value={leadhubSyncConfig}
            isContinuous={isContinuous}
            continuousSyncIntervalMinutes={continuousSyncIntervalMinutes}
            onChange={(config) => {
              setLeadhubSyncConfig(config);
              if (!config?.enabled) {
                void beginLeadhubSyncFlow(null);
                return;
              }
              void persistLeadhubConfig({
                ...config,
                enabled: true,
                source: "leadhub_autopilot",
                enrichmentGate: config.enrichmentGate ?? "import_both",
              }).catch((err: unknown) => {
                toast.error(
                  getEmailServiceErrorMessage(
                    err,
                    "Failed to save Autopilot settings"
                  )
                );
              });
            }}
            syncing={leadhubSyncing || enrichmentPreviewLoading}
            enriching={false}
            syncPhase={leadhubSyncPhase}
            syncStats={leadhubSyncStats}
            syncLinks={leadhubSyncLinks}
            onSyncNow={() => {
              const config = leadhubSyncConfig ?? {
                enabled: true,
                source: "leadhub_autopilot" as const,
                enrichmentGate: "import_both" as const,
                priorities: ["hot", "warm"] as Array<
                  "hot" | "warm" | "cold" | "unknown"
                >,
              };
              void beginLeadhubSyncFlow({ ...config, enabled: true });
            }}
          />
        </div>
      )}

      <div className="mb-6 space-y-4">
        <GoogleSheetsSourcePanel
          campaignId={campaignId}
          domainId={effectiveDomainId}
          campaignStatus={campaignStatus}
          isContinuous={isContinuous}
          continuousSyncIntervalMinutes={continuousSyncIntervalMinutes}
          value={sheetSyncConfig}
          onChange={setSheetSyncConfig}
          onImported={() => {
            void fetchCampaignLeads();
            onLeadsAdded?.();
          }}
        />
        <CampaignWebhookPanel
          campaignId={campaignId}
          domainId={effectiveDomainId}
          isContinuous={isContinuous}
        />
      </div>

          {enrichmentChoiceOpen && enrichmentPreview && (
            <BodyPortal>
              <div
                className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
                onClick={() => {
                  if (!leadhubSyncing) {
                    setEnrichmentChoiceOpen(false);
                    pendingSyncConfigRef.current = null;
                  }
                }}
              >
                <div
                  className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
                  role="dialog"
                  aria-labelledby="leadhub-enrichment-choice-title"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3
                    id="leadhub-enrichment-choice-title"
                    className="text-base font-semibold text-slate-900"
                  >
                    Choose which leads to import
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    We found{" "}
                    <span className="font-medium text-slate-900">
                      {enrichmentPreview.total.toLocaleString()}
                    </span>{" "}
                    matching lead
                    {enrichmentPreview.total !== 1 ? "s" : ""}:{" "}
                    <span className="font-medium text-slate-900">
                      {enrichmentPreview.enrichedCount.toLocaleString()}
                    </span>{" "}
                    enriched and{" "}
                    <span className="font-medium text-slate-900">
                      {enrichmentPreview.unenrichedCount.toLocaleString()}
                    </span>{" "}
                    not enriched. Import both, or only one group?
                  </p>
                  <div className="mt-5 flex flex-col gap-2">
                    <Button
                      type="button"
                      className="w-full bg-blue-600 text-white hover:bg-blue-700"
                      disabled={leadhubSyncing}
                      onClick={() => confirmEnrichmentChoice("import_both")}
                    >
                      Import both
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={
                        leadhubSyncing || enrichmentPreview.enrichedCount === 0
                      }
                      onClick={() => confirmEnrichmentChoice("enriched_only")}
                    >
                      Enriched only ({enrichmentPreview.enrichedCount.toLocaleString()})
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={
                        leadhubSyncing || enrichmentPreview.unenrichedCount === 0
                      }
                      onClick={() => confirmEnrichmentChoice("unenriched_only")}
                    >
                      Not enriched only (
                      {enrichmentPreview.unenrichedCount.toLocaleString()})
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      disabled={leadhubSyncing}
                      onClick={() => {
                        setEnrichmentChoiceOpen(false);
                        pendingSyncConfigRef.current = null;
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </BodyPortal>
          )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Campaign Leads</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {displayTotal > 0
              ? `${displayTotal.toLocaleString()} lead${displayTotal !== 1 ? "s" : ""} in this campaign`
              : "No leads added yet"}
            {hasLeadhubImports && leadhubSummary.imported > displayTotal && (
              <span className="text-slate-400">
                {" "}
                · from {leadhubSummary.imported.toLocaleString()} LeadHub contact
                {leadhubSummary.imported !== 1 ? "s" : ""}
                {leadhubExcludedCount > 0 && (
                  <>
                    {" "}
                    ({leadhubExcludedCount.toLocaleString()} not added
                    {leadhubSkipReasons ? `: ${leadhubSkipReasons}` : ""})
                  </>
                )}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchCampaignLeads()}
            disabled={loadingLeads}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loadingLeads ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {canModifyLeads && (
            <button
              onClick={() => setShowAddModal(true)}
              disabled={addingLeads}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-60"
            >
              {addingLeads ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Leads
            </button>
          )}
        </div>
      </div>

      {!canModifyLeads && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Leads cannot be added or removed while this campaign is{" "}
          {campaignStatus === "verifying_leads" ? "verifying" : campaignStatus}.
        </div>
      )}

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-xl border border-slate-200 bg-white">
          <div className="relative mb-6">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 ring-1 ring-slate-200">
              <Users className="h-10 w-10 text-slate-400" />
            </div>
            <div className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 ring-2 ring-white">
              <Plus className="h-4 w-4 text-white" />
            </div>
          </div>

          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Add some leads to get started
          </h3>
          <p className="text-slate-500 max-w-sm text-sm leading-relaxed mb-8">
            Use LeadHub Autopilot above to sync CRM leads, or upload a CSV / pick from
            lead lists and filters.
          </p>

          {canModifyLeads && (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                <Users className="h-4 w-4" />
                Add Leads
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg"
              >
                <Upload className="h-4 w-4" />
                Upload CSV
              </button>
            </div>
          )}

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
            {[
              { icon: Upload, title: "Upload CSV", desc: "Import contacts from a spreadsheet" },
              { icon: Search, title: "From Lead Lists", desc: "Pick from your saved lead lists" },
              {
                icon: UserCheck,
                title: "Filter & Select",
                desc: "Filter by tags, categories, or manually select",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <button
                key={title}
                type="button"
                disabled={!canModifyLeads}
                onClick={() => canModifyLeads && setShowAddModal(true)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-blue-50/50 transition-all disabled:opacity-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
                  <Icon className="h-4 w-4 text-slate-500" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-700">{title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {canModifyLeads && selectedCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                  <span className="text-sm font-medium text-rose-800">
                    {selectedCount} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowRemoveConfirm(true)}
                    disabled={removingLeads}
                    className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                  >
                    {removingLeads ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Remove from campaign
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLeadIds(new Set())}
                    disabled={removingLeads}
                    className="text-xs font-medium text-rose-700 hover:text-rose-900 disabled:opacity-60"
                  >
                    Clear
                  </button>
                </div>
              )}
              <div className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-slate-200">
                <p className="text-xs text-slate-500">Total leads</p>
                <p className="text-lg font-semibold tabular-nums text-slate-900">
                  {displayTotal.toLocaleString()}
                </p>
              </div>
              <div className="text-xs text-slate-500">
                {loadingLeads
                  ? "Loading…"
                  : displayTotal > 0
                    ? `Showing ${rangeStart.toLocaleString()}–${rangeEnd.toLocaleString()} of ${displayTotal.toLocaleString()}`
                    : "No results"}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search email, name, or company…"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600 whitespace-nowrap">
                Rows
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* Data table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white hover:bg-white">
                  {canModifyLeads && (
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          allOnPageSelected
                            ? true
                            : someOnPageSelected
                              ? "indeterminate"
                              : false
                        }
                        onCheckedChange={(checked) =>
                          toggleSelectAllOnPage(checked === true)
                        }
                        disabled={loadingLeads || leads.length === 0}
                        aria-label="Select all leads on this page"
                      />
                    </TableHead>
                  )}
                  <TableHead className="w-12 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    #
                  </TableHead>
                  <TableHead className="min-w-[220px] text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </TableHead>
                  <TableHead className="min-w-[140px] text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Name
                  </TableHead>
                  <TableHead className="min-w-[140px] text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Company
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Verification
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Added
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingLeads ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      {Array.from({ length: canModifyLeads ? 8 : 7 }).map((__, j) => (
                        <TableCell key={j}>
                          <div className="h-4 animate-pulse rounded bg-slate-100" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={canModifyLeads ? 8 : 7}
                      className="py-12 text-center text-sm text-slate-500"
                    >
                      {debouncedSearch
                        ? "No leads match your search."
                        : "No leads found for this campaign."}
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead, index) => (
                    <TableRow
                      key={lead.id}
                      className={`hover:bg-slate-50/80 ${
                        selectedLeadIds.has(lead.id) ? "bg-blue-50/50" : ""
                      }`}
                    >
                      {canModifyLeads && (
                        <TableCell>
                          <Checkbox
                            checked={selectedLeadIds.has(lead.id)}
                            onCheckedChange={(checked) =>
                              toggleLeadSelection(lead.id, checked === true)
                            }
                            disabled={removingLeads}
                            aria-label={`Select ${lead.email}`}
                          />
                        </TableCell>
                      )}
                      <TableCell className="text-xs tabular-nums text-slate-400">
                        {(page - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">{lead.email}</TableCell>
                      <TableCell className="text-slate-600">{lead.name || "—"}</TableCell>
                      <TableCell className="text-slate-600">{lead.company || "—"}</TableCell>
                      <TableCell>
                        <StatusBadge status={lead.status} sendError={lead.sendError} />
                      </TableCell>
                      <TableCell>
                        <VerificationBadge
                          status={lead.verificationStatus}
                          isSafeToSend={lead.isSafeToSend}
                        />
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {formatDate(lead.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Page {page} of {resolvedTotalPages}
              {debouncedSearch ? ` · filtered by "${debouncedSearch}"` : ""}
            </p>
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={page <= 1 || loadingLeads}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                aria-label="First page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loadingLeads}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  disabled={loadingLeads}
                  className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-medium ${
                    n === page
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(resolvedTotalPages, p + 1))}
                disabled={page >= resolvedTotalPages || loadingLeads}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPage(resolvedTotalPages)}
                disabled={page >= resolvedTotalPages || loadingLeads}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                aria-label="Last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showRemoveConfirm}
        onClose={() => {
          if (!removingLeads) setShowRemoveConfirm(false);
        }}
        onConfirm={() => void handleRemoveSelected()}
        title="Remove leads from campaign?"
        message={`Remove ${selectedCount} lead${selectedCount !== 1 ? "s" : ""} from this campaign? They will not receive any remaining emails in this campaign. Already sent emails are not affected.`}
        confirmText="Remove leads"
        cancelText="Keep leads"
        type="danger"
        isLoading={removingLeads}
      />

      <RecipientSelectionModal
        open={showAddModal}
        onClose={() => {
          if (!addingLeads) setShowAddModal(false);
        }}
        onSelect={(data) => void handleSelect(data)}
        initialSelection={{ type: "individual", ids: [], count: 0 }}
        selectedTags={selectedTags}
        selectedCategories={selectedCategories}
        onTagsChange={setSelectedTags}
        onCategoriesChange={setSelectedCategories}
      />
    </div>
  );
}
