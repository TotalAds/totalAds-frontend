"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
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
  }, [page, limit, statusFilter]);

  const loadCampaigns = async () => {
    try {
      const data = await getUserCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error("Failed to load campaigns:", error);
    }
  };

  const loadLeads = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (statusFilter) params.append("status", statusFilter);

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

  const filteredLeads = leads.filter(
    (lead) =>
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Lead Management
            </h1>
            <p className="text-gray-400">
              Manage and organize your email leads
            </p>
          </div>
          <button
            onClick={() => router.push("/email/leads/create")}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            <IconPlus size={20} />
            Add Lead
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="sent">Sent</option>
              <option value="opened">Opened</option>
              <option value="clicked">Clicked</option>
              <option value="bounced">Bounced</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedLeadsForCampaign.size > 0 && (
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="text-white">
              <span className="font-semibold">
                {selectedLeadsForCampaign.size}
              </span>{" "}
              lead{selectedLeadsForCampaign.size !== 1 ? "s" : ""} selected
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStartCampaignModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all duration-200"
              >
                <IconMail size={18} />
                Start Campaign
              </button>
              <button
                onClick={() => setSelectedLeadsForCampaign(new Set())}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Leads Table */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">
              Loading leads...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No leads found.{" "}
              <a
                href="/email/leads/create"
                className="text-purple-400 hover:text-purple-300"
              >
                Create one
              </a>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 w-12">
                        <input
                          type="checkbox"
                          checked={
                            selectedLeadsForCampaign.size ===
                              filteredLeads.length && filteredLeads.length > 0
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLeadsForCampaign(
                                new Set(filteredLeads.map((l) => l.id))
                              );
                            } else {
                              setSelectedLeadsForCampaign(new Set());
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
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Campaign
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="border-b border-white/10 hover:bg-white/5 transition-colors"
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
                          {lead.customFields?.company || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {lead.customFields?.role || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {lead.campaigns && lead.campaigns.length > 0 ? (
                            lead.campaigns.length === 1 ? (
                              <button
                                onClick={() =>
                                  setSelectedLeadForCampaigns(lead)
                                }
                                className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full hover:bg-blue-500/30 transition-colors"
                              >
                                {lead.campaigns[0].name}
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  setSelectedLeadForCampaigns(lead)
                                }
                                className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full hover:bg-blue-500/30 transition-colors"
                              >
                                {lead.campaigns.length} campaigns
                              </button>
                            )
                          ) : (
                            <span className="text-gray-500 text-xs">
                              Unassociated
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm flex gap-2">
                          <button
                            onClick={() => handleDelete(lead.id)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
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
              <div className="px-6 py-4 border-t border-white/10 flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(page * limit, total)} of {total} leads
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-white">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
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
          selectedLeadForCampaigns.campaigns.length > 1 && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Associated Campaigns
                  </h3>
                  <button
                    onClick={() => setSelectedLeadForCampaigns(null)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <IconX size={20} className="text-gray-400" />
                  </button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedLeadForCampaigns.campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-white font-medium">
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
                                ? "bg-purple-500/20 text-purple-300"
                                : campaign.status === "clicked"
                                ? "bg-pink-500/20 text-pink-300"
                                : campaign.status === "bounced"
                                ? "bg-red-500/20 text-red-300"
                                : "bg-gray-500/20 text-gray-300"
                            }`}
                          >
                            {campaign.status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
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
            <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Start Campaign with Selected Leads
                </h3>
                <button
                  onClick={() => setShowStartCampaignModal(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <IconX size={20} className="text-gray-400" />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-gray-300">
                  You have selected{" "}
                  <span className="font-semibold text-purple-300">
                    {selectedLeadsForCampaign.size}
                  </span>{" "}
                  lead{selectedLeadsForCampaign.size !== 1 ? "s" : ""}.
                </p>
                <p className="text-sm text-gray-400">
                  To start a campaign with these leads, go to the{" "}
                  <button
                    onClick={() => {
                      router.push("/email/campaigns/builder");
                      setShowStartCampaignModal(false);
                    }}
                    className="text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    Campaign Builder
                  </button>{" "}
                  and select these leads in the lead selection step.
                </p>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 max-h-48 overflow-y-auto">
                  <p className="text-xs text-gray-400 mb-2">Selected Leads:</p>
                  <div className="space-y-1">
                    {Array.from(selectedLeadsForCampaign).map((leadId) => {
                      const lead = filteredLeads.find((l) => l.id === leadId);
                      return (
                        <div key={leadId} className="text-xs text-gray-300">
                          {lead?.email}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowStartCampaignModal(false)}
                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      router.push("/email/campaigns/builder");
                      setShowStartCampaignModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all duration-200"
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
