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

export interface LeadhubSyncConfig {
  enabled: boolean;
  source: "leadhub_autopilot";
  listIds?: string[];
  /** When signup, import uses LeadHub GET /api/signups/sync. */
  listType?: "regular" | "signup";
  categoryIds?: string[];
  priorities?: Array<"hot" | "warm" | "cold" | "unknown">;
  minIntentScore?: number;
  minIcpScore?: number;
  icpProfileId?: string;
  enrichmentGate?:
    | "import_both"
    | "enriched_only"
    | "unenriched_only"
    | "auto_enrich";
  /** @deprecated Unused */
  dailyIntakeCap?: number;
  /** @deprecated Unused */
  trustLeadhubVerification?: boolean;
}

export interface LeadhubList {
  id: string;
  name: string;
  description?: string | null;
  isSystemList?: boolean;
  listType?: "regular" | "signup";
  leadCount?: number;
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

export interface LeadhubPreviewCounts {
  total: number;
  enrichedCount: number;
  unenrichedCount: number;
}

export const previewLeadhubSync = async (
  campaignId: string | number
): Promise<LeadhubPreviewCounts> => {
  const response = await emailClient.post("/api/leadhub/preview", { campaignId });
  return (
    response.data?.data ?? {
      total: 0,
      enrichedCount: 0,
      unenrichedCount: 0,
    }
  );
};

export interface LeadhubSyncLinkRow {
  leadhubLeadId: string;
  email: string | null;
  /** LeadHub field path used for import and {{email}} token. */
  emailField?: "signup.email" | "contact.email" | null;
  mergeToken?: "{{email}}";
  isSignupLead?: boolean;
  syncStatus: string;
  lastError: string | null;
  priority: string | null;
  intentScore: number | null;
  icpScore: number | null;
  updatedAt: string;
}

export interface LeadhubSyncSummary {
  imported: number;
  addedToCampaign: number;
  skipped: number;
  skippedNoEmail: number;
  skippedVerification: number;
  skippedEnrichedOnly: number;
  skippedOther: number;
  pendingEnrichment: number;
  failed: number;
  notInCampaign: number;
}

const ADDED_SYNC_STATUSES = new Set(["ready", "queued", "synced"]);

export function summarizeLeadhubSyncLinks(
  links: LeadhubSyncLinkRow[]
): LeadhubSyncSummary {
  let addedToCampaign = 0;
  let skippedNoEmail = 0;
  let skippedVerification = 0;
  let skippedEnrichedOnly = 0;
  let skippedOther = 0;
  let pendingEnrichment = 0;
  let failed = 0;

  for (const link of links) {
    const status = link.syncStatus;
    const err = (link.lastError || "").toLowerCase();

    if (ADDED_SYNC_STATUSES.has(status)) {
      addedToCampaign += 1;
      continue;
    }

    if (status === "pending_enrichment") {
      pendingEnrichment += 1;
      continue;
    }

    if (status === "failed") {
      failed += 1;
      continue;
    }

    if (status === "skipped") {
      if (err.includes("no email") || err.includes("no valid email")) {
        skippedNoEmail += 1;
      } else if (
        err.includes("not safe") ||
        err.includes("verification") ||
        err.includes("invalid")
      ) {
        skippedVerification += 1;
      } else if (err.includes("unenriched_only") || err.includes("already enriched")) {
        skippedOther += 1;
      } else if (err.includes("not enriched") || err.includes("enriched_only")) {
        skippedEnrichedOnly += 1;
      } else {
        skippedOther += 1;
      }
    }
  }

  const skipped =
    skippedNoEmail + skippedVerification + skippedEnrichedOnly + skippedOther;
  const imported = links.length;
  const notInCampaign = Math.max(
    0,
    imported - addedToCampaign - pendingEnrichment
  );

  return {
    imported,
    addedToCampaign,
    skipped,
    skippedNoEmail,
    skippedVerification,
    skippedEnrichedOnly,
    skippedOther,
    pendingEnrichment,
    failed,
    notInCampaign,
  };
}

export function formatLeadhubSkipReasons(summary: LeadhubSyncSummary): string {
  const parts: string[] = [];

  if (summary.skippedNoEmail > 0) {
    parts.push(
      `${summary.skippedNoEmail} missing or invalid email${
        summary.skippedNoEmail !== 1 ? "s" : ""
      }`
    );
  }
  if (summary.skippedVerification > 0) {
    parts.push(
      `${summary.skippedVerification} failed verification${
        summary.skippedVerification !== 1 ? " checks" : " check"
      }`
    );
  }
  if (summary.skippedEnrichedOnly > 0) {
    parts.push(
      `${summary.skippedEnrichedOnly} not enriched yet${
        summary.skippedEnrichedOnly !== 1 ? "" : ""
      }`
    );
  }
  if (summary.skippedOther > 0) {
    parts.push(`${summary.skippedOther} other`);
  }
  if (summary.failed > 0) {
    parts.push(`${summary.failed} failed to import`);
  }

  return parts.join(" · ");
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
