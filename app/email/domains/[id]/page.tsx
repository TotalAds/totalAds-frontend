"use client";

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import emailClient from '@/utils/api/emailClient';

interface Domain {
  id: string;
  domain: string;
  verificationStatus: string;
  dkimStatus: string;
  sesIdentityArn?: string;
  mailFromDomain?: string;
  dkimTokens?: any;
  sendingQuota?: any;
  createdAt: string;
  updatedAt: string;
}

export default function DomainDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const domainId = params.id as string;

  const [domain, setDomain] = useState<Domain | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDomain();
  }, [domainId]);

  const fetchDomain = async () => {
    try {
      setLoading(true);
      const response = await emailClient.get(`/api/domains/${domainId}`);
      if (response.data.success) {
        setDomain(response.data.data);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to load domain";
      toast.error(errorMessage);
      router.push("/emails/domains");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      verified: { bg: "bg-green-500/20", text: "text-green-400" },
      pending: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
      failed: { bg: "bg-red-500/20", text: "text-red-400" },
    };

    const statusStyle = statusMap[status] || statusMap.pending;

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-semibold ${statusStyle.bg} ${statusStyle.text}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading domain...</p>
        </div>
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <p className="text-gray-300">Domain not found</p>
          <Link
            href="/email/domains"
            className="text-purple-400 hover:text-purple-300 mt-4 inline-block"
          >
            Back to Domains
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <Link
              href="/email/domains"
              className="text-purple-400 hover:text-purple-300 font-semibold mb-2 inline-block"
            >
              ← Back to Domains
            </Link>
            <h1 className="text-2xl font-bold text-white">{domain.domain}</h1>
          </div>
          <div className="flex gap-3">
            <Link href={`/email/domains/${domain.id}/verify`}>
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2 rounded-lg transition">
                Verify Domain
              </Button>
            </Link>
            <Link href={`/email/domains/${domain.id}/senders`}>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg transition">
                Email Senders
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Verification Status */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Verification Status
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Domain Verification</span>
              {getStatusBadge(domain.verificationStatus)}
            </div>
            <p className="text-gray-400 text-sm mt-2">
              {domain.verificationStatus === "verified"
                ? "Your domain has been verified"
                : "Pending verification. Add DNS records to verify."}
            </p>
          </div>

          {/* DKIM Status */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              DKIM Status
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">DKIM Configuration</span>
              {getStatusBadge(domain.dkimStatus)}
            </div>
            <p className="text-gray-400 text-sm mt-2">
              {domain.dkimStatus === "verified"
                ? "DKIM is configured and verified"
                : "DKIM configuration pending"}
            </p>
          </div>
        </div>

        {/* Domain Information */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            Domain Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm">Domain</label>
              <p className="text-white font-mono">{domain.domain}</p>
            </div>
            {domain.sesIdentityArn && (
              <div>
                <label className="text-gray-400 text-sm">
                  SES Identity ARN
                </label>
                <p className="text-white font-mono text-sm break-all">
                  {domain.sesIdentityArn}
                </p>
              </div>
            )}
            {domain.mailFromDomain && (
              <div>
                <label className="text-gray-400 text-sm">
                  Mail From Domain
                </label>
                <p className="text-white font-mono">{domain.mailFromDomain}</p>
              </div>
            )}
            <div>
              <label className="text-gray-400 text-sm">Created</label>
              <p className="text-white">
                {new Date(domain.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* DNS Records */}
        {domain.dkimTokens && (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">
              DKIM Records
            </h3>
            <div className="space-y-3">
              {domain.dkimTokens.tokens &&
              Array.isArray(domain.dkimTokens.tokens) ? (
                domain.dkimTokens.tokens.map((token: string, index: number) => (
                  <div
                    key={index}
                    className="bg-black/30 rounded p-3 text-gray-300 text-sm font-mono overflow-x-auto"
                  >
                    <div className="text-gray-400">Record {index + 1}:</div>
                    <div>{token}</div>
                  </div>
                ))
              ) : (
                <div className="bg-black/30 rounded p-3 text-gray-300 text-sm font-mono overflow-x-auto">
                  No DKIM tokens available
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sending Quota */}
        {domain.sendingQuota && (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Sending Quota
            </h3>
            <div className="space-y-2 text-gray-300">
              <p>
                Max 24-Hour Send: {domain.sendingQuota.max24HourSend || "N/A"}
              </p>
              <p>
                Max Send Rate: {domain.sendingQuota.maxSendRate || "N/A"}{" "}
                emails/sec
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
