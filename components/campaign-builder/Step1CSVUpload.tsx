"use client";

import Papa from "papaparse";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

import { CampaignBuilderState } from "@/app/email/campaigns/builder/page";
import CreatableSelect from "@/components/common/CreatableSelect";
import { Button } from "@/components/ui/button";
import {
  getLeadCategories,
  getLeadTags,
  LeadCategory,
  LeadTag,
} from "@/utils/api/emailClient";
import {
  findDuplicateEmails,
  isValidEmail,
} from "@/utils/validation/emailValidator";

import LeadSelection from "./LeadSelection";

interface Step1Props {
  state: CampaignBuilderState;
  setState: (state: CampaignBuilderState) => void;
  onNext: () => void;
}

interface Lead {
  id: string;
  email: string;
  name?: string;
  customFields?: Record<string, any>;
  campaigns?: Array<{ id: string; name: string }>;
  createdAt: Date;
}

export default function CampaignStep1CSVUpload({
  state,
  setState,
  onNext,
}: Step1Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadMode, setUploadMode] = useState<"csv" | "leads">("csv");
  const [showLeadSelection, setShowLeadSelection] = useState(false);

  // Local cache of normalized rows for re-validating when email column changes
  const [rawRows, setRawRows] = useState<Array<Record<string, any>>>([]);
  const [tagOptions, setTagOptions] = useState<LeadTag[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<LeadCategory[]>([]);

  useEffect(() => {
    // Prefetch existing tags and categories to populate the selectors
    (async () => {
      try {
        const [tags, categories] = await Promise.all([
          getLeadTags(),
          getLeadCategories(),
        ]);
        setTagOptions(tags || []);
        setCategoryOptions(categories || []);
      } catch (e) {
        // Non-blocking
        console.warn("Failed to prefetch tags/categories", e);
      }
    })();
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
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

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    setUploading(true);

    const finalize = (rows: any[]) => {
      // Filter out rows that are completely blank
      const cleanedRows = rows.filter((r) => {
        const vals = Object.values(r || {}).map((v) => String(v ?? "").trim());
        return vals.some((v) => v !== "");
      });

      if (cleanedRows.length === 0) {
        toast.error("File has no valid rows");
        setUploading(false);
        return;
      }

      // Derive columns and drop blank/unnamed headers like __EMPTY or Unnamed: *
      const rawCols = Object.keys(cleanedRows[0] || {});
      const columns = rawCols
        .map((c) => String(c || "").trim())
        .filter((c) => c.length > 0 && !/^(__?empty|empty|unnamed)/i.test(c));

      // Hard limit rows
      if (cleanedRows.length > 5000) {
        toast.error("Maximum 5000 rows allowed");
        setUploading(false);
        return;
      }

      // Helper: infer email column by header name or by scanning values
      const inferEmailColumn = (
        cols: string[],
        rows: Array<Record<string, any>>
      ): string | null => {
        const direct = cols.find((c) => c.toLowerCase() === "email");
        if (direct) return direct;
        let bestCol: string | null = null;
        let bestCount = 0;
        for (const c of cols) {
          let count = 0;
          for (let i = 0; i < Math.min(rows.length, 200); i++) {
            const v = String(rows[i]?.[c] ?? "").trim();
            if (v && isValidEmail(v)) count++;
          }
          if (count > bestCount) {
            bestCount = count;
            bestCol = c;
          }
        }
        return bestCount > 0 ? bestCol : null;
      };

      // Normalize each row: remove blank/unnamed columns and null values
      const normalized = cleanedRows.map((r) => {
        const obj: Record<string, any> = {};
        for (const k of Object.keys(r)) {
          const nk = String(k || "").trim();
          if (nk && !/^(__?empty|empty|unnamed)/i.test(nk)) {
            // Only include non-null, non-undefined, non-empty values
            const val = r[k];
            const strVal = String(val ?? "").trim();
            if (strVal && strVal !== "null" && strVal !== "undefined") {
              obj[nk] = strVal;
            }
          }
        }
        return obj;
      });

      // Store normalized rows for revalidation on manual email column selection
      setRawRows(normalized);

      const inferred = inferEmailColumn(columns, normalized);
      if (!inferred) {
        // No email column could be detected - let the user select manually
        setState({
          ...state,
          csvData: normalized,
          columns,
          emailColumn: "",
        });
        toast.error(
          "We couldn't detect the email column. Please select it below to continue."
        );
        setUploading(false);
        return;
      }

      // Validate with inferred email column
      const emailField = inferred;
      const invalidEmails: Array<{ email: string; index: number }> = [];
      const validatedData: typeof normalized = [];

      normalized.forEach((row, index) => {
        const email = row[emailField];
        if (!email) {
          invalidEmails.push({ email: "EMPTY", index });
          return;
        }

        if (!isValidEmail(email)) {
          invalidEmails.push({ email, index });
          return;
        }

        validatedData.push(row);
      });

      // Check for duplicates within the batch
      const { duplicates } = findDuplicateEmails(validatedData, emailField);

      if (invalidEmails.length > 0) {
        const errorMsg = `Found ${
          invalidEmails.length
        } invalid email(s). First few: ${invalidEmails
          .slice(0, 3)
          .map((e) => `Row ${e.index + 1}: ${e.email}`)
          .join(", ")}`;
        toast.error(errorMsg);
        setUploading(false);
        return;
      }

      if (duplicates.length > 0) {
        const errorMsg = `Found ${
          duplicates.length
        } duplicate email(s) within this batch. First few: ${duplicates
          .slice(0, 3)
          .map((d) => `${d.email} (${d.count} times)`)
          .join(", ")}`;
        toast.error(errorMsg);
        setUploading(false);
        return;
      }

      setState({
        ...state,
        csvData: validatedData,
        columns,
        emailColumn: emailField,
      });

      toast.success(
        `Uploaded ${validatedData.length} valid leads with ${columns.length} columns`
      );
      setUploading(false);
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

  const handleCancel = () => {
    setState({
      ...state,
      csvData: [],
      columns: [],
      emailColumn: "",
      selectedTags: [],
      selectedCategories: [],
    });
  };

  const handleEmailColumnChange = (col: string) => {
    if (!col) {
      setState({ ...state, emailColumn: "" });
      return;
    }
    const invalidEmails: Array<{ email: string; index: number }> = [];
    const validatedData: Array<Record<string, any>> = [];

    rawRows.forEach((row, index) => {
      const email = String(row[col] ?? "").trim();
      if (!email || !isValidEmail(email)) {
        invalidEmails.push({ email: email || "EMPTY", index });
        return;
      }
      validatedData.push(row);
    });

    const { duplicates } = findDuplicateEmails(validatedData, col);
    if (invalidEmails.length > 0) {
      toast.error(
        `Selected column has ${invalidEmails.length} invalid email rows. Please fix your file or choose another column.`
      );
      // Still allow selection, but filtered rows will be used
    }
    if (duplicates.length > 0) {
      toast.error(
        `Found ${duplicates.length} duplicate email(s). Remove duplicates in your file to ensure best results.`
      );
    }

    setState({ ...state, emailColumn: col, csvData: validatedData });
    toast.success(
      `Using "${col}" as email column. ${validatedData.length} valid leads ready.`
    );
  };

  const handleLeadsSelected = (selectedLeads: Lead[]) => {
    // Convert leads to CSV format with custom fields stored in customFields
    const csvData = selectedLeads.map((lead) => {
      const row: Record<string, any> = {
        email: lead.email,
        name: lead.name || "",
      };

      // Add custom fields directly (not prefixed with custom_)
      // Only include user-facing fields, not internal fields like leadId
      if (lead.customFields) {
        Object.entries(lead.customFields).forEach(([key, value]) => {
          row[key] = value || "";
        });
      }

      return row;
    });

    const columns = Object.keys(csvData[0] || {});

    setState({
      ...state,
      csvData,
      columns,
    });

    setShowLeadSelection(false);
    toast.success(`Selected ${selectedLeads.length} leads`);
  };

  if (showLeadSelection) {
    return (
      <LeadSelection
        onLeadsSelected={handleLeadsSelected}
        onCancel={() => setShowLeadSelection(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      {state.csvData.length === 0 && (
        <div className="bg-brand-main/5 backdrop-blur-md border border-brand-main/20 rounded-xl p-6">
          <p className="text-text-100 font-semibold mb-4">
            Choose how to add leads:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setUploadMode("csv")}
              className={`p-4 rounded-lg border-2 transition ${
                uploadMode === "csv"
                  ? "border-brand-main bg-brand-main/10"
                  : "border-brand-main/20 bg-brand-main/5 hover:border-brand-main/30"
              }`}
            >
              <p className="text-text-100 font-semibold">Upload CSV/Excel</p>
              <p className="text-text-200 text-sm mt-1">
                Upload a file with your leads
              </p>
            </button>
            <button
              onClick={() => {
                setUploadMode("leads");
                setShowLeadSelection(true);
              }}
              className={`p-4 rounded-lg border-2 transition ${
                uploadMode === "leads"
                  ? "border-brand-main bg-brand-main/10"
                  : "border-brand-main/20 bg-brand-main/5 hover:border-brand-main/30"
              }`}
            >
              <p className="text-text-100 font-semibold">Select from Leads</p>
              <p className="text-text-200 text-sm mt-1">
                Choose from your existing leads
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {state.csvData.length === 0 && uploadMode === "csv" ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`backdrop-blur-xl border-2 border-dashed rounded-2xl p-12 text-center transition ${
            dragActive
              ? "border-brand-main bg-brand-main/10"
              : "border-brand-main/20 bg-brand-main/5 hover:border-brand-main/30"
          }`}
        >
          <div className="w-16 h-16 bg-brand-main rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-brand-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-text-100 mb-2">
            Upload Your Leads
          </h3>
          <p className="text-text-200 mb-6">
            Drag and drop your CSV or Excel file here, or click to browse
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-brand-main hover:bg-brand-main/90 text-brand-white px-6 py-2 rounded-lg transition"
          >
            {uploading ? "Uploading..." : "Choose File"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) =>
              e.target.files && handleFileUpload(e.target.files[0])
            }
            className="hidden"
          />
          <p className="text-xs text-text-200/60 mt-4">
            Supported formats: CSV, XLSX (Max 50MB, 5000 rows)
          </p>
        </div>
      ) : (
        <>
          {/* Preview */}
          <div className="backdrop-blur-xl bg-brand-main/5 border border-brand-main/20 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-text-100">
                Preview ({state.csvData.length} leads)
              </h3>
              <Button
                onClick={handleCancel}
                className="bg-error/20 hover:bg-error/30 text-error text-xs px-3 py-1 rounded transition"
              >
                Change File
              </Button>
            </div>

            {/* Columns */}
            <div className="mb-4">
              <p className="text-sm text-text-200 mb-2">Columns detected:</p>
              <div className="flex flex-wrap gap-2">
                {state.columns.map((col) => (
                  <span
                    key={col}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      col === state.emailColumn
                        ? "bg-success/20 text-success"
                        : "bg-brand-main/20 text-brand-main"
                    }`}
                  >
                    {col}
                  </span>
                ))}
              </div>
              {/* Email Column + Tagging */}
              <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
                <div className="backdrop-blur-xl bg-brand-main/5 border border-brand-main/20 rounded-2xl p-4">
                  <label className="block text-sm font-medium text-text-200 mb-2">
                    Choose Email Column *
                  </label>
                  <select
                    value={state.emailColumn || ""}
                    onChange={(e) => handleEmailColumnChange(e.target.value)}
                    className="w-full px-3 py-2 bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
                  >
                    <option value="">Select column</option>
                    {state.columns.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-text-200/60 mt-2">
                    Auto-detected: {state.emailColumn || "none"}
                  </p>
                </div>

                <div className="backdrop-blur-xl bg-brand-main/5 border border-brand-main/20 rounded-2xl p-4">
                  <CreatableSelect
                    label="Tags (optional)"
                    options={tagOptions}
                    value={state.selectedTags}
                    onChange={(vals) =>
                      setState({ ...state, selectedTags: vals })
                    }
                    onCreateNew={async (name) => ({
                      id: `new-${Date.now()}`,
                      name,
                    })}
                  />
                </div>

                <div className="backdrop-blur-xl bg-brand-main/5 border border-brand-main/20 rounded-2xl p-4">
                  <CreatableSelect
                    label="Categories (Segmentation)"
                    options={categoryOptions}
                    value={state.selectedCategories}
                    onChange={(vals) =>
                      setState({ ...state, selectedCategories: vals })
                    }
                    onCreateNew={async (name) => ({
                      id: `new-${Date.now()}`,
                      name,
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Data Preview Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-main/10">
                    {state.columns.map((col) => (
                      <th
                        key={col}
                        className="px-4 py-2 text-left text-text-200 font-medium"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {state.csvData.slice(0, 5).map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-brand-main/10 hover:bg-brand-main/5"
                    >
                      {state.columns.map((col) => (
                        <td
                          key={`${idx}-${col}`}
                          className="px-4 py-2 text-text-200 truncate"
                        >
                          {row[col] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {state.csvData.length > 5 && (
              <p className="text-xs text-text-200/60 mt-2">
                Showing 5 of {state.csvData.length} rows
              </p>
            )}
          </div>

          {/* Campaign Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="backdrop-blur-xl bg-brand-main/5 border border-brand-main/20 rounded-2xl p-6">
              <label className="block text-sm font-medium text-text-200 mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                value={state.campaignName}
                onChange={(e) =>
                  setState({ ...state, campaignName: e.target.value })
                }
                placeholder="e.g., Q4 Product Launch"
                className="w-full px-4 py-2 bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200/50 focus:outline-none focus:ring-2 focus:ring-brand-main"
              />
            </div>
            <div className="backdrop-blur-xl bg-brand-main/5 border border-brand-main/20 rounded-2xl p-6">
              <label className="block text-sm font-medium text-text-200 mb-2">
                Description
              </label>
              <input
                type="text"
                value={state.campaignDescription}
                onChange={(e) =>
                  setState({ ...state, campaignDescription: e.target.value })
                }
                placeholder="Campaign description"
                className="w-full px-4 py-2 bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200/50 focus:outline-none focus:ring-2 focus:ring-brand-main"
              />
            </div>
          </div>
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-end gap-4">
        <Button
          onClick={() => window.history.back()}
          className="bg-brand-main/10 hover:bg-brand-main/20 text-brand-main px-6 py-2 rounded-lg transition"
        >
          Cancel
        </Button>
        <Button
          onClick={onNext}
          disabled={
            state.csvData.length === 0 ||
            !state.campaignName ||
            !state.emailColumn
          }
          className="bg-brand-main hover:bg-brand-main/90 disabled:bg-brand-main/50 text-brand-white px-6 py-2 rounded-lg transition"
        >
          Next: Email Template →
        </Button>
      </div>
    </div>
  );
}
