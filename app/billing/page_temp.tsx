"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { useAuthContext } from "@/context/AuthContext";
import {
  IconCalendar,
  IconCreditCard,
  IconCurrency,
  IconTrendingUp,
} from "@tabler/icons-react";

export default function Billing() {
  const { state } = useAuthContext();
  const { isAuthenticated, isLoading, user } = state;
  const router = useRouter();
  const [credits, setCredits] = useState(15);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      // Mock data - replace with real API call
      setTimeout(() => {
        setCredits(15);
        setLoading(false);
      }, 1000);
    }
  }, [isAuthenticated]);

  if (isLoading || loading) {
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
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Billing 💳</h1>
          <p className="text-xl text-gray-300 mb-8">
            Manage your credits and usage
          </p>
        </div>

        {/* Current Plan */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <IconCreditCard className="w-8 h-8 text-purple-400" />
            <h2 className="text-3xl font-bold text-white">Current Plan</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <IconTrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Free Plan</h3>
              <p className="text-gray-300">Perfect for getting started</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <IconCurrency className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{credits} Credits</h3>
              <p className="text-gray-300">Remaining this month</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <IconCalendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Resets Monthly</h3>
              <p className="text-gray-300">On the 1st of each month</p>
            </div>
          </div>
        </div>

        {/* Usage This Month */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-white mb-6">Usage This Month</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">API Calls Made</span>
              <span className="text-white font-semibold">5 / 20</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full" style={{ width: '25%' }}></div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">25% used</span>
              <span className="text-gray-400">15 credits remaining</span>
            </div>
          </div>
        </div>

        {/* Upgrade Options */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6">Need More Credits?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
              <h4 className="text-xl font-bold text-white mb-3">Pro Plan</h4>
              <p className="text-gray-300 mb-4">Pay-per-call billing</p>
              <ul className="space-y-2 text-gray-300 mb-6">
                <li>• $0.10 per API call</li>
                <li>• No monthly limits</li>
                <li>• Priority support</li>
              </ul>
              <button className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200">
                Upgrade to Pro
              </button>
            </div>
            <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
              <h4 className="text-xl font-bold text-white mb-3">Enterprise</h4>
              <p className="text-gray-300 mb-4">Custom solutions</p>
              <ul className="space-y-2 text-gray-300 mb-6">
                <li>• Custom pricing</li>
                <li>• Dedicated support</li>
                <li>• SLA guarantees</li>
              </ul>
              <button className="w-full px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
