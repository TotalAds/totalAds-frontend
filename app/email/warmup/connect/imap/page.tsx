"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/AuthContext";
import emailClient from "@/utils/api/emailClient";
import {
  IconArrowLeft,
  IconCheck,
  IconX,
  IconLoader,
  IconShieldCheck,
  IconPlugConnected,
  IconMail,
  IconServer,
  IconLock,
} from "@tabler/icons-react";

type Provider = "yahoo" | "custom";

interface ImapSmtpFormData {
  email: string;
  displayName: string;
  username: string;
  mailDisplayName: string;
  timezone: string;
  dailyLimit: number;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  imapHost: string;
  imapPort: number;
  imapUsername: string;
  imapPassword: string;
}

interface ConnectionTestResult {
  smtp: "pending" | "testing" | "success" | "error";
  imap: "pending" | "testing" | "success" | "error";
  smtpError?: string;
  imapError?: string;
}

const PROVIDER_DEFAULTS: Record<
  Provider,
  {
    name: string;
    smtpHost: string;
    smtpPort: number;
    imapHost: string;
    imapPort: number;
  }
> = {
  yahoo: {
    name: "Yahoo Mail",
    smtpHost: "smtp.mail.yahoo.com",
    smtpPort: 587,
    imapHost: "imap.mail.yahoo.com",
    imapPort: 993,
  },
  custom: {
    name: "Custom SMTP",
    smtpHost: "",
    smtpPort: 587,
    imapHost: "",
    imapPort: 993,
  },
};

