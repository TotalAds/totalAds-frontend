"use client";

import { ColDef, ICellRendererParams } from "ag-grid-community";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import AGGridWrapper from "@/components/common/AGGridWrapper";
import { Button } from "@/components/ui/button";
import {
  deleteCampaign,
  downloadCSVTemplate,
  getCampaigns,
  pauseCampaign,
  resumeCampaign,
  WhatsAppCampaign,
} from "@/utils/api/whatsappClient";
import { tokenStorage } from "@/utils/auth/tokenStorage";

export default function WhatsAppCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // TODO: Get phoneNumberId from user settings
  const phoneNumberId = "default";

  useEffect(() => {
    fetchCampaigns();
  }, [page]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const result = await getCampaigns(phoneNumberId, page, limit);
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
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      setDeleting(campaignId);
      await deleteCampaign(campaignId);
      toast.success("Campaign deleted successfully");
      fetchCampaigns();
    } catch (error: any) {
      console.error("Error deleting campaign:", error);
      toast.error(error.response?.data?.message || "Failed to delete campaign");
    } finally {
      setDeleting(null);
    }
  };

  const handlePause = async (campaignId: string) => {
    try {
      await pauseCampaign(campaignId);
      toast.success("Campaign paused successfully");
      fetchCampaigns();
    } catch (error: any) {
      console.error("Error pausing campaign:", error);
      toast.error(error.response?.data?.message || "Failed to pause campaign");
    }
  };

  const handleResume = async (campaignId: string) => {
    try {
      await resumeCampaign(campaignId);
      toast.success("Campaign resumed successfully");
      fetchCampaigns();
    } catch (error: any) {
      console.error("Error resuming campaign:", error);
      toast.error(error.response?.data?.message || "Failed to resume campaign");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      draft: { bg: "bg-slate-100", text: "text-slate-600" },
      running: { bg: "bg-green-100", text: "text-green-700" },
      sending: { bg: "bg-blue-100", text: "text-blue-700" },
      paused: { bg: "bg-amber-100", text: "text-amber-700" },
      completed: { bg: "bg-emerald-100", text: "text-emerald-700" },
      failed: { bg: "bg-red-100", text: "text-red-700" },
      cancelled: { bg: "bg-gray-100", text: "text-gray-700" },
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

  const StatusCellRenderer = useCallback(
    (params: ICellRendererParams<WhatsAppCampaign>) => {
      const campaign = params.data;
      if (!campaign) return null;
      return getStatusBadge(campaign.status);
    },
    []
  );

  const ActionsCellRenderer = useCallback(
    (params: ICellRendererParams<WhatsAppCampaign>) => {
      const campaign = params.data;
      if (!campaign) return null;

      return (
        <div className="flex justify-end gap-2 py-1">
          <Link href={`/whatsapp/campaigns/${campaign.campaignId}`}>
            <Button className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs px-3 py-1.5 rounded-md font-medium transition border border-blue-200">
              View
            </Button>
          </Link>
          {campaign.status === "running" && (
            <Button
              onClick={() => handlePause(campaign.campaignId)}
              className="bg-amber-50 hover:bg-amber-100 text-amber-600 text-xs px-3 py-1.5 rounded-md font-medium transition border border-amber-200"
            >
              Pause
            </Button>
          )}
          {campaign.status === "paused" && (
            <Button
              onClick={() => handleResume(campaign.campaignId)}
              className="bg-green-50 hover:bg-green-100 text-green-600 text-xs px-3 py-1.5 rounded-md font-medium transition border border-green-200"
            >
              Resume
            </Button>
          )}
          {campaign.status === "draft" && (
            <Button
              onClick={() => handleDelete(campaign.campaignId)}
              disabled={deleting === campaign.campaignId}
              className="bg-red-50 hover:bg-red-100 text-red-600 text-xs px-3 py-1.5 rounded-md font-medium transition border border-red-200 disabled:opacity-50"
            >
              {deleting === campaign.campaignId ? "..." : "Delete"}
            </Button>
          )}
        </div>
      );
    },
    [deleting]
  );

  const columnDefs = useMemo<ColDef<WhatsAppCampaign>[]>(
    () => [
      {
        headerName: "Name",
        field: "campaignName",
        flex: 1.5,
        minWidth: 150,
        cellClass: "text-slate-800 font-medium",
        sortable: true,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Template",
        field: "templateName",
        flex: 1.5,
        minWidth: 150,
        cellClass: "text-slate-600 text-sm",
        sortable: true,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Status",
        field: "status",
        flex: 1,
        minWidth: 120,
        cellRenderer: StatusCellRenderer,
        sortable: true,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Records",
        field: "totalRecords",
        flex: 1,
        minWidth: 100,
        cellClass: "text-slate-500 text-sm",
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
        filter: false,
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
              WhatsApp Campaigns
            </h1>
            <p className="text-text-200 text-sm mt-1">
              Create and manage your WhatsApp campaigns
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={async () => {
                try {
                  await downloadCSVTemplate();
                  toast.success("CSV template downloaded successfully");
                } catch (error: any) {
                  toast.error("Failed to download CSV template");
                }
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition"
            >
              📥 Download CSV Template
            </Button>
            <Link href="/whatsapp/campaigns/create">
              <Button className="bg-brand-main hover:bg-brand-main/80 text-white px-6 py-2 rounded-lg transition">
                + Create Campaign
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-brand-main border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-text-200">Loading campaigns...</p>
            </div>
          </div>
        ) : campaigns?.length === 0 ? (
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text-100 mb-2">
              No Campaigns Yet
            </h3>
            <p className="text-text-200 mb-6">
              Create your first WhatsApp campaign to get started
            </p>
            <Link href="/whatsapp/campaigns/create">
              <Button className="bg-brand-main hover:bg-brand-main/80 text-white px-6 py-2 rounded-lg transition">
                Create Your First Campaign
              </Button>
            </Link>
          </div>
        ) : (
          <AGGridWrapper<WhatsAppCampaign>
            rowData={campaigns}
            columnDefs={columnDefs}
            loading={loading}
            height={500}
            emptyMessage="No campaigns found"
            getRowId={(params) => params.data.campaignId}
            showPagination={true}
            serverSidePagination={true}
            totalRows={total}
            currentPage={page}
            pageSize={limit}
            pageSizeOptions={[10, 25, 50, 100]}
            onPageChange={(newPage) => setPage(newPage)}
          />
        )}
      </main>
    </div>
  );
}

