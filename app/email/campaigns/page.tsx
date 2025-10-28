"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Campaign,
  deleteCampaign,
  Domain,
  getCampaigns,
  getDomains,
} from "@/utils/api/emailClient";
import { tokenStorage } from "@/utils/auth/tokenStorage";

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      fetchCampaigns();
    }
  }, [selectedDomain, page]);

  const fetchDomains = async () => {
    try {
      const result = await getDomains(1, 100);
      setDomains(result.data.domains);
      if (result.data.domains.length > 0) {
        setSelectedDomain(result.data.domains[0].id);
      }
    } catch (error: any) {
      console.error("Error fetching domains:", error);

      // Handle authentication errors
      if (error.response?.status === 401) {
        toast.error("Your session has expired. Please sign in again.");
        tokenStorage.removeTokens();
        router.push("/login");
        return;
      }

      toast.error("Failed to fetch domains");
    }
  };

  const fetchCampaigns = async () => {
    if (!selectedDomain) return;

    try {
      setLoading(true);
      const result = await getCampaigns(selectedDomain, page, limit);
      setCampaigns(result.data);
      setTotal(result.total);
    } catch (error: any) {
      console.error("Error fetching campaigns:", error);

      // Handle authentication errors
      if (error.response?.status === 401) {
        toast.error("Your session has expired. Please sign in again.");
        tokenStorage.removeTokens();
        router.push("/login");
        return;
      }

      toast.error(error.response?.data?.message || "Failed to fetch campaigns");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      setDeleting(campaignId);
      await deleteCampaign(selectedDomain, campaignId);
      toast.success("Campaign deleted successfully");
      fetchCampaigns();
    } catch (error: any) {
      console.error("Error deleting campaign:", error);
      toast.error(error.response?.data?.message || "Failed to delete campaign");
    } finally {
      setDeleting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      draft: { bg: "bg-gray-500/20", text: "text-gray-300" },
      running: { bg: "bg-green-500/20", text: "text-green-300" },
      paused: { bg: "bg-yellow-500/20", text: "text-yellow-300" },
      completed: { bg: "bg-blue-500/20", text: "text-blue-300" },
    };
    const style = statusMap[status] || statusMap.draft;
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Email Campaigns</h1>
            <p className="text-gray-400 text-sm mt-1">
              Create and manage your email campaigns
            </p>
          </div>
          <Link href="/email/campaigns/builder">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg transition">
              + Create Campaign
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Domain Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Domain
          </label>
          <select
            value={selectedDomain}
            onChange={(e) => {
              setSelectedDomain(e.target.value);
              setPage(1);
            }}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Choose a domain...</option>
            {domains?.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.domain}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-300">Loading campaigns...</p>
            </div>
          </div>
        ) : !selectedDomain ? (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Domain Selected
            </h3>
            <p className="text-gray-400 mb-6">
              Please select a domain to view campaigns
            </p>
          </div>
        ) : campaigns?.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Campaigns Yet
            </h3>
            <p className="text-gray-400 mb-6">
              Create your first campaign to get started
            </p>
            <Link href="/email/campaigns/builder">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg transition">
                Create Your First Campaign
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Campaigns Table */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Subject
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Created
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns?.map((campaign) => (
                      <tr
                        key={campaign.id}
                        className="border-b border-white/10 hover:bg-white/5 transition"
                      >
                        <td className="px-6 py-4">
                          <p className="text-white font-medium">
                            {campaign.name}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-400 text-sm truncate">
                            {campaign.subject}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(campaign.status)}
                          {typeof (campaign as any)
                            .scheduledForTomorrowCount === "number" &&
                            (campaign as any).scheduledForTomorrowCount > 0 && (
                              <span className="ml-2 inline-flex items-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/20 text-purple-300">
                                  Scheduled for tomorrow
                                </span>
                                <span
                                  className="ml-1 w-4 h-4 inline-flex items-center justify-center rounded-full border border-purple-400/40 text-purple-300 text-[10px] cursor-default"
                                  title={`${
                                    (campaign as any).scheduledForTomorrowCount
                                  } scheduled for tomorrow`}
                                >
                                  i
                                </span>
                              </span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/email/campaigns/${campaign.id}`}>
                              <Button className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs px-3 py-1 rounded transition">
                                View
                              </Button>
                            </Link>
                            {campaign.status === "draft" ? (
                              <Link
                                href={`/email/campaigns/builder?id=${campaign.id}`}
                              >
                                <Button className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs px-3 py-1 rounded transition">
                                  Edit
                                </Button>
                              </Link>
                            ) : (
                              <Button
                                disabled
                                title={`Cannot edit ${campaign.status} campaigns`}
                                className="bg-gray-600/20 text-gray-400 text-xs px-3 py-1 rounded opacity-50 cursor-not-allowed"
                              >
                                Edit
                              </Button>
                            )}
                            <Button
                              onClick={() => handleDelete(campaign.id)}
                              disabled={deleting === campaign.id}
                              className="bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs px-3 py-1 rounded transition disabled:opacity-50"
                            >
                              {deleting === campaign.id
                                ? "Deleting..."
                                : "Delete"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 px-4 py-2 rounded-lg transition"
                >
                  Previous
                </Button>
                <span className="text-gray-300 text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 px-4 py-2 rounded-lg transition"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
