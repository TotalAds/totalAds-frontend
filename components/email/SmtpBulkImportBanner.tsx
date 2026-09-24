"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  dismissSmtpBulkImportJob,
  downloadSmtpBulkImportInvalidCsv,
  getSmtpBulkImportJobStatus,
  type SmtpBulkImportJobStatus,
} from "@/utils/api/emailClient";
import {
  IconCheck,
  IconDownload,
  IconLoader2,
  IconX,
} from "@tabler/icons-react";

interface SmtpBulkImportBannerProps {
  jobId: string;
  onDismissed: (jobId: string) => void;
  onCompleted?: () => void;
}

export function SmtpBulkImportBanner({
  jobId,
  onDismissed,
  onCompleted,
}: SmtpBulkImportBannerProps) {
  const [jobStatus, setJobStatus] = useState<SmtpBulkImportJobStatus | null>(
    null
  );
  const [isPolling, setIsPolling] = useState(true);
  const [dismissing, setDismissing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!jobId || !isPolling) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const status = await getSmtpBulkImportJobStatus(jobId);
        if (cancelled) return;
        setJobStatus(status);
        if (status.status === "completed" || status.status === "failed") {
          setIsPolling(false);
          if (status.status === "completed") {
            onCompleted?.();
          }
        }
      } catch (error) {
        console.error("Failed to poll SMTP bulk import status:", error);
      }
    };

    void poll();
    const interval = setInterval(() => void poll(), 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [jobId, isPolling, onCompleted]);

  const handleDismiss = async () => {
    try {
      setDismissing(true);
      await dismissSmtpBulkImportJob(jobId);
      onDismissed(jobId);
    } catch (error) {
      console.error("Failed to dismiss SMTP bulk import banner:", error);
    } finally {
      setDismissing(false);
    }
  };

  const handleDownloadInvalid = async () => {
    try {
      setDownloading(true);
      await downloadSmtpBulkImportInvalidCsv(jobId);
    } catch (error) {
      console.error("Failed to download invalid accounts CSV:", error);
    } finally {
      setDownloading(false);
    }
  };

  if (!jobStatus) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <IconLoader2 className="h-5 w-5 animate-spin text-brand-main" />
          Loading SMTP import status…
        </div>
      </div>
    );
  }

  const isCompleted = jobStatus.status === "completed";
  const isFailed = jobStatus.status === "failed";
  const isProcessing =
    jobStatus.status === "processing" || jobStatus.status === "pending";
  const validCount = jobStatus.result?.validCount ?? 0;
  const invalidCount = jobStatus.result?.invalidCount ?? 0;

  return (
    <div
      className={`rounded-lg border p-4 shadow-sm ${
        isCompleted
          ? "border-emerald-200 bg-emerald-50"
          : isFailed
            ? "border-red-200 bg-red-50"
            : "border-sky-200 bg-sky-50"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center gap-3">
            {isCompleted ? (
              <IconCheck className="h-5 w-5 shrink-0 text-emerald-600" />
            ) : isFailed ? (
              <IconX className="h-5 w-5 shrink-0 text-red-600" />
            ) : (
              <IconLoader2 className="h-5 w-5 shrink-0 animate-spin text-sky-600" />
            )}
            <div>
              <h3 className="font-semibold text-slate-900">
                {isCompleted
                  ? "SMTP bulk import complete"
                  : isFailed
                    ? "SMTP bulk import failed"
                    : "Importing SMTP accounts"}
              </h3>
              <p className="text-sm text-slate-600">
                {jobStatus.processedRows} of {jobStatus.totalRows} accounts
                processed
                {isProcessing ? ` · ${jobStatus.progress}%` : ""}
              </p>
            </div>
          </div>

          {isProcessing && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/80">
              <div
                className="h-full bg-sky-500 transition-all duration-300"
                style={{ width: `${jobStatus.progress}%` }}
              />
            </div>
          )}

          {isCompleted && (
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                <span className="font-medium text-emerald-700">
                  {validCount}
                </span>{" "}
                account{validCount === 1 ? "" : "s"} valid and imported.
                {invalidCount > 0 && (
                  <>
                    {" "}
                    <span className="font-medium text-red-700">
                      {invalidCount}
                    </span>{" "}
                    account{invalidCount === 1 ? "" : "s"} invalid and not
                    created.
                  </>
                )}
              </p>
              {invalidCount > 0 && (
                <p className="text-slate-600">
                  Download the invalid accounts CSV for per-row error details.
                  This banner stays until you clear it.
                </p>
              )}
            </div>
          )}

          {isFailed && (
            <p className="text-sm text-red-700">
              {jobStatus.error || "Unknown error occurred"}
            </p>
          )}

          {(isCompleted || isFailed) && (
            <div className="flex flex-wrap gap-2">
              {isCompleted && invalidCount > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleDownloadInvalid()}
                  disabled={downloading}
                >
                  <IconDownload className="mr-1.5 h-4 w-4" />
                  {downloading ? "Downloading…" : "Download invalid CSV"}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleDismiss()}
                disabled={dismissing}
              >
                {dismissing ? "Clearing…" : "Clear"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
