"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  getTemplates,
  syncTemplates,
  WhatsAppTemplate,
} from "@/utils/api/whatsappClient";
import { tokenStorage } from "@/utils/auth/tokenStorage";

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "APPROVED" | "PENDING" | "REJECTED"
  >("all");

  // TODO: Get phoneNumberId from user settings
  const phoneNumberId = "default";

  const handleCreateTemplate = () => {
    router.push("/whatsapp/templates/create");
  };

  useEffect(() => {
    fetchTemplates();
  }, [statusFilter]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await getTemplates(
        phoneNumberId,
        statusFilter === "all" ? undefined : statusFilter
      );
      setTemplates(data);
    } catch (error: any) {
      console.error("Error fetching templates:", error);

      if (error.response?.status === 401) {
        toast.error("Your session has expired. Please sign in again.");
        tokenStorage.removeTokens();
        router.push("/login");
        return;
      }

      toast.error("Failed to fetch templates");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const result = await syncTemplates(phoneNumberId);
      toast.success(
        `Synced ${result.synced} new templates, updated ${result.updated}`
      );
      fetchTemplates();
    } catch (error: any) {
      console.error("Error syncing templates:", error);
      toast.error(error.response?.data?.message || "Failed to sync templates");
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      APPROVED: { bg: "bg-green-100", text: "text-green-700" },
      PENDING: { bg: "bg-amber-100", text: "text-amber-700" },
      REJECTED: { bg: "bg-red-100", text: "text-red-700" },
    };
    const style = statusMap[status] || statusMap.PENDING;
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}
      >
        {status}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    const categoryMap: Record<string, { bg: string; text: string }> = {
      UTILITY: { bg: "bg-blue-100", text: "text-blue-700" },
      MARKETING: { bg: "bg-purple-100", text: "text-purple-700" },
      AUTH: { bg: "bg-orange-100", text: "text-orange-700" },
    };
    const style = categoryMap[category] || categoryMap.UTILITY;
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${style.bg} ${style.text}`}
      >
        {category}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-bg-100">
      {/* Header */}
      <header className="backdrop-blur-xl bg-brand-main/5 border-b border-brand-main/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-text-100">
              WhatsApp Templates
            </h1>
            <p className="text-text-200 text-sm mt-1">
              Manage your WhatsApp message templates
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleCreateTemplate}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition"
            >
              + Create Template
            </Button>
            <Button
              onClick={handleSync}
              disabled={syncing}
              className="bg-brand-main hover:bg-brand-main/80 text-white px-6 py-2 rounded-lg transition"
            >
              {syncing ? "Syncing..." : "Sync from Meta"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              statusFilter === "all"
                ? "bg-brand-main text-white"
                : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter("APPROVED")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              statusFilter === "APPROVED"
                ? "bg-brand-main text-white"
                : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              statusFilter === "PENDING"
                ? "bg-brand-main text-white"
                : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter("REJECTED")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              statusFilter === "REJECTED"
                ? "bg-brand-main text-white"
                : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
            }`}
          >
            Rejected
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-brand-main border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-text-200">Loading templates...</p>
            </div>
          </div>
        ) : templates.length === 0 ? (
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text-100 mb-2">
              No Templates Found
            </h3>
            <p className="text-text-200 mb-6">
              Sync templates from Meta to get started
            </p>
            <Button
              onClick={handleSync}
              disabled={syncing}
              className="bg-brand-main hover:bg-brand-main/80 text-white px-6 py-2 rounded-lg transition"
            >
              {syncing ? "Syncing..." : "Sync from Meta"}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6 hover:bg-brand-main/20 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text-100 mb-2">
                      {template.templateName}
                    </h3>
                    <p className="text-sm text-text-200">
                      Language: {template.language}
                    </p>
                  </div>
                  {getStatusBadge(template.status)}
                </div>
                <div className="flex items-center gap-2 mb-4">
                  {getCategoryBadge(template.templateCategory)}
                </div>
                <div className="text-xs text-text-200">
                  ID: {template.templateId}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

