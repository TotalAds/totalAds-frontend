"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import MultiSelect from "@/components/common/MultiSelect";
import { Button } from "@/components/ui/button";
import emailClient from "@/utils/api/emailClient";
import { IconFilter, IconSearch, IconX } from "@tabler/icons-react";

interface Lead {
  id: string;
  email: string;
  name?: string;
  company?: string;
  role?: string;
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
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    tags: [],
    campaigns: [],
    statuses: [],
  });
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

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
    if (selectedLeads.size === 0) {
      toast.error("Please select at least one lead");
      return;
    }

    const selected = leads.filter((lead) => selectedLeads.has(lead.id));
    onLeadsSelected(selected);
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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 relative z-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IconFilter size={20} className="text-gray-400" />
            <h3 className="text-white font-semibold">Filters</h3>
            {hasActiveFilters && (
              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                {total} results
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
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
              className="absolute left-3 top-3 text-gray-400"
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
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            theme="light"
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
            theme="light"
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
            theme="light"
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
            theme="light"
          />
        </div>
      </div>

      {/* Leads Table */}
      <div
        className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl"
        style={{ overflow: "visible" }}
      >
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No leads found.</div>
        ) : (
          <>
            <div
              className="overflow-x-auto"
              style={{ borderRadius: "0.75rem" }}
            >
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedLeads.size === leads.length &&
                          leads.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeads(new Set(leads.map((l) => l.id)));
                          } else {
                            setSelectedLeads(new Set());
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Company
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm w-12">
                        <input
                          type="checkbox"
                          checked={selectedLeads.has(lead.id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedLeads);
                            if (e.target.checked) {
                              newSet.add(lead.id);
                            } else {
                              newSet.delete(lead.id);
                            }
                            setSelectedLeads(newSet);
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-white">
                        {lead.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {lead.name || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {lead.company || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {lead.role || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-white/10 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                {selectedLeads.size} of {total} leads selected
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 text-white rounded disabled:opacity-50"
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm text-gray-400">
                  Page {page} of {Math.ceil(total / limit)}
                </span>
                <Button
                  onClick={() =>
                    setPage(Math.min(Math.ceil(total / limit), page + 1))
                  }
                  disabled={page >= Math.ceil(total / limit)}
                  className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 text-white rounded disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button
          onClick={onCancel}
          className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSelectLeads}
          disabled={selectedLeads.size === 0}
          className="px-6 py-2 bg-brand-main hover:bg-brand-main/80 text-white rounded-lg transition disabled:opacity-50"
        >
          Select {selectedLeads.size} Lead{selectedLeads.size !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}
