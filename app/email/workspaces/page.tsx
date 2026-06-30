"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import ActivityLogTable from "@/components/workspace/ActivityLogTable";
import TeamMembersTable from "@/components/workspace/TeamMembersTable";
import WorkspaceRoleBanner from "@/components/workspace/WorkspaceRoleBanner";
import WorkspaceUsageCard from "@/components/workspace/WorkspaceUsageCard";
import WorkspacesSection from "@/components/workspace/WorkspacesSection";
import { useAuthContext } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  IconActivity,
  IconBuilding,
  IconChevronRight,
  IconUsers,
  IconPencil,
} from "@tabler/icons-react";
import { renameWorkspace } from "@/utils/api/workspaceClient";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type WorkspaceTab = "team" | "workspaces" | "activity";

const VALID_TABS: WorkspaceTab[] = ["team", "workspaces", "activity"];

export default function WorkspacesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state } = useAuthContext();
  const {
    activeWorkspace,
    isLoading,
    canManageMembers,
    canCreateWorkspaces,
    canViewAuditLog,
    refreshWorkspaces,
  } = useWorkspace();

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameName, setRenameName] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);

  const handleRenameActive = async () => {
    if (!activeWorkspace || !renameName.trim()) return;
    setRenameLoading(true);
    try {
      await renameWorkspace(activeWorkspace.id, renameName.trim());
      toast.success("Workspace renamed");
      setRenameOpen(false);
      setRenameName("");
      await refreshWorkspaces();
    } catch {
      toast.error("Failed to rename workspace");
    } finally {
      setRenameLoading(false);
    }
  };

  const tabFromUrl = searchParams.get("tab") as WorkspaceTab | null;
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(
    tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : "team"
  );

  const setTab = useCallback(
    (tab: WorkspaceTab) => {
      setActiveTab(tab);
      router.replace(`/email/workspaces?tab=${tab}`, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    if (!state.isLoading && !state.isAuthenticated) {
      router.push("/login");
    }
  }, [state.isLoading, state.isAuthenticated, router]);

  useEffect(() => {
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const navItems = useMemo(() => {
    const items: {
      id: WorkspaceTab;
      label: string;
      icon: React.ReactNode;
      description: string;
      visible: boolean;
    }[] = [
      {
        id: "team",
        label: "Team",
        icon: <IconUsers className="h-5 w-5" />,
        description: "Members & invites",
        visible: canManageMembers,
      },
      {
        id: "workspaces",
        label: "Workspaces",
        icon: <IconBuilding className="h-5 w-5" />,
        description: "Manage on your plan",
        visible: canCreateWorkspaces,
      },
      {
        id: "activity",
        label: "Activity",
        icon: <IconActivity className="h-5 w-5" />,
        description: "Audit log",
        visible: canViewAuditLog,
      },
    ];
    return items.filter((item) => item.visible);
  }, [canManageMembers, canCreateWorkspaces, canViewAuditLog]);

  useEffect(() => {
    if (navItems.length === 0) return;
    if (!navItems.some((item) => item.id === activeTab)) {
      setTab(navItems[0].id);
    }
  }, [navItems, activeTab, setTab]);

  if (!state.isAuthenticated) {
    return null;
  }

  const hasAdminAccess = navItems.length > 0;

  return (
    <div className="min-h-screen bg-bg-100 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Team & workspaces
          </h1>
          <p className="mt-1 text-sm text-slate-600 flex items-center gap-2 flex-wrap">
            {activeWorkspace ? (
              <>
                <span>
                  Active workspace:{" "}
                  <span className="font-semibold text-slate-900">
                    {activeWorkspace.name}
                  </span>
                  <span className="ml-2 capitalize text-slate-500">
                    ({activeWorkspace.role})
                  </span>
                </span>
                {activeWorkspace.role === "admin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setRenameName(activeWorkspace.name);
                      setRenameOpen(true);
                    }}
                    className="inline-flex items-center justify-center rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    title="Rename workspace"
                  >
                    <IconPencil className="h-4 w-4" />
                  </button>
                )}
              </>
            ) : (
              "Select a workspace from the sidebar"
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">
            Loading workspace…
          </div>
        ) : !activeWorkspace ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-600">
              No workspace found. Try refreshing the page.
            </p>
          </div>
        ) : !hasAdminAccess ? (
          <WorkspaceRoleBanner variant="team-settings" />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <aside className="lg:col-span-3">
              <nav className="sticky top-24 space-y-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                {navItems.map((item) => {
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition-colors ${
                        active
                          ? "bg-brand-main text-white shadow-sm"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={active ? "text-white" : "text-slate-500"}>
                          {item.icon}
                        </span>
                        <div>
                          <span
                            className={`block text-sm font-semibold ${
                              active ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {item.label}
                          </span>
                          <span
                            className={`block text-xs ${
                              active ? "text-blue-100" : "text-slate-500"
                            }`}
                          >
                            {item.description}
                          </span>
                        </div>
                      </div>
                      {active && (
                        <IconChevronRight className="h-4 w-4 shrink-0 text-white" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </aside>

            <div className="space-y-6 lg:col-span-9">
              <WorkspaceUsageCard />
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
                {activeTab === "team" && <TeamMembersTable />}
                {activeTab === "workspaces" && <WorkspacesSection />}
                {activeTab === "activity" && <ActivityLogTable />}
              </div>
            </div>
          </div>
        )}
      </div>

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
            <Button onClick={handleRenameActive} disabled={renameLoading || !renameName.trim()}>
              {renameLoading ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
