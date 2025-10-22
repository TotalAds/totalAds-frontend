"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Credits, getCredits } from '@/utils/api/emailClient';
import { tokenStorage } from '@/utils/auth/tokenStorage';

export default function CreditsPage() {
  const router = useRouter();
  const [credits, setCredits] = useState<Credits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      const data = await getCredits();
      setCredits(data);
    } catch (error: any) {
      console.error("Error fetching credits:", error);

      // Handle authentication errors
      if (error.response?.status === 401) {
        toast.error("Your session has expired. Please sign in again.");
        tokenStorage.removeTokens();
        router.push("/login");
        return;
      }

      toast.error(error.response?.data?.message || "Failed to fetch credits");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-white">Email Credits</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your email credits
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-300">Loading credits...</p>
            </div>
          </div>
        ) : !credits ? (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Credit Data
            </h3>
            <p className="text-gray-400">Unable to load credit information</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Credit Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Current Balance",
                  value: credits.balance || 0,
                  color: "from-green-500 to-emerald-500",
                  icon: "💰",
                },
                {
                  label: "Total Credits",
                  value: credits.total || 0,
                  color: "from-blue-500 to-cyan-500",
                  icon: "🛒",
                },
                {
                  label: "Total Used",
                  value: credits.used || 0,
                  color: "from-yellow-500 to-orange-500",
                  icon: "📧",
                },
                {
                  label: "Remaining",
                  value: (credits.balance || 0) - (credits.used || 0),
                  color: "from-purple-500 to-pink-500",
                  icon: "✨",
                },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-gray-500 text-xs mt-2">Credits</p>
                </div>
              ))}
            </div>

            {/* Purchase Credits Section */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                Purchase Credits
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { amount: 100, price: "$10", popular: false },
                  { amount: 500, price: "$40", popular: true },
                  { amount: 1000, price: "$70", popular: false },
                ].map((plan, idx) => (
                  <div
                    key={idx}
                    className={`backdrop-blur-xl border rounded-xl p-6 transition ${
                      plan.popular
                        ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400"
                        : "bg-white/5 border-white/20 hover:bg-white/10"
                    }`}
                  >
                    {plan.popular && (
                      <div className="mb-4">
                        <span className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          POPULAR
                        </span>
                      </div>
                    )}
                    <p className="text-3xl font-bold text-white mb-2">
                      {plan.amount}
                    </p>
                    <p className="text-gray-400 text-sm mb-4">Credits</p>
                    <p className="text-2xl font-bold text-white mb-6">
                      {plan.price}
                    </p>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition">
                      Purchase
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
