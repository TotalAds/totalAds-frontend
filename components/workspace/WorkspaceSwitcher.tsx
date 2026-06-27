"use client";

import Link from "next/link";
import { IconBuilding, IconChevronDown, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWorkspace } from "@/context/WorkspaceContext";
import { createWorkspace } from "@/utils/api/workspaceClient";
import { cn } from "@/utils/cn";

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
  variant?: "default" | "sidebar";
}

function WorkspaceMenuItem({
  id,
  name,
  role,
  isActive,
  onSelect,
}: {
  id: number;
  name: string;
  role: string;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem
      onClick={onSelect}
      className={cn("flex items-center gap-2", isActive && "bg-brand-main/10")}
    >
      <span className="min-w-0 flex-1 truncate font-medium">
        {name || "Unnamed workspace"}
      </span>
      <span className="shrink-0 text-xs capitalize text-slate-500">{role}</span>
    </DropdownMenuItem>
  );
}

export default function WorkspaceSwitcher({
  collapsed,
  variant = "default",
}: WorkspaceSwitcherProps) {
  const isSidebar = variant === "sidebar";
  const {
    ownedWorkspaces,
    sharedWorkspaces,
    activeWorkspace,
    switchWorkspace,
    refreshWorkspaces,
    billingAccount,
    canCreateWorkspaces,
    isLoading,
    role,
  } = useWorkspace();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const atWorkspaceLimit =
    billingAccount &&
    billingAccount.maxWorkspaces > 0 &&
    billingAccount.workspacesUsed >= billingAccount.maxWorkspaces;

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createWorkspace(name.trim());
      toast.success("Workspace created");
      setCreateOpen(false);
      setName("");
      await refreshWorkspaces();
    } catch (err: unknown) {
      const ax = err as {
        response?: { data?: { code?: string; message?: string } };
      };
      const code = ax.response?.data?.code;
      if (code === "WORKSPACE_LIMIT_REACHED") {
        toast.error(
          "Workspace limit reached on your plan. Upgrade to add more.",
        );
      } else {
        toast.error(ax.response?.data?.message || "Failed to create workspace");
      }
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "h-10 w-full animate-pulse rounded-lg border",
          isSidebar
            ? "border-sidebar-border bg-sidebar-hover"
            : "border-brand-main/10 bg-bg-300/40",
          collapsed && "h-10 w-10",
        )}
      />
    );
  }

  if (!activeWorkspace) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed px-3 py-2 text-xs",
          isSidebar
            ? "border-sidebar-border text-sidebar-muted"
            : "border-brand-main/30 text-text-200",
          collapsed && "px-2 text-center",
        )}
        title="No workspace loaded"
      >
        {!collapsed ? "No workspace" : "—"}
      </div>
    );
  }

  const displayName = activeWorkspace.name?.trim() || "Workspace";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
              isSidebar
                ? "border-sidebar-border bg-sidebar-hover text-sidebar-text hover:border-sidebar-active/40 hover:bg-sidebar-bg"
                : "border-brand-main/20 bg-bg-300/50 text-text-100 hover:bg-bg-300",
              collapsed && "justify-center px-2",
            )}
          >
            <IconBuilding
              className={cn(
                "h-4 w-4 shrink-0",
                isSidebar ? "text-sidebar-active" : "text-brand-main",
              )}
            />
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {displayName}
                  </span>
                  {role && (
                    <span className="block truncate text-[10px] capitalize text-sidebar-muted">
                      {role}
                      {!activeWorkspace.isOwner ? " · shared" : ""}
                    </span>
                  )}
                </span>
                <IconChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isSidebar ? "text-sidebar-muted" : "text-text-200",
                  )}
                />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {ownedWorkspaces.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs text-slate-500">
                My workspaces
              </DropdownMenuLabel>
              {ownedWorkspaces.map((ws) => (
                <WorkspaceMenuItem
                  key={ws.id}
                  id={ws.id}
                  name={ws.name}
                  role={ws.role}
                  isActive={ws.id === activeWorkspace.id}
                  onSelect={() => {
                    if (ws.id !== activeWorkspace.id)
                      void switchWorkspace(ws.id);
                  }}
                />
              ))}
            </>
          )}

          {sharedWorkspaces.length > 0 && (
            <>
              {ownedWorkspaces.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs text-slate-500">
                Shared with me
              </DropdownMenuLabel>
              {sharedWorkspaces.map((ws) => (
                <WorkspaceMenuItem
                  key={ws.id}
                  id={ws.id}
                  name={ws.name}
                  role={ws.role}
                  isActive={ws.id === activeWorkspace.id}
                  onSelect={() => {
                    if (ws.id !== activeWorkspace.id)
                      void switchWorkspace(ws.id);
                  }}
                />
              ))}
            </>
          )}

          {ownedWorkspaces.length === 0 && sharedWorkspaces.length === 0 && (
            <DropdownMenuItem disabled>No workspaces</DropdownMenuItem>
          )}

          {canCreateWorkspaces && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!!atWorkspaceLimit}
                onClick={() => setCreateOpen(true)}
              >
                <IconPlus className="mr-2 h-4 w-4" />
                Create workspace
              </DropdownMenuItem>
              {atWorkspaceLimit && (
                <p className="px-2 pb-2 text-xs text-amber-700">
                  Plan limit reached.
                </p>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Workspace limits apply to workspaces on your own plan. Joining other
            people&apos;s workspaces does not count toward this limit.
          </p>
          <Input
            placeholder="Workspace name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {atWorkspaceLimit && (
            <p className="text-sm text-amber-800">
              You&apos;ve reached your plan limit.{" "}
              <Link href="/email/pricing" className="underline">
                Upgrade
              </Link>
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating || !name.trim()}>
              {creating ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