export default function ImapSmtpConfigPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state } = useAuthContext();

  const provider = (searchParams.get("provider") as Provider) || "custom";
  const emailParam = searchParams.get("email") || "";
  const defaults = PROVIDER_DEFAULTS[provider];

  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTest, setConnectionTest] = useState<ConnectionTestResult>({
    smtp: "pending",
    imap: "pending",
  });
  const [formData, setFormData] = useState<ImapSmtpFormData>({
    email: emailParam,
    displayName: "",
    username: emailParam.split("@")[0] || "",
    mailDisplayName: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    dailyLimit: 10,
    smtpHost: defaults.smtpHost,
    smtpPort: defaults.smtpPort,
    smtpUsername: emailParam,
    smtpPassword: "",
    imapHost: defaults.imapHost,
    imapPort: defaults.imapPort,
    imapUsername: emailParam,
    imapPassword: "",
  });

  useEffect(() => {
    if (!state.isLoading && state.isAuthenticated && state.user) {
      if (!state.user.onboardingCompleted) {
        router.push("/onboarding");
        return;
      }
    }
  }, [state.isLoading, state.isAuthenticated, state.user, router]);

  // Check if email is provided (required for verified sender)
  useEffect(() => {
    if (!emailParam) {
      toast.error("Please select a verified sender first");
      router.push("/email/warmup/connect");
    }
  }, [emailParam, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "dailyLimit" || name === "smtpPort" || name === "imapPort"
          ? parseInt(value) || 0
          : value,
    }));
    // Reset connection test when credentials change
    if (
      name.includes("smtp") ||
      name.includes("imap") ||
      name === "email"
    ) {
      setConnectionTest({ smtp: "pending", imap: "pending" });
    }
  };

  const validateForm = (): boolean => {
    if (!formData.email) {
      toast.error("Email address is required");
      return false;
    }

    if (!formData.mailDisplayName) {
      toast.error("Mail Display Name is required");
      return false;
    }

    if (!formData.username) {
      toast.error("Username is required");
      return false;
    }

    if (!formData.timezone) {
      toast.error("Timezone is required");
      return false;
    }

    if (
      !formData.dailyLimit ||
      formData.dailyLimit < 5 ||
      formData.dailyLimit > 150
    ) {
      toast.error("Daily limit must be between 5 and 150");
      return false;
    }

    // SMTP validation
    if (
      !formData.smtpHost ||
      !formData.smtpPort ||
      !formData.smtpUsername ||
      !formData.smtpPassword
    ) {
      toast.error("All SMTP fields are required");
      return false;
    }

    // IMAP validation
    if (
      !formData.imapHost ||
      !formData.imapPort ||
      !formData.imapUsername ||
      !formData.imapPassword
    ) {
      toast.error("All IMAP fields are required");
      return false;
    }

    return true;
  };

  const handleTestConnection = async () => {
    if (!validateForm()) return;

    try {
      setTestingConnection(true);
      setConnectionTest({
        smtp: "testing",
        imap: "testing",
      });

      // Call backend to test connection
      const response = await emailClient.post(
        `/api/warmup/oauth/test-connection`,
        {
          provider,
          email: formData.email,
          smtpHost: formData.smtpHost,
          smtpPort: formData.smtpPort,
          smtpUsername: formData.smtpUsername,
          smtpPassword: formData.smtpPassword,
          imapHost: formData.imapHost,
          imapPort: formData.imapPort,
          imapUsername: formData.imapUsername,
          imapPassword: formData.imapPassword,
        }
      );

      const result = response.data;

      setConnectionTest({
        smtp: result.data?.smtp?.success ? "success" : "error",
        imap: result.data?.imap?.success ? "success" : "error",
        smtpError: result.data?.smtp?.error,
        imapError: result.data?.imap?.error,
      });

      if (result.data?.smtp?.success && result.data?.imap?.success) {
        toast.success("Connection test successful! You can now connect your account.");
      } else {
        const errors = [];
        if (!result.data?.smtp?.success) errors.push(`SMTP: ${result.data?.smtp?.error || "Connection failed"}`);
        if (!result.data?.imap?.success) errors.push(`IMAP: ${result.data?.imap?.error || "Connection failed"}`);
        toast.error(errors.join("\n"));
      }
    } catch (error: any) {
      console.error("Connection test failed:", error);
      setConnectionTest({
        smtp: "error",
        imap: "error",
        smtpError: error?.response?.data?.message || "Test failed",
        imapError: error?.response?.data?.message || "Test failed",
      });
      toast.error(
        error?.response?.data?.message || "Connection test failed. Please check your credentials."
      );
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Check if connection test passed
    if (connectionTest.smtp !== "success" || connectionTest.imap !== "success") {
      toast.error("Please test your connection first before proceeding.");
      return;
    }

    try {
      setLoading(true);
      const toastId = toast.loading("Connecting account...");

      // Call backend API using emailClient
      const response = await emailClient.post(
        `/api/warmup/oauth/imap-smtp/${provider}`,
        {
          code: formData.email, // Backend uses 'code' field for email
          displayName: formData.displayName || formData.email,
          dailyLimit: formData.dailyLimit,
          smtpHost: formData.smtpHost,
          smtpPort: formData.smtpPort,
          smtpUsername: formData.smtpUsername,
          smtpPassword: formData.smtpPassword,
          imapHost: formData.imapHost,
          imapPort: formData.imapPort,
          imapUsername: formData.imapUsername,
          imapPassword: formData.imapPassword,
        }
      );

      toast.dismiss(toastId);

      if (response.data?.success) {
        toast.success("Account connected successfully!");
        // Redirect to accounts page after 1 second
        setTimeout(() => {
          router.push("/email/warmup/accounts");
        }, 1000);
      } else {
        throw new Error(response.data?.message || "Failed to connect account");
      }
    } catch (error: any) {
      console.error("Failed to connect account:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to connect account. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const ConnectionStatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "success":
        return <IconCheck className="w-5 h-5 text-green-400" />;
      case "error":
        return <IconX className="w-5 h-5 text-red-400" />;
      case "testing":
        return <IconLoader className="w-5 h-5 text-yellow-400 animate-spin" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-text-300" />;
    }
  };

  const isConnectionTestPassed =
    connectionTest.smtp === "success" && connectionTest.imap === "success";

  return (
    <div className="min-h-screen bg-bg-100">
      {/* Header */}
      <header className="backdrop-blur-xl bg-brand-main/5 border-b border-brand-main/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/email/warmup/connect"
            className="inline-flex items-center gap-2 text-text-200 hover:text-text-100 transition mb-4"
          >
            <IconArrowLeft className="w-4 h-4" />
            Back to Provider Selection
          </Link>
          <h1 className="text-3xl font-bold text-text-100">
            Configure {defaults.name}
          </h1>
          <p className="text-text-200 text-sm mt-1">
            Enter your IMAP/SMTP credentials and test the connection
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Verified Sender Badge */}
          {emailParam && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-xl bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-center gap-3"
            >
              <IconShieldCheck className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-green-400 font-medium">Verified Sender</p>
                <p className="text-text-200 text-sm">{emailParam}</p>
              </div>
            </motion.div>
          )}

          {/* Account Information */}
          <div className="backdrop-blur-xl bg-brand-main/5 border border-brand-main/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <IconMail className="w-6 h-6 text-brand-main" />
              <h2 className="text-xl font-bold text-text-100">
                Account Information
              </h2>
            </div>
            <div className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-sm font-semibold text-text-100 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your-email@example.com"
                  className="w-full px-4 py-3 bg-bg-200 border border-bg-300 rounded-lg text-text-100 placeholder-text-300 focus:outline-none focus:border-brand-main transition opacity-70 cursor-not-allowed"
                  required
                  disabled
                />
                <p className="text-text-300 text-xs mt-1">
                  Email from your verified sender (cannot be changed)
                </p>
              </div>

              {/* Mail Display Name */}
              <div>
                <label className="block text-sm font-semibold text-text-100 mb-2">
                  Mail Display Name *
                </label>
                <input
                  type="text"
                  name="mailDisplayName"
                  value={formData.mailDisplayName}
                  onChange={handleInputChange}
                  placeholder="e.g., John Smith"
                  className="w-full px-4 py-3 bg-bg-200 border border-bg-300 rounded-lg text-text-100 placeholder-text-300 focus:outline-none focus:border-brand-main transition"
                  required
                />
                <p className="text-text-300 text-xs mt-1">
                  The name that appears in the "From" field of emails
                </p>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-text-100 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="e.g., john (local part before @)"
                  className="w-full px-4 py-3 bg-bg-200 border border-bg-300 rounded-lg text-text-100 placeholder-text-300 focus:outline-none focus:border-brand-main transition"
                  required
                />
                <p className="text-text-300 text-xs mt-1">
                  The local part of your email address (before @)
                </p>
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-sm font-semibold text-text-100 mb-2">
                  Timezone *
                </label>
                <input
                  type="text"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  placeholder="e.g., Asia/Kolkata, America/New_York"
                  className="w-full px-4 py-3 bg-bg-200 border border-bg-300 rounded-lg text-text-100 placeholder-text-300 focus:outline-none focus:border-brand-main transition"
                  required
                />
                <p className="text-text-300 text-xs mt-1">
                  IANA timezone for scheduling warmup emails during working
                  hours
                </p>
              </div>

              {/* Display Name (Optional) */}
              <div>
                <label className="block text-sm font-semibold text-text-100 mb-2">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="e.g., Sales Account 1"
                  className="w-full px-4 py-3 bg-bg-200 border border-bg-300 rounded-lg text-text-100 placeholder-text-300 focus:outline-none focus:border-brand-main transition"
                />
                <p className="text-text-300 text-xs mt-1">
                  A friendly name to identify this account in your dashboard
                </p>
              </div>

              {/* Daily Limit */}
              <div>
                <label className="block text-sm font-semibold text-text-100 mb-2">
                  Daily Warmup Limit *
                </label>
                <input
                  type="number"
                  name="dailyLimit"
                  value={formData.dailyLimit}
                  onChange={handleInputChange}
                  min="5"
                  max="150"
                  className="w-full px-4 py-3 bg-bg-200 border border-bg-300 rounded-lg text-text-100 placeholder-text-300 focus:outline-none focus:border-brand-main transition"
                  required
                />
                <p className="text-text-300 text-xs mt-1">
                  Number of warmup emails to send per day (5-150)
                </p>
              </div>
            </div>
          </div>

          {/* SMTP Configuration */}
          <div className="backdrop-blur-xl bg-brand-main/5 border border-brand-main/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <IconServer className="w-6 h-6 text-brand-main" />
                <h2 className="text-xl font-bold text-text-100">
                  SMTP Configuration
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <ConnectionStatusIcon status={connectionTest.smtp} />
                <span className={`text-sm ${
                  connectionTest.smtp === "success" ? "text-green-400" :
                  connectionTest.smtp === "error" ? "text-red-400" :
                  connectionTest.smtp === "testing" ? "text-yellow-400" :
                  "text-text-300"
                }`}>
                  {connectionTest.smtp === "success" ? "Connected" :
                   connectionTest.smtp === "error" ? "Failed" :
                   connectionTest.smtp === "testing" ? "Testing..." :
                   "Not tested"}
                </span>
              </div>
            </div>
            {connectionTest.smtpError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {connectionTest.smtpError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-text-100 mb-2">
                  SMTP Host *
                </label>
                <input
                  type="text"
                  name="smtpHost"
                  value={formData.smtpHost}
                  onChange={handleInputChange}
                  placeholder="smtp.example.com"
                  className="w-full px-4 py-3 bg-bg-200 border border-bg-300 rounded-lg text-text-100 placeholder-text-300 focus:outline-none focus:border-brand-main transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-100 mb-2">
                  SMTP Port *
                </label>
                <input
                  type="number"
                  name="smtpPort"
                  value={formData.smtpPort}
                  onChange={handleInputChange}
                  placeholder="587"
                  className="w-full px-4 py-3 bg-bg-200 border border-bg-300 rounded-lg text-text-100 placeholder-text-300 focus:outline-none focus:border-brand-main transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-100 mb-2">
                  SMTP Username *
                </label>
                <input
                  type="text"
                  name="smtpUsername"
                  value={formData.smtpUsername}
                  onChange={handleInputChange}
                  placeholder="your-email@example.com"
                  className="w-full px-4 py-3 bg-bg-200 border border-bg-300 rounded-lg text-text-100 placeholder-text-300 focus:outline-none focus:border-brand-main transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-100 mb-2">
                  SMTP Password *
                </label>
                <input
                  type="password"
                  name="smtpPassword"
                  value={formData.smtpPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-bg-200 border border-bg-300 rounded-lg text-text-100 placeholder-text-300 focus:outline-none focus:border-brand-main transition"
                  required
                />
              </div>
            </div>
          </div>

          {/* IMAP Configuration */}
          <div className="backdrop-blur-xl bg-brand-main/5 border border-brand-main/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <IconLock className="w-6 h-6 text-brand-main" />
                <h2 className="text-xl font-bold text-text-100">
                  IMAP Configuration
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <ConnectionStatusIcon status={connectionTest.imap} />
                <span className={`text-sm ${
                  connectionTest.imap === "success" ? "text-green-400" :
                  connectionTest.imap === "error" ? "text-red-400" :
                  connectionTest.imap === "testing" ? "text-yellow-400" :
                  "text-text-300"
                }`}>
                  {connectionTest.imap === "success" ? "Connected" :
                   connectionTest.imap === "error" ? "Failed" :
                   connectionTest.imap === "testing" ? "Testing..." :
                   "Not tested"}
                </span>
              </div>
            </div>
            {connectionTest.imapError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {connectionTest.imapError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-text-100 mb-2">
                  IMAP Host *
                </label>
                <input
                  type="text"
                  name="imapHost"
                  value={formData.imapHost}
                  onChange={handleInputChange}
                  placeholder="imap.example.com"
                  className="w-full px-4 py-3 bg-bg-200 border border-bg-300 rounded-lg text-text-100 placeholder-text-300 focus:outline-none focus:border-brand-main transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-100 mb-2">
                  IMAP Port *
                </label>
                <input
                  type="number"
                  name="imapPort"
                  value={formData.imapPort}
                  onChange={handleInputChange}
                  placeholder="993"
                  className="w-full px-4 py-3 bg-bg-200 border border-bg-300 rounded-lg text-text-100 placeholder-text-300 focus:outline-none focus:border-brand-main transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-100 mb-2">
                  IMAP Username *
                </label>
                <input
                  type="text"
                  name="imapUsername"
                  value={formData.imapUsername}
                  onChange={handleInputChange}
                  placeholder="your-email@example.com"
                  className="w-full px-4 py-3 bg-bg-200 border border-bg-300 rounded-lg text-text-100 placeholder-text-300 focus:outline-none focus:border-brand-main transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-100 mb-2">
                  IMAP Password *
                </label>
                <input
                  type="password"
                  name="imapPassword"
                  value={formData.imapPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-bg-200 border border-bg-300 rounded-lg text-text-100 placeholder-text-300 focus:outline-none focus:border-brand-main transition"
                  required
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Test Connection Button */}
            <Button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection || loading}
              className="w-full bg-bg-300 hover:bg-bg-300/80 text-text-100 px-6 py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {testingConnection ? (
                <>
                  <IconLoader className="w-5 h-5 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <IconPlugConnected className="w-5 h-5" />
                  Test Connection
                </>
              )}
            </Button>

            <div className="flex gap-4">
              <Button
                type="button"
                onClick={() => router.push("/email/warmup/connect")}
                className="flex-1 bg-bg-300 hover:bg-bg-300/80 text-text-100 px-6 py-3 rounded-lg transition"
                disabled={loading || testingConnection}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className={`flex-1 px-6 py-3 rounded-lg transition flex items-center justify-center gap-2 ${
                  isConnectionTestPassed
                    ? "bg-brand-main hover:bg-brand-main/80 text-text-100"
                    : "bg-bg-300 text-text-300 cursor-not-allowed"
                }`}
                disabled={loading || testingConnection || !isConnectionTestPassed}
              >
                {loading ? (
                  <>
                    <IconLoader className="w-5 h-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <IconCheck className="w-5 h-5" />
                    Connect Account
                  </>
                )}
              </Button>
            </div>

            {!isConnectionTestPassed && (
              <p className="text-center text-text-300 text-sm">
                Please test your connection before connecting the account
              </p>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
