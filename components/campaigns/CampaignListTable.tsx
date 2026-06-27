"use client";

import {
  BarChart3,
  ChevronDown,
  Download,
  MoreVertical,
  Pencil,
  Search,
  Trash2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Campaign,
  downloadCampaignAnalyticsReport,
  updateCampaign,
} from "@/utils/api/emailClient";
import { INBOX_CAMPAIGN_DOMAIN_ID } from "@/lib/campaignDomain";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Ready to send" },
  { value: "verifying_leads", label: "Verifying leads" },
  { value: "verification_failed", label: "Verification failed" },
  { value: "sending", label: "Sending" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name A–Z" },
];

const STATUS_LABELS: Record<string, string> = {
  verifying_leads: "Verifying leads",
  verification_failed: "Verification failed",
  scheduled: "Ready to send",
};

const TABLE_HEADERS = [
  "Name",
  "Status",
  "Progress",
  "Sent",
  "Click",
  "Replied",
  "Bounce",
  "Action",
] as const;

function getStatusLabel(status: string): string {
  return (
    STATUS_LABELS[status] ||
    status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")
  );
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "completed":
      return "bg-emerald-500 text-white";
    case "sending":
      return "bg-blue-500 text-white";
    case "scheduled":
      return "bg-sky-500 text-white";
    case "paused":
      return "bg-amber-500 text-white";
    case "verification_failed":
    case "cancelled":
      return "bg-red-500 text-white";
    case "verifying_leads":
      return "bg-violet-500 text-white";
    default:
      return "bg-slate-400 text-white";
  }
}

function getProgressBarClass(status: string): string {
  if (status === "completed") return "bg-emerald-500";
  if (status === "paused") return "bg-amber-500";
  if (status === "verification_failed" || status === "cancelled") {
    return "bg-red-400";
  }
  return "bg-blue-500";
}

function canRenameCampaign(status: string): boolean {
  return status !== "sending" && status !== "verifying_leads";
}

function canDeleteCampaign(status: string): boolean {
  return status !== "sending" && status !== "verifying_leads";
}

export interface CampaignListTableProps {
  campaigns: Campaign[];
  loading?: boolean;
  deletingId?: string | null;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onDelete: (campaignId: string, domainId?: string) => void;
  onRefresh: () => void;
  readOnly?: boolean;
}

