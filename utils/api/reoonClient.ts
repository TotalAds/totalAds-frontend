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

export interface QueueVerificationResponse {
  jobId: string;
  leadCount: number;
  mode: string;
  status: "queued";
}

/**
 * Queue verification job (async - returns immediately)
 * User will receive email notification when verification completes
 */
export const queueCampaignLeadsVerification = async (params: {
  domainId: string;
  campaignId: string;
  leadIds: string[];
  mode?: "quick" | "power";
}): Promise<QueueVerificationResponse> => {
  const { domainId, campaignId, leadIds, mode = "power" } = params;

  const response = await emailClient.post(
    `/api/domains/${domainId}/campaigns/${campaignId}/verify-leads-with-reoon`,
    {
      leadIds,
      mode,
    }
  );

  const raw = response.data?.data ?? response.data ?? {};
  return raw as QueueVerificationResponse;
};

/**
 * Synchronous verification (for small batches or cached results)
 * Waits for verification to complete before returning
 */
export const verifyCampaignLeadsWithReoon = async (params: {
  domainId: string;
  campaignId: string;
  leadIds: string[];
  mode?: "quick" | "power";
}): Promise<BulkVerifyLeadsResponse> => {
  const { domainId, campaignId, leadIds, mode = "power" } = params;

  // Use the sync endpoint for immediate results (cached emails)
  const response = await emailClient.post(
    `/api/domains/${domainId}/campaigns/${campaignId}/verify-leads-with-reoon-sync`,
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

// Types for verification status check
export interface EmailVerificationStatusResult {
  email: string;
  isVerified: boolean;
  status?: string;
  isSafeToSend?: boolean | null;
  verifiedAt?: string;
}

export interface CheckEmailsVerificationStatusResponse {
  total: number;
  verified: number;
  unverified: number;
  verifiedEmails: string[];
  unverifiedEmails: string[];
  details: EmailVerificationStatusResult[];
}

/**
 * Check verification status for a list of emails
 * Returns which emails are already verified and which need verification
 * Used to optimize bulk verification - only send unverified emails to Reoon API
 */
export const checkEmailsVerificationStatus = async (
  emails: string[]
): Promise<CheckEmailsVerificationStatusResponse> => {
  const response = await emailClient.post(
    "/api/reoon/check-verification-status",
    {
      emails,
    }
  );

  const raw = response.data?.data ?? response.data ?? {};
  return raw as CheckEmailsVerificationStatusResponse;
};
