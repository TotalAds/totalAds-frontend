"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable, { Column } from "@/components/ui/DataTable";
import InviteMemberDialog from "@/components/workspace/InviteMemberDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  getWorkspaceMembers,
  removeWorkspaceMember,
  updateMemberRole,
  WorkspaceInvite,
  WorkspaceMember,
  WorkspaceRole,
} from "@/utils/api/workspaceClient";
import { formatApiDate } from "@/utils/formatDate";
import { IconMail, IconUserPlus } from "@tabler/icons-react";

const ROLE_STYLES: Record<WorkspaceRole, string> = {
  admin: "bg-violet-100 text-violet-800 border-violet-200",
  editor: "bg-blue-100 text-blue-800 border-blue-200",
  viewer: "bg-slate-100 text-slate-700 border-slate-200",
};

function RoleBadge({ role, isOwner }: { role: WorkspaceRole; isOwner?: boolean }) {
  return (
    <Badge
      variant="outline"
      className={`capitalize ${ROLE_STYLES[role]}`}
    >
      {isOwner ? `${role} · owner` : role}
    </Badge>
  );
}

export default function TeamMembersTable() {
  const { activeWorkspace, canManageMembers, refreshWorkspaces } = useWorkspace();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<WorkspaceMember | null>(null);

  const load = useCallback(async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const data = await getWorkspaceMembers(activeWorkspace.id);
      setMembers(data?.members ?? []);
      setInvites(data?.invites ?? []);
    } catch {
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!activeWorkspace) return null;

  const seatsMax = activeWorkspace.maxSeats;
  const seatsUsed = activeWorkspace.seatsUsed;
  const atSeatLimit = seatsMax > 0 && seatsUsed >= seatsMax;
  const seatsRemaining =
    seatsMax > 0 ? Math.max(0, seatsMax - seatsUsed) : null;

  const memberColumns: Column<WorkspaceMember>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (v: unknown) => (
        <span className="font-medium text-slate-900">{String(v || "—")}</span>
      ),
    },
    { key: "email", label: "Email", sortable: true },
    {
      key: "role",
      label: "Role",
      render: (_: unknown, row: WorkspaceMember) =>
        canManageMembers && !row.isOwner ? (
          <Select
            value={row.role}
            onValueChange={async (v) => {
              try {
                await updateMemberRole(
                  activeWorkspace.id,
                  row.userId,
                  v as WorkspaceRole
                );
                toast.success("Role updated");
                await load();
              } catch {
                toast.error("Failed to update role");
              }
            }}
          >
            <SelectTrigger className="h-9 w-32 border-slate-200 bg-white text-slate-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <RoleBadge role={row.role} isOwner={row.isOwner} />
        ),
    },
    {
      key: "joinedAt",
      label: "Joined",
      sortable: true,
      render: (v: unknown) => formatApiDate(v),
    },
    {
      key: "actions",
      label: "",
      render: (_: unknown, row: WorkspaceMember) =>
        canManageMembers && !row.isOwner ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setRemoveTarget(row)}
          >
            Remove
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Team members</h2>
          <p className="mt-1 text-sm text-slate-600">
            {seatsMax > 0 ? (
              <>
                <span className="font-medium text-slate-800">{seatsUsed}</span> of{" "}
                <span className="font-medium text-slate-800">{seatsMax}</span> seats
                used
                {seatsRemaining != null && seatsRemaining > 0 && (
                  <> · {seatsRemaining} remaining</>
                )}
              </>
            ) : (
              "Unlimited seats on your plan"
            )}
          </p>
        </div>
        {canManageMembers && (
          <Button
            size="sm"
            className="shrink-0 gap-2"
            onClick={() => setInviteOpen(true)}
            disabled={atSeatLimit}
          >
            <IconUserPlus className="h-4 w-4" />
            Invite member
          </Button>
        )}
      </div>

      {atSeatLimit && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Seat limit reached for this workspace.{" "}
          <Link href="/email/pricing" className="font-semibold underline">
            Upgrade your plan
          </Link>{" "}
          to invite more teammates.
        </div>
      )}

      <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Role permissions
        </p>
        <ul className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
          <li>
            <span className="font-medium text-violet-800">Admin</span> — billing,
            team, workspaces, full access
          </li>
          <li>
            <span className="font-medium text-blue-800">Editor</span> — campaigns,
            leads, domains
          </li>
          <li>
            <span className="font-medium text-slate-800">Viewer</span> — read-only
            access
          </li>
        </ul>
      </div>

      <DataTable
        data={members}
        columns={memberColumns}
        loading={loading}
        searchable
        emptyMessage="No team members yet"
      />

      {invites.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Pending invites ({invites.length})
          </h3>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                    <IconMail className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{inv.email}</p>
                    <p className="text-xs text-slate-500">
                      Expires {formatApiDate(inv.expiresAt)}
                    </p>
                  </div>
                </div>
                <RoleBadge role={inv.role} />
              </div>
            ))}
          </div>
        </div>
      )}

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        workspaceId={activeWorkspace.id}
        onSuccess={async () => {
          await load();
          await refreshWorkspaces();
        }}
      />

      <ConfirmDialog
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={async () => {
          if (!removeTarget) return;
          try {
            await removeWorkspaceMember(activeWorkspace.id, removeTarget.userId);
            toast.success("Member removed");
            setRemoveTarget(null);
            await load();
            await refreshWorkspaces();
          } catch {
            toast.error("Failed to remove member");
          }
        }}
        title="Remove member"
        message={`Remove ${removeTarget?.email} from this workspace?`}
        confirmText="Remove"
        type="danger"
      />
    </div>
  );
}
