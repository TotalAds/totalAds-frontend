"use client";

import apiClient from "./apiClient";

// Shared response unwrapping that tolerates multiple API response shapes
const unwrap = (res: any) => {
  const d = res?.data;
  if (!d) return d;

  // Recursively unwrap nested { status, message, payload } envelopes
  let p: any = d.payload ?? d;
  while (p && typeof p === "object" && "payload" in p && p.payload) {
    p = p.payload;
  }

  if (p) {
    // Prefer common fields if present
    if (p.job !== undefined) return p.job;
    if (p.rows !== undefined || p.nextCursor !== undefined) {
      return { rows: p.rows ?? [], nextCursor: p.nextCursor };
    }
    if (p.jobId !== undefined) return { jobId: p.jobId };

    // Only unwrap to p.data when it's the ONLY field (no pagination metadata)
    const keys = Object.keys(p);
    if (keys.length === 1 && p.data !== undefined) return p.data;

    return p;
  }

  if (d.data !== undefined) return d.data;
  return d;
};

export interface CreateUploadJobParams {
  file: File;
  icpProfileId: string; // required
  websiteColumn: string; // required
}

export type JobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface LeadEnhancementJob {
  id: string;
  status: JobStatus;
  totalRows: number;
  processedRows: number;
  failedRows: number;
  creditsEstimated?: number | null;
  creditsUsed?: number | null;
  websiteColumn?: string;
  icpProfileId?: string | number;
  startedAt?: string;
  updatedAt?: string;
}

export interface JobRow {
  rowIndex: number;
  website: string;
  status: "pending" | "processing" | "completed" | "failed";
  errorMessage?: string;
  data?: Record<string, any>;
}

export const getActiveJob = async (): Promise<{
  job: LeadEnhancementJob | null;
}> => {
  const res = await apiClient.get("/lead-enhancement/jobs/active");
  const d = res?.data;
  const job = d?.payload?.job ?? d?.job ?? null;
  return { job };
};

export const createUploadJob = async (params: CreateUploadJobParams) => {
  const fd = new FormData();
  fd.append("file", params.file);
  fd.append("icpProfileId", params.icpProfileId);
  fd.append("websiteColumn", params.websiteColumn);
  const res = await apiClient.post("/lead-enhancement/jobs", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap(res) as { jobId: string };
};

export const getJob = async (id: string): Promise<LeadEnhancementJob> => {
  const res = await apiClient.get(`/lead-enhancement/jobs/${id}`);
  return unwrap(res);
};

export const getJobRows = async (
  id: string,
  cursor?: string,
  limit: number = 100
): Promise<{ rows: JobRow[]; nextCursor?: string }> => {
  const q = new URLSearchParams();
  if (cursor) q.set("cursor", cursor);
  q.set("limit", String(limit));
  const res = await apiClient.get(
    `/lead-enhancement/jobs/${id}/rows?${q.toString()}`
  );
  return unwrap(res);
};

export const getHistory = async (
  page: number = 1,
  limit: number = 10
): Promise<{
  data: LeadEnhancementJob[];
  total: number;
  page: number;
  limit: number;
}> => {
  async function request(url: string) {
    const res = await apiClient.get(url);
    const raw = unwrap(res);
    if (Array.isArray(raw)) {
      return {
        data: raw as LeadEnhancementJob[],
        total: raw.length,
        page,
        limit,
      };
    }
    if (raw && typeof raw === "object" && Array.isArray((raw as any).data)) {
      return raw as {
        data: LeadEnhancementJob[];
        total: number;
        page: number;
        limit: number;
      };
    }
    // Try reading wrapper directly if unwrap returned unexpected
    const d = res?.data;
    const p = d?.payload;
    if (p && Array.isArray(p.data)) {
      return {
        data: p.data,
        total: typeof p.total === "number" ? p.total : p.data.length,
        page: typeof p.page === "number" ? p.page : page,
        limit: typeof p.limit === "number" ? p.limit : limit,
      };
    }
    return { data: [], total: 0, page, limit };
  }

  const primaryUrl = `/lead-enhancement/jobs/history?page=${page}&limit=${limit}`;
  try {
    return await request(primaryUrl);
  } catch (err: any) {
    // Fallback to alternate path some environments may expose
    if (err?.response?.status === 404) {
      const altUrl = `/lead-enhancement/history?page=${page}&limit=${limit}`;
      try {
        return await request(altUrl);
      } catch (err2: any) {
        if (err2?.response?.status === 404) {
          return { data: [], total: 0, page, limit };
        }
        throw err2;
      }
    }
    throw err;
  }
};

export const downloadJobFile = async (
  id: string,
  format: "csv" | "xlsx" = "csv"
) => {
  const res = await apiClient.get(
    `/lead-enhancement/jobs/${id}/download?format=${format}`,
    { responseType: "blob" }
  );
  return res.data as Blob;
};
