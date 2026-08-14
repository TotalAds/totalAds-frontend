"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { LeadDetailsModal } from "@/components/leads/LeadDetailsModal";
import LeadsSubNav from "@/components/leads/LeadsSubNav";
import LeadsToolbar from "@/components/leads/LeadsToolbar";
import {
  buildLeadsApiParams,
  EMPTY_LEAD_COUNTS,
  filtersToApiBody,
  type LeadVerificationCounts,
} from "@/components/leads/leadsFilterUtils";
import LeadsTable, {
  EMPTY_LEAD_FILTERS,
  hasActiveLeadFilters,
  LeadColumnFilters,
  LeadFilterOptions,
  LeadRow,
} from "@/components/leads/LeadsTable";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useCanEdit, useIsViewer } from "@/context/WorkspaceContext";
import WorkspaceRoleBanner from "@/components/workspace/WorkspaceRoleBanner";
import emailClient, {
  exportLeadsCsv,
  unarchiveLeads,
} from "@/utils/api/emailClient";
import { IconArchiveOff, IconDownload, IconTrash } from "@tabler/icons-react";

interface ListResponse {
  leads: LeadRow[];
  counts?: LeadVerificationCounts;
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

export default function ArchivedLeadsPage() {
  const canEdit = useCanEdit();
  const isViewer = useIsViewer();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<LeadColumnFilters>(EMPTY_LEAD_FILTERS);
  const [search, setSearch] = useState("");
  const [counts, setCounts] = useState<LeadVerificationCounts>(EMPTY_LEAD_COUNTS);
  const [filterOptions, setFilterOptions] = useState<LeadFilterOptions>({
    categories: [],
    tags: [],
    campaigns: [],
    lists: [],
  });
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isAllMatchingSelected, setIsAllMatchingSelected] = useState(false);
  const [selectedLeadForDetails, setSelectedLeadForDetails] =
    useState<LeadRow | null>(null);
  const [pendingDeleteLeadId, setPendingDeleteLeadId] = useState<string | null>(
    null
  );
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showBulkUnarchiveConfirm, setShowBulkUnarchiveConfirm] = useState(false);
  const [pendingUnarchiveLeadId, setPendingUnarchiveLeadId] = useState<
    string | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const hasActiveFilters = hasActiveLeadFilters(filters) || search.trim().length > 0;

  useEffect(() => {
    loadLeads();
  }, [page, limit, filters, search]);

  useEffect(() => {
    loadFilterOptions();
  }, [filters, search]);

  useEffect(() => {
    setSelectedLeadIds(new Set());
    setIsAllMatchingSelected(false);
  }, [filters, search, page, limit]);

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
      const params = buildLeadsApiParams({
        page,
        limit,
        search,
        filters,
        archived: true,
      });

      const response = await emailClient.get<{ data: ListResponse }>(
        `/api/leads?${params.toString()}`
      );

      if (response.data?.data) {
        setLeads(response.data.data.leads);
        setTotal(response.data.data.pagination.total);
        setCounts(response.data.data.counts ?? EMPTY_LEAD_COUNTS);
      }
    } catch (error) {
      console.error("Failed to load archived leads:", error);
      toast.error("Failed to load archived leads");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiltersChange = useCallback((next: LeadColumnFilters) => {
    setFilters(next);
    setPage(1);
  }, []);

  const clearAllFilters = () => {
    setFilters(EMPTY_LEAD_FILTERS);
    setSearch("");
    setPage(1);
  };

  const buildSelectionPayload = () => {
    if (isAllMatchingSelected) {
      return {
        selectAllMatching: true,
        filters: { ...filtersToApiBody(search, filters), archived: true },
      };
    }
    return { leadIds: Array.from(selectedLeadIds) };
  };

  const confirmSingleUnarchive = async () => {
    if (!pendingUnarchiveLeadId) return;
    setIsRestoring(true);
    try {
      const result = await unarchiveLeads({ leadIds: [pendingUnarchiveLeadId] });
      toast.success(`Restored ${result.count} lead`);
      setPendingUnarchiveLeadId(null);
      await loadLeads();
    } catch (error) {
      console.error("Failed to unarchive lead:", error);
      toast.error("Failed to restore lead");
    } finally {
      setIsRestoring(false);
    }
  };

  const confirmBulkUnarchive = async () => {
    setIsRestoring(true);
    try {
      const result = await unarchiveLeads(buildSelectionPayload());
      toast.success(`Restored ${result.count} lead${result.count !== 1 ? "s" : ""}`);
      setShowBulkUnarchiveConfirm(false);
      setSelectedLeadIds(new Set());
      setIsAllMatchingSelected(false);
      await loadLeads();
    } catch (error) {
      console.error("Failed to unarchive leads:", error);
      toast.error("Failed to restore selected leads");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = buildLeadsApiParams({
        page: 1,
        limit: 100,
        search,
        filters,
        archived: true,
      });
      await exportLeadsCsv(params.toString());
      toast.success("Export started");
    } catch (error) {
      console.error("Failed to export archived leads:", error);
      toast.error("Failed to export archived leads");
    } finally {
      setIsExporting(false);
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
      toast.success("Lead deleted permanently");
      setPendingDeleteLeadId(null);
      await loadLeads();
    } catch (error) {
      console.error("Failed to delete lead:", error);
      toast.error("Failed to delete lead");
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmBulkDelete = async () => {
    const leadIds = Array.from(selectedLeadIds);
    if (leadIds.length === 0) return;
    setIsDeleting(true);
    try {
      const results = await Promise.allSettled(
        leadIds.map((leadId) => emailClient.delete(`/api/leads/${leadId}`))
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      const deleted = leadIds.length - failed;
      if (deleted > 0) {
        toast.success(`Deleted ${deleted} lead${deleted !== 1 ? "s" : ""}`);
      }
      if (failed > 0) toast.error(`Failed to delete ${failed} lead${failed !== 1 ? "s" : ""}`);
      setShowBulkDeleteConfirm(false);
      setSelectedLeadIds(new Set());
      setIsAllMatchingSelected(false);
      await loadLeads();
    } catch (error) {
      toast.error("Failed to delete selected leads");
    } finally {
      setIsDeleting(false);
    }
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (filters.email.trim()) count++;
    if (filters.name.trim()) count++;
    if (filters.verification.length > 0) count++;
    if (filters.tagIds.length > 0) count++;
    if (filters.categoryIds.length > 0) count++;
    if (filters.listIds.length > 0) count++;
    if (filters.campaignIds.length > 0) count++;
    return count;
  }, [filters, search]);

  return (
    <div className="min-h-screen bg-bg-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="mb-1 text-3xl font-bold text-text-100">
              Archived Leads
            </h1>
            <p className="text-sm text-text-200">
              Review, restore, or export leads removed from active lists and
              campaigns
            </p>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={isExporting || total === 0}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50"
            >
              <IconDownload size={18} />
              Export CSV
            </button>
          )}
        </div>

        {isViewer && (
          <WorkspaceRoleBanner variant="viewer-action" className="mb-6" />
        )}

        <LeadsSubNav />

        <LeadsToolbar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          filters={filters}
          filterOptions={filterOptions}
          onFiltersChange={handleFiltersChange}
          counts={counts}
          onClearAll={clearAllFilters}
        />

        {hasActiveFilters && (
          <p className="mb-2 px-1 text-xs text-slate-500">
            <span className="font-medium text-slate-700">
              {total.toLocaleString()} archived result{total !== 1 ? "s" : ""}
            </span>{" "}
            · {activeFilterCount} active filter
            {activeFilterCount !== 1 ? "s" : ""}
          </p>
        )}

        {canEdit && (selectedLeadIds.size > 0 || isAllMatchingSelected) && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2">
            <span className="text-sm text-emerald-900">
              {isAllMatchingSelected
                ? `All ${total.toLocaleString()} archived leads selected`
                : `${selectedLeadIds.size} selected`}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowBulkUnarchiveConfirm(true)}
                disabled={isRestoring}
                className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <IconArchiveOff size={16} />
                Restore
              </button>
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(true)}
                disabled={isDeleting}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                title="Delete permanently"
              >
                <IconTrash size={16} />
              </button>
              <button
                onClick={() => {
                  setSelectedLeadIds(new Set());
                  setIsAllMatchingSelected(false);
                }}
                className="rounded-md px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-100"
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
          selectedIds={selectedLeadIds}
          onSelectionChange={setSelectedLeadIds}
          isAllMatchingSelected={isAllMatchingSelected}
          onSelectAllMatchingChange={setIsAllMatchingSelected}
          onUnarchive={(lead) => setPendingUnarchiveLeadId(lead.id)}
          onDelete={handleDelete}
          onViewDetails={setSelectedLeadForDetails}
          emptyMessage={
            hasActiveFilters
              ? "No archived leads match your filters"
              : "No archived leads yet"
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

        <LeadDetailsModal
          isOpen={!!selectedLeadForDetails}
          lead={selectedLeadForDetails}
          onClose={() => setSelectedLeadForDetails(null)}
        />

        <ConfirmDialog
          isOpen={!!pendingUnarchiveLeadId}
          onClose={() => {
            if (!isRestoring) setPendingUnarchiveLeadId(null);
          }}
          onConfirm={() => void confirmSingleUnarchive()}
          title="Restore lead?"
          message="This lead will return to your active leads list and can be added to campaigns again."
          confirmText="Restore"
          cancelText="Cancel"
          type="info"
          isLoading={isRestoring}
        />

        <ConfirmDialog
          isOpen={showBulkUnarchiveConfirm}
          onClose={() => {
            if (!isRestoring) setShowBulkUnarchiveConfirm(false);
          }}
          onConfirm={() => void confirmBulkUnarchive()}
          title="Restore selected leads?"
          message={`Restore ${isAllMatchingSelected ? total.toLocaleString() : selectedLeadIds.size} archived lead${(isAllMatchingSelected ? total : selectedLeadIds.size) !== 1 ? "s" : ""} to active lists?`}
          confirmText="Restore"
          cancelText="Cancel"
          type="info"
          isLoading={isRestoring}
        />

        <ConfirmDialog
          isOpen={!!pendingDeleteLeadId}
          onClose={() => {
            if (!isDeleting) setPendingDeleteLeadId(null);
          }}
          onConfirm={() => void confirmSingleDelete()}
          title="Delete lead permanently?"
          message="This cannot be undone."
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
          title="Delete selected archived leads?"
          message="This permanently deletes the selected leads. This cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
}
