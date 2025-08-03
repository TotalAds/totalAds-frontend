"use client";

import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { apiClient } from "@/utils/api";
import {
  IconAward,
  IconBrain,
  IconBulb,
  IconChartBar,
  IconRocket,
  IconSparkles,
  IconTarget,
  IconTrendingUp,
} from "@tabler/icons-react";

interface LearningMetrics {
  totalExtractions: number;
  successfulExtractions: number;
  averageQualityScore: number;
  averageConfidenceScore: number;
  improvementRate: number;
  costSavings: number;
  userSatisfactionScore: number;
  patternsDiscovered: number;
  promptsImproved: number;
  feedbackReceived: number;
}

interface PerformanceTrend {
  date: string;
  successRate: number;
  qualityScore: number;
  confidenceScore: number;
  userSatisfaction: number;
  extractionCount: number;
}

interface IndustryInsight {
  industry: string;
  extractionCount: number;
  successRate: number;
  averageQualityScore: number;
  topChallenges: string[];
  improvements: string[];
}

interface PromptPerformance {
  promptType: string;
  currentVersion: number;
  successRate: number;
  qualityScore: number;
  userSatisfaction: number;
  lastImproved: Date;
  improvementCount: number;
  status: "excellent" | "good" | "needs_improvement" | "poor";
}

const LearningAnalyticsPage = () => {
  const [metrics, setMetrics] = useState<LearningMetrics | null>(null);
  const [trends, setTrends] = useState<PerformanceTrend[]>([]);
  const [industryInsights, setIndustryInsights] = useState<IndustryInsight[]>(
    []
  );
  const [promptPerformance, setPromptPerformance] = useState<
    PromptPerformance[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/learning-analytics/dashboard");

      if (response.data.success) {
        const { data } = response.data;
        setMetrics(data.metrics);
        setTrends(data.trends);
        setIndustryInsights(data.industryInsights);
        setPromptPerformance(data.promptPerformance);
      } else {
        console.error("API returned unsuccessful response:", response.data);
        toast.error(response.data.error || "Failed to load learning analytics");
      }
    } catch (error: any) {
      console.error("Error fetching learning analytics:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to load learning analytics";
      toast.error(`Error: ${errorMessage}`);

      // For development, show more detailed error info
      if (process.env.NODE_ENV === "development") {
        console.error("Full error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: error.config,
        });
      }

      // Set fallback data to prevent UI crashes
      setMetrics({
        totalExtractions: 0,
        successfulExtractions: 0,
        averageQualityScore: 0,
        averageConfidenceScore: 0,
        improvementRate: 0,
        costSavings: 0,
        userSatisfactionScore: 0,
        patternsDiscovered: 0,
        promptsImproved: 0,
        feedbackReceived: 0,
      });
      setTrends([]);
      setIndustryInsights([]);
      setPromptPerformance([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-green-400 bg-green-500/20";
      case "good":
        return "text-blue-400 bg-blue-500/20";
      case "needs_improvement":
        return "text-yellow-400 bg-yellow-500/20";
      case "poor":
        return "text-red-400 bg-red-500/20";
      default:
        return "text-gray-400 bg-gray-500/20";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading AI Learning Insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <IconBrain className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              AI Learning Analytics
            </h1>
          </div>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Comprehensive insights into your AI-powered data extraction
            performance and continuous learning improvements
          </p>
        </motion.div>

        {/* Key Metrics Grid */}
        {metrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <IconTarget className="w-8 h-8 text-green-400" />
                <div>
                  <h3 className="text-white font-semibold">Success Rate</h3>
                  <p className="text-gray-400 text-sm">Extraction accuracy</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-green-400">
                {(
                  (metrics.successfulExtractions / metrics.totalExtractions) *
                  100
                ).toFixed(1)}
                %
              </div>
              <p className="text-gray-400 text-sm mt-2">
                {metrics.successfulExtractions} of {metrics.totalExtractions}{" "}
                extractions
              </p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <IconChartBar className="w-8 h-8 text-blue-400" />
                <div>
                  <h3 className="text-white font-semibold">Quality Score</h3>
                  <p className="text-gray-400 text-sm">Data quality rating</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-400">
                {(metrics.averageQualityScore * 100).toFixed(0)}%
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Average quality rating
              </p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <IconTrendingUp className="w-8 h-8 text-purple-400" />
                <div>
                  <h3 className="text-white font-semibold">Improvement</h3>
                  <p className="text-gray-400 text-sm">Learning progress</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-purple-400">
                +{(metrics.improvementRate * 100).toFixed(1)}%
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Performance improvement
              </p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <IconSparkles className="w-8 h-8 text-yellow-400" />
                <div>
                  <h3 className="text-white font-semibold">Cost Savings</h3>
                  <p className="text-gray-400 text-sm">Efficiency gains</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-yellow-400">
                ${metrics.costSavings.toFixed(2)}
              </div>
              <p className="text-gray-400 text-sm mt-2">Estimated savings</p>
            </div>
          </motion.div>
        )}

        {/* Learning Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Prompt Performance */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <IconRocket className="w-6 h-6 text-purple-400" />
              <h3 className="text-xl font-semibold text-white">
                Prompt Performance
              </h3>
            </div>
            <div className="space-y-4">
              {promptPerformance.map((prompt, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-white font-medium">
                        {prompt.promptType}
                      </h4>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          prompt.status
                        )}`}
                      >
                        {prompt.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                      <span>
                        Success: {(prompt.successRate * 100).toFixed(0)}%
                      </span>
                      <span>
                        Quality: {(prompt.qualityScore * 100).toFixed(0)}%
                      </span>
                      <span>v{prompt.currentVersion}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Improvements</div>
                    <div className="text-lg font-semibold text-white">
                      {prompt.improvementCount}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Industry Insights */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <IconBulb className="w-6 h-6 text-yellow-400" />
              <h3 className="text-xl font-semibold text-white">
                Industry Insights
              </h3>
            </div>
            <div className="space-y-4">
              {industryInsights.map((insight, index) => (
                <div key={index} className="p-4 bg-gray-800/50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-medium">
                      {insight.industry}
                    </h4>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Success Rate</div>
                      <div className="text-lg font-semibold text-green-400">
                        {(insight.successRate * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Extractions:</span>
                      <span className="text-white ml-2">
                        {insight.extractionCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Quality:</span>
                      <span className="text-white ml-2">
                        {(insight.averageQualityScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Learning Stats */}
        {metrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <IconAward className="w-6 h-6 text-purple-400" />
              <h3 className="text-xl font-semibold text-white">
                Learning Progress
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  {metrics.patternsDiscovered}
                </div>
                <div className="text-gray-300">Patterns Discovered</div>
                <div className="text-sm text-gray-400 mt-1">
                  New extraction patterns learned
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {metrics.promptsImproved}
                </div>
                <div className="text-gray-300">Prompts Improved</div>
                <div className="text-sm text-gray-400 mt-1">
                  AI prompts optimized
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {metrics.feedbackReceived}
                </div>
                <div className="text-gray-300">Feedback Received</div>
                <div className="text-sm text-gray-400 mt-1">
                  User feedback processed
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LearningAnalyticsPage;
