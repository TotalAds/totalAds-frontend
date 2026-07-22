"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import BulkUploadModal from "@/components/leads/BulkUploadModal";
import BulkUploadProgressBanner from "@/components/leads/BulkUploadProgressBanner";
import ContactPlanLimitBanner from "@/components/leads/ContactPlanLimitBanner";
import { LeadDetailsModal } from "@/components/leads/LeadDetailsModal";
import LeadsTable, {
  EMPTY_LEAD_FILTERS,
  hasActiveLeadFilters,
  LeadColumnFilters,
  LeadFilterOptions,
  LeadRow,
} from "@/components/leads/LeadsTable";
import { LeadVerificationModal } from "@/components/leads/LeadVerificationModal";
import { BodyPortal } from "@/components/ui/BodyPortal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useCanEdit, useIsViewer } from "@/context/WorkspaceContext";
import WorkspaceRoleBanner from "@/components/workspace/WorkspaceRoleBanner";
import emailClient, {
  checkActiveBulkUploadJobs,
  ContactMetrics,
  getContactMetrics,
} from "@/utils/api/emailClient";
import { IconMail, IconPlus, IconTrash, IconX } from "@tabler/icons-react";

interface ListResponse {
  leads: LeadRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface FilterOptionsResponse {
  categories: Array<{ id: string; name: string; color?: string; count?: number }>;
  tags: Array<{ id: string; name: string; color?: string; count?: number }>;
  campaigns: Array<{ id: string; name: string; status?: string; count?: number }>;
  lists: Array<{ id: string; name: string; count?: number }>;
}

export default function LeadsPage() {
  const router = useRouter();
  const canEdit = useCanEdit();
  const isViewer = useIsViewer();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<LeadColumnFilters>(EMPTY_LEAD_FILTERS);
  const [filterOptions, setFilterOptions] = useState<LeadFilterOptions>({
    categories: [],
    tags: [],
    campaigns: [],
    lists: [],
  });
  const [selectedLeadForCampaigns, setSelectedLeadForCampaigns] =
    useState<LeadRow | null>(null);
  const [showStartCampaignModal, setShowStartCampaignModal] = useState(false);
  const [selectedLeadsForCampaign, setSelectedLeadsForCampaign] = useState<
    Set<string>
  >(new Set());
  const [selectedLeadForVerification, setSelectedLeadForVerification] =
    useState<LeadRow | null>(null);
  const [selectedLeadForDetails, setSelectedLeadForDetails] =
    useState<LeadRow | null>(null);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [activeUploadJobs, setActiveUploadJobs] = useState<
    Array<{ jobId: string; totalRows: number }>
  >([]);
  const [contactMetrics, setContactMetrics] = useState<ContactMetrics | null>(
    null
  );
  const [pendingDeleteLeadId, setPendingDeleteLeadId] = useState<string | null>(
    null
  );
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasActiveFilters = hasActiveLeadFilters(filters);

  useEffect(() => {
    loadLeads();

    checkActiveBulkUploadJobs()
      .then((result) => {
        if (result.hasActiveJobs && result.activeJobs.length > 0) {
          setActiveUploadJobs(
            result.activeJobs.map((job) => ({
              jobId: job.jobId,
              totalRows: job.totalRows,
            }))
          );
        }
      })
      .catch((error) => {
        console.error("Failed to check active jobs:", error);
      });
  }, [page, limit, filters]);

  useEffect(() => {
    loadFilterOptions();
  }, [filters]);

  useEffect(() => {
    setSelectedLeadsForCampaign(new Set());
  }, [filters, page, limit]);

  const loadFilterOptions = async () => {
    try {
      const params = new URLSearchParams();

      if (filters.categoryIds.length > 0) {
        params.append("categoryIds", filters.categoryIds.join(","));
      }
      if (filters.tagIds.length > 0) {
        params.append("tagIds", filters.tagIds.join(","));
      }
      if (filters.campaignIds.length > 0) {
        params.append("campaignIds", filters.campaignIds.join(","));
      }
      if (filters.listIds.length > 0) {
        params.append("listIds", filters.listIds.join(","));
      }

      const response = await emailClient.get<{ data: FilterOptionsResponse }>(
        `/api/leads/filter-options?${params.toString()}`
      );

      if (response.data?.data) {
        const data = response.data.data;
        setFilterOptions({
          categories: data.categories.map((c) => ({
            id: c.id,
            name: c.name,
            count: c.count,
            color: c.color,
          })),
          tags: data.tags.map((t) => ({
            id: t.id,
            name: t.name,
            count: t.count,
            color: t.color,
          })),
          campaigns: data.campaigns.map((c) => ({
            id: c.id,
            name: c.name,
            count: c.count,
          })),
          lists: (data.lists ?? []).map((l) => ({
            id: l.id,
            name: l.name,
            count: l.count,
          })),
        });
      }
    } catch (error) {
      console.error("Failed to load filter options:", error);
    }
  };

  const loadLeads = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters.email.trim()) params.append("email", filters.email.trim());
      if (filters.name.trim()) params.append("name", filters.name.trim());
      if (filters.categoryIds.length > 0) {
        params.append("categoryIds", filters.categoryIds.join(","));
      }
      if (filters.tagIds.length > 0) {
        params.append("tagIds", filters.tagIds.join(","));
      }
      if (filters.campaignIds.length > 0) {
        params.append("campaignIds", filters.campaignIds.join(","));
      }
      if (filters.listIds.length > 0) {
        params.append("listIds", filters.listIds.join(","));
      }
      if (filters.verification.length > 0) {
        params.append("verification", filters.verification.join(","));
      }

