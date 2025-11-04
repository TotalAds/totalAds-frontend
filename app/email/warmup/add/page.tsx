"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/AuthContext";
import warmupClient, { createWarmupAccount } from "@/utils/api/warmupClient";
import { IconArrowLeft } from "@tabler/icons-react";

export default function AddWarmupAccountPage() {
  const router = useRouter();
  const { state } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [prerequisites, setPrerequisites] = useState<any>(null);

  const [formData, setFormData] = useState({
    email: "",
    provider: "gmail" as const,
    displayName: "",
    dailyLimit: 50,
  });

  useEffect(() => {
    if (!state.isLoading && state.isAuthenticated && state.user) {
      if (!state.user.onboardingCompleted) {
        router.push("/onboarding");
        return;
      }
      checkPrerequisites();
    }
  }, [state.isLoading, state.isAuthenticated, state.user, router]);

  const checkPrerequisites = async () => {
    try {
      setLoading(true);
      const data = await warmupClient.get("/prerequisites");
      setPrerequisites(data.data);

      if (!data.data.canCreateWarmupAccount) {
        toast.error("Please complete prerequisites before adding an account");
        router.push("/email/warmup/accounts");
      }
    } catch (error: any) {
      console.error("Failed to check prerequisites:", error);
      toast.error("Failed to check prerequisites");
      router.push("/email/warmup/accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error("Email is required");
      return;
    }

    try {
      setCreating(true);
      await createWarmupAccount({
        email: formData.email,
        provider: formData.provider,
        displayName: formData.displayName || formData.email,
        dailyLimit: formData.dailyLimit,
      });

      toast.success("Warmup account created successfully");
      router.push("/email/warmup/accounts");
    } catch (error: any) {
      console.error("Failed to create account:", error);
      toast.error(error.response?.data?.error || "Failed to create account");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <p className="text-text-200">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-100">
      {/* Header */}
      <header className="backdrop-blur-xl bg-brand-main/5 border-b border-brand-main/10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/email/warmup/accounts"
            className="flex items-center gap-2 text-text-200 hover:text-text-100 transition mb-4"
          >
            <IconArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-3xl font-bold text-text-100">
            Add Warmup Account
          </h1>
          <p className="text-text-200 text-sm mt-1">
            Connect a new email account for warmup
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Address */}
          <div>
            <label className="block text-text-100 font-medium mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-3 bg-bg-300 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:border-brand-main"
              placeholder="sender@example.com"
              required
            />
            <p className="text-text-200 text-sm mt-2">
              Must be from a verified domain
            </p>
          </div>

          {/* Email Provider */}
          <div>
            <label className="block text-text-100 font-medium mb-2">
              Email Provider *
            </label>
            <select
              value={formData.provider}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  provider: e.target.value as any,
                })
              }
              className="w-full px-4 py-3 bg-bg-300 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:border-brand-main"
            >
              <option value="gmail">Gmail</option>
              <option value="outlook">Outlook</option>
              <option value="yahoo">Yahoo</option>
              <option value="zoho">Zoho</option>
              <option value="custom">Custom SMTP</option>
            </select>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-text-100 font-medium mb-2">
              Display Name (Optional)
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
              className="w-full px-4 py-3 bg-bg-300 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:border-brand-main"
              placeholder="My Gmail Account"
            />
          </div>

          {/* Daily Limit */}
          <div>
            <label className="block text-text-100 font-medium mb-2">
              Daily Warmup Limit
            </label>
            <input
              type="number"
              value={formData.dailyLimit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dailyLimit: parseInt(e.target.value),
                })
              }
              min="10"
              max="500"
              className="w-full px-4 py-3 bg-bg-300 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:border-brand-main"
            />
            <p className="text-text-200 text-sm mt-2">
              Recommended: 50-100 emails per day for best deliverability
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-6">
            <Link href="/email/warmup/accounts" className="flex-1">
              <Button className="w-full bg-bg-300 hover:bg-bg-300/80 text-text-100 px-6 py-3 rounded-lg transition">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={creating}
              className="flex-1 bg-brand-main hover:bg-brand-main/80 text-text-100 px-6 py-3 rounded-lg transition disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Account"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
