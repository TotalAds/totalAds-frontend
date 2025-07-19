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
        setError("Failed to load scrape history. Please try again later.");
        console.error("Error fetching scrape history:", err);
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
      a.download = `scrape-history-${
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
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case "completed":
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            Completed
          </span>
        );
      case "processing":
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            Processing
          </span>
        );
      case "failed":
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            Failed
          </span>
        );
      case "canceled":
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            Canceled
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            {status}
          </span>
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              You need to be logged in to view your scrape history.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !isLoadingMore) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-bg-200 rounded-lg shadow-sm">
      <div className="p-4 border-b border-bg-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Recent Scrapes</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center px-3 py-1 border border-primary-200 rounded-md"
            >
              <IconFilter className="w-4 h-4 mr-1" />
              Filters
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || history.length === 0}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center px-3 py-1 border border-primary-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconDownload className="w-4 h-4 mr-1" />
              {exporting ? "Exporting..." : "Export"}
            </button>
            <button
              onClick={() => fetchHistory()}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center px-3 py-1 border border-primary-200 rounded-md"
              disabled={loading}
            >
              <IconRefresh className="w-4 h-4 mr-1" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Contains
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.url}
                    onChange={(e) => handleFilterChange("url", e.target.value)}
                    placeholder="Search URLs..."
                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <IconSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-700 flex items-center px-3 py-1 border border-gray-300 rounded-md"
              >
                <IconFilterOff className="w-4 h-4 mr-1" />
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {history.length === 0 && !loading ? (
        <div className="p-8 text-center text-text-200">
          <p>No scrape history found. Try scraping a URL first.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-bg-200">
              <thead className="bg-bg-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-text-300 uppercase tracking-wider"
                  >
                    URL
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-text-300 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-text-300 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-text-300 uppercase tracking-wider"
                  >
                    AI
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-text-300 uppercase tracking-wider"
                  >
                    Credits
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-medium text-text-300 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-bg-200">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-bg-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="max-w-xs truncate">{item.url}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text-300">
                      <div title={format(new Date(item.createdAt), "PPpp")}>
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {item.enabledAI ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-text-300">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {item.creditsUsed}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {item.status === "completed" && (
                          <button
                            onClick={() => handleViewResult(item.id)}
                            className="text-primary-600 hover:text-primary-700"
                            title="View Result"
                          >
                            <IconEye className="w-5 h-5" />
                          </button>
                        )}
                        {item.status === "processing" && (
                          <button
                            onClick={() => handleCancelJob(item.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Cancel Job"
                            disabled={cancelingJobId === item.id}
                          >
                            {cancelingJobId === item.id ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-red-600"></div>
                            ) : (
                              <IconX className="w-5 h-5" />
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
            <div className="px-4 py-3 flex items-center justify-between border-t border-bg-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className={`relative inline-flex items-center px-4 py-2 border border-bg-300 text-sm font-medium rounded-md ${
                    page === 1
                      ? "text-text-200 bg-bg-50"
                      : "text-text-400 bg-white hover:bg-bg-50"
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-bg-300 text-sm font-medium rounded-md ${
                    page === totalPages
                      ? "text-text-200 bg-bg-50"
                      : "text-text-400 bg-white hover:bg-bg-50"
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-text-400">
                    Showing <span className="font-medium">page {page}</span> of{" "}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(1)}
                      disabled={page === 1 || loading}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-bg-300 bg-white text-sm font-medium ${
                        page === 1
                          ? "text-text-200"
                          : "text-text-400 hover:bg-bg-50"
                      }`}
                    >
                      <span className="sr-only">First</span>
                      <span>«</span>
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || loading}
                      className={`relative inline-flex items-center px-2 py-2 border border-bg-300 bg-white text-sm font-medium ${
                        page === 1
                          ? "text-text-200"
                          : "text-text-400 hover:bg-bg-50"
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
                          className={`relative inline-flex items-center px-4 py-2 border ${
                            page === pageNum
                              ? "bg-primary-50 border-primary-500 text-primary-600 z-10"
                              : "border-bg-300 bg-white text-text-400 hover:bg-bg-50"
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
                      className={`relative inline-flex items-center px-2 py-2 border border-bg-300 bg-white text-sm font-medium ${
                        page === totalPages
                          ? "text-text-200"
                          : "text-text-400 hover:bg-bg-50"
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <span>›</span>
                    </button>
                    <button
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages || loading}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-bg-300 bg-white text-sm font-medium ${
                        page === totalPages
                          ? "text-text-200"
                          : "text-text-400 hover:bg-bg-50"
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
