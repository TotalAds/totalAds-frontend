"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import emailClient from "@/utils/api/emailClient";

interface Domain {
  domain: string;
  permission: string;
  is_verified: boolean;
  last_synced_at: string;
}

interface PostmasterMetrics {
  reputation: {
    current: string;
    trend: string;
    average: number;
  };
  spamRate: {
    current: number;
    trend: string;
    average: number;
  };
  authentication: {
    spf: number;
    dkim: number;
    dmarc: number;
  };
  alerts: Array<{
    type: string;
    category: string;
    message: string;
    recommendation: string;
  }>;
}

interface ConnectionStatus {
  isConnected: boolean;
  tokenExpired: boolean;
  domainCount: number;
  needsReconnect: boolean;
}

export default function PostmasterInsightsPage() {
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [metrics, setMetrics] = useState<PostmasterMetrics | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      loadDomainMetrics(selectedDomain);
    }
  }, [selectedDomain]);

  const checkConnection = async () => {
    try {
      setLoading(true);
      
      // Check connection status
      const statusRes = await emailClient("/api/warmup/postmaster/status");
      if (statusRes.status === 200) {
        const statusData = await statusRes.data;
        setConnectionStatus(statusData.data);
        
        if (statusData.data.isConnected && !statusData.data.tokenExpired) {
          // Load domains
          const domainsRes = await emailClient("/api/warmup/postmaster/domains");
          if (domainsRes.status === 200) {
            const domainsData = await domainsRes.data;
            setDomains(domainsData.data.domains || []);
            if (domainsData.data.domains?.length > 0) {
              setSelectedDomain(domainsData.data.domains[0].domain);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to check connection:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDomainMetrics = async (domain: string) => {
    try {
      const res = await emailClient(`/api/warmup/postmaster/stats/${encodeURIComponent(domain)}`);
      if (res.status === 200) {
        const data = await res.data;
        setMetrics(data.data.summary);
      }
    } catch (error) {
      console.error("Failed to load metrics:", error);
    }
  };

  const handleConnect = async () => {
    try {
      const res = await emailClient("/api/warmup/postmaster/connect");
      if (res.status === 200) {
        const data = await res.data;
        // Redirect to Google OAuth
        window.location.href = data.data.authUrl;
      } else {
        toast.error("Failed to initiate connection");
      }
    } catch (error) {
      toast.error("Failed to connect to Postmaster");
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await emailClient("/api/warmup/postmaster/domains/sync", { method: "POST" });
      if (res.status === 200) {
        toast.success("Domains synced successfully");
        await checkConnection();
      } else {
        toast.error("Failed to sync domains");
      }
    } catch (error) {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const getReputationColor = (reputation: string) => {
    switch (reputation) {
      case "HIGH": return "text-green-400";
      case "MEDIUM": return "text-yellow-400";
      case "LOW": return "text-orange-400";
      case "BAD": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  const getReputationBg = (reputation: string) => {
    switch (reputation) {
      case "HIGH": return "bg-green-500/20";
      case "MEDIUM": return "bg-yellow-500/20";
      case "LOW": return "bg-orange-500/20";
      case "BAD": return "bg-red-500/20";
      default: return "bg-gray-500/20";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-main border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-200">Loading Postmaster data...</p>
        </div>
      </div>
    );
  }

  // Not connected state
  if (!connectionStatus?.isConnected || connectionStatus?.needsReconnect) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto">
          <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-8 text-center">
            <ShieldCheckIcon className="w-16 h-16 text-brand-main mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-text-100 mb-2">
              Connect Gmail Postmaster Tools
            </h1>
            <p className="text-text-200 mb-6">
              Get deep insights into your email deliverability with Google's Postmaster Tools.
              See domain reputation, spam rates, and authentication status.
            </p>
            
            <div className="space-y-4 mb-8 text-left">
              <div className="flex items-start gap-3 p-4 bg-bg-200/50 rounded-xl">
                <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-text-100 font-medium">Domain Reputation</p>
                  <p className="text-text-300 text-sm">See how Gmail rates your sending domain</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-bg-200/50 rounded-xl">
                <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-text-100 font-medium">Spam Rate Tracking</p>
                  <p className="text-text-300 text-sm">Monitor user-reported spam rates</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-bg-200/50 rounded-xl">
                <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-text-100 font-medium">Authentication Status</p>
                  <p className="text-text-300 text-sm">Verify SPF, DKIM, and DMARC compliance</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleConnect}
              className="px-6 py-3 bg-brand-main hover:bg-brand-main/90 text-white font-semibold rounded-xl transition-all flex items-center gap-2 mx-auto"
            >
              <LinkIcon className="w-5 h-5" />
              Connect with Google
            </button>

            {connectionStatus?.needsReconnect && (
              <p className="text-yellow-400 text-sm mt-4">
                Your connection has expired. Please reconnect.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-100">Gmail Postmaster Insights</h1>
          <p className="text-text-200 mt-1">Domain reputation and deliverability metrics from Google</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="bg-bg-200 border border-brand-main/20 rounded-xl px-4 py-2 text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
          >
            {domains.map((d) => (
              <option key={d.domain} value={d.domain}>{d.domain}</option>
            ))}
          </select>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="p-2 bg-brand-main/20 hover:bg-brand-main/30 border border-brand-main/30 rounded-xl transition-all disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-5 h-5 text-brand-main ${syncing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Domain Reputation Card */}
      {metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Reputation */}
            <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
              <h3 className="text-text-200 text-sm font-medium mb-2">Domain Reputation</h3>
              <div className="flex items-center gap-4">
                <span className={`text-4xl font-bold ${getReputationColor(metrics.reputation.current)}`}>
                  {metrics.reputation.current}
                </span>
                <span className={`px-2 py-1 rounded-lg text-xs ${getReputationBg(metrics.reputation.current)} ${getReputationColor(metrics.reputation.current)}`}>
                  {metrics.reputation.trend === "improving" ? "↑ Improving" :
                   metrics.reputation.trend === "declining" ? "↓ Declining" : "→ Stable"}
                </span>
              </div>
              <p className="text-text-300 text-sm mt-2">
                Average score: {metrics.reputation.average}
              </p>
            </div>

            {/* Spam Rate */}
            <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
              <h3 className="text-text-200 text-sm font-medium mb-2">Spam Rate</h3>
              <div className="flex items-center gap-4">
                <span className={`text-4xl font-bold ${
                  metrics.spamRate.current < 0.01 ? "text-green-400" :
                  metrics.spamRate.current < 0.05 ? "text-yellow-400" : "text-red-400"
                }`}>
                  {(metrics.spamRate.current * 100).toFixed(2)}%
                </span>
                <span className={`px-2 py-1 rounded-lg text-xs ${
                  metrics.spamRate.trend === "improving" ? "bg-green-500/20 text-green-400" :
                  metrics.spamRate.trend === "worsening" ? "bg-red-500/20 text-red-400" : 
                  "bg-gray-500/20 text-gray-400"
                }`}>
                  {metrics.spamRate.trend === "improving" ? "↓ Improving" :
                   metrics.spamRate.trend === "worsening" ? "↑ Worsening" : "→ Stable"}
                </span>
              </div>
              <p className="text-text-300 text-sm mt-2">
                Target: &lt;0.10% • Avg: {(metrics.spamRate.average * 100).toFixed(3)}%
              </p>
            </div>

            {/* Authentication */}
            <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
              <h3 className="text-text-200 text-sm font-medium mb-4">Authentication</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-text-200">SPF</span>
                  <span className={metrics.authentication.spf > 0.9 ? "text-green-400" : "text-yellow-400"}>
                    {(metrics.authentication.spf * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-200">DKIM</span>
                  <span className={metrics.authentication.dkim > 0.9 ? "text-green-400" : "text-yellow-400"}>
                    {(metrics.authentication.dkim * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-200">DMARC</span>
                  <span className={metrics.authentication.dmarc > 0.9 ? "text-green-400" : "text-yellow-400"}>
                    {(metrics.authentication.dmarc * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {metrics.alerts.length > 0 && (
            <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-text-100 mb-4">Alerts & Recommendations</h3>
              <div className="space-y-4">
                {metrics.alerts.map((alert, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl ${
                      alert.type === "critical" ? "bg-red-500/10 border border-red-500/30" :
                      alert.type === "warning" ? "bg-yellow-500/10 border border-yellow-500/30" :
                      "bg-blue-500/10 border border-blue-500/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {alert.type === "critical" ? (
                        <XCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
                      ) : (
                        <ExclamationTriangleIcon className={`w-5 h-5 flex-shrink-0 ${
                          alert.type === "warning" ? "text-yellow-400" : "text-blue-400"
                        }`} />
                      )}
                      <div>
                        <p className={`font-medium ${
                          alert.type === "critical" ? "text-red-400" :
                          alert.type === "warning" ? "text-yellow-400" : "text-blue-400"
                        }`}>
                          {alert.message}
                        </p>
                        <p className="text-text-200 text-sm mt-1">
                          {alert.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Domains List */}
          <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-text-100 mb-4">Connected Domains</h3>
            <div className="space-y-3">
              {domains.map((domain) => (
                <div
                  key={domain.domain}
                  className={`p-4 rounded-xl bg-bg-200/50 flex items-center justify-between cursor-pointer hover:bg-bg-200 transition-all ${
                    selectedDomain === domain.domain ? "ring-2 ring-brand-main" : ""
                  }`}
                  onClick={() => setSelectedDomain(domain.domain)}
                >
                  <div>
                    <p className="text-text-100 font-medium">{domain.domain}</p>
                    <p className="text-text-300 text-xs">
                      Permission: {domain.permission} • Last synced: {new Date(domain.last_synced_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-xs ${
                    domain.is_verified ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {domain.is_verified ? "Verified" : "Pending"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Back Link */}
      <Link
        href="/email/warmup/analytics"
        className="inline-flex items-center gap-2 text-brand-main hover:text-brand-main/80"
      >
        ← Back to Analytics Dashboard
      </Link>
    </div>
  );
}
