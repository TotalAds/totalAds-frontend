"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import MultiSelect from "@/components/common/MultiSelect";
import emailClient, {
  Campaign,
  getUserCampaigns,
} from "@/utils/api/emailClient";
import {
  IconFilter,
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

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter([]);
    setCategoryFilter([]);
    setTagFilter([]);
    setCampaignFilter([]);
    setPage(1);
  };

  const hasActiveFilters =
    searchTerm ||
    statusFilter.length > 0 ||
    categoryFilter.length > 0 ||
    tagFilter.length > 0 ||
    campaignFilter.length > 0;

  const totalPages = Math.ceil(total / limit);

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
            className="flex items-center gap-2 px-6 py-3 bg-brand-main hover:bg-brand-main/80 text-text-100 font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            <IconPlus size={20} />
            Add Lead
          </button>
        </div>

        {/* Filters */}
        <div className="bg-brand-main/10 backdrop-blur-md border border-brand-main/20 rounded-xl p-6 mb-6 relative z-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconFilter size={20} className="text-text-200" />
              <h3 className="text-text-100 font-semibold">Filters</h3>
              {hasActiveFilters && (
                <span className="text-xs bg-brand-main/20 text-brand-main px-2 py-1 rounded-full">
                  {total} results
                </span>
              )}
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-sm text-text-200 hover:text-text-100 transition-colors"
              >
                <IconX size={16} />
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
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
                className="w-full pl-10 pr-4 py-2 bg-brand-main/10 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-brand-main"
              />
            </div>

            {/* Category Filter */}
            <MultiSelect
              options={filterOptions.categories}
              selectedIds={categoryFilter}
              onChange={(selected) => {
                setCategoryFilter(selected);
                setPage(1);
              }}
              placeholder="Categories"
              searchable
            />

            {/* Tag Filter */}
            <MultiSelect
              options={filterOptions.tags}
              selectedIds={tagFilter}
              onChange={(selected) => {
                setTagFilter(selected);
                setPage(1);
              }}
              placeholder="Tags"
              searchable
            />

            {/* Campaign Filter */}
            <MultiSelect
              options={filterOptions.campaigns}
              selectedIds={campaignFilter}
              onChange={(selected) => {
                setCampaignFilter(selected);
                setPage(1);
              }}
              placeholder="Campaigns"
              searchable
            />

            {/* Status Filter */}
            <MultiSelect
              options={filterOptions.statuses.map((s) => ({
                id: s.value,
                name: s.label,
                count: s.count,
              }))}
              selectedIds={statusFilter}
              onChange={(selected) => {
                setStatusFilter(selected);
                setPage(1);
              }}
              placeholder="Status"
              searchable
            />
          </div>
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

        {/* Leads Table */}
        <div className="bg-brand-main/10 backdrop-blur-md border border-brand-main/20 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-text-200">
              Loading leads...
            </div>
          ) : leads.length === 0 ? (
            <div className="p-8 text-center text-text-200">
              No leads found.{" "}
              <a
                href="/email/leads/create"
                className="text-brand-main hover:text-brand-secondary"
              >
                Create one
              </a>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-brand-main/5 border-b border-brand-main/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-200 w-12">
                        <input
                          type="checkbox"
                          checked={
                            selectedLeadsForCampaign.size === leads.length &&
                            leads.length > 0
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLeadsForCampaign(
                                new Set(leads.map((l) => l.id))
                              );
                            } else {
                              setSelectedLeadsForCampaign(new Set());
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-brand-main focus:ring-brand-main"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-200">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-200">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-200">
                        Company
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-200">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-200">
                        Campaign
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-200">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="border-b border-brand-main/10 hover:bg-brand-main/5 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm w-12">
                          <input
                            type="checkbox"
                            checked={selectedLeadsForCampaign.has(lead.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedLeadsForCampaign);
                              if (e.target.checked) {
                                newSet.add(lead.id);
                              } else {
                                newSet.delete(lead.id);
                              }
                              setSelectedLeadsForCampaign(newSet);
                            }}
                            className="w-4 h-4 rounded border-text-200 text-brand-main focus:ring-brand-main"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-text-100">
                          {lead.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-200">
                          {lead.name || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-200">
                          {lead.customFields?.company || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-200">
                          {lead.customFields?.role || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {lead.campaigns && lead.campaigns.length > 0 ? (
                            <button
                              onClick={() => setSelectedLeadForCampaigns(lead)}
                              className="px-3 py-1 bg-brand-main/20 text-brand-main text-xs rounded-full hover:bg-brand-main/30 transition-colors font-medium"
                            >
                              {lead.campaigns.length === 1
                                ? lead.campaigns[0].name
                                : `${lead.campaigns.length} campaigns`}
                            </button>
                          ) : (
                            <span className="text-text-200 text-xs">
                              Unassociated
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm flex gap-2">
                          <button
                            onClick={() => handleDelete(lead.id)}
                            className="p-2 hover:bg-brand-main/10 rounded-lg transition-colors"
                            title="Delete lead"
                          >
                            <IconTrash size={18} className="text-red-400" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-brand-main/10 flex justify-between items-center">
                <div className="text-sm text-text-200">
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(page * limit, total)} of {total} leads
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-brand-main/10 hover:bg-brand-main/20 disabled:opacity-50 disabled:cursor-not-allowed text-text-100 rounded-lg transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-text-100">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-brand-main/10 hover:bg-brand-main/20 disabled:opacity-50 disabled:cursor-not-allowed text-text-100 rounded-lg transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

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
                      const lead = filteredLeads.find((l) => l.id === leadId);
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
      </div>
    </div>
  );
}
