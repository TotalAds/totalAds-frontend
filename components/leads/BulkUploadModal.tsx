"use client";

import Papa from "papaparse";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import CreatableSelect from "@/components/common/CreatableSelect";
import { Button } from "@/components/ui/button";
import emailClient, {
  createLeadCategory,
  createLeadTag,
  getLeadCategories,
  getLeadTags,
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
  onSuccess: () => void;
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
  const [tagOptions, setTagOptions] = useState<LeadTag[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<LeadCategory[]>([]);
  const [duplicateEmails, setDuplicateEmails] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (isOpen) {
      (async () => {
        try {
          const [tags, categories] = await Promise.all([
            getLeadTags(),
            getLeadCategories(),
          ]);
          setTagOptions(tags || []);
          setCategoryOptions(categories || []);
        } catch (e) {
          console.warn("Failed to prefetch tags/categories", e);
        }
      })();
    }
  }, [isOpen]);

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
    const uniqueEmails: string[] = [];

    emailMap.forEach((rows, email) => {
      if (rows.length > 1) {
        duplicateEmailsInFile.push({ email, rows });
      } else {
        uniqueEmails.push(email);
      }
    });

    const duplicateCount = duplicateEmailsInFile.reduce(
      (sum, dup) => sum + dup.rows.length - 1,
      0
    );
    const uniqueCount = uniqueEmails.length;

    // Show clear message about duplicates and unique emails
    if (duplicateCount > 0) {
      const sampleDuplicates = duplicateEmailsInFile
        .slice(0, 3)
        .map((d) => d.email)
        .join(", ");
      toast.info(
        `Found ${duplicateCount} duplicate email(s) in file (${duplicateEmailsInFile.length} unique emails have duplicates). Sample: ${sampleDuplicates}${
          duplicateEmailsInFile.length > 3
            ? ` (and ${duplicateEmailsInFile.length - 3} more)`
            : ""
        }. ${uniqueCount} unique email(s) will be inserted.`,
        { duration: 8000 }
      );
    } else if (invalidRows.length > 0) {
      toast.warning(
        `Skipping ${invalidRows.length} invalid email(s). ${uniqueCount} unique email(s) will be inserted.`,
        { duration: 6000 }
      );
    }

    setUploading(true);
    const toastId = toast.loading("Uploading leads...");

    try {
      // Normalize data for API - only use valid rows
      const csvData = validRows.map((row) => {
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

      // Call API to create leads
      const response = await emailClient.post("/api/leads/bulk-upload", {
        csvData,
        tags: selectedTags.map((t) => t.name),
        categories: selectedCategories.map((c) => c.name),
      });

      toast.dismiss(toastId);

      const stats = response.data?.data?.statistics;
      if (stats) {
        // Build detailed success message
        const parts: string[] = [];
        if (stats.created > 0) {
          parts.push(`${stats.created} created`);
        }
        if (stats.updated > 0) {
          parts.push(`${stats.updated} updated`);
        }
        if (stats.skipped > 0) {
          parts.push(`${stats.skipped} skipped`);
        }
        if (stats.invalid > 0) {
          parts.push(`${stats.invalid} invalid`);
        }

        const mainMessage =
          parts.length > 0
            ? `Upload complete: ${parts.join(", ")}`
            : `Successfully processed ${stats.total} leads`;

        toast.success(mainMessage, {
          duration: 8000,
        });

        // Show detailed breakdown if there are issues
        if (stats.skipped > 0 || stats.invalid > 0) {
          const details: string[] = [];

          if (stats.duplicatesInBatch > 0) {
            details.push(`${stats.duplicatesInBatch} duplicate(s) in file`);
          }
          if (stats.duplicatesInDatabase > 0) {
            details.push(
              `${stats.duplicatesInDatabase} already exist in database`
            );
          }
          if (stats.invalid > 0) {
            details.push(`${stats.invalid} invalid email(s)`);
          }

          if (details.length > 0) {
            setTimeout(() => {
              toast.info(
                `Details: ${details.join("; ")}${
                  stats.duplicateEmails.length > 0
                    ? `. Sample duplicates: ${stats.duplicateEmails
                        .slice(0, 3)
                        .join(", ")}${
                        stats.duplicateEmails.length > 3
                          ? ` (and ${stats.duplicateEmails.length - 3} more)`
                          : ""
                      }`
                    : ""
                }${
                  stats.invalidEmails.length > 0
                    ? `. Sample invalid: ${stats.invalidEmails
                        .slice(0, 3)
                        .join(", ")}${
                        stats.invalidEmails.length > 3
                          ? ` (and ${stats.invalidEmails.length - 3} more)`
                          : ""
                      }`
                    : ""
                }`,
                { duration: 10000 }
              );
            }, 1000);
          }
        }
      } else {
        toast.success(
          `Successfully uploaded ${response.data?.data?.count || 0} leads`
        );
      }

      // Reset form
      setRawRows([]);
      setColumns([]);
      setEmailColumn("");
      setSelectedTags([]);
      setSelectedCategories([]);
      setDuplicateEmails(new Set());

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.dismiss(toastId);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to upload leads";
      toast.error(errorMsg);
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

  const duplicateEmailsInFile: Array<{ email: string; rows: number[]; count: number }> = [];
  const uniqueEmails: string[] = [];

  emailMap.forEach((rows, email) => {
    if (rows.length > 1) {
      duplicateEmailsInFile.push({ email, rows, count: rows.length });
    } else {
      uniqueEmails.push(email);
    }
  });

  const duplicateCount = duplicateEmailsInFile.reduce(
    (sum, dup) => sum + dup.count - 1,
    0
  );
  const uniqueCount = uniqueEmails.length;

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
                          {duplicateEmailsInFile.length} unique email(s) have duplicates. 
                          Only the first occurrence of each will be inserted.
                        </p>
                        {duplicateEmailsInFile.length > 0 && (
                          <div className="mt-2 text-xs text-text-200 bg-bg-300 rounded p-2 max-h-32 overflow-y-auto">
                            <p className="font-semibold mb-1">Duplicate emails:</p>
                            {duplicateEmailsInFile.slice(0, 5).map((dup, idx) => (
                              <p key={idx} className="truncate">
                                • {dup.email} (appears {dup.count} times in rows: {dup.rows.join(", ")})
                              </p>
                            ))}
                            {duplicateEmailsInFile.length > 5 && (
                              <p className="text-text-200/70 mt-1">
                                ... and {duplicateEmailsInFile.length - 5} more duplicate email(s)
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
                        {uniqueCount} unique email(s) will be inserted
                      </p>
                      {duplicateCount > 0 && (
                        <p className="text-text-200 text-sm mt-1">
                          ({validRows.length} total valid rows - {duplicateCount} duplicates removed = {uniqueCount} unique)
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

            {/* Tags and Categories */}
            <div className="grid grid-cols-2 gap-4">
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
                    const newTag = await createLeadTag(name);
                    setTagOptions((prev) => [...prev, newTag]);
                    return newTag;
                  }}
                  isMulti
                  placeholder="Select or create tags"
                />
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
                    const newCategory = await createLeadCategory(name);
                    setCategoryOptions((prev) => [...prev, newCategory]);
                    return newCategory;
                  }}
                  isMulti
                  placeholder="Select or create categories"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-brand-main/20">
              <Button onClick={onClose} variant="outline" disabled={uploading}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading || validRows.length === 0}
                className="bg-brand-main hover:bg-brand-main/80 text-white"
              >
                {uploading
                  ? "Uploading..."
                  : `Upload ${validRows.length} Leads`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
