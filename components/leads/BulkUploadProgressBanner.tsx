"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  BulkUploadJobStatus,
  getBulkUploadJobStatus,
} from "@/utils/api/emailClient";
import { IconCheck, IconLoader2, IconX } from "@tabler/icons-react";

interface BulkUploadProgressBannerProps {
  jobId: string;
  onComplete: () => void;
  onDismiss: () => void;
}

export default function BulkUploadProgressBanner({
  jobId,
  onComplete,
  onDismiss,
}: BulkUploadProgressBannerProps) {
  const [jobStatus, setJobStatus] = useState<BulkUploadJobStatus | null>(null);
  const onCompleteRef = useRef(onComplete);
  const finishedRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!jobId) return;

    finishedRef.current = false;
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const finish = (status: BulkUploadJobStatus) => {
      if (finishedRef.current || cancelled) return;
      finishedRef.current = true;
      if (intervalId) clearInterval(intervalId);

      const activeJobs = JSON.parse(
        localStorage.getItem("activeBulkUploadJobs") || "[]"
      ) as string[];
      localStorage.setItem(
        "activeBulkUploadJobs",
        JSON.stringify(activeJobs.filter((id) => id !== jobId))
      );

      if (status.status === "completed") {
        const stats = status.result?.statistics;
        if (stats) {
          const summary = [
            `${stats.created} new`,
            stats.updated > 0 ? `${stats.updated} updated` : null,
            stats.skipped > 0 ? `${stats.skipped} skipped` : null,
            stats.invalid > 0 ? `${stats.invalid} invalid` : null,
          ]
            .filter(Boolean)
            .join(", ");
          toast.success(`Upload complete! ${summary}`, { duration: 10000 });
        } else {
          toast.success("Upload complete!", { duration: 5000 });
        }
        onCompleteRef.current();
      } else if (status.status === "failed") {
        toast.error(`Upload failed: ${status.error || "Unknown error"}`, {
          duration: 10000,
        });
        onCompleteRef.current();
      } else {
        onCompleteRef.current();
      }
    };

    const pollOnce = async () => {
      try {
        const status = await getBulkUploadJobStatus(jobId);
        if (cancelled) return;
        setJobStatus(status);

        if (
          status.status === "completed" ||
          status.status === "failed"
        ) {
          finish(status);
        }
      } catch (error: any) {
        console.error("Failed to poll job status:", error);
        if (error.response?.status === 404) {
          finish({
            jobId,
            status: "failed",
            totalRows: 0,
            processedRows: 0,
            progress: 0,
            error: "Job not found",
            createdAt: new Date().toISOString(),
          });
        }
      }
    };

    void pollOnce();
    intervalId = setInterval(() => {
      void pollOnce();
    }, 2000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [jobId]);

  if (!jobStatus) {
    return (
      <div className="bg-brand-main/10 border border-brand-main/30 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <IconLoader2 className="animate-spin text-brand-main" size={20} />
          <span className="text-text-200">Loading job status...</span>
        </div>
      </div>
    );
  }

  const progress = jobStatus.progress || 0;
  const isCompleted = jobStatus.status === "completed";
  const isFailed = jobStatus.status === "failed";
  const isProcessing =
    jobStatus.status === "processing" || jobStatus.status === "pending";

  return (
    <div
      className={`rounded-lg p-4 border ${
        isCompleted
          ? "bg-green-500/10 border-green-500/30"
          : isFailed
          ? "bg-red-500/10 border-red-500/30"
          : "bg-brand-main/10 border-brand-main/30"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            {isCompleted ? (
              <IconCheck className="text-green-400 flex-shrink-0" size={20} />
            ) : isFailed ? (
              <IconX className="text-red-400 flex-shrink-0" size={20} />
            ) : (
              <IconLoader2
                className="animate-spin text-brand-main flex-shrink-0"
                size={20}
              />
            )}
            <div className="flex-1">
              <h3
                className={`font-semibold ${
                  isCompleted
                    ? "text-green-300"
                    : isFailed
                    ? "text-red-300"
                    : "text-text-100"
                }`}
              >
                {isCompleted
                  ? "Upload Complete"
                  : isFailed
                  ? "Upload Failed"
                  : "Processing Bulk Upload"}
              </h3>
              <p className="text-text-200 text-sm">
                Job ID: {jobId} • {jobStatus.totalRows} total rows
              </p>
            </div>
            {(isCompleted || isFailed) && (
              <button
                type="button"
                onClick={onDismiss}
                className="text-text-200 hover:text-text-100 transition-colors flex-shrink-0"
                aria-label="Dismiss"
              >
                <IconX size={18} />
              </button>
            )}
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-200">
                  Processed {jobStatus.processedRows} of {jobStatus.totalRows}{" "}
                  rows
                </span>
                <span className="text-text-100 font-medium">{progress}%</span>
              </div>
              <div className="w-full bg-bg-300 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-brand-main transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {isCompleted && jobStatus.result?.statistics && (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <span className="text-text-200">New:</span>
                  <span className="ml-2 text-green-400 font-medium">
                    {jobStatus.result.statistics.created}
                  </span>
                </div>
                <div>
                  <span className="text-text-200">Updated:</span>
                  <span className="ml-2 text-blue-400 font-medium">
                    {jobStatus.result.statistics.updated}
                  </span>
                </div>
                <div>
                  <span className="text-text-200">Skipped:</span>
                  <span className="ml-2 text-amber-400 font-medium">
                    {jobStatus.result.statistics.skipped}
                  </span>
                </div>
                <div>
                  <span className="text-text-200">Invalid:</span>
                  <span className="ml-2 text-red-400 font-medium">
                    {jobStatus.result.statistics.invalid}
                  </span>
                </div>
              </div>
            </div>
          )}

          {isFailed && (
            <div className="text-sm">
              <p className="text-red-300 font-medium mb-1">Error:</p>
              <p className="text-text-200">
                {jobStatus.error || "Unknown error occurred"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
