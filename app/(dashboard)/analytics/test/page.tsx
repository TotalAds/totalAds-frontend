"use client";

import React, { useState } from "react";
import { apiClient } from "@/utils/api";
import { toast } from "react-hot-toast";

const TestAnalyticsPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testHealthEndpoint = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/learning-analytics/health");
      setResult({ type: "health", data: response.data });
      toast.success("Health check successful!");
    } catch (error: any) {
      console.error("Health check failed:", error);
      setResult({ type: "error", data: error.response?.data || error.message });
      toast.error("Health check failed");
    } finally {
      setLoading(false);
    }
  };

  const testDashboardEndpoint = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/learning-analytics/dashboard");
      setResult({ type: "dashboard", data: response.data });
      toast.success("Dashboard data fetched successfully!");
    } catch (error: any) {
      console.error("Dashboard fetch failed:", error);
      setResult({ type: "error", data: error.response?.data || error.message });
      toast.error("Dashboard fetch failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Learning Analytics API Test</h1>
          <p className="text-gray-300">Test the learning analytics API endpoints</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={testHealthEndpoint}
            disabled={loading}
            className="p-6 bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl hover:border-gray-600/50 transition-all duration-300 text-white"
          >
            <h3 className="text-lg font-semibold mb-2">Test Health Endpoint</h3>
            <p className="text-gray-400 text-sm">GET /learning-analytics/health</p>
          </button>

          <button
            onClick={testDashboardEndpoint}
            disabled={loading}
            className="p-6 bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl hover:border-gray-600/50 transition-all duration-300 text-white"
          >
            <h3 className="text-lg font-semibold mb-2">Test Dashboard Endpoint</h3>
            <p className="text-gray-400 text-sm">GET /learning-analytics/dashboard</p>
          </button>
        </div>

        {loading && (
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-white mt-2">Testing...</p>
          </div>
        )}

        {result && (
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Result ({result.type})
            </h3>
            <pre className="bg-gray-800/50 p-4 rounded-lg text-sm text-gray-300 overflow-auto max-h-96">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestAnalyticsPage;
