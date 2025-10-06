"use client";

import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DataTable from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { useAuthContext } from '@/context/AuthContext';
import { getCreditBalance, getCreditPricing } from '@/utils/api/creditsClient';
import { getICPProfiles, ICPProfile } from '@/utils/api/icpClient';
import { createSheetJob, createUploadJob, getActiveJob } from '@/utils/api/leadEnhancementClient';
import { IconHistory, IconUpload } from '@tabler/icons-react';

const MAX_FILE_MB = 50;

const urlLike = (v: string) => {
  if (!v) return false;
  const s = String(v).trim();
  const re = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/.*)?$/i;
  return (
    re.test(s) ||
    s.startsWith("www.") ||
    s.includes(".com") ||
    s.includes(".io")
  );
};

const normalizeUrl = (raw: string): string | null => {
  try {
    let s = String(raw).trim();
    if (!s) return null;
    if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
    const u = new URL(s);
    u.hash = "";
    u.search = "";
    u.pathname = u.pathname.replace(/\/$/, "");
    return u.toString();
  } catch {
    return null;
  }
};

export default function LeadEnhancementContainer() {
  const router = useRouter();
  const { state: authState } = useAuthContext();
  const { isAuthenticated, isLoading: authLoading } = authState;

  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [websiteColumn, setWebsiteColumn] = useState<string>("");
  const [icpProfiles, setIcpProfiles] = useState<ICPProfile[]>([]);
  const [icpProfileId, setIcpProfileId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [activeJob, setActiveJob] = useState<any>(null);
  const [creditsOk, setCreditsOk] = useState(true);
  const [estCredits, setEstCredits] = useState<number>(0);
  const [sheetUrl, setSheetUrl] = useState<string>("");
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  const [showGoogleSheets, setShowGoogleSheets] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      setShowAuthWarning(true);
    } else {
      setShowAuthWarning(false);
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // Poll active job status periodically so the banner stays fresh
  useEffect(() => {
    let t: any;
    const poll = async () => {
      try {
        const act = await getActiveJob().catch(() => ({ job: null }));
        setActiveJob(act.job);
      } catch (e) {
        // silent
      }
    };
    if (isAuthenticated) {
      poll();
      t = setInterval(poll, 4000);
    }
    return () => t && clearInterval(t);
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      setLoadingProfiles(true);
      const [p, act] = await Promise.all([
        getICPProfiles("active", 1, 100),
        getActiveJob().catch(() => ({ job: null })),
      ]);
      setIcpProfiles(p.profiles || []);
      setActiveJob(act.job);
    } catch (e) {
      console.error("Failed to fetch data:", e);
      toast.error("Failed to load profiles. Please refresh the page.");
    } finally {
      setLoadingProfiles(false);
    }
  };

  const detectWebsiteColumn = (cols: string[], data: Record<string, any>[]) => {
    let best = "";
    let bestScore = -1;
    cols.forEach((c) => {
      let score = 0;
      for (let i = 0; i < Math.min(25, data.length); i++) {
        if (urlLike(String(data[i]?.[c] ?? ""))) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    });
    return best;
  };

  const getExportUrl = (url: string) => {
    try {
      const u = new URL(url);
      const m = u.pathname.match(/\/spreadsheets\/d\/([^/]+)/);
      const spreadsheetId = m?.[1];
      const gidMatch = u.hash.match(/gid=(\d+)/);
      const gid = gidMatch?.[1];
      if (!spreadsheetId) return null;
      const params = new URLSearchParams();
      params.set("format", "csv");
      if (gid) params.set("gid", gid);
      return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?${params.toString()}`;
    } catch {
      return null;
    }
  };

  const loadSheet = async () => {
    if (!sheetUrl) {
      toast.error("Please paste a public Google Sheet link first");
      return;
    }

    const exportUrl = getExportUrl(sheetUrl);
    if (!exportUrl) {
      toast.error("Invalid Google Sheet link");
      return;
    }

    try {
      toast.loading("Loading sheet data...", { id: "load-sheet" });
      const res = await axios.get(exportUrl, { responseType: "text" });
      const csv = String(res.data || "");
      const wb = XLSX.read(csv, { type: "string" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { defval: "" }) as any[];
      const cols = Object.keys(data[0] || {});

      if (!cols.length) {
        toast.error("No data found in sheet (first worksheet)", {
          id: "load-sheet",
        });
        return;
      }

      setFile(null);
      setRows(data);
      setColumns(cols);
      setWebsiteColumn(detectWebsiteColumn(cols, data));
      toast.success(`Loaded ${data.length} rows from sheet`, {
        id: "load-sheet",
      });
    } catch (e: any) {
      console.error("Failed to load sheet:", e);
      toast.error(
        e?.message || "Failed to load sheet. Ensure it is publicly accessible",
        { id: "load-sheet" }
      );
    }
  };

  const onFile = async (f: File) => {
    if (!f) return;

    const mb = f.size / (1024 * 1024);
    if (mb > MAX_FILE_MB) {
      toast.error(`File too large. Maximum size is ${MAX_FILE_MB}MB`);
      return;
    }

    const name = f.name.toLowerCase();
    if (
      !name.endsWith(".csv") &&
      !name.endsWith(".xlsx") &&
      !name.endsWith(".xls")
    ) {
      toast.error("Unsupported file type. Please use .csv, .xlsx, or .xls");
      return;
    }

    setFile(f);
    toast.loading("Parsing file...", { id: "parse-file" });

    try {
      if (name.endsWith(".csv")) {
        Papa.parse(f, {
          header: true,
          complete: (res) => {
            const data = (res.data as any[]).filter(Boolean);
            const cols = res.meta.fields || Object.keys(data[0] || {});
            setRows(data);
            setColumns(cols);
            setWebsiteColumn(detectWebsiteColumn(cols, data));
            toast.success(`Loaded ${data.length} rows from CSV`, {
              id: "parse-file",
            });
          },
          error: (err) => {
            console.error("CSV parse error:", err);
            toast.error("Failed to parse CSV file", { id: "parse-file" });
          },
        });
      } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        const buf = await f.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" }) as any[];
        const cols = Object.keys(data[0] || {});
        setRows(data);
        setColumns(cols);
        setWebsiteColumn(detectWebsiteColumn(cols, data));
        toast.success(`Loaded ${data.length} rows from Excel`, {
          id: "parse-file",
        });
      }
    } catch (e: any) {
      console.error("File parse error:", e);
      toast.error(e?.message || "Failed to parse file", { id: "parse-file" });
    }
  };

  const uniqueWebsites = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const raw = r[websiteColumn];
      const n = normalizeUrl(String(raw || ""));
      if (n) set.add(n);
    });
    return Array.from(set);
  }, [rows, websiteColumn]);

  useEffect(() => {
    const calc = async () => {
      try {
        const [bal, pricing] = await Promise.all([
          getCreditBalance().catch(() => null),
          getCreditPricing().catch(() => null),
        ]);
        const per =
          pricing?.aiScrapingCredits ?? pricing?.normalScrapingCredits ?? 1;
        const est = uniqueWebsites.length * per;
        setEstCredits(est);
        if (bal?.currentBalance != null)
          setCreditsOk(bal.currentBalance >= est);
      } catch (e) {
        console.error(e);
      }
    };
    if (uniqueWebsites.length) calc();
  }, [uniqueWebsites.length]);

  const usingSheet = !file && sheetUrl && rows.length > 0;
  const canSubmit =
    (file != null || usingSheet) &&
    websiteColumn &&
    icpProfileId &&
    (!activeJob ||
      ["completed", "failed", "cancelled"].includes(activeJob.status)) &&
    creditsOk;

  const onSubmit = async () => {
    // Check authentication
    if (!isAuthenticated) {
      router.push("/login?redirect=/lead-enhancement");
      return;
    }

    if (!file && !usingSheet) {
      toast.error("Please select a file or load a Google Sheet first");
      return;
    }

    if (!websiteColumn) {
      toast.error("Please select the website column");
      return;
    }

    if (!icpProfileId) {
      toast.error("Please select an ICP profile");
      return;
    }

    try {
      setLoading(true);
      toast.loading("Creating enhancement job...", { id: "create-job" });

      if (file) {
        const res = await createUploadJob({
          file,
          icpProfileId,
          websiteColumn,
        });
        if (res?.jobId) {
          toast.success("Job created successfully!", { id: "create-job" });
          router.push(`/lead-enhancement/jobs/${res.jobId}`);
        }
      } else if (usingSheet) {
        const res = await createSheetJob({
          sheetUrl,
          icpProfileId,
          websiteColumn,
        });
        if (res?.jobId) {
          toast.success("Job created successfully!", { id: "create-job" });
          router.push(`/lead-enhancement/jobs/${res.jobId}`);
        }
      }
    } catch (e: any) {
      console.error("Failed to create job:", e);
      const errorMsg = e?.message || "Failed to create enhancement job";
      toast.error(errorMsg, { id: "create-job" });

      // Handle specific error cases
      if (errorMsg.toLowerCase().includes("credit")) {
        toast.error("Insufficient credits. Please add credits to continue.", {
          duration: 6000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Lead Enhancement
            </h1>
            <p className="text-gray-300">
              Bulk enrich your leads with comprehensive business intelligence
            </p>
          </div>

          <Link
            href="/lead-enhancement/history"
            className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 border border-white/20 hover:border-white/30 backdrop-blur-sm"
          >
            <IconHistory className="h-5 w-5 mr-2" />
            View History
          </Link>
        </div>

        {/* Authentication Warning */}
        {showAuthWarning && (
          <div
            className="backdrop-blur-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-200 px-6 py-4 rounded-2xl mb-8 shadow-2xl"
            role="alert"
          >
            <div className="flex items-start">
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center mr-4 mt-0.5">
                <span className="text-white text-sm font-bold">!</span>
              </div>
              <div>
                <p className="font-bold text-lg mb-2">
                  Authentication Required
                </p>
                <p className="text-yellow-100">
                  You need to be logged in to use Lead Enhancement features.
                  Please
                  <button
                    onClick={() =>
                      router.push("/login?redirect=/lead-enhancement")
                    }
                    className="font-bold underline ml-1 hover:text-white transition-colors"
                  >
                    login
                  </button>{" "}
                  or
                  <button
                    onClick={() =>
                      router.push("/signup?redirect=/lead-enhancement")
                    }
                    className="font-bold underline ml-1 hover:text-white transition-colors"
                  >
                    create an account
                  </button>
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Active Job Warning */}
        {activeJob &&
          !["completed", "failed", "cancelled"].includes(activeJob.status) && (
            <div
              className="backdrop-blur-xl bg-blue-500/20 border border-blue-500/30 text-blue-200 px-6 py-4 rounded-2xl mb-8 shadow-2xl"
              role="alert"
            >
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-4 mt-0.5">
                  <span className="text-white text-sm font-bold">ℹ</span>
                </div>
                <div>
                  <p className="font-bold text-lg mb-2">Active Job Running</p>
                  <p className="text-blue-100">
                    You have an active enhancement job. Please wait for it to
                    complete before starting a new one.
                    <button
                      onClick={() =>
                        router.push(`/lead-enhancement/jobs/${activeJob.id}`)
                      }
                      className="font-bold underline ml-1 hover:text-white transition-colors"
                    >
                      View job
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Upload Section */}
        <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl mb-8">
          <CardHeader className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <IconUpload className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-white">
                  Upload Data Source
                </CardTitle>
                <CardDescription className="text-sm text-gray-300">
                  Choose your lead data file or connect to Google Sheets
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* File Upload */}
              <div className="space-y-3">
                <Label className="text-white font-medium flex items-center gap-2">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Upload File
                </Label>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => e.target.files && onFile(e.target.files[0])}
                  className=" file:bg-gradient-to-r file:from-purple-500 file:to-pink-500 file:text-white file:border-0 file:rounded-lg file:px-4 file:py-0.5 file:mr-4 hover:from-purple-500/20 hover:to-pink-500/20 focus:border-purple-400 transition-all duration-200"
                />
                <p className="text-xs text-gray-400">
                  Supports CSV, XLSX, XLS files up to {MAX_FILE_MB}MB
                </p>
              </div>

              {/* Google Sheets Toggle */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowGoogleSheets(!showGoogleSheets)}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <svg
                        className="h-5 w-5 text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h3 className="text-white font-medium">
                        Connect Google Sheets
                      </h3>
                      <p className="text-sm text-gray-400">
                        Load data directly from a public Google Sheet
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {showGoogleSheets ? "Hide" : "Show"}
                    </span>
                    <svg
                      className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                        showGoogleSheets ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {showGoogleSheets && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4">
                    <div className="flex gap-3 flex-1 ">
                      <Input
                        placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                        value={sheetUrl}
                        onChange={(e) => setSheetUrl(e.target.value)}
                        containerClass="flex-1"
                      />
                      <Button
                        onClick={loadSheet}
                        disabled={!sheetUrl}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          Load Sheet
                        </div>
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Sheet must be publicly viewable. No Google API required.
                    </p>
                  </div>
                )}
              </div>

              {/* File Status */}
              {(file || (sheetUrl && rows.length > 0)) && (
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <svg
                        className="h-4 w-4 text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <span className="text-green-300 font-medium">
                        {file
                          ? `File loaded: ${file.name}`
                          : "Google Sheet loaded"}
                      </span>
                      <span className="text-green-400 text-sm ml-2">
                        ({rows.length} rows)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configuration Section */}
        <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl mb-8">
          <CardHeader className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-white">
                  Configure Enhancement
                </CardTitle>
                <CardDescription className="text-sm text-gray-300">
                  Set up your lead enrichment parameters
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ICP Profile */}
              <div className="space-y-3">
                <Label className="text-white font-medium flex items-center gap-2">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  ICP Profile
                </Label>
                <Select
                  value={icpProfileId}
                  onValueChange={setIcpProfileId}
                  disabled={loadingProfiles}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an ICP profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {icpProfiles.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {icpProfiles.length === 0 && !loadingProfiles && (
                  <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <p className="text-xs text-yellow-300">
                      No ICP profiles found.{" "}
                      <Link
                        href="/icp-profiles"
                        className="underline hover:text-yellow-200 font-medium"
                      >
                        Create one
                      </Link>
                    </p>
                  </div>
                )}
              </div>

              {/* Website Column */}
              <div className="space-y-3">
                <Label className="text-white font-medium flex items-center gap-2">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9"
                    />
                  </svg>
                  Website Column
                </Label>
                <Select
                  value={websiteColumn}
                  onValueChange={setWebsiteColumn}
                  disabled={columns.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">
                  Auto-detected from your data
                </p>
              </div>

              {/* Unique Websites Stats */}
              <div className="space-y-3">
                <Label className="text-white font-medium flex items-center gap-2">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Unique Websites
                </Label>
                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-lg p-4">
                  <div className="text-3xl font-bold text-white mb-1">
                    {uniqueWebsites.length}
                  </div>
                  <p className="text-xs text-gray-400">
                    Duplicates will reuse results
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credits and Action Section */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl mb-8">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              {/* Credits Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/20">
                    <svg
                      className="h-6 w-6 text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Estimated Credits</p>
                    <p className="text-2xl font-bold text-white">
                      {estCredits}
                    </p>
                  </div>
                  {!creditsOk && (
                    <div className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-300 font-medium">
                        Insufficient credits
                      </p>
                    </div>
                  )}
                </div>

                {activeJob && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-blue-300 font-medium">
                          Active job: {activeJob.status}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          router.push(`/lead-enhancement/jobs/${activeJob.id}`)
                        }
                        className="text-blue-200 hover:text-white underline"
                      >
                        View job
                      </button>
                    </div>
                    {typeof activeJob.processedRows === "number" &&
                      typeof activeJob.totalRows === "number" && (
                        <div className="mt-3">
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${
                                  (activeJob.totalRows
                                    ? activeJob.processedRows /
                                      activeJob.totalRows
                                    : 0) * 100
                                }%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-blue-200 mt-1">
                            {activeJob.processedRows}/{activeJob.totalRows}{" "}
                            processed
                          </p>
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={onSubmit}
                  disabled={!canSubmit || loading}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating Job...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Start Enhancement
                    </div>
                  )}
                </Button>

                {!creditsOk && (
                  <Button
                    onClick={() => router.push("/billing")}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-3 rounded-xl transition-all duration-200 font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      Add Credits
                    </div>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Data Preview Section */}
        {rows.length > 0 && (
          <div className="space-y-4">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-lg">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Data Preview
                  </h3>
                  <p className="text-sm text-gray-300">
                    {rows.length} total rows loaded
                  </p>
                </div>
              </div>
            </div>

            <DataTable
              data={rows}
              columns={columns.map((col) => ({
                key: col,
                label: col,
                sortable: true,
                render: (value: any) => (
                  <div
                    className="truncate max-w-[200px]"
                    title={String(value ?? "")}
                  >
                    {String(value ?? "")}
                  </div>
                ),
              }))}
              pageSize={10}
              searchable={true}
              sortable={true}
              emptyMessage="No data available"
              maxHeight="400px"
            />
          </div>
        )}
      </div>
    </div>
  );
}
