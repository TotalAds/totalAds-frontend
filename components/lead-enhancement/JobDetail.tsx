"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import DataTable from "@/components/ui/DataTable";
import {
  downloadJobFile,
  getJob,
  getJobRows,
  LeadEnhancementJob,
} from "@/utils/api/leadEnhancementClient";
import {
  IconCheck,
  IconClock,
  IconDownload,
  IconFileSpreadsheet,
  IconX,
} from "@tabler/icons-react";

const POLL_MS = 4000;

export default function JobDetail({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [job, setJob] = useState<LeadEnhancementJob | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const timer = useRef<any>(null);

  const refresh = async () => {
    try {
      const j = await getJob(jobId);
      setJob(j);

      // Fetch all pages of rows to show a complete live view
      const allRows: any[] = [];
      let cur: string | undefined = undefined;
      let safety = 0;
      do {
        const r = await getJobRows(jobId, cur, 500);
        if (r.rows?.length) allRows.push(...r.rows);
        cur = r.nextCursor;
        safety++;
      } while (cur && safety < 20); // hard cap to avoid runaway

      setRows(allRows);
      setCursor(cur);

      // Stop polling once terminal state reached
      if (["completed", "failed", "cancelled"].includes(j.status)) {
        if (timer.current) clearInterval(timer.current);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refresh();
    timer.current = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer.current);
  }, [jobId]);

  const onDownload = async (fmt: "csv" | "xlsx") => {
    try {
      toast.loading(`Downloading ${fmt.toUpperCase()}...`, { id: "download" });
      const blob = await downloadJobFile(jobId, fmt);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lead-enhancement-${jobId}.${fmt}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${fmt.toUpperCase()} successfully`, {
        id: "download",
      });
    } catch (e: any) {
      console.error("Download failed:", e);
      toast.error(e?.message || "Failed to download file", { id: "download" });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <IconCheck className="h-4 w-4 text-green-400" />;
      case "failed":
        return <IconX className="h-4 w-4 text-red-400" />;
      case "pending":
      case "processing":
        return <IconClock className="h-4 w-4 text-yellow-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400";
      case "failed":
        return "text-red-400";
      case "pending":
      case "processing":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-5 animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/20">
                  <svg
                    className="h-8 w-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Enhancement Job
                  </h1>
                  <p className="text-gray-300">Job ID: {jobId}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push("/lead-enhancement")}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to Enhancement
                </button>
                <button
                  onClick={() => router.push("/lead-enhancement/history")}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  View History
                </button>
              </div>
            </div>
          </div>

          {/* Job Status Card */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl mb-8">
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-xl">
                    {getStatusIcon(job?.status || "")}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Job Status
                    </h2>
                    <p className="text-sm text-gray-300">
                      Current processing state
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-2xl font-bold ${getStatusColor(
                      job?.status || ""
                    )}`}
                  >
                    {job?.status || "Loading..."}
                  </div>
                  <p className="text-sm text-gray-400">
                    {job?.startedAt && new Date(job.startedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => onDownload("csv")}
                  disabled={job?.status !== "completed"}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    <IconDownload className="h-4 w-4" />
                    Download CSV
                  </div>
                </Button>
                <Button
                  onClick={() => onDownload("xlsx")}
                  disabled={job?.status !== "completed"}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center gap-2">
                    <IconFileSpreadsheet className="h-4 w-4" />
                    Download XLSX
                  </div>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-sm text-gray-400 mb-1">Total Rows</p>
              <p className="text-3xl font-bold text-white">
                {job?.totalRows || 0}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-sm text-gray-400 mb-1">Processed</p>
              <p className="text-3xl font-bold text-green-400">
                {job?.processedRows || 0}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-sm text-gray-400 mb-1">Failed</p>
              <p className="text-3xl font-bold text-red-400">
                {job?.failedRows || 0}
              </p>
            </div>
          </div>

          {job?.status === "processing" && (
            <div className="mt-6">
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      ((job?.processedRows || 0) / (job?.totalRows || 1)) * 100
                    }%`,
                  }}
                ></div>
              </div>
              <p className="text-sm text-gray-400 mt-2 text-center">
                Processing...{" "}
                {Math.round(
                  ((job?.processedRows || 0) / (job?.totalRows || 1)) * 100
                )}
                %
              </p>
            </div>
          )}
        </div>

        {/* Rows Table */}
        <div className="space-y-4">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Row Details
                </h2>
                <p className="text-sm text-gray-300">
                  {rows.length} rows processed
                </p>
              </div>
            </div>
          </div>

          <DataTable
            data={rows}
            columns={[
              {
                key: "rowIndex",
                label: "#",
                sortable: true,
                width: "80px",
                render: (value: any) => (
                  <span className="text-white/70 font-mono text-sm">
                    {value}
                  </span>
                ),
              },
              {
                key: "website",
                label: "Website",
                sortable: true,
                render: (value: any) => (
                  <div
                    className="text-white/90 font-medium truncate max-w-[300px]"
                    title={value}
                  >
                    {value}
                  </div>
                ),
              },
              {
                key: "status",
                label: "Status",
                sortable: true,
                width: "120px",
                render: (value: any) => (
                  <div className="flex items-center gap-2">
                    {getStatusIcon(value)}
                    <span className={getStatusColor(value)}>{value}</span>
                  </div>
                ),
              },
              {
                key: "errorMessage",
                label: "Error Message",
                sortable: false,
                render: (value: any) => (
                  <div
                    className="text-red-300 text-xs max-w-[250px] truncate"
                    title={value || "-"}
                  >
                    {value || "-"}
                  </div>
                ),
              },
            ]}
            pageSize={20}
            searchable={true}
            sortable={true}
            emptyMessage="No rows found"
            maxHeight="500px"
          />
        </div>
      </div>
    </div>
  );
}
