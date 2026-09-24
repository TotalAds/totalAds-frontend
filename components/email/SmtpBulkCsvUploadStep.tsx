"use client";

import Papa from "papaparse";
import { useRef, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { MAX_DAILY_EMAIL_CAP, SENDER_PACING_DEFAULTS } from "@/lib/senderPacing";
import { createSmtpBulkImportJob } from "@/utils/api/emailClient";
import { IconDownload, IconUpload } from "@tabler/icons-react";

const SAMPLE_HEADERS = [
  "Email",
  "First Name",
  "Last Name",
  "IMAP Username",
  "IMAP Password",
  "IMAP Host",
  "IMAP Port",
  "SMTP Username",
  "SMTP Password",
  "SMTP Host",
  "SMTP Port",
  "Daily Limit",
] as const;

const SAMPLE_ROW = [
  "you@example.com",
  "Jane",
  "Doe",
  "you@example.com",
  "your-app-password",
  "imap.example.com",
  "993",
  "you@example.com",
  "your-app-password",
  "smtp.example.com",
  "587",
  String(SENDER_PACING_DEFAULTS.campaignDailyLimit),
];

function downloadSampleCsv() {
  const csv = Papa.unparse({
    fields: [...SAMPLE_HEADERS],
    data: [SAMPLE_ROW],
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "smtp-accounts-sample.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[\s_]+/g, " ");
}

const HEADER_MAP: Record<string, string> = {
  email: "email",
  "first name": "firstName",
  firstname: "firstName",
  "last name": "lastName",
  lastname: "lastName",
  "imap username": "imapUsername",
  "imap password": "imapPassword",
  "imap host": "imapHost",
  "imap port": "imapPort",
  "smtp username": "smtpUsername",
  "smtp password": "smtpPassword",
  "smtp host": "smtpHost",
  "smtp port": "smtpPort",
  "daily limit": "dailyLimit",
  dailylimit: "dailyLimit",
  "daily send limit": "dailyLimit",
};

type SmtpBulkCsvUploadStepProps = {
  onBack: () => void;
  onStarted: (jobId: string) => void;
};

export function SmtpBulkCsvUploadStep({
  onBack,
  onStarted,
}: SmtpBulkCsvUploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [uploading, setUploading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setParseError(null);
    setFileName(file.name);
    setRows([]);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setParseError("Please upload a CSV file");
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0 && (!result.data || result.data.length === 0)) {
          setParseError(result.errors[0]?.message || "Failed to parse CSV");
          return;
        }

        const mapped = result.data
          .map((raw) => {
            const out: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(raw)) {
              const mappedKey = HEADER_MAP[normalizeHeader(key)];
              if (!mappedKey) continue;
              out[mappedKey] = typeof value === "string" ? value.trim() : value;
            }
            return out;
          })
          .filter((row) => Object.keys(row).length > 0);

        if (mapped.length === 0) {
          setParseError(
            "No rows found. Use the sample CSV headers (Email, IMAP Host, SMTP Host, …)."
          );
          return;
        }

        setRows(mapped);
      },
      error: (err) => {
        setParseError(err.message || "Failed to parse CSV");
      },
    });
  };

  const handleUpload = async () => {
    if (rows.length === 0) {
      toast.error("Choose a CSV file first");
      return;
    }

    try {
      setUploading(true);
      const job = await createSmtpBulkImportJob(rows);
      toast.success(
        "Import started. We’ll verify each account in the background."
      );
      onStarted(job.id);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to start bulk import";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5 px-6 py-6">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-3 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          ← Back
        </button>
        <h3 className="text-xl font-semibold text-slate-900">
          Bulk Import from CSV
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Download the sample, fill one row per mailbox, then upload. Processing
          continues even if you close this dialog.
        </p>
      </div>

      <ol className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <li>
          <span className="font-semibold text-slate-900">Step 1: Create your file</span>
          <p className="mt-0.5 text-slate-500">
            Download the sample CSV and fill in account details for each row.
          </p>
        </li>
        <li>
          <span className="font-semibold text-slate-900">Step 2: Required fields</span>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-500">
            <li>
              If you use one password or app password, enter it in both IMAP and
              SMTP password columns.
            </li>
            <li>
              Daily Limit is optional (default {SENDER_PACING_DEFAULTS.campaignDailyLimit},
              max {MAX_DAILY_EMAIL_CAP}).
            </li>
            <li>
              Google accounts: create an App Password and use it for both IMAP and
              SMTP.
            </li>
          </ul>
        </li>
        <li>
          <span className="font-semibold text-slate-900">Step 3: Upload</span>
          <p className="mt-0.5 text-slate-500">
            Save as CSV, upload below, then click Upload All. Valid accounts are
            imported; invalid ones appear in a banner with a downloadable error
            list.
          </p>
        </li>
      </ol>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={downloadSampleCsv}>
          <IconDownload className="mr-2 h-4 w-4" />
          Download sample CSV
        </Button>
      </div>

      <div
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center transition hover:border-brand-main/50"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        role="button"
        tabIndex={0}
      >
        <IconUpload className="mb-2 h-8 w-8 text-slate-400" />
        <p className="text-sm font-medium text-slate-800">
          {fileName || "Click to choose a CSV file"}
        </p>
        {rows.length > 0 && (
          <p className="mt-1 text-xs text-emerald-600">
            {rows.length} account{rows.length === 1 ? "" : "s"} ready to import
          </p>
        )}
        {parseError && (
          <p className="mt-2 text-xs text-red-600">{parseError}</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          onClick={() => void handleUpload()}
          disabled={uploading || rows.length === 0}
        >
          {uploading ? "Starting…" : "Upload All"}
        </Button>
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}
