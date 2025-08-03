"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import React from "react";

import {
  IconArrowRight,
  IconBrain,
  IconChartBar,
  IconRocket,
  IconSparkles,
  IconTarget,
  IconTrendingUp,
} from "@tabler/icons-react";

const AnalyticsPage = () => {
  const analyticsCards = [
    {
      title: "Learning Insights",
      description:
        "AI performance metrics, learning progress, and improvement trends",
      icon: <IconBrain className="w-8 h-8" />,
      href: "/analytics/learning",
      gradient: "from-purple-500 to-pink-500",
      features: [
        "AI Learning Progress",
        "Prompt Performance",
        "Industry Insights",
        "Cost Optimization",
      ],
      isNew: true,
    },

    {
      title: "Usage Analytics",
      description:
        "API usage patterns, credit consumption, and billing insights",
      icon: <IconTrendingUp className="w-8 h-8" />,
      href: "/analytics/usage",
      gradient: "from-green-500 to-emerald-500",
      features: [
        "API Usage Trends",
        "Credit Consumption",
        "Cost Analysis",
        "Usage Forecasting",
      ],
    },
    {
      title: "Business Intelligence",
      description: "Industry trends, competitive analysis, and market insights",
      icon: <IconTarget className="w-8 h-8" />,
      href: "/analytics/business",
      gradient: "from-orange-500 to-red-500",
      features: [
        "Industry Trends",
        "Market Analysis",
        "Competitive Insights",
        "Lead Quality Scoring",
      ],
    },
  ];

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
              <IconChartBar className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              Analytics Dashboard
            </h1>
          </div>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Comprehensive analytics and insights for your AI-powered data
            extraction platform
          </p>
        </motion.div>

        {/* Analytics Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {analyticsCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              className="group"
            >
              <Link href={card.href}>
                <div className="relative bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 hover:border-gray-600/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden">
                  {/* Background Gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}
                  />

                  {/* New Badge */}
                  {card.isNew && (
                    <div className="absolute top-4 right-4">
                      <motion.span
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="px-3 py-1 text-xs font-semibold bg-red-500/20 text-red-300 rounded-full border border-red-500/30"
                      >
                        NEW
                      </motion.span>
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-start space-x-4 mb-6">
                    <div
                      className={`w-16 h-16 bg-gradient-to-r ${card.gradient} rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}
                    >
                      {card.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all duration-300">
                        {card.title}
                      </h3>
                      <p className="text-gray-300 leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {card.features.map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="flex items-center space-x-3"
                      >
                        <div
                          className={`w-2 h-2 bg-gradient-to-r ${card.gradient} rounded-full`}
                        />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">
                      Click to explore
                    </span>
                    <div className="flex items-center space-x-2 text-gray-300 group-hover:text-white transition-colors duration-300">
                      <span className="text-sm font-medium">
                        View Analytics
                      </span>
                      <IconArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8"
        >
          <div className="flex items-center space-x-3 mb-6">
            <IconRocket className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">
              Platform Overview
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                98.5%
              </div>
              <div className="text-gray-300">Uptime</div>
              <div className="text-sm text-gray-400 mt-1">Last 30 days</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">2.3s</div>
              <div className="text-gray-300">Avg Response</div>
              <div className="text-sm text-gray-400 mt-1">
                API response time
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">15K+</div>
              <div className="text-gray-300">Extractions</div>
              <div className="text-sm text-gray-400 mt-1">This month</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                4.8/5
              </div>
              <div className="text-gray-300">Satisfaction</div>
              <div className="text-sm text-gray-400 mt-1">User rating</div>
            </div>
          </div>
        </motion.div>

        {/* Coming Soon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-8 text-center"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <IconSparkles className="w-8 h-8 text-yellow-400" />
            <h3 className="text-2xl font-bold text-white">
              More Analytics Coming Soon
            </h3>
          </div>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            We're continuously adding new analytics features including real-time
            monitoring, advanced reporting, custom dashboards, and predictive
            insights.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Real-time Monitoring",
              "Custom Reports",
              "Predictive Analytics",
              "Advanced Filtering",
            ].map((feature) => (
              <span
                key={feature}
                className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm border border-purple-500/30"
              >
                {feature}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
