"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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

type NamedRef = { id?: string; name?: string; color?: string; status?: string; error?: string };

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function displayValue(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => {
        if (item == null) return null;
        if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
          return String(item);
        }
        const rec = asRecord(item);
        if (rec?.name != null) return displayValue(rec.name);
        return null;
      })
      .filter((v): v is string => !!v);
    return parts.length > 0 ? parts.join(", ") : null;
  }
  const rec = asRecord(value);
  if (rec?.name != null) return displayValue(rec.name);
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function namedList(value: unknown): NamedRef[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const rec = asRecord(item);
      if (!rec) return null;
      const name = displayValue(rec.name);
      if (!name) return null;
      return {
        id: rec.id != null ? String(rec.id) : undefined,
        name,
        color: typeof rec.color === "string" ? rec.color : undefined,
        status: displayValue(rec.status) ?? undefined,
        error: displayValue(rec.error) ?? undefined,
      };
    })
    .filter((item): item is NamedRef => !!item);
}

function flattenFields(
  source: Record<string, unknown> | null | undefined,
  skipKeys: Set<string> = new Set()
): Array<{ label: string; value: string }> {
  if (!source) return [];
  const rows: Array<{ label: string; value: string }> = [];
  for (const [key, raw] of Object.entries(source)) {
    if (skipKeys.has(key)) continue;
    const value = displayValue(raw);
    if (!value) continue;
    rows.push({ label: key, value });
  }
  return rows;
}

/** Display-only lead shape — no internal ids, nulls, or organize metadata. */
function buildLeadView(row: LeadRow, fetched: Record<string, unknown> | null) {
  const name = displayValue(row.name ?? fetched?.name);
  const company = displayValue(row.company ?? fetched?.company);
  const role = displayValue(row.role ?? fetched?.role);
  const status = displayValue(row.status ?? fetched?.status);
  const sendError = displayValue(row.sendError ?? fetched?.sendError);
  const verificationStatus = displayValue(
    row.verificationStatus ?? fetched?.verificationStatus
  );
  const isSafeToSend =
    row.isSafeToSend ??
    (typeof fetched?.isSafeToSend === "boolean" ? fetched.isSafeToSend : null);

  const customFields = flattenFields(
    asRecord(row.customFields ?? fetched?.customFields)
  );
  const enrichedData = flattenFields(asRecord(row.enrichedData ?? fetched?.enrichedData), new Set([
    "source",
    "leadhub",
  ]));

  const tags = namedList(row.tags ?? fetched?.tags).map((t) => t.name!);
  const categories = namedList(row.categories ?? fetched?.categories).map(
    (c) => c.name!
  );
  const lists = namedList(row.lists ?? fetched?.lists).map((l) => l.name!);
  const campaigns = namedList(
    row.campaigns && row.campaigns.length > 0
      ? row.campaigns
      : fetched?.campaigns
  ).map((c) => ({
    name: c.name!,
    status: c.status,
    error: c.error,
  }));

  return {
    email: row.email,
    name,
    company,
    role,
    status,
    sendError,
    verificationStatus,
    isSafeToSend,
    customFields,
    enrichedData,
    tags,
    categories,
    lists,
    campaigns,
  };
}

type LeadView = ReturnType<typeof buildLeadView>;

function serializeLeadJson(view: LeadView): string {
  const payload: Record<string, unknown> = {
    email: view.email,
  };
  if (view.name) payload.name = view.name;
  if (view.company) payload.company = view.company;
  if (view.role) payload.role = view.role;
  if (view.status) payload.status = view.status;
  if (view.sendError) payload.sendError = view.sendError;
  if (view.verificationStatus) payload.verificationStatus = view.verificationStatus;
  if (view.isSafeToSend != null) payload.isSafeToSend = view.isSafeToSend;
  if (view.customFields.length > 0) {
    payload.customFields = Object.fromEntries(
      view.customFields.map((f) => [f.label, f.value])
    );
  }
  if (view.enrichedData.length > 0) {
    payload.enrichedData = Object.fromEntries(
      view.enrichedData.map((f) => [f.label, f.value])
    );
  }
  if (view.tags.length > 0) payload.tags = view.tags;
  if (view.categories.length > 0) payload.categories = view.categories;
  if (view.lists.length > 0) payload.lists = view.lists;
  if (view.campaigns.length > 0) {
    payload.campaigns = view.campaigns.map((c) => {
      const item: Record<string, string> = { name: c.name };
      if (c.status) item.status = c.status;
      if (c.error) item.error = c.error;
      return item;
    });
  }
  return JSON.stringify(payload, null, 2);
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 border-b border-slate-100 py-2.5 last:border-b-0 sm:grid-cols-[180px_1fr]">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="break-words text-sm text-slate-900">{value}</dd>
    </div>
  );
}

