"use client";

import { ColDef } from "ag-grid-community";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import AGGridWrapper from "@/components/common/AGGridWrapper";
import LeadFilterModal from "@/components/leads/LeadFilterModal";
import { Button } from "@/components/ui/button";
import emailClient from "@/utils/api/emailClient";
import { IconSearch, IconX } from "@tabler/icons-react";

interface Lead {
  id: string;
  email: string;
  name?: string;
  verificationStatus?: string;
  category?: string;
  tags?: string;
  campaigns?: Array<{ id: string; name: string }>;
  createdAt: Date;
}

interface FilterOption {
  id: string;
  name: string;
  color?: string;
  status?: string;
  count?: number;
}

interface FilterOptions {
  categories: FilterOption[];
  tags: FilterOption[];
  campaigns: FilterOption[];
  statuses: Array<{ value: string; label: string; count: number }>;
}

interface LeadSelectionProps {
  onLeadsSelected: (leads: Lead[]) => void;
  onCancel: () => void;
}

export default function LeadSelection({
  onLeadsSelected,
  onCancel,
}: LeadSelectionProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [campaignFilter, setCampaignFilter] = useState<string[]>([]);
  const [verificationFilter, setVerificationFilter] = useState<string[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    tags: [],
    campaigns: [],
    statuses: [],
  });
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);

  useEffect(() => {
    loadLeads();
  }, [
    page,
    limit,
    searchTerm,
    statusFilter,
    categoryFilter,
    tagFilter,
    campaignFilter,
    verificationFilter,
  ]);

  useEffect(() => {
    loadFilterOptions();
  }, [statusFilter, categoryFilter, tagFilter, campaignFilter]);

  const loadFilterOptions = async () => {
    try {
      const params = new URLSearchParams();

      if (categoryFilter.length > 0)
        params.append("categoryIds", categoryFilter.join(","));
      if (tagFilter.length > 0) params.append("tagIds", tagFilter.join(","));
      if (campaignFilter.length > 0)
        params.append("campaignIds", campaignFilter.join(","));
      if (statusFilter.length > 0)
        params.append("statuses", statusFilter.join(","));

      const response = await emailClient.get<{ data: FilterOptions }>(
        `/api/leads/filter-options?${params.toString()}`
      );

      if (response.data?.data) {
        setFilterOptions(response.data.data);
      }
    } catch (error: any) {
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

      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter.length > 0) params.append("status", statusFilter[0]); // Backend currently supports single status
      if (categoryFilter.length > 0)
        params.append("categoryIds", categoryFilter.join(","));
      if (tagFilter.length > 0) params.append("tagIds", tagFilter.join(","));
      if (campaignFilter.length > 0)
        params.append("campaignIds", campaignFilter.join(","));

      const response = await emailClient.get<any>(
        `/api/leads?${params.toString()}`
      );

      if (response.data?.data) {
        setLeads(response.data.data.leads);
        setTotal(response.data.data.pagination.total);
      }
    } catch (error: any) {
      console.error("Failed to load leads:", error);
      toast.error("Failed to load leads");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLeads = () => {
    if (selectedLeads.length === 0) {
      toast.error("Please select at least one lead");
      return;
    }
    onLeadsSelected(selectedLeads);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter([]);
    setCategoryFilter([]);
    setTagFilter([]);
    setCampaignFilter([]);
    setVerificationFilter([]);
    setPage(1);
  };

  const hasActiveFilters =
    searchTerm ||
    statusFilter.length > 0 ||
    categoryFilter.length > 0 ||
    tagFilter.length > 0 ||
    campaignFilter.length > 0 ||
    verificationFilter.length > 0;

  // Handle AG Grid selection change
  const onSelectionChanged = useCallback((event: any) => {
    const selectedRows = event.api.getSelectedRows();
    setSelectedLeads(selectedRows);
  }, []);

  // Row selection configuration for AG Grid v34+
  const rowSelection = useMemo(() => {
    return {
      mode: "multiRow" as const,
      checkboxes: true,
      headerCheckbox: true,
      enableClickSelection: false,
    };
  }, []);

  // Verification status cell renderer
  const VerificationCellRenderer = useCallback((params: any) => {
    const status = params.data?.verificationStatus;
    if (!status) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400">
          Unverified
        </span>
      );
    }

    const statusColors: Record<string, { bg: string; text: string }> = {
      safe: { bg: "bg-green-500/20", text: "text-green-400" },
      risky: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
      invalid: { bg: "bg-red-500/20", text: "text-red-400" },
      unknown: { bg: "bg-gray-500/20", text: "text-gray-400" },
    };

    const colors = statusColors[status.toLowerCase()] || statusColors.unknown;
    const label =
      status === "safe"
        ? "Safe to send"
        : status.charAt(0).toUpperCase() + status.slice(1);

    return (
      <span
        className={`px-2 py-1 text-xs rounded-full ${colors.bg} ${colors.text}`}
      >
        {label}
      </span>
    );
  }, []);

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<Lead>[]>(
    () => [
      {
        headerName: "Email",
        field: "email",
        flex: 2,
        minWidth: 200,
        cellClass: "text-text-100 font-medium",
        sortable: true,
        filter: "agTextColumnFilter",
        filterParams: {
          buttons: ["reset", "apply"],
          closeOnApply: true,
        },
      },
      {
        headerName: "Status",
        field: "verificationStatus",
        flex: 1,
        minWidth: 120,
        maxWidth: 140,
        cellRenderer: VerificationCellRenderer,
        sortable: true,
        filter: "agTextColumnFilter",
        filterParams: {
          buttons: ["reset", "apply"],
          closeOnApply: true,
          filterOptions: ["equals", "notEqual", "contains"],
          defaultOption: "equals",
        },
      },
      {
        headerName: "Name",
        field: "name",
        flex: 1,
        minWidth: 120,
        filter: "agTextColumnFilter",
        filterParams: {
          buttons: ["reset", "apply"],
          closeOnApply: true,
        },
        valueFormatter: (params) => params.value || "-",
        cellClass: "text-text-200",
        sortable: true,
      },
    ],
    [VerificationCellRenderer]
  );

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <IconSearch
            className="absolute left-3 top-3 text-text-200"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-brand-main/10 border border-brand-main/20 rounded-xl text-text-100 placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-brand-main"
          />
        </div>

        {/* Filter Modal Button */}
        <LeadFilterModal
          filterOptions={filterOptions}
          statusFilter={statusFilter}
          categoryFilter={categoryFilter}
          tagFilter={tagFilter}
          campaignFilter={campaignFilter}
          verificationFilter={verificationFilter}
          onStatusFilterChange={(selected) => {
            setStatusFilter(selected);
            setPage(1);
          }}
          onCategoryFilterChange={(selected) => {
            setCategoryFilter(selected);
            setPage(1);
          }}
          onTagFilterChange={(selected) => {
            setTagFilter(selected);
            setPage(1);
          }}
          onCampaignFilterChange={(selected) => {
            setCampaignFilter(selected);
            setPage(1);
          }}
          onVerificationFilterChange={(selected) => {
            setVerificationFilter(selected);
            setPage(1);
          }}
          onApply={() => {}}
          onClearAll={clearAllFilters}
        />

        {/* Results count */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-200">{total} results</span>
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-sm text-text-200 hover:text-text-100 transition-colors"
            >
              <IconX size={16} />
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="bg-brand-main/5 backdrop-blur-md border border-brand-main/20 rounded-xl overflow-hidden">
        <AGGridWrapper<Lead>
          rowData={leads}
          columnDefs={columnDefs}
          loading={isLoading}
          emptyMessage="No leads found"
          height={400}
          rowSelection={rowSelection}
          onSelectionChanged={onSelectionChanged}
          showPagination={true}
          serverSidePagination={true}
          totalRows={total}
          currentPage={page}
          pageSize={limit}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          getRowId={(params) => params.data.id}
        />

        {/* Selection Info */}
        <div className="px-4 py-3 border-t border-brand-main/10 bg-brand-main/5">
          <span className="text-sm text-text-200">
            {selectedLeads.length} of {total} leads selected
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button
          onClick={onCancel}
          className="px-6 py-2 bg-brand-main/10 hover:bg-brand-main/20 text-brand-main rounded-lg transition"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSelectLeads}
          disabled={selectedLeads.length === 0}
          className="px-6 py-2 bg-brand-main hover:bg-brand-main/80 text-white rounded-lg transition disabled:opacity-50"
        >
          Select {selectedLeads.length} Lead
          {selectedLeads.length !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}
