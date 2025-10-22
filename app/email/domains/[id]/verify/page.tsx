"use client";

import Cookies from 'js-cookie';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import emailClient from '@/utils/api/emailClient';

export default function VerifyDomainPage() {
  const router = useRouter();
  const params = useParams();
  const domainId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [domainInfo, setDomainInfo] = useState<any>(null);
  const [dns, setDns] = useState<any>(null);

  useEffect(() => {
    // Fetch domain info and DNS records
    fetchDomainInfo();
    fetchDnsRecords();
  }, [domainId]);

  const fetchDnsRecords = async () => {
    try {
      const response = await emailClient.get(
        `/api/domains/${domainId}/dns-records`
      );
      if (response.data.success) {
        setDns(response.data.data);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to load DNS records";
      toast.error(errorMessage);
    }
  };

  const fetchDomainInfo = async () => {
    try {
      const response = await emailClient.get(`/api/domains/${domainId}`);
      if (response.data.success) {
        setDomainInfo(response.data.data);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to load domain";
      toast.error(errorMessage);
    }
  };

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await emailClient.post(
        `/api/domains/${domainId}/verify`,
        {}
      );

      if (response.data.success) {
        const data = response.data.data;
        if (data.verificationStatus === "verified") {
          toast.success("Domain verified successfully!");
          router.push("/email/domains");
        } else {
          toast.loading(
            "Domain verification is still pending. Please check AWS SES console."
          );
          setDomainInfo(data);
        }
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to check verification status";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/email/domains"
            className="text-purple-400 hover:text-purple-300 font-semibold"
          >
            ← Back to Domains
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Verify Domain
            </h1>
            <p className="text-gray-300">
              {domainInfo?.domain && `Verify ownership of ${domainInfo.domain}`}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleCheckStatus} className="space-y-6">
            {/* Status Display */}
            {domainInfo && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h3 className="text-blue-400 font-semibold mb-3">
                  Current Status:
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Verification Status:</span>
                    <span
                      className={`font-semibold ${
                        domainInfo.verificationStatus === "verified"
                          ? "text-green-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {domainInfo.verificationStatus || "pending"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">DKIM Status:</span>
                    <span
                      className={`font-semibold ${
                        domainInfo.dkimStatus === "verified" ||
                        domainInfo.dkimStatus === "Success"
                          ? "text-green-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {domainInfo.dkimStatus || "pending"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* DNS Records Section */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <h3 className="text-purple-400 font-semibold mb-3">
                DNS Records to Add:
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Add these records to your domain's DNS settings:
              </p>

              {/* TXT Record for Domain Identity */}
              {dns?.dnsRecords?.txt?.value && (
                <div className="mb-4">
                  <p className="text-gray-400 font-semibold mb-2">
                    TXT Record (Domain Identity):
                  </p>
                  <div className="bg-black/30 rounded p-2 font-mono text-xs">
                    <div className="text-gray-400">
                      <span className="text-blue-300">Name:</span> _amazonses.
                      {domainInfo?.domain}
                    </div>
                    <div className="text-gray-400 mt-1">
                      <span className="text-blue-300">Value:</span>{" "}
                      {dns.dnsRecords.txt.value}
                    </div>
                    <div className="text-gray-400 mt-1">
                      <span className="text-blue-300">Type:</span> TXT
                    </div>
                  </div>
                </div>
              )}

              {/* DKIM CNAME Records */}
              {((dns?.dnsRecords?.dkim?.length || 0) > 0
                ? dns?.dnsRecords?.dkim
                : domainInfo?.dkimTokens?.tokens || []) && (
                <div className="space-y-3">
                  <div className="text-sm">
                    <p className="text-gray-400 font-semibold mb-2">
                      DKIM Records (3 CNAME records):
                    </p>
                    {(
                      dns?.dnsRecords?.dkim || domainInfo?.dkimTokens?.tokens
                    )?.map((token: any, index: number) => {
                      const tokenStr =
                        typeof token === "string"
                          ? token
                          : token?.name?.split("._domainkey.")[0];
                      return (
                        <div
                          key={index}
                          className="bg-black/30 rounded p-2 mb-2 font-mono text-xs"
                        >
                          <div className="text-gray-400">
                            <span className="text-blue-300">Name:</span>{" "}
                            {tokenStr}._domainkey.{domainInfo?.domain}
                          </div>
                          <div className="text-gray-400 mt-1">
                            <span className="text-blue-300">Value:</span>{" "}
                            {tokenStr}.dkim.amazonses.com
                          </div>
                          <div className="text-gray-400 mt-1">
                            <span className="text-blue-300">Type:</span> CNAME
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <h3 className="text-green-400 font-semibold mb-2">
                Verification Steps:
              </h3>
              <ol className="text-green-300 text-sm space-y-2">
                <li>
                  1. Add the TXT record for domain identity (shown above).
                </li>
                <li>2. Add all three DKIM CNAME records (shown above).</li>
                <li>
                  3. Wait for DNS propagation (typically 5–30 minutes, up to
                  72h).
                </li>
                <li>4. Click "Check Verification Status" below.</li>
              </ol>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Checking Status..." : "Check Verification Status"}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-white/10"></div>
            <span className="px-3 text-gray-400 text-sm">or</span>
            <div className="flex-1 border-t border-white/10"></div>
          </div>

          {/* Back to Domains */}
          <p className="text-center text-gray-300">
            <Link
              href="/email/domains"
              className="text-green-400 hover:text-green-300 font-semibold transition"
            >
              Back to Domains
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Need help? Check our DNS setup guide
        </p>
      </main>
    </div>
  );
}
