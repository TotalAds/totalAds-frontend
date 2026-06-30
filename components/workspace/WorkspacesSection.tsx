"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  createWorkspace,
  listBillingAccountWorkspaces,
  renameWorkspace,
} from "@/utils/api/workspaceClient";
import { IconBuilding, IconPlus, IconPencil } from "@tabler/icons-react";

export default function WorkspacesSection() {
  const { activeWorkspace, billingAccount, canCreateWorkspaces, refreshWorkspaces } =
    useWorkspace();
  const [list, setList] = useState<{ id: number; name: string; createdAt?: string }[]>(
    []
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);

  // States for renaming workspace
  const [renameOpen, setRenameOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<{ id: number; name: string } | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);

  const load = async () => {
    setListLoading(true);
    try {
      const data = await listBillingAccountWorkspaces();
      setList(data);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (canCreateWorkspaces) void load();
  }, [canCreateWorkspaces]);

  if (!canCreateWorkspaces) {
    return (
      <p className="text-sm text-slate-600">
        Only workspace admins can manage workspaces on your plan.
      </p>
    );
  }

  const wsMax = billingAccount?.maxWorkspaces ?? 1;
  const wsUsed = billingAccount?.workspacesUsed ?? list.length;
  const atLimit = wsMax > 0 && wsUsed >= wsMax;
  const wsPct = wsMax > 0 ? Math.min(100, Math.round((wsUsed / wsMax) * 100)) : 0;

  const handleCreate = async () => {
    setLoading(true);
    try {
      await createWorkspace(name.trim());
      toast.success("Workspace created");
      setCreateOpen(false);
      setName("");
      await load();
      await refreshWorkspaces();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { code?: string } } };
      if (ax.response?.data?.code === "WORKSPACE_LIMIT_REACHED") {
        toast.error("Workspace limit reached on your plan");
      } else {
        toast.error("Failed to create workspace");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async () => {
    if (!selectedWorkspace || !renameName.trim()) return;
    setRenameLoading(true);
    try {
      await renameWorkspace(selectedWorkspace.id, renameName.trim());
      toast.success("Workspace renamed");
      setRenameOpen(false);
      setSelectedWorkspace(null);
      setRenameName("");
      await load();
      await refreshWorkspaces();
    } catch (err: unknown) {
      toast.error("Failed to rename workspace");
    } finally {
      setRenameLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Workspaces</h2>
          <p className="mt-1 text-sm text-slate-600">
            {wsMax > 0 ? (
              <>
                <span className="font-medium text-slate-800">{wsUsed}</span> of{" "}
                <span className="font-medium text-slate-800">{wsMax}</span> workspaces
                on your plan
              </>
            ) : (
              "Unlimited workspaces on your plan"
            )}
          </p>
          {wsMax > 0 && (
            <div className="mt-3 h-2 max-w-xs overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${atLimit ? "bg-amber-500" : "bg-brand-main"}`}
                style={{ width: `${wsPct}%` }}
              />
            </div>
          )}
        </div>
        <Button
          size="sm"
          className="shrink-0 gap-2"
          disabled={atLimit}
          onClick={() => setCreateOpen(true)}
        >
          <IconPlus className="h-4 w-4" />
          New workspace
        </Button>
      </div>

      {atLimit && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Workspace limit reached.{" "}
          <Link href="/email/pricing" className="font-semibold underline">
            Upgrade plan
          </Link>{" "}
          to create more workspaces.
        </div>
      )}

      {listLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-50"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((ws) => {
            const isActive = activeWorkspace?.id === ws.id;
            return (
              <div
                key={ws.id}
                className={`rounded-xl border p-4 transition-shadow ${
                  isActive
                    ? "border-brand-main/40 bg-brand-main/5 shadow-sm ring-1 ring-brand-main/20"
                    : "border-slate-200 bg-white hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        isActive ? "bg-brand-main/15" : "bg-slate-100"
                      }`}
                    >
                      <IconBuilding
                        className={`h-5 w-5 ${isActive ? "text-brand-main" : "text-slate-500"}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{ws.name}</p>
                      <p className="text-xs text-slate-500">ID {ws.id}</p>
                      {isActive && (
                        <span className="mt-2 inline-flex rounded-full bg-brand-main/15 px-2 py-0.5 text-xs font-medium text-brand-main">
                          Current workspace
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50 shrink-0"
                    onClick={() => {
                      setSelectedWorkspace(ws);
                      setRenameName(ws.name);
                      setRenameOpen(true);
                    }}
                  >
                    <IconPencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
          </DialogHeader>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Marketing, Sales"
            className="border-slate-200"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loading || !name.trim()}>
              {loading ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename workspace</DialogTitle>
          </DialogHeader>
          <Input
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            placeholder="Workspace name"
            className="border-slate-200"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={renameLoading || !renameName.trim()}>
              {renameLoading ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
