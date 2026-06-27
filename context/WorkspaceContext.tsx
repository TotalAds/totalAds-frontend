"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "react-hot-toast";

import { useAuthContext } from "@/context/AuthContext";
import {
  BillingAccountSummary,
  listWorkspaces,
  getBillingAccountSummary,
  switchWorkspace as apiSwitchWorkspace,
  WorkspaceRole,
  WorkspaceSummary,
} from "@/utils/api/workspaceClient";
import {
  getActiveWorkspaceId,
  setActiveWorkspaceId,
} from "@/utils/workspace/storage";

interface WorkspaceContextValue {
  workspaces: WorkspaceSummary[];
  ownedWorkspaces: WorkspaceSummary[];
  sharedWorkspaces: WorkspaceSummary[];
  activeWorkspace: WorkspaceSummary | null;
  role: WorkspaceRole | null;
  billingAccount: BillingAccountSummary | null;
  isLoading: boolean;
  isSharedWorkspace: boolean;
  refreshWorkspaces: () => Promise<void>;
  switchWorkspace: (workspaceId: number) => Promise<void>;
  canEdit: boolean;
  canManageBilling: boolean;
  canManageMembers: boolean;
  /** Can create workspaces on the user's own billing account (plan limit applies). */
  canCreateWorkspaces: boolean;
  canViewAuditLog: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(
  undefined
);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { state } = useAuthContext();
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [billingAccount, setBillingAccount] =
    useState<BillingAccountSummary | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshWorkspaces = useCallback(async () => {
    if (!state.isAuthenticated) {
      setWorkspaces([]);
      setBillingAccount(null);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const [wsList, billing] = await Promise.all([
        listWorkspaces(),
        getBillingAccountSummary().catch(() => null),
      ]);
      setWorkspaces(wsList);
      setBillingAccount(billing);

      const stored = getActiveWorkspaceId();
      const validStored = wsList.find((w) => String(w.id) === stored);
      const owned = wsList.find((w) => w.isOwner);
      const nextId = validStored
        ? String(validStored.id)
        : owned
          ? String(owned.id)
          : wsList[0]
            ? String(wsList[0].id)
            : null;
      if (nextId) setActiveWorkspaceId(nextId);
      setActiveId(nextId);
    } catch (e) {
      console.error("Failed to load workspaces", e);
      toast.error("Could not load workspaces. Check that the API is running.");
    } finally {
      setIsLoading(false);
    }
  }, [state.isAuthenticated]);

  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces]);

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => String(w.id) === activeId) ?? null,
    [workspaces, activeId]
  );

  const ownedWorkspaces = useMemo(
    () => workspaces.filter((w) => w.isOwner),
    [workspaces]
  );

  const sharedWorkspaces = useMemo(
    () => workspaces.filter((w) => !w.isOwner),
    [workspaces]
  );

  const role = activeWorkspace?.role ?? null;
  const isSharedWorkspace = activeWorkspace ? !activeWorkspace.isOwner : false;
  const canCreateOnOwnPlan = Boolean(billingAccount);

  const switchWorkspace = useCallback(
    async (workspaceId: number) => {
      try {
        await apiSwitchWorkspace(workspaceId);
        setActiveWorkspaceId(workspaceId);
        setActiveId(String(workspaceId));
        toast.success("Workspace switched");
        window.location.reload();
      } catch {
        toast.error("Failed to switch workspace");
      }
    },
    []
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      ownedWorkspaces,
      sharedWorkspaces,
      activeWorkspace,
      role,
      billingAccount,
      isLoading,
      isSharedWorkspace,
      refreshWorkspaces,
      switchWorkspace,
      canEdit: role === "admin" || role === "editor",
      canManageBilling: role === "admin",
      canManageMembers: role === "admin",
      canCreateWorkspaces: canCreateOnOwnPlan,
      canViewAuditLog: role === "admin",
    }),
    [
      workspaces,
      ownedWorkspaces,
      sharedWorkspaces,
      activeWorkspace,
      role,
      billingAccount,
      isLoading,
      isSharedWorkspace,
      canCreateOnOwnPlan,
      refreshWorkspaces,
      switchWorkspace,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return ctx;
}

export function useCanEdit() {
  return useWorkspace().canEdit;
}

export function useCanManageBilling() {
  return useWorkspace().canManageBilling;
}

export function useCanManageMembers() {
  return useWorkspace().canManageMembers;
}

export function useCanViewAuditLog() {
  return useWorkspace().canViewAuditLog;
}

export function useCanCreateWorkspaces() {
  return useWorkspace().canCreateWorkspaces;
}

export function useIsViewer() {
  const { role } = useWorkspace();
  return role === "viewer";
}
