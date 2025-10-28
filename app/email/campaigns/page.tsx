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
      draft: { bg: "bg-gray-500/40", text: "text-text-300" },
      running: { bg: "bg-green-500/40", text: "text-green-400" },
      paused: { bg: "bg-yellow-500/40", text: "text-yellow-400" },
      completed: { bg: "bg-blue-500/40", text: "text-blue-400" },
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
    <div className="min-h-screen bg-bg-100">
      {/* Header */}
      <header className="backdrop-blur-xl bg-brand-main/5 border-b border-brand-main/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-text-100">
              Email Campaigns
            </h1>
            <p className="text-text-200 text-sm mt-1">
              Create and manage your email campaigns
            </p>
          </div>
          <Link href="/email/campaigns/builder">
            <Button className="bg-brand-main hover:bg-brand-main/80 text-text-100 px-6 py-2 rounded-lg transition">
              + Create Campaign
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Domain Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-200 mb-2">
            Select Domain
          </label>
          <select
            value={selectedDomain}
            onChange={(e) => {
              setSelectedDomain(e.target.value);
              setPage(1);
            }}
            className="w-full px-4 py-2 bg-brand-main/10 border border-brand-main/20 rounded-lg text-text-100 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-brand-main"
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
              <div className="w-12 h-12 border-4 border-brand-main border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-text-200">Loading campaigns...</p>
            </div>
          </div>
        ) : !selectedDomain ? (
          <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-brand-main rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-text-100"
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
            <h3 className="text-xl font-semibold text-text-100 mb-2">
              No Domain Selected
            </h3>
            <p className="text-text-200 mb-6">
              Please select a domain to view campaigns
            </p>
          </div>
        ) : campaigns?.length === 0 ? (
          <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-brand-main rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-text-100"
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
            <h3 className="text-xl font-semibold text-text-100 mb-2">
              No Campaigns Yet
            </h3>
            <p className="text-text-200 mb-6">
              Create your first campaign to get started
            </p>
            <Link href="/email/campaigns/builder">
              <Button className="bg-brand-main hover:bg-brand-main/80 text-text-100 px-6 py-2 rounded-lg transition">
                Create Your First Campaign
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Campaigns Table */}
            <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-brand-main/10 bg-brand-main/5">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-200">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-200">
                        Subject
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-200">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-200">
                        Created
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text-200">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns?.map((campaign) => (
                      <tr
                        key={campaign.id}
                        className="border-b border-brand-main/10 hover:bg-brand-main/5 transition"
                      >
                        <td className="px-6 py-4">
                          <p className="text-text-100 font-medium">
                            {campaign.name}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-text-200 text-sm truncate">
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
                        <td className="px-6 py-4 text-text-200 text-sm">
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/email/campaigns/${campaign.id}`}>
                              <Button className="bg-blue-200 hover:bg-blue-300 text-blue-500 text-xs px-3 py-1 rounded transition">
                                View
                              </Button>
                            </Link>
                            {campaign.status === "draft" ? (
                              <Link
                                href={`/email/campaigns/builder?id=${campaign.id}`}
                              >
                                <Button className="bg-purple-200 hover:bg-purple-300 text-purple-500 text-xs px-3 py-1 rounded transition">
                                  Edit
                                </Button>
                              </Link>
                            ) : (
                              <Button
                                disabled
                                title={`Cannot edit ${campaign.status} campaigns`}
                                className="bg-gray-100 text-text-200 text-xs px-3 py-1 rounded opacity-100 cursor-not-allowed"
                              >
                                Edit
                              </Button>
                            )}
                            <Button
                              onClick={() => handleDelete(campaign.id)}
                              disabled={deleting === campaign.id}
                              className="bg-red-200 hover:bg-red-300 text-red-500 text-xs px-3 py-1 rounded transition disabled:opacity-50"
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
                  className="bg-brand-main/10 hover:bg-brand-main/20 text-text-100 disabled:opacity-50 px-4 py-2 rounded-lg transition"
                >
                  Previous
                </Button>
                <span className="text-text-200 text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="bg-brand-main/10 hover:bg-brand-main/20 text-text-100 disabled:opacity-50 px-4 py-2 rounded-lg transition"
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
