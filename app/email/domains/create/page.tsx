"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import emailClient from "@/utils/api/emailClient";

export default function CreateDomainPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [domain, setDomain] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDomain(e.target.value);
    if (error) {
      setError("");
    }
  };

  const validateDomain = (): boolean => {
    if (!domain.trim()) {
      setError("Domain is required");
      return false;
    }

    // Basic domain validation
    const domainRegex =
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
    if (!domainRegex.test(domain)) {
      setError("Invalid domain format");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateDomain()) {
      return;
    }

    setLoading(true);

    try {
      const response = await emailClient.post("/api/domains", {
        domain: domain,
      });

      if (response.data.success) {
        toast.success("Domain created successfully!");
        // AWS SES verification email has been sent
        // Redirect to verification page to check status
        router.push(`/email/domains/${response.data.data.id}/verify`);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to create domain";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-100">
      {/* Header */}
      <header className="backdrop-blur-xl bg-brand-main/5 border-b border-brand-main/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/email/domains"
            className="text-brand-main hover:text-brand-secondary font-semibold"
          >
            ← Back to Domains
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-text-100"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-text-100 mb-2">
              Add New Domain
            </h1>
            <p className="text-text-200">
              Enter your domain to get started with email campaigns
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Domain Input */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Domain Name
              </label>
              <input
                type="text"
                value={domain}
                onChange={handleChange}
                placeholder="example.com"
                className="w-full px-4 py-3 bg-brand-main/5 border border-brand-main/10 rounded-lg text-text-100 placeholder-text-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                disabled={loading}
              />
              {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
              <p className="text-text-200 text-sm mt-2">
                Enter your domain without www (e.g., example.com)
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h3 className="text-blue-400 font-semibold mb-2">
                What happens next?
              </h3>
              <ul className="text-blue-300 text-sm space-y-1">
                <li>✓ We&apos;ll generate a verification token</li>
                <li>✓ You&apos;ll add DNS records to your domain</li>
                <li>✓ We&apos;ll verify your domain ownership</li>
                <li>✓ Your domain will be ready for sending emails</li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !domain}
              className="w-full mt-6 bg-brand-tertiary hover:bg-brand-tertiary/80 text-text-100 font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Creating Domain..." : "Create Domain"}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-brand-main/10"></div>
            <span className="px-3 text-text-200 text-sm">or</span>
            <div className="flex-1 border-t border-brand-main/10"></div>
          </div>

          {/* Back to Domains */}
          <p className="text-center text-text-200">
            Already have domains?{" "}
            <Link
              href="/email/domains"
              className="text-blue-400 hover:text-blue-300 font-semibold transition"
            >
              View All Domains
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-text-200 text-sm mt-6">
          Need help? Check our documentation for domain setup instructions
        </p>
      </main>
    </div>
  );
}