function ChipList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function LeadDetailsModal({
  isOpen,
  lead,
  onClose,
}: LeadDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<LeadView | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !lead) {
      setView(null);
      setCopied(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadLead = async () => {
      setLoading(true);
      setView(buildLeadView(lead, null));

      try {
        const fetched = (await getLeadById(lead.id)) as unknown as Record<
          string,
          unknown
        >;
        if (!cancelled) {
          setView(buildLeadView(lead, fetched));
        }
      } catch (error) {
        console.error("Failed to load lead details:", error);
        if (!cancelled) {
          setView(buildLeadView(lead, null));
          toast.error(
            "Showing table data only — full lead record could not be loaded."
          );
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

  const jsonText = useMemo(() => (view ? serializeLeadJson(view) : ""), [view]);

  const handleCopy = async () => {
    if (!jsonText) return;
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      toast.success("Lead data copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy");
    }
  };

  const coreFields = useMemo(() => {
    if (!view) return [];
    const rows: Array<{ label: string; value: string }> = [
      { label: "Email", value: view.email },
    ];
    if (view.name) rows.push({ label: "Name", value: view.name });
    if (view.company) rows.push({ label: "Company", value: view.company });
    if (view.role) rows.push({ label: "Role", value: view.role });
    if (view.status) rows.push({ label: "Status", value: view.status });
    if (view.verificationStatus) {
      rows.push({ label: "Verification", value: view.verificationStatus });
    }
    if (view.isSafeToSend != null) {
      rows.push({
        label: "Safe to send",
        value: view.isSafeToSend ? "Yes" : "No",
      });
    }
    if (view.sendError) rows.push({ label: "Send error", value: view.sendError });
    return rows;
  }, [view]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden border-slate-200 bg-slate-50 p-0">
        <DialogHeader className="border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Lead data
              </DialogTitle>
              <DialogDescription className="mt-1 truncate text-sm text-slate-500">
                {lead?.email ?? "Lead details"}
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
                  Copy
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(85vh-88px)] space-y-3 overflow-auto px-6 py-4">
          {loading && !view ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
            </div>
          ) : view ? (
            <>
              <Section title="Contact">
                <dl>
                  {coreFields.map((field) => (
                    <FieldRow
                      key={field.label}
                      label={field.label}
                      value={field.value}
                    />
                  ))}
                </dl>
              </Section>

              {view.customFields.length > 0 && (
                <Section title="Custom fields">
                  <dl>
                    {view.customFields.map((field) => (
                      <FieldRow
                        key={field.label}
                        label={field.label}
                        value={field.value}
                      />
                    ))}
                  </dl>
                </Section>
              )}

              {view.enrichedData.length > 0 && (
                <Section title="Enriched data">
                  <dl>
                    {view.enrichedData.map((field) => (
                      <FieldRow
                        key={field.label}
                        label={field.label}
                        value={field.value}
                      />
                    ))}
                  </dl>
                </Section>
              )}

              {(view.tags.length > 0 ||
                view.categories.length > 0 ||
                view.lists.length > 0) && (
                <Section title="Organization">
                  <div className="space-y-3">
                    {view.tags.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                          Tags
                        </p>
                        <ChipList items={view.tags} />
                      </div>
                    )}
                    {view.categories.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                          Categories
                        </p>
                        <ChipList items={view.categories} />
                      </div>
                    )}
                    {view.lists.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                          Lists
                        </p>
                        <ChipList items={view.lists} />
                      </div>
                    )}
                  </div>
                </Section>
              )}

              {view.campaigns.length > 0 && (
                <Section title="Campaigns">
                  <ul className="space-y-2">
                    {view.campaigns.map((campaign) => (
                      <li
                        key={`${campaign.name}-${campaign.status ?? ""}`}
                        className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">
                            {campaign.name}
                          </span>
                          {campaign.status && (
                            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                              {campaign.status}
                            </span>
                          )}
                        </div>
                        {campaign.error && (
                          <p className="mt-1 text-xs text-slate-500">
                            {campaign.error}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">
              No lead selected.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