export function CampaignListTable({
  campaigns,
  loading = false,
  deletingId = null,
  total,
  page,
  pageSize,
  onPageChange,
  onDelete,
  onRefresh,
  readOnly = false,
}: CampaignListTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [renameTarget, setRenameTarget] = useState<Campaign | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filteredCampaigns = useMemo(() => {
    const query = search.trim().toLowerCase();
    let rows = campaigns.filter((campaign) => {
      if (statusFilter !== "all" && campaign.status !== statusFilter) return false;
      if (!query) return true;
      return campaign.name.toLowerCase().includes(query);
    });

    rows = [...rows].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortBy === "oldest" ? aTime - bTime : bTime - aTime;
    });

    return rows;
  }, [campaigns, search, sortBy, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const allVisibleSelected =
    filteredCampaigns.length > 0 &&
    filteredCampaigns.every((campaign) => selectedIds.has(campaign.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(filteredCampaigns.map((campaign) => campaign.id)));
  };

  const toggleSelect = (campaignId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(campaignId)) next.delete(campaignId);
      else next.add(campaignId);
      return next;
    });
  };

  const openRenameDialog = (campaign: Campaign) => {
    setRenameTarget(campaign);
    setRenameValue(campaign.name);
  };

  const handleRename = async () => {
    if (!renameTarget) return;
    const trimmed = renameValue.trim();
    if (!trimmed) {
      toast.error("Campaign name cannot be empty");
      return;
    }
    if (trimmed === renameTarget.name) {
      setRenameTarget(null);
      return;
    }

    const domainId = renameTarget.domainId || INBOX_CAMPAIGN_DOMAIN_ID;
    try {
      setRenaming(true);
      await updateCampaign(domainId, renameTarget.id, { name: trimmed });
      toast.success("Campaign renamed");
      setRenameTarget(null);
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to rename campaign");
    } finally {
      setRenaming(false);
    }
  };

  const handleDownloadAnalytics = async (campaign: Campaign) => {
    try {
      setDownloadingId(campaign.id);
      await downloadCampaignAnalyticsReport(campaign.id, "overall_summary", "csv");
      toast.success("Analytics report downloaded");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to download analytics");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="h-10 pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Zap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 appearance-none rounded-lg border border-slate-200 bg-white px-4 pr-9 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[960px] w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="w-10 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      aria-label="Select all campaigns"
                    />
                  </th>
                  {TABLE_HEADERS.map((label) => (
                    <th
                      key={label}
                      className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 ${
                        label === "Action" ? "w-[72px] text-center" : ""
                      }`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={TABLE_HEADERS.length + 1}
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      Loading campaigns…
                    </td>
                  </tr>
                ) : filteredCampaigns.length === 0 ? (
                  <tr>
                    <td
                      colSpan={TABLE_HEADERS.length + 1}
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      No campaigns match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((campaign) => {
                    const sent = campaign.sentCount ?? 0;
                    const clicked = campaign.clickCount ?? 0;
                    const bounced = campaign.bounceCount ?? 0;
                    const replied = campaign.replyCount ?? 0;
                    const progress = campaign.progressPercent ?? 0;
                    const replyRate =
                      sent > 0 ? Math.round((replied / sent) * 100) : 0;
                    const analyticsHref = `/email/campaigns/${campaign.id}`;

                    return (
                      <tr
                        key={campaign.id}
                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                      >
                        <td className="px-4 py-3 align-middle">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(campaign.id)}
                            onChange={() => toggleSelect(campaign.id)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            aria-label={`Select ${campaign.name}`}
                          />
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <button
                            type="button"
                            onClick={() => router.push(analyticsHref)}
                            className="max-w-[220px] truncate text-left text-sm font-semibold text-slate-900 hover:text-blue-600"
                          >
                            {campaign.name}
                          </button>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(campaign.status)}`}
                          >
                            {getStatusLabel(campaign.status)}
                          </span>
                        </td>

                        <td className="min-w-[120px] px-4 py-3 align-middle">
                          <div className="mb-1 text-xs font-medium text-slate-700">
                            {progress}%
                          </div>
                          <div className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full transition-all ${getProgressBarClass(campaign.status)}`}
                              style={{
                                width: `${Math.min(100, Math.max(0, progress))}%`,
                              }}
                            />
                          </div>
                        </td>

                        <td className="px-4 py-3 align-middle text-sm font-medium text-slate-800">
                          {sent}
                        </td>
                        <td className="px-4 py-3 align-middle text-sm font-medium text-slate-800">
                          {clicked}
                        </td>
                        <td className="px-4 py-3 align-middle text-sm font-medium text-slate-800">
                          <span>{replied}</span>
                          <span className="mx-1 text-slate-300">|</span>
                          <span className="text-slate-500">{replyRate}%</span>
                        </td>
                        <td className="px-4 py-3 align-middle text-sm font-medium text-slate-800">
                          {bounced}
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div className="flex justify-center">
                            {readOnly ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="border-slate-300"
                                asChild
                              >
                                <Link href={analyticsHref}>View</Link>
                              </Button>
                            ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 shrink-0 border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50"
                                  aria-label={`Actions for ${campaign.name}`}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="z-50 w-52">
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={analyticsHref}
                                    className="flex cursor-pointer items-center"
                                  >
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    View analytics
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={downloadingId === campaign.id}
                                  onClick={() => void handleDownloadAnalytics(campaign)}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  {downloadingId === campaign.id
                                    ? "Downloading…"
                                    : "Download analytics"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  disabled={!canRenameCampaign(campaign.status)}
                                  onClick={() => openRenameDialog(campaign)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Rename campaign
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  disabled={
                                    !canDeleteCampaign(campaign.status) ||
                                    deletingId === campaign.id
                                  }
                                  onClick={() =>
                                    onDelete(campaign.id, campaign.domainId)
                                  }
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {deletingId === campaign.id
                                    ? "Deleting…"
                                    : "Delete campaign"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages} · {total} campaigns
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => onPageChange(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => onPageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={!!renameTarget}
        onOpenChange={(open) => {
          if (!open && !renaming) setRenameTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename campaign</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Campaign name"
            autoFocus
            disabled={renaming}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleRename();
            }}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRenameTarget(null)}
              disabled={renaming}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleRename()} disabled={renaming}>
              {renaming ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
