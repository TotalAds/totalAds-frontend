"use client";

import Papa from "papaparse";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import CreatableSelect from "@/components/common/CreatableSelect";
import { Button } from "@/components/ui/button";
import emailClient, {
  checkActiveBulkUploadJobs,
  createBulkUploadJob,
  createLeadCategory,
  createLeadTag,
  createList,
  EmailList,
  getBulkUploadJobStatus,
  getEmailServiceErrorMessage,
  getLeadCategories,
  getLeadTags,
  getLists,
  LeadCategory,
  LeadTag,
} from "@/utils/api/emailClient";
import {
  findDuplicateEmails,
  isValidEmail,
} from "@/utils/validation/emailValidator";
import { IconUpload, IconX } from "@tabler/icons-react";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (jobId?: string, totalRows?: number) => void;
}

export default function BulkUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: BulkUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [rawRows, setRawRows] = useState<Array<Record<string, any>>>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [emailColumn, setEmailColumn] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<LeadTag[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<LeadCategory[]>(
    []
  );
  const [selectedLists, setSelectedLists] = useState<EmailList[]>([]);
  const [tagOptions, setTagOptions] = useState<LeadTag[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<LeadCategory[]>([]);
  const [listOptions, setListOptions] = useState<EmailList[]>([]);
  const [duplicateEmails, setDuplicateEmails] = useState<Set<string>>(
    new Set()
  );
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Function to refresh all options data
  const refreshOptions = async () => {
    setLoadingOptions(true);
    try {
      const [tags, categories, listsData] = await Promise.all([
        getLeadTags(),
        getLeadCategories(),
        getLists(1, 100),
      ]);
      setTagOptions(tags || []);
      setCategoryOptions(categories || []);
      setListOptions(listsData.data.lists || []);
    } catch (e) {
      console.warn("Failed to refresh options:", e);
      toast.error("Failed to refresh options");
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshOptions();

      // Check for active jobs when modal opens (user-specific check from backend)
      checkActiveBulkUploadJobs()
        .then((result) => {
          if (result.hasActiveJobs && result.activeJobs.length > 0) {
            toast.warning(
              `You have ${result.activeJobs.length} bulk upload job${
                result.activeJobs.length > 1 ? "s" : ""
              } in progress. Please wait for them to complete before starting a new upload.`,
              { duration: 6000 }
            );
          }
        })
        .catch((error) => {
          console.error("Failed to check active jobs:", error);
          // Don't block the user if check fails
        });
    }
  }, [isOpen]);

  // Poll job progress
  const pollJobProgress = async (jobId: string, toastId: string) => {
    let pollCount = 0;
    const maxPolls = 300; // Max 10 minutes (300 * 2 seconds)

    const pollInterval = setInterval(async () => {
      pollCount++;

      try {
        const status = await getBulkUploadJobStatus(jobId);
        const progress = status.progress || 0;
        const processedRows = status.processedRows || 0;
        const totalRows = status.totalRows || 0;

        console.log(
          `[Bulk Upload] Job ${jobId} status: ${status.status}, progress: ${progress}%, processed: ${processedRows}/${totalRows}`
        );

        if (status.status === "completed") {
          clearInterval(pollInterval);

          // Remove from active jobs (localStorage is just for UI, backend is source of truth)
          const activeJobs = JSON.parse(
            localStorage.getItem("activeBulkUploadJobs") || "[]"
          );
          const updatedJobs = activeJobs.filter((id: string) => id !== jobId);
          localStorage.setItem(
            "activeBulkUploadJobs",
            JSON.stringify(updatedJobs)
          );

          // Show success with summary
          const stats = status.result?.statistics;
          if (stats) {
            const summary = [
              `${stats.created} created`,
              stats.updated > 0 ? `${stats.updated} updated` : null,
              stats.skipped > 0 ? `${stats.skipped} skipped` : null,
              stats.invalid > 0 ? `${stats.invalid} invalid` : null,
            ]
              .filter(Boolean)
              .join(", ");

            toast.success(`Upload complete! ${summary}`, {
              id: toastId,
              duration: 10000,
            });
          } else {
            toast.success("Upload complete!", {
              id: toastId,
              duration: 5000,
            });
          }

          // Refresh leads list
          onSuccess();
        } else if (status.status === "failed") {
          clearInterval(pollInterval);

          // Remove from active jobs (localStorage is just for UI, backend is source of truth)
          const activeJobs = JSON.parse(
            localStorage.getItem("activeBulkUploadJobs") || "[]"
          );
          const updatedJobs = activeJobs.filter((id: string) => id !== jobId);
          localStorage.setItem(
            "activeBulkUploadJobs",
            JSON.stringify(updatedJobs)
          );

          toast.error(`Upload failed: ${status.error || "Unknown error"}`, {
            id: toastId,
            duration: 10000,
          });
        } else {
          // Update progress - show more detailed info
          const statusText =
            status.status === "pending"
              ? "Queued"
              : status.status === "processing"
              ? "Processing"
              : status.status;

          toast.loading(
            `${statusText}: ${processedRows}/${totalRows} leads (${progress}%)`,
            {
              id: toastId,
              duration: Infinity,
            }
          );
        }
      } catch (error: any) {
        console.error("Failed to poll job status:", error);
        if (error.response?.status === 404) {
          clearInterval(pollInterval);
          toast.error("Job not found", {
            id: toastId,
            duration: 5000,
          });
        } else if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          toast.error(
            "Upload is taking longer than expected. Please check the job status manually.",
            {
              id: toastId,
              duration: 10000,
            }
          );
        }
      }
    }, 5000); // Poll every 2 seconds

    // Cleanup on unmount
    return () => clearInterval(pollInterval);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const isCSV =
      file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv");
    const isExcel =
      file.type === "application/vnd.ms-excel" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.name.toLowerCase().endsWith(".xlsx") ||
      file.name.toLowerCase().endsWith(".xls");

    if (!isCSV && !isExcel) {
      toast.error("Please upload a CSV or Excel file");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    setUploading(true);

    const finalize = (rows: any[]) => {
      const cleanedRows = rows.filter((r) => {
        const values = Object.values(r || {});
        return values.some((v) => String(v || "").trim().length > 0);
      });

      if (cleanedRows.length === 0) {
        toast.error("No valid data found in file");
        setUploading(false);
        return;
      }

      const cols = Object.keys(cleanedRows[0] || {});
      setColumns(cols);
      setRawRows(cleanedRows);

      // Auto-detect email column
      const emailCol = cols.find(
        (c) =>
          c.toLowerCase().includes("email") ||
          c.toLowerCase() === "e-mail" ||
          c.toLowerCase() === "email address"
      );
      if (emailCol) {
        setEmailColumn(emailCol);
      } else if (cols.length > 0) {
        setEmailColumn(cols[0]);
      }

      // Check for duplicates in the file
      const emails = cleanedRows
        .map((r) => {
          const col = emailCol || cols[0];
          return String(r[col] || "")
            .toLowerCase()
            .trim();
        })
        .filter((e) => e && isValidEmail(e));

      const duplicates = findDuplicateEmails(emails);
      setDuplicateEmails(new Set(duplicates.duplicates.map((d) => d.email)));

      setUploading(false);
      toast.success(`Loaded ${cleanedRows.length} rows from file`);
    };

    if (isCSV) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          try {
            finalize(results.data as any[]);
          } catch (e) {
            console.error(e);
            toast.error("Failed to parse CSV file");
            setUploading(false);
          }
        },
        error: (error: any) => {
          console.error("CSV parse error:", error);
          toast.error("Failed to parse CSV file");
          setUploading(false);
        },
      });
    } else if (isExcel) {
      try {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, {
          defval: "",
        });
        finalize(rows);
      } catch (e) {
        console.error("Excel parse error:", e);
        toast.error("Failed to parse Excel file");
        setUploading(false);
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleEmailColumnChange = (col: string) => {
    setEmailColumn(col);
    // Re-check duplicates with new email column
    const emails = rawRows
      .map((r) =>
        String(r[col] || "")
          .toLowerCase()
          .trim()
      )
      .filter((e) => e && isValidEmail(e));
    const duplicates = findDuplicateEmails(emails);
    setDuplicateEmails(new Set(duplicates.duplicates.map((d) => d.email)));
  };

  const handleUpload = async () => {
    if (!emailColumn) {
      toast.error("Please select an email column");
      return;
    }

    if (rawRows.length === 0) {
      toast.error("No data to upload");
      return;
    }

    // Check for active jobs before starting upload (user-specific check from backend)
    try {
      const activeJobsResult = await checkActiveBulkUploadJobs();
      if (
        activeJobsResult.hasActiveJobs &&
        activeJobsResult.activeJobs.length > 0
      ) {
        toast.error(
          `You have ${activeJobsResult.activeJobs.length} bulk upload job${
            activeJobsResult.activeJobs.length > 1 ? "s" : ""
          } in progress. Please wait for them to complete before starting a new upload.`,
          { duration: 6000 }
        );
        return;
      }
    } catch (error: any) {
      console.error("Failed to check active jobs:", error);
      // Continue with upload if check fails (backend will also check)
    }

    // Filter and validate rows - separate valid from invalid
    const validRows: Array<Record<string, any>> = [];
    const invalidRows: Array<{ row: number; email: string }> = [];

    rawRows.forEach((row, index) => {
      const email = String(row[emailColumn] || "")
        .toLowerCase()
        .trim();

      if (!email) {
        invalidRows.push({ row: index + 1, email: "EMPTY" });
        return;
      }

      if (!isValidEmail(email)) {
        invalidRows.push({ row: index + 1, email });
        return;
      }

      validRows.push(row);
    });

    // Check if we have any valid rows to upload
    if (validRows.length === 0) {
      toast.error(
        `No valid emails found. Found ${invalidRows.length} invalid email(s). Please fix them before uploading.`
      );
      return;
    }

    // Calculate duplicates in the file
    const emailMap = new Map<string, number[]>();
    validRows.forEach((row, index) => {
      const email = String(row[emailColumn] || "")
        .toLowerCase()
        .trim();
      if (!emailMap.has(email)) {
        emailMap.set(email, []);
      }
      emailMap.get(email)!.push(index + 1);
    });

    const duplicateEmailsInFile: Array<{ email: string; rows: number[] }> = [];

    emailMap.forEach((rows, email) => {
      if (rows.length > 1) {
        duplicateEmailsInFile.push({ email, rows });
      }
    });

    const duplicateRowCount = duplicateEmailsInFile.reduce(
      (sum, dup) => sum + dup.rows.length - 1,
      0
    );
    const distinctInFile = emailMap.size;

    // Show clear message about duplicates and distinct contacts (aligned with backend)
    if (duplicateRowCount > 0) {
      const sampleDuplicates = duplicateEmailsInFile
        .slice(0, 3)
        .map((d) => d.email)
        .join(", ");
      toast.info(
        `Found ${duplicateRowCount} duplicate row(s) in file (${
          duplicateEmailsInFile.length
        } email(s) appear more than once). Sample: ${sampleDuplicates}${
          duplicateEmailsInFile.length > 3
            ? ` (and ${duplicateEmailsInFile.length - 3} more)`
            : ""
        }. ${distinctInFile} distinct contact(s) will be processed (first row per email kept).`,
        { duration: 8000 }
      );
    } else if (invalidRows.length > 0) {
      toast.warning(
        `Skipping ${invalidRows.length} invalid email(s). ${distinctInFile} contact(s) will be processed.`,
        { duration: 6000 }
      );
    }

    setUploading(true);

    try {
      // Dedupe by email (first occurrence wins) — matches createLeadsFromCSVService / worker
      const seenEmails = new Set<string>();
      const dedupedValidRows = validRows.filter((row) => {
        const email = String(row[emailColumn] || "")
          .toLowerCase()
          .trim();
        if (seenEmails.has(email)) return false;
        seenEmails.add(email);
        return true;
      });

      // Normalize data for API — one row per distinct email
      const csvData = dedupedValidRows.map((row) => {
        const normalized: Record<string, any> = {};
        // Map email column
        normalized.email = String(row[emailColumn] || "")
          .toLowerCase()
          .trim();
        // Include all other columns as custom fields
        Object.keys(row).forEach((key) => {
          if (key !== emailColumn && row[key]) {
            normalized[key] = row[key];
          }
        });
        return normalized;
      });

      // Create bulk upload job (async)
      let job;
      try {
        job = await createBulkUploadJob(csvData, {
          tags: selectedTags.map((t) => t.name),
          categories: selectedCategories.map((c) => c.name),
          listIds: selectedLists.map((l) => l.id),
        });
      } catch (error: any) {
        // Handle conflict error (active job exists)
        if (error.response?.status === 409) {
          const errorData = error.response?.data?.data;
          if (errorData?.activeJobId) {
            toast.error(
              `You already have a bulk upload in progress (${
                errorData.progress || 0
              }% complete). Please wait for it to finish before starting a new upload.`,
              {
                duration: 8000,
              }
            );
            // Optionally, add the existing job to active jobs list
            const activeJobs = JSON.parse(
              localStorage.getItem("activeBulkUploadJobs") || "[]"
            );
            if (!activeJobs.includes(errorData.activeJobId)) {
              activeJobs.push(errorData.activeJobId);
              localStorage.setItem(
                "activeBulkUploadJobs",
                JSON.stringify(activeJobs)
              );
            }
            setUploading(false);
            return;
          }
        }
        // Re-throw other errors
        throw error;
      }

      // Reset form
      setRawRows([]);
      setColumns([]);
      setEmailColumn("");
      setSelectedTags([]);
      setSelectedCategories([]);
      setSelectedLists([]);
      setDuplicateEmails(new Set());

      // Close modal immediately
      onClose();

      // Store job ID in localStorage for progress tracking
      const activeJobs = JSON.parse(
        localStorage.getItem("activeBulkUploadJobs") || "[]"
      );
      activeJobs.push(job.jobId);
      localStorage.setItem("activeBulkUploadJobs", JSON.stringify(activeJobs));

      // Show persistent toast with progress tracking
      const toastId = `bulk-upload-${job.jobId}`;
      toast.loading(`Processing ${job.totalRows} contact(s)... 0%`, {
        id: toastId,
        duration: Infinity, // Keep toast until dismissed or completed
      });

      // Start polling for progress
      pollJobProgress(job.jobId, toastId);

      // Trigger success callback with job info
      onSuccess(job.jobId, job.totalRows);
    } catch (error: any) {
      const errorMsg = getEmailServiceErrorMessage(
        error,
        "Failed to create bulk upload job"
      );
      toast.error(errorMsg, {
        duration: error.response?.status === 403 ? 10000 : 6000,
      });
      console.error("Bulk upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const validRows = rawRows.filter((r) => {
    const email = String(r[emailColumn] || "")
      .toLowerCase()
      .trim();
    return email && isValidEmail(email);
  });

  // Calculate duplicates and unique emails for display
  const emailMap = new Map<string, number[]>();
  validRows.forEach((row, index) => {
    const email = String(row[emailColumn] || "")
      .toLowerCase()
      .trim();
    if (email) {
      if (!emailMap.has(email)) {
        emailMap.set(email, []);
      }
      emailMap.get(email)!.push(index + 1);
    }
  });

  const duplicateEmailsInFile: Array<{
    email: string;
    rows: number[];
    count: number;
  }> = [];

  emailMap.forEach((rows, email) => {
    if (rows.length > 1) {
      duplicateEmailsInFile.push({ email, rows, count: rows.length });
    }
  });

  /** Extra rows after the first occurrence of each email (matches backend batch dedupe). */
  const duplicateCount = duplicateEmailsInFile.reduce(
    (sum, dup) => sum + dup.count - 1,
    0
  );
  /** Distinct valid emails in the file — this is how many leads the upload will create/update. */
  const distinctEmailCount = emailMap.size;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-bg-200 to-bg-300 border border-brand-main/20 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-100">
            Bulk Upload Leads
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-brand-main/10 rounded-lg transition-colors"
          >
            <IconX size={24} className="text-text-200" />
          </button>
        </div>

        {/* File Upload Area */}
        {rawRows.length === 0 ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              dragActive
                ? "border-brand-main bg-brand-main/10"
                : "border-brand-main/30 bg-brand-main/5"
            }`}
          >
            <IconUpload size={48} className="mx-auto mb-4 text-brand-main" />
            <p className="text-text-100 mb-2 font-semibold">
              Drag and drop your CSV or Excel file here
            </p>
            <p className="text-text-200 text-sm mb-4">
              or click to browse (max 50MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-brand-main hover:bg-brand-main/80 text-white"
            >
              Select File
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* File Info */}
            <div className="bg-brand-main/10 border border-brand-main/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-100 font-semibold">
                    {rawRows.length} rows loaded
                  </p>
                  <p className="text-text-200 text-sm">
                    {validRows.length} valid emails
                    {duplicateEmails.size > 0 && (
                      <span className="text-amber-400 ml-2">
                        ({duplicateEmails.size} duplicates in file)
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setRawRows([]);
                    setColumns([]);
                    setEmailColumn("");
                    setDuplicateEmails(new Set());
                  }}
                  className="text-text-200 hover:text-text-100 text-sm"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Upload Summary */}
            {emailColumn && validRows.length > 0 && (
              <div className="bg-bg-200 border border-brand-main/20 rounded-lg p-4 space-y-3">
                <h3 className="text-text-100 font-semibold text-lg">
                  Upload Summary
                </h3>

                <div className="space-y-2">
                  {duplicateCount > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">⚠️</span>
                      <div className="flex-1">
                        <p className="text-text-100 font-medium">
                          Found {duplicateCount} duplicate email(s) in file
                        </p>
                        <p className="text-text-200 text-sm mt-1">
                          {duplicateEmailsInFile.length} unique email(s) have
                          duplicates. Only the first occurrence of each will be
                          inserted.
                        </p>
                        {duplicateEmailsInFile.length > 0 && (
                          <div className="mt-2 text-xs text-text-200 bg-bg-300 rounded p-2 max-h-32 overflow-y-auto">
                            <p className="font-semibold mb-1">
                              Duplicate emails:
                            </p>
                            {duplicateEmailsInFile
                              .slice(0, 5)
                              .map((dup, idx) => (
                                <p key={idx} className="truncate">
                                  • {dup.email} (appears {dup.count} times in
                                  rows: {dup.rows.join(", ")})
                                </p>
                              ))}
                            {duplicateEmailsInFile.length > 5 && (
                              <p className="text-text-200/70 mt-1">
                                ... and {duplicateEmailsInFile.length - 5} more
                                duplicate email(s)
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✅</span>
                    <div className="flex-1">
                      <p className="text-text-100 font-medium">
                        {distinctEmailCount} contact(s) will be processed
                      </p>
                      {duplicateCount > 0 && (
                        <p className="text-text-200 text-sm mt-1">
                          {validRows.length} valid rows in file; {duplicateCount}{" "}
                          duplicate row(s) skipped (first row per email kept) →{" "}
                          {distinctEmailCount} distinct contact(s).
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Email Column Selection */}
            <div>
              <label className="block text-text-100 font-semibold mb-2">
                Select Email Column
              </label>
              <select
                value={emailColumn}
                onChange={(e) => handleEmailColumnChange(e.target.value)}
                className="w-full px-4 py-2 bg-bg-200 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
              >
                {columns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags, Categories, and Lists */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-100 font-semibold mb-2">
                    Tags (optional)
                  </label>
                  <CreatableSelect
                    options={tagOptions}
                    value={selectedTags}
                    onChange={(selected) => {
                      setSelectedTags(selected);
                    }}
                    onCreateNew={async (name: string) => {
                      try {
                        const newTag = await createLeadTag(name);
                        // Refresh all tags to get the latest data
                        await refreshOptions();
                        return newTag;
                      } catch (error: any) {
                        toast.error(
                          error.response?.data?.message ||
                            "Failed to create tag"
                        );
                        throw error;
                      }
                    }}
                    isMulti
                    placeholder="Select or create tags"
                    isLoading={loadingOptions}
                  />
                  <p className="text-xs text-text-200/60 mt-1.5">
                    Label leads for easy filtering
                  </p>
                </div>
                <div>
                  <label className="block text-text-100 font-semibold mb-2">
                    Categories (optional)
                  </label>
                  <CreatableSelect
                    options={categoryOptions}
                    value={selectedCategories}
                    onChange={(selected) => {
                      setSelectedCategories(selected);
                    }}
                    onCreateNew={async (name: string) => {
                      try {
                        const newCategory = await createLeadCategory(name);
                        // Refresh all categories to get the latest data
                        await refreshOptions();
                        return newCategory;
                      } catch (error: any) {
                        toast.error(
                          error.response?.data?.message ||
                            "Failed to create category"
                        );
                        throw error;
                      }
                    }}
                    isMulti
                    placeholder="Select or create categories"
                    isLoading={loadingOptions}
                  />
                  <p className="text-xs text-text-200/60 mt-1.5">
                    Group leads by type or source
                  </p>
                </div>
              </div>

              {/* Lists Section with Enhanced UI */}
              <div className="bg-brand-main/5 border border-brand-main/10 rounded-lg p-4">
                <div className="mb-3">
                  <label className="block text-text-100 font-semibold mb-2">
                    Lists (optional)
                  </label>
                  <CreatableSelect
                    options={listOptions}
                    value={selectedLists}
                    onChange={(selected) => {
                      setSelectedLists(selected as EmailList[]);
                    }}
                    onCreateNew={async (name: string) => {
                      try {
                        const newList = await createList({ name });
                        // Refresh all lists to get the latest data
                        await refreshOptions();
                        toast.success(`List "${name}" created successfully`);
                        return newList;
                      } catch (error: any) {
                        toast.error(
                          error.response?.data?.message ||
                            "Failed to create list"
                        );
                        throw error;
                      }
                    }}
                    isMulti
                    placeholder="Select or create lists"
                    isLoading={loadingOptions}
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-text-100">
                    Why use lists?
                  </p>
                  <ul className="text-xs text-text-200/70 space-y-1 list-disc list-inside">
                    <li>
                      Organize contacts into groups (e.g., "VIP Customers",
                      "Newsletter Subscribers")
                    </li>
                    <li>Quickly select entire lists when creating campaigns</li>
                    <li>Better segmentation for targeted email marketing</li>
                    <li>
                      All uploaded leads will be automatically added to selected
                      lists
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-brand-main/20">
              <Button onClick={onClose} variant="outline" disabled={uploading}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading || distinctEmailCount === 0}
                className="bg-brand-main hover:bg-brand-main/80 text-white"
              >
                {uploading
                  ? "Uploading..."
                  : `Upload ${distinctEmailCount} contact(s)`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
