"use client";

import { format, formatDistanceToNow } from 'date-fns';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useAuthContext } from '@/context/AuthContext';
import { downloadJobFile, getHistory, LeadEnhancementJob } from '@/utils/api/leadEnhancementClient';
import {
    IconDownload, IconEye, IconFileSpreadsheet, IconFilter, IconFilterOff, IconRefresh, IconSearch,
    IconUpload
} from '@tabler/icons-react';

const LeadEnhancementHistory: React.FC = () => {
  const [history, setHistory] = useState<LeadEnhancementJob[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
  });
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [downloadingJobId, setDownloadingJobId] = useState<string | null>(null);

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

        const data = await getHistory(currentPage, 10);

        // Apply client-side filtering if needed
        let filteredData = data.data || [];

        if (filters.status) {
          filteredData = filteredData.filter(
            (item: LeadEnhancementJob) => item.status === filters.status
          );
        }

        setHistory(filteredData);
        setTotalPages(Math.ceil((data.total || filteredData.length) / 10));
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

  const handleDownload = async (
    jobId: string,
    format: "csv" | "xlsx" = "xlsx"
  ) => {
    try {
      setDownloadingJobId(jobId);
      const blob = await downloadJobFile(jobId, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lead-enhancement-${jobId}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`File downloaded successfully`);
    } catch (error: any) {
      console.error("Download failed:", error);
      toast.error("Failed to download file. Please try again.");
    } finally {
      setDownloadingJobId(null);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      // Get all history data for export
      const data = await getHistory(1, 1000);

      const exportData = data.data.map((item: LeadEnhancementJob) => ({
        "Job ID": item.id,
        Status: item.status,
        "Total Rows": item.totalRows,
        "Processed Rows": item.processedRows,
        "Failed Rows": item.failedRows,
        "Success Rate":
          item.totalRows > 0
            ? `${Math.round((item.processedRows / item.totalRows) * 100)}%`
            : "0%",
        "Started At": item.startedAt
          ? format(new Date(item.startedAt), "yyyy-MM-dd HH:mm:ss")
          : "N/A",
        "Updated At": item.updatedAt
          ? format(new Date(item.updatedAt), "yyyy-MM-dd HH:mm:ss")
          : "N/A",
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
      a.download = `lead-enhancement-history-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("History exported successfully");
    } catch (error: any) {
      console.error("Export failed:", error);
      toast.error("Failed to export data. Please try again.");
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
    });
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

  const getSuccessRate = (job: LeadEnhancementJob) => {
    if (job.totalRows === 0) return 0;
    return Math.round(((job.totalRows - job.failedRows) / job.totalRows) * 100);
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
              You need to be logged in to view your lead enhancement history.
              Please sign in to access your past jobs and results.
            </p>
            <button
              onClick={() => (window.location.href = "/login")}
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
            Fetching your lead enhancement history...
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
              Lead Enhancement History
            </h3>
            <p className="text-white/70 text-sm">
              View your past lead enhancement jobs and their results. You can
              check the status of your jobs, see processing statistics, and
              download completed results.
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
              onClick={() => setShowDetails((s) => !s)}
              className="text-sm text-white/90 hover:text-white flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all duration-200 backdrop-blur-sm"
              title="Toggle extra columns"
            >
              <IconSearch className="w-4 h-4 mr-2" />
              {showDetails ? "Hide details" : "Show details"}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <option value="pending" className="bg-gray-800 text-white">
                    Pending
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
            {filters.status || filters.startDate || filters.endDate ? (
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
                  <IconUpload className="w-12 h-12 text-white/60" />
                </div>
                <h4 className="text-2xl font-bold text-white mb-3">
                  No enhancement jobs yet
                </h4>
                <p className="text-white/70 text-base mb-6 leading-relaxed">
                  Start by uploading your first lead file to enhance your data.
                  Your completed jobs will appear here with detailed information
                  about processing status and results.
                </p>
                <button
                  onClick={() => (window.location.href = "/lead-enhancement")}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <IconUpload className="w-5 h-5 mr-2" />
                  Start Enhancement
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
                    Job ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  {showDetails && (
                    <>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider"
                      >
                        Website Column
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider"
                      >
                        ICP Profile ID
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider"
                      >
                        Credits Estimated
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider"
                      >
                        Credits Used
                      </th>
                    </>
                  )}
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
                    Progress
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider"
                  >
                    Success Rate
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
                      <div className="text-white/90 font-medium">
                        #{item.id.slice(-8)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                      <div
                        title={
                          item.startedAt
                            ? format(new Date(item.startedAt), "PPpp")
                            : "N/A"
                        }
                      >
                        {item.startedAt
                          ? formatDistanceToNow(new Date(item.startedAt), {
                              addSuffix: true,
                            })
                          : "N/A"}
                      </div>
                    </td>
                    {showDetails && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                          {item.websiteColumn || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                          {item.icpProfileId ?? "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                          {item.creditsEstimated ?? "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                          {item.creditsUsed ?? "-"}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <div className="text-white/90 text-sm">
                            {item.processedRows}/{item.totalRows} rows
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2 mt-1">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${
                                  item.totalRows > 0
                                    ? (item.processedRows / item.totalRows) *
                                      100
                                    : 0
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <span
                          className={`text-sm font-medium ${
                            getSuccessRate(item) >= 80
                              ? "text-green-300"
                              : getSuccessRate(item) >= 60
                              ? "text-yellow-300"
                              : "text-red-300"
                          }`}
                        >
                          {getSuccessRate(item)}%
                        </span>
                        {item.failedRows > 0 && (
                          <span className="ml-2 text-xs text-red-300">
                            ({item.failedRows} failed)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() =>
                            (window.location.href = `/lead-enhancement/jobs/${item.id}`)
                          }
                          className="p-2 text-blue-300 hover:text-blue-200 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-all duration-200 backdrop-blur-sm"
                          title="View Details"
                        >
                          <IconEye className="w-4 h-4" />
                        </button>
                        {item.status === "completed" && (
                          <>
                            <button
                              onClick={() => handleDownload(item.id, "csv")}
                              disabled={downloadingJobId === item.id}
                              className="p-2 text-green-300 hover:text-green-200 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg transition-all duration-200 backdrop-blur-sm disabled:opacity-50"
                              title="Download CSV"
                            >
                              {downloadingJobId === item.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-300"></div>
                              ) : (
                                <IconDownload className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDownload(item.id, "xlsx")}
                              disabled={downloadingJobId === item.id}
                              className="p-2 text-purple-300 hover:text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg transition-all duration-200 backdrop-blur-sm disabled:opacity-50"
                              title="Download XLSX"
                            >
                              {downloadingJobId === item.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-300"></div>
                              ) : (
                                <IconFileSpreadsheet className="w-4 h-4" />
                              )}
                            </button>
                          </>
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

export default LeadEnhancementHistory;
