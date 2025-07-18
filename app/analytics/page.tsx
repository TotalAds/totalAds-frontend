"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { useAuthContext } from "@/context/AuthContext";
import {
  IconChartBar,
  IconTrendingUp,
  IconClock,
  IconTarget,
  IconCalendar,
  IconDownload,
} from "@tabler/icons-react";

interface AnalyticsData {
  totalScrapes: number;
  successRate: number;
  averageProcessingTime: number;
  aiEnhancedScrapes: number;
  topDomains: Array<{ domain: string; count: number }>;
  dailyUsage: Array<{ date: string; count: number }>;
  monthlyTrends: Array<{ month: string; scrapes: number; success: number }>;
  errorTypes: Array<{ type: string; count: number }>;
}

export default function Analytics() {
  const { state } = useAuthContext();
  const { isAuthenticated, isLoading } = state;
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        
        // Mock data for now - in real implementation, fetch from API
        const mockData: AnalyticsData = {
          totalScrapes: 156,
          successRate: 94.2,
          averageProcessingTime: 2.3,
          aiEnhancedScrapes: 89,
          topDomains: [
            { domain: "example.com", count: 23 },
            { domain: "test.com", count: 18 },
            { domain: "demo.org", count: 15 },
            { domain: "sample.net", count: 12 },
            { domain: "website.io", count: 8 },
          ],
          dailyUsage: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            count: Math.floor(Math.random() * 10) + 1,
          })).reverse(),
          monthlyTrends: [
            { month: "Jan", scrapes: 45, success: 42 },
            { month: "Feb", scrapes: 52, success: 49 },
            { month: "Mar", scrapes: 59, success: 56 },
          ],
          errorTypes: [
            { type: "Timeout", count: 5 },
            { type: "Network Error", count: 3 },
            { type: "Parse Error", count: 2 },
            { type: "Rate Limited", count: 1 },
          ],
        };

        setAnalytics(mockData);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [isAuthenticated, timeRange]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Analytics Dashboard
              </h1>
              <p className="text-gray-300 text-lg">
                Detailed insights into your scraping performance and usage patterns.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/20">
                <IconDownload className="w-4 h-4 mr-2 text-white" />
                <span className="text-white">Export Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-medium">Total Scrapes</p>
                <p className="text-3xl font-bold text-white">
                  {analytics?.totalScrapes || 0}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                <IconChartBar className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-medium">Success Rate</p>
                <p className="text-3xl font-bold text-white">
                  {analytics?.successRate || 0}%
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                <IconTarget className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-medium">Avg Processing</p>
                <p className="text-3xl font-bold text-white">
                  {analytics?.averageProcessingTime || 0}s
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                <IconClock className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-medium">AI Enhanced</p>
                <p className="text-3xl font-bold text-white">
                  {analytics?.aiEnhancedScrapes || 0}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <IconTrendingUp className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Domains */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Top Scraped Domains
            </h2>
            <div className="space-y-4">
              {analytics?.topDomains.map((domain, index) => (
                <div key={domain.domain} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white font-semibold text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <span className="text-white font-medium">{domain.domain}</span>
                  </div>
                  <span className="text-gray-300">{domain.count} scrapes</span>
                </div>
              ))}
            </div>
          </div>

          {/* Error Analysis */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Error Analysis
            </h2>
            <div className="space-y-4">
              {analytics?.errorTypes.map((error, index) => (
                <div key={error.type} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                    <span className="text-white font-medium">{error.type}</span>
                  </div>
                  <span className="text-gray-300">{error.count} errors</span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-red-500/20 rounded-xl border border-red-500/30">
              <p className="text-red-200 text-sm">
                Total error rate: {((analytics?.errorTypes.reduce((sum, e) => sum + e.count, 0) || 0) / (analytics?.totalScrapes || 1) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Usage Trends */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Usage Trends
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {analytics?.monthlyTrends.map((trend) => (
              <div key={trend.month} className="bg-white/10 rounded-xl p-4 border border-white/20">
                <h3 className="text-white font-semibold mb-2">{trend.month}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Scrapes:</span>
                    <span className="text-white font-medium">{trend.scrapes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Success:</span>
                    <span className="text-green-400 font-medium">{trend.success}</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                      style={{ width: `${(trend.success / trend.scrapes) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
