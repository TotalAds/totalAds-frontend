"use client";

import { useEffect, useMemo, useState } from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { toast } from "sonner";

import { LeadRow } from "@/components/leads/LeadsTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getLeadById } from "@/utils/api/emailClient";

interface LeadDetailsModalProps {
  isOpen: boolean;
  lead: LeadRow | null;
  onClose: () => void;
}

function serializeLeadJson(data: unknown): string {
  return JSON.stringify(
    data,
    (_, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    },
    2
  );
}

function buildLeadPayload(
  row: LeadRow,
  fetched: Record<string, unknown> | null
): Record<string, unknown> {
  const verification =
    row.verificationStatus != null || row.isSafeToSend != null
      ? {
          status: row.verificationStatus ?? null,
          isSafeToSend: row.isSafeToSend ?? null,
        }
      : undefined;

  return {
    ...(fetched ?? {}),
    id: row.id,
    email: row.email,
    name: row.name ?? fetched?.name ?? null,
    company: row.company ?? fetched?.company ?? null,
    role: row.role ?? fetched?.role ?? null,
    status: row.status ?? fetched?.status ?? null,
    sendError: row.sendError ?? fetched?.sendError ?? null,
    tags: row.tags ?? fetched?.tags ?? [],
    categories: row.categories ?? [],
    lists: row.lists ?? [],
    campaigns:
      row.campaigns && row.campaigns.length > 0
        ? row.campaigns
        : (fetched?.campaigns ?? []),
    verification,
    verificationStatus: row.verificationStatus ?? fetched?.verificationStatus ?? null,
    isSafeToSend: row.isSafeToSend ?? fetched?.isSafeToSend ?? null,
    customFields: row.customFields ?? fetched?.customFields ?? null,
    enrichedData: row.enrichedData ?? fetched?.enrichedData ?? null,
    createdAt: row.createdAt ?? fetched?.createdAt ?? null,
    updatedAt: row.updatedAt ?? fetched?.updatedAt ?? null,
  };
}

export function LeadDetailsModal({
  isOpen,
  lead,
  onClose,
}: LeadDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !lead) {
      setPayload(null);
      setCopied(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadLead = async () => {
      setLoading(true);
      setPayload(buildLeadPayload(lead, null));

      try {
        const fetched = (await getLeadById(lead.id)) as unknown as Record<
          string,
          unknown
        >;
        if (!cancelled) {
          setPayload(buildLeadPayload(lead, fetched));
        }
      } catch (error) {
        console.error("Failed to load lead details:", error);
        if (!cancelled) {
          setPayload(buildLeadPayload(lead, null));
          toast.error("Showing table data only — full lead record could not be loaded.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadLead();

    return () => {
      cancelled = true;
    };
  }, [isOpen, lead]);

  const jsonText = useMemo(
    () => (payload ? serializeLeadJson(payload) : ""),
    [payload]
  );

  const handleCopy = async () => {
    if (!jsonText) return;
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      toast.success("Lead JSON copied to clipboard");
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy JSON");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden border-slate-200 bg-white p-0">
        <DialogHeader className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Lead data
              </DialogTitle>
              <DialogDescription className="mt-1 truncate text-sm text-slate-500">
                {lead?.email ?? "All available fields for this lead"}
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!jsonText || loading}
              className="shrink-0 border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              {copied ? (
                <>
                  <IconCheck size={16} className="mr-1.5" />
                  Copied
                </>
              ) : (
                <>
                  <IconCopy size={16} className="mr-1.5" />
                  Copy JSON
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(85vh-88px)] overflow-auto bg-slate-950 px-6 py-4">
          {loading && !payload ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-700 border-t-white" />
            </div>
          ) : (
            <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-100">
              {jsonText}
            </pre>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
