"use client";

import axios from "axios";

import apiClient from "./apiClient";

export interface RecentActivityItem {
  timestamp: string;
  endpoint: string;
  status: number;
}

export interface DashboardStatsResponse {
  user: any;
  usage: any;
  billing: any;
  tokens: any;
  analytics: {
    topEndpoints: { endpoint: string; count: number }[];
    recentActivity: RecentActivityItem[];
  };
}

export const getDashboardStats = async (): Promise<DashboardStatsResponse> => {
  try {
    const res = await apiClient.get("/users/dashboard-stats", {
      withCredentials: true,
    });
    const raw = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
    const payload = raw?.payload?.data ?? raw?.data ?? raw;
    return payload as DashboardStatsResponse;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message;
      throw new Error(msg || "Failed to fetch dashboard stats");
    }
    throw error;
  }
};
