"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { CampaignListTable } from "@/components/campaigns/CampaignListTable";
import { CreateCampaignModal } from "@/components/campaigns/CreateCampaignModal";
import { Button } from "@/components/ui/button";
import { useCanEdit, useIsViewer } from "@/context/WorkspaceContext";
import WorkspaceRoleBanner from "@/components/workspace/WorkspaceRoleBanner";
import { useEmailProvider } from "@/hooks/useEmailProvider";
import { INBOX_CAMPAIGN_DOMAIN_ID } from "@/lib/campaignDomain";
import {
  Campaign,
  CampaignEligibility,
  deleteCampaign,
  Domain,
  getAllCampaigns,
  getCampaignEligibility,
  getDomains,
} from "@/utils/api/emailClient";
import { tokenStorage } from "@/utils/auth/tokenStorage";
import { getCampaignBuilderMode } from "@/utils/campaignBuilder";

export default function CampaignsPage() {
  const router = useRouter();
  const canEdit = useCanEdit();
  const isViewer = useIsViewer();
  const { usesSesDomains } = useEmailProvider();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [eligibility, setEligibility] = useState<CampaignEligibility | null>(
    null,
  );
  const [initLoading, setInitLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [campaignTypeFilter, setCampaignTypeFilter] = useState<
    "all" | "single" | "sequence"
  >("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const limit = 10;

  const canCreateCampaigns = eligibility?.eligible === true && canEdit;
  const canBrowseCampaigns = canEdit || isViewer;

  useEffect(() => {
    const initialize = async () => {
      if (!canBrowseCampaigns) {
        setInitLoading(false);
        return;
      }
      if (isViewer) {
        setInitLoading(false);
        return;
      }
      try {
        setInitLoading(true);
        const [eligibilityData, domainsResult] = await Promise.all([
          getCampaignEligibility(),
          usesSesDomains
            ? getDomains(1, 100)
            : Promise.resolve({ data: { domains: [] as Domain[] } }),
        ]);
        setEligibility(eligibilityData);
        setDomains(domainsResult.data.domains || []);
      } catch (error: any) {
        console.error("Error initializing campaigns page:", error);
        if (error.response?.status === 401) {
          toast.error("Your session has expired. Please sign in again.");
          tokenStorage.removeTokens();
          router.push("/login");
          return;
        }
        toast.error("Failed to load campaign setup status");
      } finally {
        setInitLoading(false);
      }
    };
    initialize();
  }, [router, usesSesDomains, canBrowseCampaigns, isViewer]);

  const fetchCampaigns = useCallback(async () => {
    if (!canBrowseCampaigns) return;

    try {
      setLoading(true);
      const result = await getAllCampaigns(page, limit, {
        domainId: domainFilter || undefined,
      });
      setCampaigns(result.data);
      setTotal(result.total);
    } catch (error: any) {
      console.error("Error fetching campaigns:", error);
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
  }, [canBrowseCampaigns, page, limit, domainFilter, router]);

  useEffect(() => {
    if (canBrowseCampaigns) {
      fetchCampaigns();
    }
  }, [canBrowseCampaigns, fetchCampaigns]);

  const handleDelete = async (campaignId: string, domainId?: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    const resolvedDomainId = domainId || INBOX_CAMPAIGN_DOMAIN_ID;
    try {
      setDeleting(campaignId);
      await deleteCampaign(resolvedDomainId, campaignId);
      toast.success("Campaign deleted successfully");
      fetchCampaigns();
    } catch (error: any) {
      console.error("Error deleting campaign:", error);
      toast.error(error.response?.data?.message || "Failed to delete campaign");
    } finally {
      setDeleting(null);
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (campaignTypeFilter === "all") return true;
    return getCampaignBuilderMode(campaign.sequence) === campaignTypeFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Email Campaigns
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Create and manage your email campaigns
            </p>
          </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            disabled={!canCreateCampaigns}
            className="rounded-lg bg-blue-600 px-5 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            + New Campaign
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {isViewer && <WorkspaceRoleBanner variant="viewer-action" className="mb-6" />}
        {canCreateCampaigns && usesSesDomains && domains.length > 0 && (
          <div className="mb-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Filter by domain (optional)
              </label>
              <select
                value={domainFilter}
                onChange={(e) => {
                  setDomainFilter(e.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All campaigns</option>
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.domain}
                  </option>
                ))}
              </select>
            </div>
            {/* <div className="md:self-end">
              <div className="flex rounded-lg border border-slate-200 bg-white p-1">
                {(["all", "single", "sequence"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCampaignTypeFilter(type)}
                    className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition ${
                      campaignTypeFilter === type
                        ? "bg-blue-600 text-white"
                        : "text-slate-500"
                    }`}
                  >
                    {type === "all" ? "All" : type}
                  </button>
                ))}
              </div>
            </div> */}
          </div>
        )}

        {/* {canCreateCampaigns && (!usesSesDomains || domains.length === 0) && (
          <div className="mb-6 flex justify-end">
            <div className="flex rounded-lg border border-slate-200 bg-white p-1">
              {(["all", "single", "sequence"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCampaignTypeFilter(type)}
                  className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition ${
                    campaignTypeFilter === type
                      ? "bg-blue-600 text-white"
                      : "text-slate-500"
                  }`}
                >
                  {type === "all" ? "All" : type}
                </button>
              ))}
            </div>
          </div>
        )} */}

        {initLoading ||
        (canBrowseCampaigns && loading && campaigns.length === 0) ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <p className="text-slate-500">
                {initLoading ? "Checking setup…" : "Loading campaigns…"}
              </p>
            </div>
          </div>
        ) : isViewer ? (
          filteredCampaigns.length === 0 && !loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <h3 className="mb-2 text-xl font-semibold text-slate-900">
                No campaigns to view
              </h3>
              <p className="text-slate-500">
                This workspace has no campaigns yet, or you may not have access
                to view them.
              </p>
            </div>
          ) : (
            <CampaignListTable
              campaigns={filteredCampaigns}
              loading={loading}
              deletingId={null}
              total={total}
              page={page}
              pageSize={limit}
              onPageChange={setPage}
              onDelete={() => undefined}
              onRefresh={fetchCampaigns}
              readOnly
            />
          )
        ) : !canCreateCampaigns ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
              <svg
                className="h-8 w-8 text-white"
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
            <h3 className="mb-2 text-xl font-semibold text-slate-900">
              Connect a sending account first
            </h3>
            <p className="mx-auto mb-2 max-w-md text-slate-500">
              {eligibility?.ineligibleReason ||
                "Add at least one verified sending account (Gmail, Microsoft, Custom SMTP, or AWS SES) before you can create campaigns."}
            </p>
            <p className="mx-auto mb-6 max-w-md text-sm text-slate-400">
              Domain verification is only required for AWS SES. Connected inbox
              accounts only need a verified sender.
            </p>
            <Link href="/email/sending-accounts">
              <Button className="rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                Add sending account
              </Button>
            </Link>
          </div>
        ) : filteredCampaigns.length === 0 && !loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
              <svg
                className="h-8 w-8 text-white"
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
            <h3 className="mb-2 text-xl font-semibold text-slate-900">
              No Campaigns Yet
            </h3>
            <p className="mb-6 text-slate-500">
              Create your first campaign to get started
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition-all hover:shadow-md"
            >
              Create Your First Campaign
            </button>
          </div>
        ) : (
          <CampaignListTable
            campaigns={filteredCampaigns}
            loading={loading}
            deletingId={deleting}
            total={total}
            page={page}
            pageSize={limit}
            onPageChange={setPage}
            onDelete={handleDelete}
            onRefresh={fetchCampaigns}
          />
        )}
      </main>

      {/* Create Campaign Modal */}
      <CreateCampaignModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(campaignId) => {
          setCreateModalOpen(false);
          router.push(`/email/campaigns/${campaignId}`);
        }}
      />
    </div>
  );
}
