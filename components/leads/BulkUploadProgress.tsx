"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { getBulkUploadJobStatus, BulkUploadJobStatus } from "@/utils/api/emailClient";
import { IconCheck, IconX, IconLoader2 } from "@tabler/icons-react";

interface BulkUploadProgressProps {
  jobId: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

export default function BulkUploadProgress({
  jobId,
  onComplete,
  onError,
}: BulkUploadProgressProps) {
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
          onError(status.error || "Upload failed");
        }
      } catch (error: any) {
        console.error("Failed to poll job status:", error);
        // Continue polling on error, but show warning
        if (error.response?.status === 404) {
          setIsPolling(false);
          clearInterval(pollInterval);
          onError("Job not found");
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
  }, [jobId, isPolling, onComplete, onError]);

  if (!jobStatus) {
    return (
      <div className="flex items-center justify-center p-8">
        <IconLoader2 className="animate-spin text-brand-main" size={24} />
        <span className="ml-2 text-text-200">Loading job status...</span>
      </div>
    );
  }

  const progress = jobStatus.progress || 0;
  const isCompleted = jobStatus.status === "completed";
  const isFailed = jobStatus.status === "failed";
  const isProcessing = jobStatus.status === "processing" || jobStatus.status === "pending";

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-text-100 font-semibold">
            {isCompleted
              ? "Upload Complete"
              : isFailed
              ? "Upload Failed"
              : "Processing Upload"}
          </span>
          <span className="text-text-200 text-sm">{progress}%</span>
        </div>
        <div className="w-full bg-bg-300 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isCompleted
                ? "bg-green-500"
                : isFailed
                ? "bg-red-500"
                : "bg-brand-main"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-sm text-text-200">
          <span>
            Processed {jobStatus.processedRows} of {jobStatus.totalRows} rows
          </span>
          {isProcessing && (
            <span className="flex items-center gap-1">
              <IconLoader2 className="animate-spin" size={14} />
              Processing...
            </span>
          )}
        </div>
      </div>

      {/* Results Summary */}
      {isCompleted && jobStatus.result?.statistics && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <IconCheck className="text-green-400" size={20} />
            <h3 className="text-green-300 font-semibold">Upload Summary</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-text-200">Total Rows:</span>
              <span className="ml-2 text-text-100 font-medium">
                {jobStatus.result.statistics.total}
              </span>
            </div>
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
            <div>
              <span className="text-text-200">Duplicates (File):</span>
              <span className="ml-2 text-amber-400 font-medium">
                {jobStatus.result.statistics.duplicatesInBatch}
              </span>
            </div>
            <div>
              <span className="text-text-200">Duplicates (DB):</span>
              <span className="ml-2 text-amber-400 font-medium">
                {jobStatus.result.statistics.duplicatesInDatabase}
              </span>
            </div>
          </div>
          {jobStatus.result.statistics.invalidEmails.length > 0 && (
            <div className="mt-3 pt-3 border-t border-green-500/20">
              <p className="text-xs text-text-200 mb-2">
                Sample Invalid Emails ({jobStatus.result.statistics.invalidEmails.length} total):
              </p>
              <div className="text-xs text-text-300 bg-bg-300 rounded p-2 max-h-24 overflow-y-auto">
                {jobStatus.result.statistics.invalidEmails.slice(0, 5).join(", ")}
                {jobStatus.result.statistics.invalidEmails.length > 5 && "..."}
              </div>
            </div>
          )}
          {jobStatus.result.statistics.duplicateEmails.length > 0 && (
            <div className="mt-3 pt-3 border-t border-green-500/20">
              <p className="text-xs text-text-200 mb-2">
                Sample Duplicate Emails ({jobStatus.result.statistics.duplicateEmails.length} total):
              </p>
              <div className="text-xs text-text-300 bg-bg-300 rounded p-2 max-h-24 overflow-y-auto">
                {jobStatus.result.statistics.duplicateEmails.slice(0, 5).join(", ")}
                {jobStatus.result.statistics.duplicateEmails.length > 5 && "..."}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {isFailed && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <IconX className="text-red-400" size={20} />
            <h3 className="text-red-300 font-semibold">Upload Failed</h3>
          </div>
          <p className="text-text-200 text-sm">{jobStatus.error || "Unknown error occurred"}</p>
          {jobStatus.errorDetails && (
            <details className="mt-2">
              <summary className="text-xs text-text-300 cursor-pointer">
                View error details
              </summary>
              <pre className="mt-2 text-xs text-text-300 bg-bg-300 rounded p-2 overflow-auto">
                {JSON.stringify(jobStatus.errorDetails, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}



