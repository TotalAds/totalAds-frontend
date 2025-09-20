"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import QuickStart from "@/components/common/QuickStart";
import WelcomeModal from "@/components/tour/WelcomeModal";
import { useAuthContext } from "@/context/AuthContext";
import { useTourState } from "@/hooks/useTourState";
import { getCreditBalance } from "@/utils/api/creditsClient";
import { IconCreditCard, IconRocket, IconSparkles } from "@tabler/icons-react";

export default function Dashboard() {
  const { state } = useAuthContext();
  const { isAuthenticated, isLoading, user } = state;
  const { isFirstVisit } = useTourState();
  const router = useRouter();
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCredits();
    }
  }, [isAuthenticated]);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      const balance = await getCreditBalance();
      setCredits(Math.round(balance.currentBalance * 10) / 10); // Round to 1 decimal place
    } catch (error) {
      console.error("Failed to fetch credits:", error);
      setCredits(0);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-white mb-2">Loading...</h3>
        </div>
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
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Simple Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Hi {user?.name || "there"}! 👋
          </h1>
          <p className="text-2xl text-gray-300 mb-8">
            Find leads from any website in seconds
          </p>
        </div>

        {/* Credits Display - Simple */}
        <div className="text-center mb-12">
          <div
            data-tour="credits-display"
            className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-8 py-4"
          >
            <IconCreditCard className="w-6 h-6 text-green-400" />
            <span className="text-white text-lg font-semibold">
              {loading ? "..." : `${credits.toFixed(1)} credits left`}
            </span>
          </div>
        </div>

        {/* Main Action - Prominent */}
        <div className="mb-16" data-tour="quick-start">
          <QuickStart className="max-w-2xl mx-auto" />
        </div>

        {/* Simple 3-Step Guide */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            How it works ✨
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">1</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Paste URL</h3>
              <p className="text-gray-300">Copy any company website URL</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">2</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Click Go</h3>
              <p className="text-gray-300">Our AI analyzes the website</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">3</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Get Results</h3>
              <p className="text-gray-300">See company details instantly</p>
            </div>
          </div>
        </div>

        {/* Quick Links - Simplified */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/scraper/history"
            data-tour="history-link"
            className="flex items-center justify-center p-6 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-200 group"
          >
            <IconRocket className="w-8 h-8 text-purple-400 mr-4 group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="text-xl font-bold text-white">View History</h3>
              <p className="text-gray-300">See your past searches</p>
            </div>
          </Link>

          <Link
            href="/icp-profiles"
            data-tour="icp-link"
            className="flex items-center justify-center p-6 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-200 group"
          >
            <IconSparkles className="w-8 h-8 text-blue-400 mr-4 group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="text-xl font-bold text-white">Smart Profiles</h3>
              <p className="text-gray-300">Set your ideal customer</p>
            </div>
          </Link>
        </div>

        {/* Try Sample Button */}
        <div className="text-center mt-12">
          <Link
            href="/scraper?url=https://semrush.com"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-full transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <IconSparkles className="w-5 h-5" />
            Try with Sample Website
          </Link>
        </div>

        {/* Welcome Modal for new users */}
        <WelcomeModal isNewUser={isFirstVisit} />
      </div>
    </div>
  );
}
