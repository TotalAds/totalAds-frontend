"use client";

import { ColDef, ICellRendererParams } from "ag-grid-community";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import AGGridWrapper from "@/components/common/AGGridWrapper";
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
  const [loading, setLoading] = useState(false);
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [reoonFilter, setReoonFilter] = useState<"all" | "on" | "off">("all");
  const [showReoonLegend, setShowReoonLegend] = useState(false);
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
      setDomainsLoading(true);
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
    } finally {
      setDomainsLoading(false);
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
      draft: { bg: "bg-slate-100", text: "text-slate-600" },
      running: { bg: "bg-green-100", text: "text-green-700" },
      sending: { bg: "bg-blue-100", text: "text-blue-700" },
      paused: { bg: "bg-amber-100", text: "text-amber-700" },
      completed: { bg: "bg-emerald-100", text: "text-emerald-700" },
    };
    const style = statusMap[status] || statusMap.draft;
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const totalPages = Math.ceil(total / limit);

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (reoonFilter === "all") return true;
    const reoonUsed = !!(campaign as any).reoonVerificationSummary?.used;
    return reoonFilter === "on" ? reoonUsed : !reoonUsed;
  });

  // AG Grid Cell Renderers
  const StatusCellRenderer = useCallback(
    (params: ICellRendererParams<Campaign>) => {
      const campaign = params.data;
      if (!campaign) return null;

      const reoonSummary = (campaign as any).reoonVerificationSummary;
      const used = !!reoonSummary?.used;
      const excludedAsRisky =
        typeof reoonSummary?.excludedAsRisky === "number"
          ? reoonSummary.excludedAsRisky
          : null;

      return (
        <div className="flex flex-col gap-1.5 py-1">
          <div className="flex items-center gap-2">
            {getStatusBadge(campaign.status)}
            {typeof (campaign as any).scheduledForTomorrowCount === "number" &&
              (campaign as any).scheduledForTomorrowCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">
                  Scheduled
                </span>
              )}
          </div>
          <div>
            {!used && excludedAsRisky == null ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                Reoon: Off
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 border border-green-200">
                  Reoon: On
                </span>
                {excludedAsRisky !== null && excludedAsRisky > 0 && (
                  <span className="text-[10px] text-green-600 font-medium">
                    {excludedAsRisky} risky removed
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      );
    },
    []
  );

  const ActionsCellRenderer = useCallback(
    (params: ICellRendererParams<Campaign>) => {
      const campaign = params.data;
      if (!campaign) return null;

      return (
        <div className="flex justify-end gap-2 py-1">
          <Link href={`/email/campaigns/${campaign.id}`}>
            <Button className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs px-3 py-1.5 rounded-md font-medium transition border border-blue-200">
              View
            </Button>
          </Link>
          {campaign.status === "draft" ? (
            <Link href={`/email/campaigns/builder?id=${campaign.id}`}>
              <Button className="bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs px-3 py-1.5 rounded-md font-medium transition border border-slate-200">
                Edit
              </Button>
            </Link>
          ) : (
            <Button
              disabled
              title={`Cannot edit ${campaign.status} campaigns`}
              className="bg-slate-50 text-slate-400 text-xs px-3 py-1.5 rounded-md font-medium border border-slate-200 cursor-not-allowed"
            >
              Edit
            </Button>
          )}
          <Button
            onClick={() => handleDelete(campaign.id)}
            disabled={deleting === campaign.id}
            className="bg-red-50 hover:bg-red-100 text-red-600 text-xs px-3 py-1.5 rounded-md font-medium transition border border-red-200 disabled:opacity-50"
          >
            {deleting === campaign.id ? "..." : "Delete"}
          </Button>
        </div>
      );
    },
    [deleting]
  );

  // Helper function to get subject from campaign
  const getSubjectFromCampaign = (campaign: Campaign): string => {
    // Try to get subject from sequence (first email step)
    if (campaign.sequence && campaign.sequence.length > 0) {
      return campaign.sequence[0].subject || "-";
    }
    // Fallback to direct subject field if available
    if (campaign.subject) {
      return campaign.subject;
    }
    return "-";
  };

  // Helper function to format date
  const formatDate = (dateValue: string | null | undefined): string => {
    if (!dateValue) return "-";
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<Campaign>[]>(
    () => [
      {
        headerName: "Name",
        field: "name",
        flex: 1.5,
        minWidth: 150,
        cellClass: "text-slate-800 font-medium",
        sortable: true,
      },
      {
        headerName: "Subject",
        flex: 2,
        minWidth: 200,
        maxWidth: 350,
        valueGetter: (params) => getSubjectFromCampaign(params.data!),
        cellClass: "text-slate-600 text-sm",
        cellStyle: {
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        },
        tooltipValueGetter: (params) => params.value,
        sortable: true,
      },
      {
        headerName: "Status",
        field: "status",
        flex: 1.5,
        minWidth: 180,
        cellRenderer: StatusCellRenderer,
        sortable: true,
      },
      {
        headerName: "Created",
        field: "createdAt",
        flex: 1,
        minWidth: 120,
        valueFormatter: (params) => formatDate(params.value),
        cellClass: "text-slate-500 text-sm",
        sortable: true,
      },
      {
        headerName: "Actions",
        flex: 1.5,
        minWidth: 200,
        cellRenderer: ActionsCellRenderer,
        sortable: false,
      },
    ],
    [StatusCellRenderer, ActionsCellRenderer]
  );

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
            <Button className="bg-brand-main hover:bg-brand-main/80 text-white px-6 py-2 rounded-lg transition">
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

        {/* Reoon Filter Chips */}
        {campaigns && campaigns.length > 0 && (
          <div className="mb-6 flex items-center gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => setReoonFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  reoonFilter === "all"
                    ? "bg-brand-main text-white"
                    : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
                }`}
              >
                All Campaigns
              </button>
              <button
                onClick={() => setReoonFilter("on")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  reoonFilter === "on"
                    ? "bg-brand-main text-white"
                    : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Reoon: On
              </button>
              <button
                onClick={() => setReoonFilter("off")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  reoonFilter === "off"
                    ? "bg-brand-main text-white"
                    : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M13.477 14.89A6 6 0 015.11 2.526a6 6 0 008.367 8.368zM17.5 11a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Reoon: Off
              </button>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowReoonLegend(!showReoonLegend)}
                className="p-2 hover:bg-brand-main/10 rounded-lg transition-colors text-text-200 hover:text-text-100"
                title="Learn about Reoon verification"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {showReoonLegend && (
                <div className="absolute right-0 mt-2 w-80 bg-bg-200 border border-brand-main/20 rounded-lg p-4 shadow-xl z-50">
                  <h4 className="text-sm font-semibold text-text-100 mb-3">
                    Reoon Email Verification
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <svg
                          className="w-4 h-4 text-emerald-300 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-text-100">Reoon: On</p>
                        <p className="text-text-200">
                          Email verification was used for this campaign. Risky
                          leads were filtered out before sending.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <svg
                          className="w-4 h-4 text-slate-300 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M13.477 14.89A6 6 0 015.11 2.526a6 6 0 008.367 8.368zM17.5 11a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-text-100">Reoon: Off</p>
                        <p className="text-text-200">
                          Email verification was not used. All leads were sent
                          without verification filtering.
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-brand-main/10">
                      <p className="text-text-200 text-xs">
                        The &quot;risky removed&quot; count shows how many leads
                        were excluded as risky during verification.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {domainsLoading || loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-brand-main border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-text-200">
                {domainsLoading ? "Loading domains..." : "Loading campaigns..."}
              </p>
            </div>
          </div>
        ) : domains.length === 0 ? (
          <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-brand-main rounded-full flex items-center justify-center mx-auto mb-4">
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
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text-100 mb-2">
              No Domains Yet
            </h3>
            <p className="text-text-200 mb-6">
              Add a domain first to create campaigns
            </p>
            <Link href="/email/domains/create">
              <Button className="bg-brand-main hover:bg-brand-main/80 text-white px-6 py-2 rounded-lg transition">
                Add Your First Domain
              </Button>
            </Link>
          </div>
        ) : filteredCampaigns?.length === 0 && campaigns?.length === 0 ? (
          <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-brand-main rounded-full flex items-center justify-center mx-auto mb-4">
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
            <h3 className="text-xl font-semibold text-text-100 mb-2">
              No Campaigns Yet
            </h3>
            <p className="text-text-200 mb-6">
              Create your first campaign to get started
            </p>
            <Link href="/email/campaigns/builder">
              <Button className="bg-brand-main hover:bg-brand-main/80 text-white px-6 py-2 rounded-lg transition">
                Create Your First Campaign
              </Button>
            </Link>
          </div>
        ) : filteredCampaigns?.length === 0 ? (
          <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-brand-main rounded-full flex items-center justify-center mx-auto mb-4">
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
                  d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text-100 mb-2">
              No Campaigns Found
            </h3>
            <p className="text-text-200 mb-6">
              No campaigns match the selected filter
            </p>
            <button
              onClick={() => setReoonFilter("all")}
              className="bg-brand-main hover:bg-brand-main/80 text-white px-6 py-2 rounded-lg transition"
            >
              Clear Filter
            </button>
          </div>
        ) : (
          <>
            {/* Campaigns AG Grid Table */}
            <AGGridWrapper<Campaign>
              rowData={filteredCampaigns}
              columnDefs={columnDefs}
              loading={loading}
              height={500}
              emptyMessage="No campaigns found"
              getRowId={(params) => params.data.id}
              showPagination={true}
              serverSidePagination={true}
              totalRows={total}
              currentPage={page}
              pageSize={limit}
              pageSizeOptions={[10, 25, 50, 100]}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </>
        )}
      </main>
    </div>
  );
}
