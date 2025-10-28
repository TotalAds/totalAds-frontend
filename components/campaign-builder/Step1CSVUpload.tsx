"use client";

import Papa from "papaparse";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

import { CampaignBuilderState } from "@/app/email/campaigns/builder/page";
import { Button } from "@/components/ui/button";
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

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

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

      // Derive columns and drop blank/unnamed headers
      const rawCols = Object.keys(cleanedRows[0] || {});
      const columns = rawCols.filter((c) => String(c || "").trim().length > 0);

      // Ensure email column exists (case-insensitive)
      const hasEmail = columns.some((col) => col.toLowerCase() === "email");
      if (!hasEmail) {
        toast.error("File must contain an 'email' column");
        setUploading(false);
        return;
      }

      // Hard limit rows
      if (cleanedRows.length > 5000) {
        toast.error("Maximum 5000 rows allowed");
        setUploading(false);
        return;
      }

      // Normalize each row: remove blank/unnamed columns and null values
      const normalized = cleanedRows.map((r) => {
        const obj: Record<string, any> = {};
        for (const k of Object.keys(r)) {
          const nk = String(k || "").trim();
          if (nk) {
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

      // Validate emails
      const emailField =
        columns.find((col) => col.toLowerCase() === "email") || "email";
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
    });
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
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
          <p className="text-white font-semibold mb-4">
            Choose how to add leads:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setUploadMode("csv")}
              className={`p-4 rounded-lg border-2 transition ${
                uploadMode === "csv"
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-white/20 bg-white/5 hover:border-white/30"
              }`}
            >
              <p className="text-white font-semibold">Upload CSV/Excel</p>
              <p className="text-gray-400 text-sm mt-1">
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
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-white/20 bg-white/5 hover:border-white/30"
              }`}
            >
              <p className="text-white font-semibold">Select from Leads</p>
              <p className="text-gray-400 text-sm mt-1">
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
              ? "border-purple-500 bg-purple-500/10"
              : "border-white/20 bg-white/5 hover:border-white/30"
          }`}
        >
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
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
          <h3 className="text-xl font-semibold text-white mb-2">
            Upload Your Leads
          </h3>
          <p className="text-gray-400 mb-6">
            Drag and drop your CSV or Excel file here, or click to browse
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition"
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
          <p className="text-xs text-gray-500 mt-4">
            Supported formats: CSV, XLSX (Max 50MB, 5000 rows)
          </p>
        </div>
      ) : (
        <>
          {/* Preview */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                Preview ({state.csvData.length} leads)
              </h3>
              <Button
                onClick={handleCancel}
                className="bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs px-3 py-1 rounded transition"
              >
                Change File
              </Button>
            </div>

            {/* Columns */}
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Columns detected:</p>
              <div className="flex flex-wrap gap-2">
                {state.columns.map((col) => (
                  <span
                    key={col}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      col.toLowerCase() === "email"
                        ? "bg-green-500/20 text-green-300"
                        : "bg-blue-500/20 text-blue-300"
                    }`}
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>

            {/* Data Preview Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {state.columns.map((col) => (
                      <th
                        key={col}
                        className="px-4 py-2 text-left text-gray-300 font-medium"
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
                      className="border-b border-white/10 hover:bg-white/5"
                    >
                      {state.columns.map((col) => (
                        <td
                          key={`${idx}-${col}`}
                          className="px-4 py-2 text-gray-300 truncate"
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
              <p className="text-xs text-gray-400 mt-2">
                Showing 5 of {state.csvData.length} rows
              </p>
            )}
          </div>

          {/* Campaign Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                value={state.campaignName}
                onChange={(e) =>
                  setState({ ...state, campaignName: e.target.value })
                }
                placeholder="e.g., Q4 Product Launch"
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={state.campaignDescription}
                onChange={(e) =>
                  setState({ ...state, campaignDescription: e.target.value })
                }
                placeholder="Campaign description"
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-end gap-4">
        <Button
          onClick={() => window.history.back()}
          className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition"
        >
          Cancel
        </Button>
        <Button
          onClick={onNext}
          disabled={state.csvData.length === 0 || !state.campaignName}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-6 py-2 rounded-lg transition"
        >
          Next: Email Template →
        </Button>
      </div>
    </div>
  );
}
