"use client";

import emailClient from "./emailClient";

export interface ReoonStatus {
  isConfigured: boolean;
  lastBalanceDailyCredits: number | null;
  lastBalanceInstantCredits: number | null;
  lastBalanceCheckedAt: string | null;
  apiStatus?: string;
}

const mapStatusResponse = (raw: any): ReoonStatus => {
  const data = raw?.data ?? raw ?? {};
  return {
    isConfigured: Boolean(data.isConfigured),
    lastBalanceDailyCredits:
      typeof data.lastBalanceDailyCredits === "number"
        ? data.lastBalanceDailyCredits
        : null,
    lastBalanceInstantCredits:
      typeof data.lastBalanceInstantCredits === "number"
        ? data.lastBalanceInstantCredits
        : null,
    lastBalanceCheckedAt: data.lastBalanceCheckedAt || null,
    apiStatus: data.apiStatus,
  };
};

export const getReoonStatus = async (
  refresh: boolean = false
): Promise<ReoonStatus> => {
  const response = await emailClient.get("/api/reoon/status", {
    params: refresh ? { refresh: "true" } : undefined,
  });

  return mapStatusResponse(response.data);
};

export const saveReoonApiKey = async (apiKey: string): Promise<ReoonStatus> => {
  const response = await emailClient.post("/api/reoon/api-key", { apiKey });

  return mapStatusResponse(response.data);
};

export interface LeadVerificationResult {
  leadId: string;
  email: string;
  status: string;
  isSafeToSend: boolean | null;
  isDisposable: boolean | null;
  isSpamtrap: boolean | null;
  isCatchAll: boolean | null;
  isRoleAccount: boolean | null;
  hasInboxFull: boolean | null;
  isDisabled: boolean | null;
  canConnectSmtp: boolean | null;
  mxAcceptsMail: boolean | null;
  provider: string;
  mode: string | null;
  verifiedAt: string;
}

export interface BulkVerifyLeadsSummary {
  total: number;
  alreadyVerified: number;
  newlyVerified: number;
  byStatus: Record<string, number>;
  safeToSend: number;
  risky: number;
}

export interface BulkVerifyLeadsResponse {
  results: LeadVerificationResult[];
  summary: BulkVerifyLeadsSummary;
}

export const verifyCampaignLeadsWithReoon = async (params: {
  domainId: string;
  campaignId: string;
  leadIds: string[];
  mode?: "quick" | "power";
}): Promise<BulkVerifyLeadsResponse> => {
  const { domainId, campaignId, leadIds, mode = "power" } = params;

  const response = await emailClient.post(
    `/api/domains/${domainId}/campaigns/${campaignId}/verify-leads-with-reoon`,
    {
      leadIds,
      mode,
    }
  );

  const raw = response.data?.data ?? response.data ?? {};
  return raw as BulkVerifyLeadsResponse;
};

export const verifyLeadWithReoon = async (params: {
  leadId: string;
  mode?: "quick" | "power";
}): Promise<BulkVerifyLeadsResponse> => {
  const { leadId, mode = "power" } = params;
  const response = await emailClient.post(
    `/api/leads/${leadId}/verify-with-reoon`,
    {
      mode,
    }
  );

  const raw = response.data?.data ?? response.data ?? {};
  return raw as BulkVerifyLeadsResponse;
};
