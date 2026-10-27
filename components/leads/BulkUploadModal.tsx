"use client";

import Papa from "papaparse";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import CreatableSelect from "@/components/common/CreatableSelect";
import { Button } from "@/components/ui/button";
import { BodyPortal } from "@/components/ui/BodyPortal";
import emailClient, {
  checkActiveBulkUploadJobs,
  checkExistingLeadEmails,
  ContactMetrics,
  createBulkUploadJob,
  createLeadCategory,
  createLeadTag,
  createList,
  EmailList,
  getContactMetrics,
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
  const uploadInFlightRef = useRef(false);
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
  const [contactMetrics, setContactMetrics] = useState<ContactMetrics | null>(
    null
  );
  const [existingEmailSet, setExistingEmailSet] = useState<Set<string>>(
    new Set()
  );
  const [checkingExisting, setCheckingExisting] = useState(false);

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

      getContactMetrics()
        .then((metrics) => setContactMetrics(metrics))
        .catch((error) => {
          console.warn("Failed to load contact slots:", error);
        });
    } else {
      setExistingEmailSet(new Set());
      setCheckingExisting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !emailColumn || rawRows.length === 0) {
      setExistingEmailSet(new Set());
      setCheckingExisting(false);
      return;
    }

    const emails = [
      ...new Set(
        rawRows
          .map((row) =>
            String(row[emailColumn] || "")
              .toLowerCase()
              .trim()
          )
          .filter((email) => email && isValidEmail(email))
      ),
    ];

    if (emails.length === 0) {
      setExistingEmailSet(new Set());
      setCheckingExisting(false);
      return;
    }

    let cancelled = false;
    setCheckingExisting(true);
    const timer = window.setTimeout(() => {
      checkExistingLeadEmails(emails)
        .then((result) => {
          if (cancelled) return;
          setExistingEmailSet(new Set(result.existing));
        })
        .catch((error) => {
          if (cancelled) return;
          console.warn("Failed to check existing emails:", error);
          setExistingEmailSet(new Set());
        })
        .finally(() => {
          if (!cancelled) setCheckingExisting(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isOpen, emailColumn, rawRows]);

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

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File size must be less than 20MB");
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
    if (uploadInFlightRef.current || uploading) return;

    if (!emailColumn) {
      toast.error("Please select an email column");
      return;
    }

    if (rawRows.length === 0) {
      toast.error("No data to upload");
      return;
    }

    uploadInFlightRef.current = true;
    setUploading(true);

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
        uploadInFlightRef.current = false;
        setUploading(false);
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
      uploadInFlightRef.current = false;
      setUploading(false);
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
    const distinctEmailsForUpload = [...emailMap.keys()];
    const updateCountForUpload = distinctEmailsForUpload.filter((email) =>
      existingEmailSet.has(email)
    ).length;
    const newCountForUpload = Math.max(
      0,
      distinctInFile - updateCountForUpload
    );
    const remainingSlots =
      typeof contactMetrics?.contacts?.remaining === "number"
        ? Math.max(0, contactMetrics.contacts.remaining)
        : null;
    if (remainingSlots !== null && newCountForUpload > remainingSlots) {
      toast.error(
        `Your plan allows ${remainingSlots} more new contact(s). This file needs ${newCountForUpload} new slot(s) (${updateCountForUpload} existing lead(s) will only be updated).`,
        { duration: 9000 }
      );
      uploadInFlightRef.current = false;
      setUploading(false);
      return;
    }

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
        }. ${distinctInFile} distinct contact(s) will be processed (${newCountForUpload} new, ${updateCountForUpload} updated).`,
        { duration: 8000 }
      );
    } else if (invalidRows.length > 0) {
      toast.warning(
        `Skipping ${invalidRows.length} invalid email(s). ${newCountForUpload} new and ${updateCountForUpload} updated contact(s) will be processed.`,
        { duration: 6000 }
      );
    } else if (updateCountForUpload > 0 || newCountForUpload > 0) {
      toast.info(
        `Processing ${newCountForUpload} new lead${newCountForUpload !== 1 ? "s" : ""} and updating ${updateCountForUpload} existing lead${updateCountForUpload !== 1 ? "s" : ""}.`,
        { duration: 5000 }
      );
    }

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

      // Create bulk upload job (chunked async upload) — only once per click
      let job;
      try {
        const uploadToastId = toast.loading(
          `Uploading ${csvData.length.toLocaleString()} lead${csvData.length !== 1 ? "s" : ""}…`
        );
        job = await createBulkUploadJob(
          csvData,
          {
            tagIds: selectedTags.map((t) => String(t.id)),
            categoryIds: selectedCategories.map((c) => String(c.id)),
            listIds: selectedLists
              .map((l) => String(l.id))
              .filter((id) => id.length > 0 && id !== "undefined" && id !== "null"),
          },
          ({ phase, uploadedRows, totalRows }) => {
            if (phase === "uploading") {
              toast.loading(
                `Uploading leads… ${uploadedRows.toLocaleString()} / ${totalRows.toLocaleString()}`,
                { id: uploadToastId }
              );
            } else if (phase === "complete") {
              toast.loading("Queuing import…", { id: uploadToastId });
            }
          }
        );
        toast.success(
          `Queued ${job.totalRows.toLocaleString()} lead${job.totalRows !== 1 ? "s" : ""} for import`,
          { id: uploadToastId, duration: 4000 }
        );
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
            const activeJobs = JSON.parse(
              localStorage.getItem("activeBulkUploadJobs") || "[]"
            ) as string[];
            if (!activeJobs.includes(String(errorData.activeJobId))) {
              activeJobs.push(String(errorData.activeJobId));
              localStorage.setItem(
                "activeBulkUploadJobs",
                JSON.stringify(activeJobs)
              );
            }
            onSuccess(
              String(errorData.activeJobId),
              Number(errorData.totalRows) || 0
            );
            return;
          }
        }
        if (error.response?.status === 413) {
          toast.error(
            "Upload too large for the server gateway. Please try again — large files are sent in chunks automatically.",
            { duration: 8000 }
          );
          return;
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
      setExistingEmailSet(new Set());

      // Close modal immediately
      onClose();

      // Store job ID once for progress tracking (banner is the only poller)
      const activeJobs = JSON.parse(
        localStorage.getItem("activeBulkUploadJobs") || "[]"
      ) as string[];
      if (!activeJobs.includes(job.jobId)) {
        activeJobs.push(job.jobId);
        localStorage.setItem(
          "activeBulkUploadJobs",
          JSON.stringify(activeJobs)
        );
      }

      // Hand off to the page banner — do not start a second status poller here
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
      uploadInFlightRef.current = false;
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
  const distinctEmails = [...emailMap.keys()];
  const updateCount = distinctEmails.filter((email) =>
    existingEmailSet.has(email)
  ).length;
  const newCount = Math.max(0, distinctEmailCount - updateCount);
  const invalidRowCount = Math.max(0, rawRows.length - validRows.length);
  const remainingSlots =
    typeof contactMetrics?.contacts?.remaining === "number"
      ? Math.max(0, contactMetrics.contacts.remaining)
      : null;
  // Only brand-new emails consume contact slots; updates do not.
  const exceedsContactSlots =
    remainingSlots !== null && newCount > remainingSlots;

  return (
    <BodyPortal>
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
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
              or click to browse (max 20MB)
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
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-text-100 font-semibold">
                    {rawRows.length} rows loaded
                  </p>
                  <p className="text-text-200 text-sm">
                    {validRows.length} valid email
                    {validRows.length !== 1 ? "s" : ""}
                    {invalidRowCount > 0 && (
                      <span className="text-rose-400 ml-2">
                        · {invalidRowCount} invalid
                      </span>
                    )}
                    {duplicateEmails.size > 0 && (
                      <span className="text-amber-400 ml-2">
                        · {duplicateEmails.size} duplicate
                        {duplicateEmails.size !== 1 ? "s" : ""} in file
                      </span>
                    )}
                  </p>
                  {emailColumn && distinctEmailCount > 0 && (
                    <p className="mt-1 text-sm text-text-100">
                      {checkingExisting ? (
                        <span className="text-text-200">
                          Checking existing leads…
                        </span>
                      ) : (
                        <>
                          <span className="font-semibold text-emerald-600">
                            {newCount} new
                          </span>
                          <span className="text-text-200"> · </span>
                          <span className="font-semibold text-sky-600">
                            {updateCount} will be updated
                          </span>
                        </>
                      )}
                    </p>
                  )}
                  {emailColumn && validRows.length === 0 && (
                    <p className="mt-1 text-sm text-rose-500">
                      No valid emails found in the selected email column.
                      Choose the correct column below.
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setRawRows([]);
                    setColumns([]);
                    setEmailColumn("");
                    setDuplicateEmails(new Set());
                    setExistingEmailSet(new Set());
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
                  {remainingSlots !== null && (
                    <div
                      className={`rounded-md px-3 py-2 text-sm ${
                        exceedsContactSlots
                          ? "bg-red-500/15 border border-red-500/30 text-red-300"
                          : "bg-green-500/10 border border-green-500/30 text-green-300"
                      }`}
                    >
                      Available contact slots:{" "}
                      <span className="font-semibold">{remainingSlots}</span>
                      <span>
                        {" "}
                        · {newCount} new lead{newCount !== 1 ? "s" : ""} need a
                        slot
                        {updateCount > 0
                          ? ` · ${updateCount} update${updateCount !== 1 ? "s" : ""} do not`
                          : ""}
                      </span>
                      {exceedsContactSlots && (
                        <span>
                          {" "}
                          · Remove {newCount - remainingSlots} new contact
                          {newCount - remainingSlots !== 1 ? "s" : ""} to
                          continue.
                        </span>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                        New leads
                      </p>
                      <p className="text-lg font-semibold text-emerald-900">
                        {checkingExisting ? "…" : newCount}
                      </p>
                      <p className="text-xs text-emerald-700/80">
                        Will be added to your lead list
                      </p>
                    </div>
                    <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-sky-700">
                        Existing leads
                      </p>
                      <p className="text-lg font-semibold text-sky-900">
                        {checkingExisting ? "…" : updateCount}
                      </p>
                      <p className="text-xs text-sky-700/80">
                        Will be updated with new columns/details
                      </p>
                    </div>
                  </div>

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
                          created or updated.
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
                        {distinctEmailCount} contact
                        {distinctEmailCount !== 1 ? "s" : ""} will be processed
                        {!checkingExisting && (
                          <>
                            {" "}
                            (
                            <span className="text-emerald-600">
                              {newCount} new
                            </span>
                            ,{" "}
                            <span className="text-sky-600">
                              {updateCount} updated
                            </span>
                            )
                          </>
                        )}
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
                disabled={
                  uploading ||
                  checkingExisting ||
                  distinctEmailCount === 0 ||
                  exceedsContactSlots
                }
                className="bg-brand-main hover:bg-brand-main/80 text-white"
              >
                {uploading
                  ? "Uploading..."
                  : checkingExisting
                    ? "Checking existing leads..."
                    : updateCount > 0 && newCount > 0
                      ? `Add ${newCount} new · update ${updateCount}`
                      : updateCount > 0
                        ? `Update ${updateCount} lead${updateCount !== 1 ? "s" : ""}`
                        : `Upload ${newCount} new lead${newCount !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
    </BodyPortal>
  );
}
