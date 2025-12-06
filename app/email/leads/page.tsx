"use client";

import { ColDef, ICellRendererParams } from "ag-grid-community";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import AGGridWrapper from "@/components/common/AGGridWrapper";
import LeadFilterModal from "@/components/leads/LeadFilterModal";
import { LeadVerificationModal } from "@/components/leads/LeadVerificationModal";
import emailClient, {
  Campaign,
  getUserCampaigns,
} from "@/utils/api/emailClient";
import {
  IconMail,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

interface Lead {
  id: string;
  email: string;
  name?: string;
  customFields?: Record<string, any>;
  status: string;
  campaignId?: string;
  campaigns?: Array<{ id: string; name: string; status?: string }>;
  createdAt: Date;
  verificationStatus?: string | null;
  isSafeToSend?: boolean | null;
}

interface ListResponse {
  leads: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
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

export default function LeadsPage() {
  const router = useRouter();
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
  const [selectedLeadForCampaigns, setSelectedLeadForCampaigns] =
    useState<Lead | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showStartCampaignModal, setShowStartCampaignModal] = useState(false);
  const [selectedLeadsForCampaign, setSelectedLeadsForCampaign] = useState<
    Set<string>
  >(new Set());
  const [selectedLeadForVerification, setSelectedLeadForVerification] =
    useState<Lead | null>(null);

  useEffect(() => {
    loadLeads();
    loadCampaigns();
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

  const loadCampaigns = async () => {
    try {
      const data = await getUserCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error("Failed to load campaigns:", error);
    }
  };

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
      if (verificationFilter.length > 0)
        params.append("verification", verificationFilter.join(","));

      const response = await emailClient.get<{ data: ListResponse }>(
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

  const handleDelete = async (leadId: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    try {
      await emailClient.delete(`/api/leads/${leadId}`);
      toast.success("Lead deleted successfully");
      loadLeads();
    } catch (error: any) {
      console.error("Failed to delete lead:", error);
      toast.error("Failed to delete lead");
    }
  };

  const handleVerifyLead = (lead: Lead) => {
    setSelectedLeadForVerification(lead);
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

  const totalPages = Math.ceil(total / limit);

  const renderVerificationBadge = (lead: Lead) => {
    const hasStatus = !!lead.verificationStatus;
    const hasSafeFlag = typeof lead.isSafeToSend === "boolean";

    if (!hasStatus && !hasSafeFlag) {
      return <span className="text-xs text-gray-400">Unverified</span>;
    }

    const status = (lead.verificationStatus || "").toLowerCase();
    const isSafe = lead.isSafeToSend === true;
    const riskyStatuses = [
      "invalid",
      "disposable",
      "spamtrap",
      "catch_all",
      "role_account",
    ];
    const isRisky =
      lead.isSafeToSend === false || riskyStatuses.includes(status || "");

    if (isSafe) {
      return <span className="text-xs text-emerald-400">Safe to send</span>;
    }

    if (isRisky) {
      return (
        <span className="text-xs text-red-400">
          Risky{status ? ` (${status})` : ""}
        </span>
      );
    }

    return (
      <span className="text-xs text-amber-400">{status || "Pending"}</span>
    );
  };

  // AG Grid Cell Renderers
  const EmailCellRenderer = useCallback((params: ICellRendererParams<Lead>) => {
    const lead = params.data;
    if (!lead) return null;
    return (
      <span className="text-brand-main font-medium text-sm">{lead.email}</span>
    );
  }, []);

  const VerificationCellRenderer = useCallback(
    (params: ICellRendererParams<Lead>) => {
      const lead = params.data;
      if (!lead) return null;
      return renderVerificationBadge(lead);
    },
    []
  );

  const CampaignCellRenderer = useCallback(
    (params: ICellRendererParams<Lead>) => {
      const lead = params.data;
      if (!lead) return null;
      if (lead.campaigns && lead.campaigns.length > 0) {
        return (
          <button
            onClick={() => setSelectedLeadForCampaigns(lead)}
            className="text-sm text-brand-secondary hover:text-brand-main transition-colors truncate"
          >
            {lead.campaigns.length === 1
              ? lead.campaigns[0].name
              : `${lead.campaigns.length} campaigns`}
          </button>
        );
      }
      return <span className="text-gray-500 text-sm">-</span>;
    },
    []
  );

  const ActionsCellRenderer = useCallback(
    (params: ICellRendererParams<Lead>) => {
      const lead = params.data;
      if (!lead) return null;
      return (
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleVerifyLead(lead)}
            className="text-gray-400 hover:text-brand-main transition-colors"
            title="Verify with Reoon"
          >
            <IconMail size={18} />
          </button>
          <button
            onClick={() => handleDelete(lead.id)}
            className="text-gray-400 hover:text-red-400 transition-colors"
            title="Delete lead"
          >
            <IconTrash size={18} />
          </button>
        </div>
      );
    },
    []
  );

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<Lead>[]>(
    () => [
      {
        headerName: "Email",
        field: "email",
        flex: 2,
        minWidth: 200,
        cellRenderer: EmailCellRenderer,
        sortable: true,
      },
      {
        headerName: "Status",
        field: "verificationStatus",
        flex: 1,
        minWidth: 120,
        maxWidth: 140,
        cellRenderer: VerificationCellRenderer,
        sortable: true,
      },
      {
        headerName: "Name",
        field: "name",
        flex: 1,
        minWidth: 120,
        valueFormatter: (params) => params.value || "-",
        sortable: true,
      },
      {
        headerName: "Campaign",
        flex: 1,
        minWidth: 150,
        cellRenderer: CampaignCellRenderer,
        sortable: false,
      },
      {
        headerName: "Actions",
        flex: 1,
        minWidth: 100,
        maxWidth: 120,
        cellRenderer: ActionsCellRenderer,
        sortable: false,
      },
    ],
    [
      EmailCellRenderer,
      VerificationCellRenderer,
      CampaignCellRenderer,
      ActionsCellRenderer,
    ]
  );

  // Handle row selection
  const onSelectionChanged = useCallback((event: any) => {
    const selectedRows = event.api.getSelectedRows();
    setSelectedLeadsForCampaign(
      new Set(selectedRows.map((row: Lead) => row.id))
    );
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

  return (
    <div className="min-h-screen bg-bg-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-text-100 mb-2">
              Lead Management
            </h1>
            <p className="text-text-200">
              Manage and organize your email leads
            </p>
          </div>
          <button
            onClick={() => router.push("/email/leads/create")}
            className="flex items-center gap-2 px-6 py-3 bg-brand-main hover:bg-brand-main/80 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            <IconPlus size={20} />
            Add Lead
          </button>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex items-center gap-4 mb-6">
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

        {/* Bulk Actions Bar */}
        {selectedLeadsForCampaign.size > 0 && (
          <div className="bg-brand-main/10 border border-brand-main/30 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="text-text-100">
              <span className="font-semibold">
                {selectedLeadsForCampaign.size}
              </span>{" "}
              lead{selectedLeadsForCampaign.size !== 1 ? "s" : ""} selected
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStartCampaignModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-main hover:bg-brand-main/80 text-text-100 font-semibold rounded-lg transition-all duration-200"
              >
                <IconMail size={18} />
                Start Campaign
              </button>
              <button
                onClick={() => setSelectedLeadsForCampaign(new Set())}
                className="px-4 py-2 bg-brand-main/10 hover:bg-brand-main/20 text-text-100 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Leads AG Grid Table */}
        <AGGridWrapper<Lead>
          rowData={leads}
          columnDefs={columnDefs}
          loading={isLoading}
          height={500}
          emptyMessage={
            hasActiveFilters
              ? "No leads match your filters"
              : "No leads found. Create one to get started."
          }
          rowSelection={rowSelection}
          onSelectionChanged={onSelectionChanged}
          getRowId={(params) => params.data.id}
          showPagination={true}
          serverSidePagination={true}
          totalRows={total}
          currentPage={page}
          pageSize={limit}
          pageSizeOptions={[10, 25, 50, 100]}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setLimit(newSize);
            setPage(1);
          }}
        />

        {/* Campaigns Modal */}
        {selectedLeadForCampaigns &&
          selectedLeadForCampaigns.campaigns &&
          selectedLeadForCampaigns.campaigns.length > 0 && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-gradient-to-br from-bg-200 to-bg-300 border border-brand-main/20 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-100">
                    Associated Campaigns (
                    {selectedLeadForCampaigns.campaigns.length})
                  </h3>
                  <button
                    onClick={() => setSelectedLeadForCampaigns(null)}
                    className="p-1 hover:bg-brand-main/10 rounded-lg transition-colors"
                  >
                    <IconX size={20} className="text-text-200" />
                  </button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedLeadForCampaigns.campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="p-3 bg-brand-main/5 border border-brand-main/10 rounded-lg hover:bg-brand-main/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-text-100 font-medium">
                          {campaign.name}
                        </p>
                        {campaign.status && (
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
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
                      <p className="text-xs text-text-200 mt-2">
                        ID: {campaign.id}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        {/* Start Campaign Modal */}
        {showStartCampaignModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-brand-main/20 rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-100">
                  Start Campaign with Selected Leads
                </h3>
                <button
                  onClick={() => setShowStartCampaignModal(false)}
                  className="p-1 hover:bg-brand-main/10 rounded-lg transition-colors"
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
                      router.push("/email/campaigns/builder");
                      setShowStartCampaignModal(false);
                    }}
                    className="text-brand-main hover:text-brand-secondary font-semibold"
                  >
                    Campaign Builder
                  </button>{" "}
                  and select these leads in the lead selection step.
                </p>
                <div className="bg-brand-main/5 border border-brand-main/10 rounded-lg p-3 max-h-48 overflow-y-auto">
                  <p className="text-xs text-text-200 mb-2">Selected Leads:</p>
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
                    className="flex-1 px-4 py-2 bg-brand-main/10 hover:bg-brand-main/20 text-text-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => {
                      router.push("/email/campaigns/builder");
                      setShowStartCampaignModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-brand-main hover:bg-brand-main/80 text-text-100 font-semibold rounded-lg transition-all duration-200"
                  >
                    Go to Builder
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <LeadVerificationModal
          isOpen={!!selectedLeadForVerification}
          lead={selectedLeadForVerification}
          onClose={() => setSelectedLeadForVerification(null)}
        />
      </div>
    </div>
  );
}
