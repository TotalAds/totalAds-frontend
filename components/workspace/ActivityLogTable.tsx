"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import DataTable, { Column } from "@/components/ui/DataTable";
import { useWorkspace } from "@/context/WorkspaceContext";
import { AuditLogEntry, getAuditLogs } from "@/utils/api/workspaceClient";
import { formatApiDate } from "@/utils/formatDate";
import { IconRefresh } from "@tabler/icons-react";

const ACTION_LABELS: Record<string, string> = {
  "workspace.created": "Workspace created",
  "workspace.renamed": "Workspace renamed",
  "workspace.deleted": "Workspace deleted",
  "member.invited": "Member invited",
  "member.removed": "Member removed",
  "member.role_changed": "Role changed",
  "member.invite_accepted": "Invite accepted",
  "campaign.created": "Campaign created",
  "campaign.updated": "Campaign updated",
  "campaign.deleted": "Campaign deleted",
  "campaign.sent": "Campaign sent",
  "lead.created": "Lead created",
  "lead.updated": "Lead updated",
  "lead.deleted": "Lead deleted",
  "domain.created": "Domain created",
  "domain.updated": "Domain updated",
  "domain.deleted": "Domain deleted",
  "billing.subscription_updated": "Subscription updated",
};

const ACTION_COLORS: Record<string, string> = {
  "workspace.created": "bg-emerald-100 text-emerald-800",
  "workspace.deleted": "bg-red-100 text-red-800",
  "member.invited": "bg-violet-100 text-violet-800",
  "member.removed": "bg-red-100 text-red-800",
  "member.role_changed": "bg-amber-100 text-amber-800",
  "member.invite_accepted": "bg-emerald-100 text-emerald-800",
  "campaign.sent": "bg-blue-100 text-blue-800",
  "billing.subscription_updated": "bg-indigo-100 text-indigo-800",
};

function formatAction(action: string) {
  return ACTION_LABELS[action] || action.replace(/\./g, " · ");
}

function actionBadgeClass(action: string) {
  return ACTION_COLORS[action] ?? "bg-slate-100 text-slate-700";
}

export default function ActivityLogTable() {
  const { activeWorkspace } = useWorkspace();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const data = await getAuditLogs(activeWorkspace.id, { limit: 100 });
      setLogs(data);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!activeWorkspace) return null;

  const columns: Column<AuditLogEntry>[] = [
    {
      key: "createdAt",
      label: "When",
      sortable: true,
      width: "180px",
      render: (v: unknown) => (
        <span className="text-slate-600">
          {formatApiDate(v, "MMM d, yyyy · h:mm a")}
        </span>
      ),
    },
    {
      key: "action",
      label: "Action",
      render: (v: unknown) => (
        <span
          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${actionBadgeClass(String(v))}`}
        >
          {formatAction(String(v))}
        </span>
      ),
    },
    {
      key: "actorName",
      label: "User",
      render: (_: unknown, row: AuditLogEntry) => (
        <span className="text-slate-800">
          {row.actorName || row.actorEmail || "System"}
        </span>
      ),
    },
    {
      key: "resourceType",
      label: "Details",
      render: (_: unknown, row: AuditLogEntry) => {
        const meta = row.metadata as Record<string, unknown> | null;
        const extra =
          meta?.email != null
            ? String(meta.email)
            : meta?.name != null
              ? String(meta.name)
              : null;
        const resource = row.resourceType
          ? `${row.resourceType}${row.resourceId ? ` #${row.resourceId}` : ""}`
          : null;
        return (
          <span className="text-slate-600">
            {[extra, resource].filter(Boolean).join(" · ") || "—"}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Activity log</h2>
          <p className="mt-1 text-sm text-slate-600">
            Recent actions in{" "}
            <span className="font-medium">{activeWorkspace.name}</span>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void load()}
          disabled={loading}
          className="gap-2 border-slate-200 text-slate-700"
        >
          <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <DataTable
        data={logs}
        columns={columns}
        loading={loading}
        searchable
        emptyMessage="No activity recorded yet. Actions like invites, campaigns, and billing changes will appear here."
        maxHeight="560px"
      />
    </div>
  );
}
