"use client";

import { useEffect, useState } from "react";
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
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    if (!jobId || !isPolling) return;

    const pollInterval = setInterval(async () => {
      try {
        const status = await getBulkUploadJobStatus(jobId);
        setJobStatus(status);

        if (status.status === "completed") {
          setIsPolling(false);
          clearInterval(pollInterval);
          onComplete();
        } else if (status.status === "failed") {
          setIsPolling(false);
          clearInterval(pollInterval);
        }
      } catch (error: any) {
        console.error("Failed to poll job status:", error);
        if (error.response?.status === 404) {
          setIsPolling(false);
          clearInterval(pollInterval);
        }
      }
    }, 2000); // Poll every 2 seconds

    // Initial fetch
    getBulkUploadJobStatus(jobId)
      .then(setJobStatus)
      .catch((error) => {
        console.error("Failed to fetch initial job status:", error);
      });

    return () => clearInterval(pollInterval);
  }, [jobId, isPolling, onComplete]);

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
          {/* Header */}
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
          </div>

          {/* Progress Bar */}
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

          {/* Results Summary */}
          {isCompleted && jobStatus.result?.statistics && (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <span className="text-text-200">Created:</span>
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

          {/* Error Display */}
          {isFailed && (
            <div className="text-sm">
              <p className="text-red-300 font-medium mb-1">Error:</p>
              <p className="text-text-200">
                {jobStatus.error || "Unknown error occurred"}
              </p>
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        {/* <button
          onClick={onDismiss}
          className="text-text-200 hover:text-text-100 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <IconX size={18} />
        </button> */}
      </div>
    </div>
  );
}




