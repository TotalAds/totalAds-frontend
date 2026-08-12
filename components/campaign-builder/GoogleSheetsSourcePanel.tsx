"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FileSpreadsheet, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getEmailServiceErrorMessage,
  patchCampaign,
} from "@/utils/api/emailClient";
import {
  getGoogleSheetsOAuthUrl,
  getGoogleSheetsStatus,
  importCampaignGoogleSheet,
  listGoogleSpreadsheets,
  listGoogleSpreadsheetTabs,
  previewGoogleSheet,
  type GoogleSpreadsheetItem,
  type GoogleSheetTab,
} from "@/utils/api/sheetsClient";
import { formatContinuousSyncInterval } from "@/lib/continuousSyncInterval";

export interface SheetSyncConfigState {
  enabled: boolean;
  connectionId: number;
  spreadsheetId: string;
  spreadsheetName?: string;
  sheetName: string;
  sheetGid?: number;
  columnMap: { email: string; name?: string };
  lastSyncedRow: number;
  lastSyncedAt?: string;
  oneShotImportedAt?: string;
}

interface GoogleSheetsSourcePanelProps {
  campaignId: string;
  domainId: string;
  campaignStatus: string;
  isContinuous: boolean;
  continuousSyncIntervalMinutes?: number;
  value: SheetSyncConfigState | null;
  onChange: (config: SheetSyncConfigState | null) => void;
  onImported?: () => void;
}

