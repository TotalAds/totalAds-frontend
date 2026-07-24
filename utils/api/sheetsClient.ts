"use client";

import emailClient from "./emailClient";

export interface GoogleSheetsConnectionStatus {
  connected: boolean;
  connectionId?: number;
  googleEmail?: string;
  status?: string;
  lastError?: string | null;
}

export interface GoogleSpreadsheetItem {
  id: string;
  name: string;
  modifiedTime: string | null;
}

export interface GoogleSheetTab {
  sheetId?: number;
  title: string;
  index: number;
}

export const getGoogleSheetsStatus =
  async (): Promise<GoogleSheetsConnectionStatus> => {
    const response = await emailClient.get("/api/sheets/status");
    return response.data?.data ?? { connected: false };
  };

export const getGoogleSheetsOAuthUrl = async (
  returnPath?: string
): Promise<{ authUrl: string }> => {
  const response = await emailClient.get("/api/sheets/oauth-url", {
    params: returnPath ? { returnPath } : undefined,
  });
  return response.data?.data;
};

export const completeGoogleSheetsOAuth = async (params: {
  code: string;
  state: string;
}): Promise<GoogleSheetsConnectionStatus> => {
  const response = await emailClient.post("/api/sheets/oauth/callback", params);
  return response.data?.data;
};

export const disconnectGoogleSheets = async (): Promise<void> => {
  await emailClient.delete("/api/sheets/connect");
};

export const listGoogleSpreadsheets = async (): Promise<
  GoogleSpreadsheetItem[]
> => {
  const response = await emailClient.get("/api/sheets/spreadsheets");
  return response.data?.data || [];
};

export const listGoogleSpreadsheetTabs = async (
  spreadsheetId: string
): Promise<{
  spreadsheetId: string;
  spreadsheetName: string;
  tabs: GoogleSheetTab[];
}> => {
  const response = await emailClient.get(
    `/api/sheets/spreadsheets/${encodeURIComponent(spreadsheetId)}/tabs`
  );
  return response.data?.data;
};

export const previewGoogleSheet = async (params: {
  spreadsheetId: string;
  sheetName: string;
}): Promise<{ headers: string[]; sampleRows: string[][] }> => {
  const response = await emailClient.post("/api/sheets/preview", params);
  return response.data?.data;
};

export const importCampaignGoogleSheet = async (
  campaignId: string,
  oneShot = true
): Promise<{
  imported: number;
  queued: number;
  skipped: number;
  lastSyncedRow: number;
}> => {
  const response = await emailClient.post(
    `/api/sheets/campaigns/${campaignId}/import`,
    { oneShot }
  );
  return response.data?.data;
};
