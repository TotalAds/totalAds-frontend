"use client";

import emailClient from "./emailClient";

export interface LeadhubConnectionStatus {
  isConfigured: boolean;
  leadhubWorkspaceId?: string | null;
  baseUrl?: string | null;
  status?: string | null;
  lastSyncAt?: string | null;
  lastError?: string | null;
  syncCursor?: string | null;
}

export type LeadhubAiBriefTone = "founder" | "consultative" | "direct";

export interface LeadhubAiBrief {
  userPrompt?: string;
  templateDescription?: string;
  emailTemplateHtml?: string;
  product?: string;
  proof?: string;
  cta?: string;
  senderName?: string;
  senderCompany?: string;
  tone?: LeadhubAiBriefTone;
  extra?: string;
}

export interface LeadhubAgentPreviewExample {
  leadId: string;
  email: string | null;
  firstName: string | null;
  company: string | null;
  subject: string;
  previewText: string;
  bodyHtml: string;
}

export interface LeadhubSyncConfig {
  enabled: boolean;
  source: "leadhub_autopilot";
  listIds?: string[];
  categoryIds?: string[];
  priorities?: Array<"hot" | "warm" | "cold" | "unknown">;
  minIntentScore?: number;
  minIcpScore?: number;
  icpProfileId?: string;
  enrichmentGate?: "auto_enrich" | "enriched_only";
  dailyIntakeCap?: number;
  trustLeadhubVerification?: boolean;
  personalizationMode?: "template" | "ai_agent";
  aiBrief?: LeadhubAiBrief;
  /** Cached Step 1 agent example emails (persisted across refresh). */
  agentPreviewExamples?: LeadhubAgentPreviewExample[];
  agentPreviewExamplesAt?: string;
}

export interface LeadhubList {
  id: string;
  name: string;
  description?: string | null;
}

export interface LeadhubCategory {
  id: string;
  name: string;
  color?: string | null;
}

const mapStatus = (raw: any): LeadhubConnectionStatus => {
  const data = raw?.data ?? raw ?? {};
  return {
    isConfigured: Boolean(data.isConfigured),
    leadhubWorkspaceId: data.leadhubWorkspaceId ?? null,
    baseUrl: data.baseUrl ?? null,
    status: data.status ?? null,
    lastSyncAt: data.lastSyncAt ?? null,
    lastError: data.lastError ?? null,
    syncCursor: data.syncCursor ?? null,
  };
};

export const getLeadhubStatus = async (): Promise<LeadhubConnectionStatus> => {
  const response = await emailClient.get("/api/leadhub/status");
  return mapStatus(response.data);
};

export const connectLeadhub = async (params: {
  apiKey: string;
  leadhubWorkspaceId: string;
  baseUrl: string;
}): Promise<LeadhubConnectionStatus> => {
  const response = await emailClient.post("/api/leadhub/connect", params);
  return mapStatus(response.data);
};

export const disconnectLeadhub = async (): Promise<LeadhubConnectionStatus> => {
  const response = await emailClient.delete("/api/leadhub/connect");
  return mapStatus(response.data);
};

export const getLeadhubLists = async (): Promise<LeadhubList[]> => {
  const response = await emailClient.get("/api/leadhub/lists");
  return response.data?.data ?? [];
};

export const getLeadhubCategories = async (): Promise<LeadhubCategory[]> => {
  const response = await emailClient.get("/api/leadhub/categories");
  return response.data?.data ?? [];
};

export const syncLeadhubCampaign = async (
  campaignId: string | number
): Promise<{
  processed: number;
  ready: number;
  pendingEnrichment: number;
  queued: number;
  skipped: number;
  skippedNoEmail?: number;
  skippedVerification?: number;
  skippedEnrichedOnly?: number;
  failed?: number;
}> => {
  const response = await emailClient.post("/api/leadhub/sync", { campaignId });
  return response.data?.data ?? response.data;
};

export interface LeadhubSyncLinkRow {
  leadhubLeadId: string;
  email: string | null;
  syncStatus: string;
  lastError: string | null;
  priority: string | null;
  intentScore: number | null;
  icpScore: number | null;
  updatedAt: string;
}

export const getCampaignLeadhubSyncLinks = async (
  campaignId: string | number
): Promise<LeadhubSyncLinkRow[]> => {
  const response = await emailClient.get(`/api/leadhub/campaign/${campaignId}/links`);
  return response.data?.data ?? [];
};

export const getLeadhubPersonalizationTokens = async (): Promise<string[]> => {
  const response = await emailClient.get("/api/leadhub/personalization-tokens");
  return response.data?.data?.tokens ?? [];
};

export const expandLeadSniperBrief = async (params: {
  userPrompt: string;
  templateDescription?: string;
  campaignName?: string;
}): Promise<LeadhubAiBrief> => {
  const response = await emailClient.post("/api/leadhub/agent/expand-brief", params);
  return response.data?.data ?? response.data;
};

export interface LeadSniperPreviewEmail {
  leadId: string;
  email: string | null;
  firstName: string | null;
  company: string | null;
  subject: string;
  previewText: string;
  bodyHtml: string;
}

export const previewLeadSniperEmails = async (params: {
  campaignId: string | number;
  limit?: number;
}): Promise<{ previews: LeadSniperPreviewEmail[] }> => {
  const response = await emailClient.post("/api/leadhub/agent/preview-emails", params);
  return response.data?.data ?? response.data;
};