export function GoogleSheetsSourcePanel({
  campaignId,
  domainId,
  campaignStatus,
  isContinuous,
  continuousSyncIntervalMinutes,
  value,
  onChange,
  onImported,
}: GoogleSheetsSourcePanelProps) {
  const isDraftCampaign = campaignStatus === "draft";
  const isReadOnly = !isDraftCampaign;
  const [connected, setConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState<GoogleSpreadsheetItem[]>([]);
  const [tabs, setTabs] = useState<GoogleSheetTab[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [spreadsheetId, setSpreadsheetId] = useState(value?.spreadsheetId || "");
  const [spreadsheetName, setSpreadsheetName] = useState(
    value?.spreadsheetName || ""
  );
  const [sheetName, setSheetName] = useState(value?.sheetName || "");
  const [emailCol, setEmailCol] = useState(value?.columnMap?.email || "");
  const [nameCol, setNameCol] = useState(value?.columnMap?.name || "");
  const [connectionId, setConnectionId] = useState(value?.connectionId || 0);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const refreshStatus = async () => {
    setLoading(true);
    try {
      const status = await getGoogleSheetsStatus();
      setConnected(status.connected);
      setGoogleEmail(status.googleEmail || null);
      if (status.connectionId) setConnectionId(status.connectionId);
      if (status.connected) {
        const files = await listGoogleSpreadsheets();
        setSpreadsheets(files);
      }
    } catch (err) {
      toast.error(getEmailServiceErrorMessage(err, "Failed to load Sheets status"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshStatus();
  }, []);

  useEffect(() => {
    setSpreadsheetId(value?.spreadsheetId || "");
    setSpreadsheetName(value?.spreadsheetName || "");
    setSheetName(value?.sheetName || "");
    setEmailCol(value?.columnMap?.email || "");
    setNameCol(value?.columnMap?.name || "");
    if (value?.connectionId) setConnectionId(value.connectionId);
  }, [
    value?.connectionId,
    value?.spreadsheetId,
    value?.spreadsheetName,
    value?.sheetName,
    value?.columnMap?.email,
    value?.columnMap?.name,
  ]);

  useEffect(() => {
    if (!connected || !spreadsheetId) {
      setTabs([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const tabsRes = await listGoogleSpreadsheetTabs(spreadsheetId);
        if (cancelled) return;
        setTabs(tabsRes.tabs);
        if (!spreadsheetName) {
          setSpreadsheetName(tabsRes.spreadsheetName);
        }
      } catch {
        if (!cancelled) setTabs([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [connected, spreadsheetId, spreadsheetName]);

  useEffect(() => {
    if (!connected || !spreadsheetId || !sheetName) {
      setHeaders([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const preview = await previewGoogleSheet({ spreadsheetId, sheetName });
        if (cancelled) return;
        setHeaders(preview.headers);
      } catch {
        if (!cancelled) setHeaders([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [connected, spreadsheetId, sheetName]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const returnPath =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : undefined;
      const { authUrl } = await getGoogleSheetsOAuthUrl(returnPath);
      window.location.href = authUrl;
    } catch (err) {
      toast.error(getEmailServiceErrorMessage(err, "Failed to start Google OAuth"));
      setConnecting(false);
    }
  };

  const handleSelectSpreadsheet = async (id: string) => {
    setSpreadsheetId(id);
    const meta = spreadsheets.find((s) => s.id === id);
    setSpreadsheetName(meta?.name || "");
    setSheetName("");
    setHeaders([]);
    try {
      const tabsRes = await listGoogleSpreadsheetTabs(id);
      setTabs(tabsRes.tabs);
      setSpreadsheetName(tabsRes.spreadsheetName);
    } catch (err) {
      toast.error(getEmailServiceErrorMessage(err, "Failed to load sheet tabs"));
    }
  };

  const handleSelectTab = async (title: string) => {
    setSheetName(title);
    if (!spreadsheetId) return;
    try {
      const preview = await previewGoogleSheet({
        spreadsheetId,
        sheetName: title,
      });
      setHeaders(preview.headers);
      const lower = preview.headers.map((h) => h.toLowerCase());
      const emailGuess =
        preview.headers.find((_, i) => lower[i].includes("email")) ||
        preview.headers[0] ||
        "";
      const nameGuess =
        preview.headers.find((_, i) => lower[i] === "name" || lower[i].includes("name")) ||
        "";
      setEmailCol((prev) => prev || emailGuess);
      setNameCol((prev) => prev || nameGuess);
    } catch (err) {
      toast.error(getEmailServiceErrorMessage(err, "Failed to preview sheet"));
    }
  };

  const buildConfig = (): SheetSyncConfigState | null => {
    if (!connectionId || !spreadsheetId || !sheetName || !emailCol) return null;
    return {
      enabled: true,
      connectionId,
      spreadsheetId,
      spreadsheetName,
      sheetName,
      columnMap: {
        email: emailCol,
        ...(nameCol ? { name: nameCol } : {}),
      },
      lastSyncedRow: value?.lastSyncedRow ?? 1,
      lastSyncedAt: value?.lastSyncedAt,
      oneShotImportedAt: value?.oneShotImportedAt,
    };
  };

  const handleSave = async () => {
    const config = buildConfig();
    if (!config) {
      toast.error("Select a spreadsheet, tab, and email column");
      return;
    }
    setSaving(true);
    try {
      await patchCampaign(domainId, campaignId, { sheetSyncConfig: config });
      onChange(config);
      toast.success(
        isContinuous
          ? `Sheet linked. New rows sync ${formatContinuousSyncInterval(continuousSyncIntervalMinutes).toLowerCase()}.`
          : "Sheet linked. Import once when ready."
      );
    } catch (err) {
      toast.error(getEmailServiceErrorMessage(err, "Failed to save sheet config"));
    } finally {
      setSaving(false);
    }
  };

  const handleUnlinkSheet = async () => {
    setSaving(true);
    try {
      await patchCampaign(domainId, campaignId, { sheetSyncConfig: null });
      onChange(null);
      setSpreadsheetId("");
      setSpreadsheetName("");
      setSheetName("");
      setEmailCol("");
      setNameCol("");
      setHeaders([]);
      setTabs([]);
      toast.success("Sheet link removed");
    } catch (err) {
      toast.error(getEmailServiceErrorMessage(err, "Failed to remove sheet link"));
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async () => {
    if (!value?.enabled) {
      await handleSave();
    }
    setImporting(true);
    try {
      const result = await importCampaignGoogleSheet(campaignId, !isContinuous);
      toast.success(
        `Imported ${result.imported} lead${result.imported === 1 ? "" : "s"} (${result.skipped} skipped)`
      );
      onImported?.();
      void refreshStatus();
    } catch (err) {
      toast.error(getEmailServiceErrorMessage(err, "Sheet import failed"));
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        <RefreshCw className="mr-2 inline h-4 w-4 animate-spin" />
        Loading Google Sheets…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
          <FileSpreadsheet className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-slate-900">Google Sheets</h4>
          <p className="mt-0.5 text-xs text-slate-500">
            {isContinuous
              ? `Pull new rows ${formatContinuousSyncInterval(continuousSyncIntervalMinutes).toLowerCase()} into this continuous campaign.`
              : "Connect a sheet and import leads once (not recurring)."}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {!connected ? (
          <Button
            type="button"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={connecting || isReadOnly}
            onClick={() => void handleConnect()}
          >
            {connecting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Redirecting…
              </>
            ) : (
              "Connect Google Sheets"
            )}
          </Button>
        ) : (
          <>
            {value?.enabled ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                <p className="font-semibold">
                  Sheet connected: {value.spreadsheetName || spreadsheetName || "Spreadsheet"} /{" "}
                  {value.sheetName || sheetName || "Tab"}
                </p>
                <p className="mt-0.5 text-emerald-800/90">
                  {isReadOnly
                    ? "Running campaign: sheet mapping is locked."
                    : "Draft campaign: you can change or remove this sheet link."}
                </p>
              </div>
            ) : null}
            <p className="text-xs text-slate-600">
              Connected as <span className="font-medium">{googleEmail}</span>
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block text-xs font-medium text-slate-700">
                Spreadsheet
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  value={spreadsheetId}
                  disabled={isReadOnly}
                  onChange={(e) => void handleSelectSpreadsheet(e.target.value)}
                >
                  <option value="">Select…</option>
                  {spreadsheets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-slate-700">
                Tab
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  value={sheetName}
                  disabled={!spreadsheetId || isReadOnly}
                  onChange={(e) => void handleSelectTab(e.target.value)}
                >
                  <option value="">Select…</option>
                  {tabs.map((t) => (
                    <option key={t.title} value={t.title}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-slate-700">
                Email column
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  value={emailCol}
                  disabled={!headers.length || isReadOnly}
                  onChange={(e) => setEmailCol(e.target.value)}
                >
                  <option value="">Select…</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-slate-700">
                Name column (optional)
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  value={nameCol}
                  disabled={!headers.length || isReadOnly}
                  onChange={(e) => setNameCol(e.target.value)}
                >
                  <option value="">None</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={saving || isReadOnly}
                onClick={() => void handleSave()}
              >
                {saving ? "Saving…" : "Save sheet link"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={saving || importing || isReadOnly || !value?.enabled}
                onClick={() => void handleUnlinkSheet()}
              >
                Remove sheet link
              </Button>
              <Button
                type="button"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={importing || isReadOnly || (!value?.enabled && !emailCol)}
                onClick={() => void handleImport()}
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Importing…
                  </>
                ) : isContinuous ? (
                  "Sync new rows now"
                ) : (
                  "Import once"
                )}
              </Button>
            </div>
            {isReadOnly && (
              <p className="text-[11px] text-amber-700">
                This campaign is not in draft. Sheet settings are visible but locked.
              </p>
            )}
            {value?.lastSyncedAt && (
              <p className="text-[11px] text-slate-400">
                Last sync {new Date(value.lastSyncedAt).toLocaleString()} · row{" "}
                {value.lastSyncedRow}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
