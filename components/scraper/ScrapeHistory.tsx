"use client";

import { format, formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

import { useAuthContext } from "@/context/AuthContext";
import { cancelScrapeJob, getScrapeHistory } from "@/utils/api/scraperClient";
import {
  IconDownload,
  IconEye,
  IconFilter,
  IconFilterOff,
  IconRefresh,
  IconSearch,
  IconX,
} from "@tabler/icons-react";

import { ScrapeHistoryItem } from "./utils/scraperTypes";

const ScrapeHistory: React.FC = () => {
  const [history, setHistory] = useState<ScrapeHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [cancelingJobId, setCancelingJobId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
    url: "",
  });
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const router = useRouter();
  const { state } = useAuthContext();
  const { isAuthenticated } = state;

  const fetchHistory = useCallback(
    async (resetPage = false) => {
      try {
        setLoading(true);
        setError(null);

        const currentPage = resetPage ? 1 : page;
        if (resetPage) {
          setPage(1);
        }

        // Build query parameters
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: "10",
        });

        if (filters.status) params.append("status", filters.status);
        if (filters.startDate) params.append("start_date", filters.startDate);
        if (filters.endDate) params.append("end_date", filters.endDate);

        const data = await getScrapeHistory(
          parseInt(params.get("page") || "1"),
          parseInt(params.get("limit") || "10")
        );

        const filteredData = filters.url
          ? data.data.filter((item: ScrapeHistoryItem) =>
              item.url.toLowerCase().includes(filters.url.toLowerCase())
            )
          : data.data;

        setHistory(filteredData);
        setTotalPages(Math.ceil(data.total / data.limit) || 1);
      } catch (err) {
        setError("Failed to load history. Please try again later.");
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    [filters, page]
  );

  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory();
    }
  }, [isAuthenticated, fetchHistory]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory(true);
    }
  }, [filters, isAuthenticated, fetchHistory]);

  const handleExport = async () => {
    try {
      setExporting(true);

      // Get all history data for export
      const params = new URLSearchParams({
        page: "1",
        limit: "1000", // Get more data for export
      });

      if (filters.status) params.append("status", filters.status);
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate) params.append("end_date", filters.endDate);

      const data = await getScrapeHistory(
        parseInt(params.get("page") || "1"),
        parseInt(params.get("limit") || "10")
      );

      const exportData = data.data.map((item: ScrapeHistoryItem) => ({
        URL: item.url,
        Status: item.status,
        "Created At": format(new Date(item.createdAt), "yyyy-MM-dd HH:mm:ss"),
        "Completed At": item.completedAt
          ? format(new Date(item.completedAt), "yyyy-MM-dd HH:mm:ss")
          : "N/A",
        "AI Enabled": item.enabledAI ? "Yes" : "No",
        "Credits Used": item.creditsUsed,
      }));

      // Convert to CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(","),
        ...exportData.map((row) =>
          headers.map((header) => `"${(row as any)[header]}"`).join(",")
        ),
      ].join("\n");

      // Download file
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `profile-history-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Export failed:", error);
      setError("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      startDate: "",
      endDate: "",
      url: "",
    });
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      setCancelingJobId(jobId);
      const result = await cancelScrapeJob(jobId);
      if (result.success) {
        // Update the job status in the local state
        setHistory((currentHistory) =>
          currentHistory.map((item) =>
            item.id === jobId ? { ...item, status: "canceled" } : item
          )
        );
      } else {
        setError(`Failed to cancel job: ${result.message}`);
      }
    } catch (err: any) {
      setError(`Error canceling job: ${err.message}`);
    } finally {
      setCancelingJobId(null);
    }
  };

  const handleViewResult = (jobId: string) => {
    router.push(`/scraper/results/${jobId}`);
  };

  const getStatusBadge = (status: string) => {
    const baseClasses =
      "inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border backdrop-blur-sm";
    switch (status) {
      case "completed":
        return (
          <span
            className={`${baseClasses} bg-green-500/20 text-green-300 border-green-500/30`}
          >
            ✓ Completed
          </span>
        );
      case "processing":
      case "running":
        return (
          <span
            className={`${baseClasses} bg-blue-500/20 text-blue-300 border-blue-500/30`}
          >
            ⟳ Processing
          </span>
        );
      case "failed":
        return (
          <span
            className={`${baseClasses} bg-red-500/20 text-red-300 border-red-500/30`}
          >
            ✗ Failed
          </span>
        );
      case "canceled":
      case "cancelled":
        return (
          <span
            className={`${baseClasses} bg-gray-500/20 text-gray-300 border-gray-500/30`}
          >
            ⊘ Canceled
          </span>
        );
      case "pending":
        return (
          <span
            className={`${baseClasses} bg-yellow-500/20 text-yellow-300 border-yellow-500/30`}
          >
            ⏳ Pending
          </span>
        );
      default:
        return (
          <span
            className={`${baseClasses} bg-gray-500/20 text-gray-300 border-gray-500/30`}
          >
            {status}
          </span>
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
        <div className="p-16 text-center">
          <div className="max-w-lg mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-sm">
              <IconEye className="w-12 h-12 text-white/60" />
            </div>
            <h4 className="text-2xl font-bold text-white mb-3">
              Authentication Required
            </h4>
            <p className="text-white/70 text-base mb-6 leading-relaxed">
              You need to be logged in to view your profile history. Please sign
              in to access your past profiles and results.
            </p>
            <button
              onClick={() => (window.location.href = "/auth/login")}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <IconEye className="w-5 h-5 mr-2" />
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !isLoadingMore) {
    return (
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
        <div className="flex flex-col justify-center items-center p-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400 mb-4"></div>
          <h3 className="text-lg font-medium text-white mb-2">
            Loading History
          </h3>
          <p className="text-white/70 text-sm">
            Fetching your profile history...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
      <div className="p-6 border-b border-white/10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Profile History
            </h3>
            <p className="text-white/70 text-sm">
              View your past profile enrichments and their results. You can
              check the status of your requests, see credits used, and access
              completed results.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-white/90 hover:text-white flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all duration-200 backdrop-blur-sm"
            >
              <IconFilter className="w-4 h-4 mr-2" />
              Filters
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || history?.length === 0}
              className="text-sm text-white/90 hover:text-white flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all duration-200 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconDownload className="w-4 h-4 mr-2" />
              {exporting ? "Exporting..." : "Export"}
            </button>
            <button
              onClick={() => fetchHistory()}
              className="text-sm text-white/90 hover:text-white flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all duration-200 backdrop-blur-sm"
              disabled={loading}
            >
              <IconRefresh className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                >
                  <option value="" className="bg-gray-800 text-white">
                    All Statuses
                  </option>
                  <option value="completed" className="bg-gray-800 text-white">
                    Completed
                  </option>
                  <option value="processing" className="bg-gray-800 text-white">
                    Processing
                  </option>
                  <option value="failed" className="bg-gray-800 text-white">
                    Failed
                  </option>
                  <option value="canceled" className="bg-gray-800 text-white">
                    Canceled
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  URL Contains
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.url}
                    onChange={(e) => handleFilterChange("url", e.target.value)}
                    placeholder="Search URLs..."
                    className="w-full px-4 py-3 pl-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                  />
                  <IconSearch className="w-5 h-5 text-white/50 absolute left-4 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-white/90 hover:text-white flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all duration-200"
              >
                <IconFilterOff className="w-4 h-4 mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 m-6 backdrop-blur-sm">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {history?.length === 0 && !loading ? (
        <div className="p-16 text-center">
          <div className="max-w-lg mx-auto">
            {/* Check if filters are applied */}
            {filters.status ||
            filters.startDate ||
            filters.endDate ||
            filters.url ? (
              <>
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-sm">
                  <IconFilterOff className="w-12 h-12 text-white/60" />
                </div>
                <h4 className="text-2xl font-bold text-white mb-3">
                  No results found
                </h4>
                <p className="text-white/70 text-base mb-6 leading-relaxed">
                  No history matches your current filters. Try adjusting your
                  search criteria or clearing the filters to see all results.
                </p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <IconFilterOff className="w-5 h-5 mr-2" />
                  Clear Filters
                </button>
              </>
            ) : (
              <>
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-sm">
                  <IconSearch className="w-12 h-12 text-white/60" />
                </div>
                <h4 className="text-2xl font-bold text-white mb-3">
                  No history yet
                </h4>
                <p className="text-white/70 text-base mb-6 leading-relaxed">
                  Start by enriching your first company profile to see your
                  history here. Your completed profiles will appear with
                  detailed information about status, credits used, and results.
                </p>
                <button
                  onClick={() => (window.location.href = "/scraper")}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <IconSearch className="w-5 h-5 mr-2" />
                  Start Enrichment
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5 backdrop-blur-sm">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider"
                  >
                    URL
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider"
                  >
                    AI Enhanced
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider"
                  >
                    Credits Used
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-right text-xs font-semibold text-white/90 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {history?.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-white/5 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="max-w-xs truncate text-white/90 font-medium">
                        {item.url}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                      <div title={format(new Date(item.createdAt), "PPpp")}>
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.enabledAI ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                          ✓ Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-300 border border-gray-500/30">
                          ✗ No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="text-white/90 font-medium">
                        {item.creditsUsed}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        {item.status === "completed" && (
                          <button
                            onClick={() => handleViewResult(item.id)}
                            className="p-2 text-blue-300 hover:text-blue-200 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-all duration-200 backdrop-blur-sm"
                            title="View Result"
                          >
                            <IconEye className="w-4 h-4" />
                          </button>
                        )}
                        {item.status === "processing" && (
                          <button
                            onClick={() => handleCancelJob(item.id)}
                            className="p-2 text-red-300 hover:text-red-200 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-all duration-200 backdrop-blur-sm disabled:opacity-50"
                            title="Cancel Job"
                            disabled={cancelingJobId === item.id}
                          >
                            {cancelingJobId === item.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-300"></div>
                            ) : (
                              <IconX className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-white/10 bg-white/5 backdrop-blur-sm rounded-b-2xl">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className={`relative inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-lg backdrop-blur-sm transition-all duration-200 ${
                    page === 1
                      ? "text-white/50 bg-white/5 cursor-not-allowed"
                      : "text-white/90 bg-white/10 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-lg backdrop-blur-sm transition-all duration-200 ${
                    page === totalPages
                      ? "text-white/50 bg-white/5 cursor-not-allowed"
                      : "text-white/90 bg-white/10 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-white/70">
                    Showing{" "}
                    <span className="font-medium text-white">page {page}</span>{" "}
                    of{" "}
                    <span className="font-medium text-white">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-lg shadow-sm space-x-1">
                    <button
                      onClick={() => setPage(1)}
                      disabled={page === 1 || loading}
                      className={`relative inline-flex items-center px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-sm font-medium backdrop-blur-sm transition-all duration-200 ${
                        page === 1
                          ? "text-white/50 cursor-not-allowed"
                          : "text-white/90 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      <span className="sr-only">First</span>
                      <span>«</span>
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || loading}
                      className={`relative inline-flex items-center px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-sm font-medium backdrop-blur-sm transition-all duration-200 ${
                        page === 1
                          ? "text-white/50 cursor-not-allowed"
                          : "text-white/90 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <span>‹</span>
                    </button>
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          disabled={loading}
                          className={`relative inline-flex items-center px-4 py-2 rounded-lg border backdrop-blur-sm transition-all duration-200 ${
                            page === pageNum
                              ? "bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500/50 text-white shadow-lg"
                              : "border-white/20 bg-white/10 text-white/90 hover:bg-white/20 hover:text-white"
                          } text-sm font-medium`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages || loading}
                      className={`relative inline-flex items-center px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-sm font-medium backdrop-blur-sm transition-all duration-200 ${
                        page === totalPages
                          ? "text-white/50 cursor-not-allowed"
                          : "text-white/90 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <span>›</span>
                    </button>
                    <button
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages || loading}
                      className={`relative inline-flex items-center px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-sm font-medium backdrop-blur-sm transition-all duration-200 ${
                        page === totalPages
                          ? "text-white/50 cursor-not-allowed"
                          : "text-white/90 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      <span className="sr-only">Last</span>
                      <span>»</span>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ScrapeHistory;