      const [response, metrics] = await Promise.all([
        emailClient.get<{ data: ListResponse }>(
          `/api/leads?${params.toString()}`
        ),
        getContactMetrics().catch(() => null),
      ]);

      if (metrics) setContactMetrics(metrics);

      if (response.data?.data) {
        setLeads(response.data.data.leads);
        setTotal(response.data.data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to load leads:", error);
      toast.error("Failed to load leads");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (leadId: string) => {
    setPendingDeleteLeadId(leadId);
  };

  const confirmSingleDelete = async () => {
    if (!pendingDeleteLeadId) return;

    setIsDeleting(true);
    try {
      await emailClient.delete(`/api/leads/${pendingDeleteLeadId}`);
      toast.success("Lead deleted successfully");
      setPendingDeleteLeadId(null);
      setSelectedLeadsForCampaign((prev) => {
        const next = new Set(prev);
        next.delete(pendingDeleteLeadId);
        return next;
      });
      await loadLeads();
    } catch (error) {
      console.error("Failed to delete lead:", error);
      toast.error("Failed to delete lead");
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmBulkDelete = async () => {
    const leadIds = Array.from(selectedLeadsForCampaign);
    if (leadIds.length === 0) return;

    setIsDeleting(true);
    try {
      const results = await Promise.allSettled(
        leadIds.map((leadId) => emailClient.delete(`/api/leads/${leadId}`))
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      const deleted = leadIds.length - failed;

      if (deleted > 0) {
        toast.success(
          `Deleted ${deleted} lead${deleted !== 1 ? "s" : ""} successfully`
        );
      }
      if (failed > 0) {
        toast.error(
          `Failed to delete ${failed} lead${failed !== 1 ? "s" : ""}`
        );
      }

      setShowBulkDeleteConfirm(false);
      setSelectedLeadsForCampaign(new Set());
      await loadLeads();
    } catch (error) {
      console.error("Failed to delete leads:", error);
      toast.error("Failed to delete selected leads");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFiltersChange = useCallback((next: LeadColumnFilters) => {
    setFilters(next);
    setPage(1);
  }, []);

  const clearAllFilters = () => {
    setFilters(EMPTY_LEAD_FILTERS);
    setPage(1);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.email.trim()) count++;
    if (filters.name.trim()) count++;
    if (filters.verification.length > 0) count++;
    if (filters.tagIds.length > 0) count++;
    if (filters.categoryIds.length > 0) count++;
    if (filters.listIds.length > 0) count++;
    if (filters.campaignIds.length > 0) count++;
    return count;
  }, [filters]);

  return (
    <div className="min-h-screen bg-bg-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-text-100">
              Lead Management
            </h1>
            <p className="text-text-200">
              Manage and organize your email leads
            </p>
          </div>
          <div className="flex items-center gap-3">
            {canEdit && (
              <>
                <button
                  onClick={async () => {
                    try {
                      const activeJobsResult = await checkActiveBulkUploadJobs();
                      if (
                        activeJobsResult.hasActiveJobs &&
                        activeJobsResult.activeJobs.length > 0
                      ) {
                        toast.warning(
                          `You have ${activeJobsResult.activeJobs.length} bulk upload job${activeJobsResult.activeJobs.length > 1 ? "s" : ""} in progress. Please wait for them to complete.`,
                          { duration: 5000 }
                        );
                        setActiveUploadJobs(
                          activeJobsResult.activeJobs.map((job) => ({
                            jobId: job.jobId,
                            totalRows: job.totalRows,
                          }))
                        );
                        return;
                      }
                    } catch (error) {
                      console.error("Failed to check active jobs:", error);
                    }
                    setShowBulkUploadModal(true);
                  }}
                  disabled={activeUploadJobs.length > 0}
                  className={`flex transform items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all duration-200 hover:scale-[1.02] ${
                    activeUploadJobs.length > 0
                      ? "cursor-not-allowed bg-gray-400 opacity-60"
                      : "bg-sidebar text-white hover:bg-sidebar/80"
                  }`}
                >
                  <IconPlus size={20} />
                  Bulk Upload
                  {activeUploadJobs.length > 0 && (
                    <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                      {activeUploadJobs.length} active
                    </span>
                  )}
                </button>
                <button
                  onClick={() => router.push("/email/leads/create")}
                  className="flex transform items-center gap-2 rounded-xl bg-brand-main px-6 py-3 font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:bg-brand-main/80"
                >
                  <IconPlus size={20} />
                  Add Lead
                </button>
              </>
            )}
          </div>
        </div>

        {isViewer && (
          <WorkspaceRoleBanner variant="viewer-action" className="mb-6" />
        )}

        <ContactPlanLimitBanner metrics={contactMetrics} className="mb-6" />

        {activeUploadJobs.length > 0 && (
          <div className="mb-6 space-y-3">
            {activeUploadJobs.map((job) => (
              <BulkUploadProgressBanner
                key={job.jobId}
                jobId={job.jobId}
                onComplete={async () => {
                  const updated = activeUploadJobs.filter(
                    (j) => j.jobId !== job.jobId
                  );
                  setActiveUploadJobs(updated);

                  try {
                    const activeJobsResult = await checkActiveBulkUploadJobs();
                    if (
                      activeJobsResult.hasActiveJobs &&
                      activeJobsResult.activeJobs.length > 0
                    ) {
                      setActiveUploadJobs(
                        activeJobsResult.activeJobs.map((j) => ({
                          jobId: j.jobId,
                          totalRows: j.totalRows,
                        }))
                      );
                    } else {
                      setActiveUploadJobs([]);
                    }
                  } catch (error) {
                    console.error("Failed to refresh active jobs:", error);
                  }

                  loadLeads();
                }}
                onDismiss={() => {
                  const updated = activeUploadJobs.filter(
                    (j) => j.jobId !== job.jobId
                  );
                  setActiveUploadJobs(updated);
                  const jobIds = updated.map((j) => j.jobId);
                  localStorage.setItem(
                    "activeBulkUploadJobs",
                    JSON.stringify(jobIds)
                  );
                }}
              />
            ))}
          </div>
        )}

        {hasActiveFilters && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="font-medium text-slate-800">
                {total.toLocaleString()} result{total !== 1 ? "s" : ""}
              </span>
              <span className="text-slate-300">·</span>
              <span>
                {activeFilterCount} active filter
                {activeFilterCount !== 1 ? "s" : ""}
              </span>
            </div>
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
            >
              <IconX size={14} />
              Clear all filters
            </button>
          </div>
        )}

        {canEdit && selectedLeadsForCampaign.size > 0 && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-brand-main/30 bg-brand-main/10 p-4">
            <div className="text-text-100">
              <span className="font-semibold">
                {selectedLeadsForCampaign.size}
              </span>{" "}
              filtered lead{selectedLeadsForCampaign.size !== 1 ? "s" : ""}{" "}
              selected on this page
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(true)}
                disabled={isDeleting}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100 hover:text-rose-700 disabled:opacity-50"
                title={`Delete ${selectedLeadsForCampaign.size} selected lead${selectedLeadsForCampaign.size !== 1 ? "s" : ""}`}
                aria-label={`Delete ${selectedLeadsForCampaign.size} selected lead${selectedLeadsForCampaign.size !== 1 ? "s" : ""}`}
              >
                <IconTrash size={18} />
              </button>
              <button
                onClick={() => setShowStartCampaignModal(true)}
                className="flex items-center gap-2 rounded-lg bg-brand-main px-4 py-2 font-semibold text-white transition-all duration-200 hover:bg-brand-main/80"
              >
                <IconMail size={18} />
                Start Campaign
              </button>
              <button
                onClick={() => setSelectedLeadsForCampaign(new Set())}
                className="rounded-lg bg-brand-main/10 px-4 py-2 text-text-100 transition-colors hover:bg-brand-main/20"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <LeadsTable
          leads={leads}
          loading={isLoading}
          canEdit={canEdit}
          filters={filters}
          filterOptions={filterOptions}
          onFiltersChange={handleFiltersChange}
          selectedIds={selectedLeadsForCampaign}
          onSelectionChange={setSelectedLeadsForCampaign}
          onVerify={setSelectedLeadForVerification}
          onDelete={handleDelete}
          onViewDetails={setSelectedLeadForDetails}
          onCampaignClick={setSelectedLeadForCampaigns}
          emptyMessage={
            hasActiveFilters
              ? "No leads match your filters"
              : "No leads found. Create one to get started."
          }
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setLimit(newSize);
            setPage(1);
          }}
        />

        {selectedLeadForCampaigns &&
          selectedLeadForCampaigns.campaigns &&
          selectedLeadForCampaigns.campaigns.length > 0 && (
            <BodyPortal>
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-2xl border border-brand-main/20 bg-gradient-to-br from-bg-200 to-bg-300 p-6 shadow-2xl">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-text-100">
                      Associated Campaigns (
                      {selectedLeadForCampaigns.campaigns.length})
                    </h3>
                    <button
                      onClick={() => setSelectedLeadForCampaigns(null)}
                      className="rounded-lg p-1 transition-colors hover:bg-brand-main/10"
                    >
                      <IconX size={20} className="text-text-200" />
                    </button>
                  </div>
                  <div className="max-h-96 space-y-2 overflow-y-auto">
                    {selectedLeadForCampaigns.campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="rounded-lg border border-brand-main/10 bg-brand-main/5 p-3 transition-colors hover:bg-brand-main/10"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-text-100">
                            {campaign.name}
                          </p>
                          {campaign.status && (
                            <span
                              className={`rounded px-2 py-1 text-xs font-semibold ${
                                campaign.status === "new"
                                  ? "bg-blue-500/20 text-blue-300"
                                  : campaign.status === "sent"
                                    ? "bg-green-500/20 text-green-300"
                                    : campaign.status === "opened"
                                      ? "bg-brand-main/20 text-brand-main"
                                      : campaign.status === "clicked"
                                        ? "bg-pink-500/20 text-pink-300"
                                        : campaign.status === "bounced"
                                          ? "bg-red-500/20 text-red-300"
                                          : "bg-gray-500/20 text-text-200"
                              }`}
                            >
                              {campaign.status}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-xs text-text-200">
                          ID: {campaign.id}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </BodyPortal>
          )}

        {showStartCampaignModal && (
          <BodyPortal>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl border border-brand-main/20 bg-slate-900 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-text-100">
                    Start Campaign with Selected Leads
                  </h3>
                  <button
                    onClick={() => setShowStartCampaignModal(false)}
                    className="rounded-lg p-1 transition-colors hover:bg-brand-main/10"
                  >
                    <IconX size={20} className="text-text-200" />
                  </button>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-text-200">
                    You have selected{" "}
                    <span className="font-semibold text-brand-main">
                      {selectedLeadsForCampaign.size}
                    </span>{" "}
                    lead{selectedLeadsForCampaign.size !== 1 ? "s" : ""}.
                  </p>
                  <p className="text-sm text-text-200">
                    To start a campaign with these leads, go to the{" "}
                    <button
                      onClick={() => {
                        router.push("/email/campaigns");
                        setShowStartCampaignModal(false);
                      }}
                      className="font-semibold text-brand-main hover:text-brand-secondary"
                    >
                      Campaigns
                    </button>{" "}
                    page, create or open a campaign, then add leads on the Leads
                    tab (or enable LeadHub Autopilot).
                  </p>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-brand-main/10 bg-brand-main/5 p-3">
                    <p className="mb-2 text-xs text-text-200">Selected Leads:</p>
                    <div className="space-y-1">
                      {Array.from(selectedLeadsForCampaign).map((leadId) => {
                        const lead = leads.find((l) => l.id === leadId);
                        return (
                          <div key={leadId} className="text-xs text-text-200">
                            {lead?.email}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowStartCampaignModal(false)}
                      className="flex-1 rounded-lg bg-brand-main/10 px-4 py-2 text-text-100 transition-colors hover:bg-brand-main/20"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        router.push("/email/campaigns");
                        setShowStartCampaignModal(false);
                      }}
                      className="flex-1 rounded-lg bg-brand-main px-4 py-2 font-semibold text-text-100 transition-all duration-200 hover:bg-brand-main/80"
                    >
                      Go to Campaigns
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </BodyPortal>
        )}

        <LeadVerificationModal
          isOpen={!!selectedLeadForVerification}
          lead={selectedLeadForVerification}
          onClose={() => setSelectedLeadForVerification(null)}
        />
        <LeadDetailsModal
          isOpen={!!selectedLeadForDetails}
          lead={selectedLeadForDetails}
          onClose={() => setSelectedLeadForDetails(null)}
        />
        <BulkUploadModal
          isOpen={showBulkUploadModal}
          onClose={() => setShowBulkUploadModal(false)}
          onSuccess={(jobId?: string, totalRows?: number) => {
            loadLeads();
            setShowBulkUploadModal(false);
            if (jobId && totalRows) {
              setActiveUploadJobs((prev) => [...prev, { jobId, totalRows }]);
            } else {
              const jobIds = JSON.parse(
                localStorage.getItem("activeBulkUploadJobs") || "[]"
              );
              if (jobIds.length > 0) {
                Promise.all(
                  jobIds.map(async (id: string) => {
                    try {
                      const { getBulkUploadJobStatus } = await import(
                        "@/utils/api/emailClient"
                      );
                      const status = await getBulkUploadJobStatus(id);
                      return { jobId: id, totalRows: status.totalRows };
                    } catch {
                      return { jobId: id, totalRows: 0 };
                    }
                  })
                ).then(setActiveUploadJobs);
              }
            }
          }}
        />

        <ConfirmDialog
          isOpen={!!pendingDeleteLeadId}
          onClose={() => {
            if (!isDeleting) setPendingDeleteLeadId(null);
          }}
          onConfirm={() => void confirmSingleDelete()}
          title="Delete lead?"
          message="Are you sure you want to delete this lead? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          isLoading={isDeleting}
        />

        <ConfirmDialog
          isOpen={showBulkDeleteConfirm}
          onClose={() => {
            if (!isDeleting) setShowBulkDeleteConfirm(false);
          }}
          onConfirm={() => void confirmBulkDelete()}
          title="Delete selected leads?"
          message={`Are you sure you want to delete ${selectedLeadsForCampaign.size} selected lead${selectedLeadsForCampaign.size !== 1 ? "s" : ""}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
}
