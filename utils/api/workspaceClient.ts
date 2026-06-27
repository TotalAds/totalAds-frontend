import apiClient, { extractApiData } from "./apiClient";

export type WorkspaceRole = "admin" | "editor" | "viewer";

export interface WorkspaceSummary {
  id: number;
  name: string;
  role: WorkspaceRole;
  billingAccountId: number;
  isOwner: boolean;
  seatsUsed: number;
  maxSeats: number;
}

export interface BillingAccountSummary {
  id: number;
  name: string | null;
  workspacesUsed: number;
  maxWorkspaces: number;
  maxSeats: number;
  tierName: string;
}

export interface WorkspaceMember {
  userId: number;
  role: WorkspaceRole;
  isOwner: boolean;
  name: string;
  email: string;
  joinedAt: string;
}

export interface WorkspaceInvite {
  id: number;
  email: string;
  role: WorkspaceRole;
  expiresAt: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: number;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actorUserId: number | null;
  actorName: string | null;
  actorEmail: string | null;
}

export async function listWorkspaces(): Promise<WorkspaceSummary[]> {
  const res = await apiClient.get("/workspaces");
  return extractApiData<WorkspaceSummary[]>(res) ?? [];
}

export async function getBillingAccountSummary(): Promise<BillingAccountSummary | null> {
  const res = await apiClient.get("/workspaces/billing-account");
  return extractApiData<BillingAccountSummary | null>(res) ?? null;
}

export async function listBillingAccountWorkspaces(): Promise<
  { id: number; name: string; createdAt: string }[]
> {
  const res = await apiClient.get("/workspaces/billing-account/workspaces");
  return extractApiData<{ id: number; name: string; createdAt: string }[]>(res) ?? [];
}

export async function createWorkspace(name: string) {
  const res = await apiClient.post("/workspaces", { name });
  return extractApiData(res);
}

export async function switchWorkspace(workspaceId: number) {
  const res = await apiClient.post(`/workspaces/${workspaceId}/switch`);
  return extractApiData(res);
}

export async function getWorkspaceMembers(workspaceId: number) {
  const res = await apiClient.get(`/workspaces/${workspaceId}/members`, {
    headers: { "X-Workspace-Id": String(workspaceId) },
  });
  return (
    extractApiData<{
      members: WorkspaceMember[];
      invites: WorkspaceInvite[];
    }>(res) ?? { members: [], invites: [] }
  );
}

export async function inviteWorkspaceMember(
  workspaceId: number,
  email: string,
  role: WorkspaceRole
) {
  const res = await apiClient.post(
    `/workspaces/${workspaceId}/invites`,
    { email, role },
    { headers: { "X-Workspace-Id": String(workspaceId) } }
  );
  return extractApiData(res);
}

export async function updateMemberRole(
  workspaceId: number,
  userId: number,
  role: WorkspaceRole
) {
  await apiClient.patch(
    `/workspaces/${workspaceId}/members/${userId}`,
    { role },
    { headers: { "X-Workspace-Id": String(workspaceId) } }
  );
}

export async function removeWorkspaceMember(workspaceId: number, userId: number) {
  await apiClient.delete(`/workspaces/${workspaceId}/members/${userId}`, {
    headers: { "X-Workspace-Id": String(workspaceId) },
  });
}

export async function getAuditLogs(
  workspaceId: number,
  params?: { limit?: number; offset?: number; action?: string }
): Promise<AuditLogEntry[]> {
  const res = await apiClient.get(`/workspaces/${workspaceId}/audit-logs`, {
    params,
    headers: { "X-Workspace-Id": String(workspaceId) },
  });
  return extractApiData<AuditLogEntry[]>(res) ?? [];
}

export interface WorkspaceInvitePreview {
  email: string;
  role: WorkspaceRole;
  workspaceId: number;
  workspaceName: string;
  expiresAt: string;
}

export async function getWorkspaceInvitePreview(token: string) {
  const res = await apiClient.get("/workspaces/invites/preview", {
    params: { token },
  });
  return extractApiData<WorkspaceInvitePreview>(res);
}

export async function acceptWorkspaceInvite(token: string) {
  const res = await apiClient.post("/workspaces/invites/accept", { token });
  return extractApiData<{ workspaceId: number }>(res);
}
