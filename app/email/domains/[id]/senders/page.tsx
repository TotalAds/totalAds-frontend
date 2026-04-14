"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { EmailDeliveryBanner } from "@/components/email/EmailDeliveryBanner";
import { BYO_DEFAULT_DAILY_SEND_CAP } from "@/lib/pricingTierSes";
import emailClient, { patchEmailSender } from "@/utils/api/emailClient";
import { useEmailProvider } from "@/hooks/useEmailProvider";

interface EmailSender {
  id: string;
  email: string;
  displayName?: string;
  domainId: string;
  verificationStatus: string;
  verificationEmailSentAt: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** BYO SES: user-set target daily cap (LeadSnipper pacing; not AWS SES quota) */
  byoDailySendCap?: number | null;
}

interface SenderQuota {
  senderId: string;
  dailyCap: number;
  used: number;
  remaining: number;
  totalSent: number;
  resetAt: string;
  override: number | null;
  allowed: boolean;
  domainTrustLevel?: 'new' | 'warming' | 'aged' | 'agency';
  domainAgeInDays?: number;
  healthScore?: number;
  healthStatus?: 'excellent' | 'good' | 'warning' | 'critical';
  bounceRate7d?: number;
  complaintRate7d?: number;
  quotaMode?: "byo" | "managed";
  byoUserRequestedCap?: number | null;
}

interface Domain {
  id: string;
  domain: string;
  verificationStatus: string;
}

export default function EmailSendersPage() {
  const params = useParams();
  const domainId = params.id as string;
  const { sesProvider, sesConnected } = useEmailProvider();

  const [senders, setSenders] = useState<EmailSender[]>([]);
  const [domain, setDomain] = useState<Domain | null>(null);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  /** BYO: optional initial daily cap when creating a sender */
  const [newByoDailyCap, setNewByoDailyCap] = useState("");
  const [creating, setCreating] = useState(false);
  const [senderCapDrafts, setSenderCapDrafts] = useState<Record<string, string>>(
    {}
  );
  const [savingCapId, setSavingCapId] = useState<string | null>(null);
  const [emailError, setEmailError] = useState("");
  const [senderQuotas, setSenderQuotas] = useState<Record<string, SenderQuota>>(
    {}
  );
  const [loadingQuotas, setLoadingQuotas] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    fetchDomain();
    fetchSenders();
  }, [domainId]);

  const fetchDomain = async () => {
    try {
      const response = await emailClient.get(`/api/domains/${domainId}`);
      if (response.data.success) {
        setDomain(response.data.data);
      }
    } catch (error: any) {
      console.error("Failed to load domain:", error);
    }
  };

  const fetchSenders = async () => {
    try {
      setLoading(true);
      const response = await emailClient.get(
        `/api/email-senders?domainId=${domainId}`
      );
      if (response.data.success) {
        const fetchedSenders = response.data.data.senders || [];
        setSenders(fetchedSenders);
        const drafts: Record<string, string> = {};
        fetchedSenders.forEach((s: EmailSender) => {
          drafts[s.id] =
            s.byoDailySendCap != null
              ? String(s.byoDailySendCap)
              : String(BYO_DEFAULT_DAILY_SEND_CAP);
        });
        setSenderCapDrafts(drafts);

        // Fetch quota for each verified sender
        fetchedSenders.forEach((sender: EmailSender) => {
          if (sender.verificationStatus === "verified") {
            fetchSenderQuota(sender.id);
          }
        });
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to load email senders";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchSenderQuota = async (senderId: string) => {
    try {
      setLoadingQuotas((prev) => ({ ...prev, [senderId]: true }));
      const response = await emailClient.get(
        `/api/email-senders/${senderId}/quota`
      );
      if (response.data.success) {
        setSenderQuotas((prev) => ({
          ...prev,
          [senderId]: response.data.data,
        }));
      }
    } catch (error: any) {
      console.error(`Failed to fetch quota for sender ${senderId}:`, error);
      // Don't show error toast for quota - it's not critical
    } finally {
      setLoadingQuotas((prev) => ({ ...prev, [senderId]: false }));
    }
  };

  const handleCreateSender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (!newDisplayName.trim()) {
      toast.error("Please enter a display name");
      return;
    }

    // Validate email domain matches verified domain
    if (domain) {
      const emailDomain = newEmail.split("@")[1]?.toLowerCase();
      const verifiedDomain = domain.domain.toLowerCase();

      if (emailDomain !== verifiedDomain) {
        const errorMsg = `Email domain must match your verified domain (${verifiedDomain}). You provided an email from ${emailDomain}. This is required to maintain AWS SES account reputation and ensure email deliverability.`;
        toast.error(errorMsg);
        return;
      }
    }

    try {
      setCreating(true);
      const body: Record<string, unknown> = {
        email: newEmail,
        displayName: newDisplayName,
        domainId,
      };
      if (sesProvider === "custom" && newByoDailyCap.trim() !== "") {
        const n = parseInt(newByoDailyCap, 10);
        if (!Number.isFinite(n) || n < 1) {
          toast.error("Daily send cap must be a positive number");
          return;
        }
        body.byoDailySendCap = n;
      }

      const response = await emailClient.post("/api/email-senders", body);

      if (response.data.success) {
        toast.success(response.data.data.message);
        setNewEmail("");
        setNewDisplayName("");
        setNewByoDailyCap("");
        await fetchSenders();
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to create email sender";
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleVerifySender = async (senderId: string) => {
    try {
      const response = await emailClient.post(
        `/api/email-senders/${senderId}/verify`,
        {} // Send empty object to set Content-Type: application/json
      );

      if (response.data.success) {
        toast.success(response.data.data.message);
        await fetchSenders();
        // If sender is now verified, fetch quota
        if (response.data.data.verificationStatus === "verified") {
          await fetchSenderQuota(senderId);
        }
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to verify email sender";
      toast.error(errorMessage);
    }
  };

  const handleDeleteSender = async (senderId: string) => {
    if (!confirm("Are you sure you want to delete this email sender?")) {
      return;
    }

    try {
      const response = await emailClient.delete(
        `/api/email-senders/${senderId}`
      );

      if (response.data.success) {
        toast.success("Email sender deleted successfully");
        await fetchSenders();
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to delete email sender";
      toast.error(errorMessage);
    }
  };

  const handleSaveByoDailyCap = async (senderId: string) => {
    const raw = senderCapDrafts[senderId]?.trim() ?? "";
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1) {
      toast.error("Enter a daily send cap of at least 1.");
      return;
    }
    try {
      setSavingCapId(senderId);
      await patchEmailSender(senderId, { byoDailySendCap: n });
      toast.success("Daily send cap saved");
      await fetchSenders();
      await fetchSenderQuota(senderId);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save daily send cap");
    } finally {
      setSavingCapId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      verified: { bg: "bg-green-200", text: "text-green-500" },
      pending: { bg: "bg-yellow-200", text: "text-yellow-500" },
      failed: { bg: "bg-red-200", text: "text-red-500" },
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

  const getTrustLevelBadge = (trustLevel?: string, ageInDays?: number) => {
    const trustMap: Record<string, { bg: string; text: string; label: string; description: string }> = {
      new: { 
        bg: "bg-blue-100", 
        text: "text-blue-600", 
        label: "🌱 New Domain",
        description: "Conservative ramp-up (20-1000/day)"
      },
      warming: { 
        bg: "bg-yellow-100", 
        text: "text-yellow-600", 
        label: "🔥 Warming Up",
        description: "Moderate ramp-up (100-2000/day)"
      },
      aged: { 
        bg: "bg-green-100", 
        text: "text-green-600", 
        label: "✅ Aged Domain",
        description: "Full capacity available"
      },
      agency: { 
        bg: "bg-purple-100", 
        text: "text-purple-600", 
        label: "🏢 Agency",
        description: "Manual override enabled"
      },
    };

    const style = trustMap[trustLevel || 'new'] || trustMap.new;

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
            {style.label}
          </span>
          {ageInDays !== undefined && (
            <span className="text-text-200 text-xs">
              {ageInDays} days old
            </span>
          )}
        </div>
        <p className="text-text-200 text-xs">{style.description}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-main border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-200">Loading email senders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-100">
      {/* Header */}
      <header className="backdrop-blur-xl bg-brand-main/5 border-b border-brand-main/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <Link
              href={`/email/domains/${domainId}`}
              className="text-brand-main hover:text-brand-secondary font-semibold mb-2 inline-block"
            >
              ← Back to Domain
            </Link>
            <h1 className="text-2xl font-bold text-text-100">Email Senders</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <EmailDeliveryBanner sesProvider={sesProvider} sesConnected={sesConnected} />
        {/* Add New Sender Form */}
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-text-100 mb-4">
            Add New Email Sender
          </h2>
          <form onSubmit={handleCreateSender} className="space-y-4">
            <div className="flex gap-3">
              <input
                type="email"
                placeholder={
                  domain
                    ? `Enter email address (e.g., noreply@${domain.domain})`
                    : "Enter email address"
                }
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1 px-4 py-2 bg-brand-main/10 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200 focus:outline-none focus:border-brand-main"
                disabled={creating}
              />
              <input
                type="text"
                placeholder="Display Name (e.g., Support Team)"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                className="flex-1 px-4 py-2 bg-brand-main/10 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200 focus:outline-none focus:border-brand-main"
                disabled={creating}
              />
              <Button
                type="submit"
                disabled={creating}
                className="bg-brand-tertiary hover:bg-brand-tertiary/80 text-text-100 px-6 py-2 rounded-lg transition disabled:opacity-50"
              >
                {creating ? "Adding..." : "Add Sender"}
              </Button>
            </div>
            {sesProvider === "custom" && (
              <div>
                <label className="block text-xs font-medium text-text-200 mb-1">
                  Target daily send cap (optional — defaults to{" "}
                  {BYO_DEFAULT_DAILY_SEND_CAP} if empty)
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder={`Default ${BYO_DEFAULT_DAILY_SEND_CAP}`}
                  value={newByoDailyCap}
                  onChange={(e) => setNewByoDailyCap(e.target.value)}
                  className="w-full max-w-xs px-4 py-2 bg-brand-main/10 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200 focus:outline-none focus:border-brand-main"
                  disabled={creating}
                />
                <p className="text-text-200 text-xs mt-1">
                  Paces sending in LeadSnipper. If a full UTC day hits this cap, the
                  next day&apos;s cap increases by 20%. AWS SES limits still apply
                  in your AWS account.
                </p>
              </div>
            )}
          </form>
          <p className="text-text-200 text-sm mt-3">
            AWS SES will send a verification email to this address. You must
            click the verification link to complete setup.
          </p>
        </div>

        {/* Email Senders List */}
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-100 mb-4">
            Your Email Senders ({senders.length})
          </h2>

          {senders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-200">No email senders added yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {senders.map((sender) => {
                const quota = senderQuotas[sender.id];
                const isLoadingQuota = loadingQuotas[sender.id];
                const isVerified = sender.verificationStatus === "verified";

                return (
                  <div
                    key={sender.id}
                    className="bg-white/10 rounded-lg p-4 border border-brand-main/10"
                  >
                    {/* Sender Info Row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-text-100 font-medium">
                          {sender.displayName && (
                            <span>{sender.displayName} </span>
                          )}
                          <span className="font-mono text-text-200">
                            &lt;{sender.email}&gt;
                          </span>
                        </p>
                        <p className="text-text-200 text-sm">
                          Created:{" "}
                          {new Date(sender.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {getStatusBadge(sender.verificationStatus)}

                        {sender.verificationStatus === "pending" && (
                          <Button
                            onClick={() => handleVerifySender(sender.id)}
                            className="bg-brand-main hover:bg-brand-main/80 text-text-100 px-4 py-2 rounded-lg transition text-sm"
                          >
                            Check Status
                          </Button>
                        )}

                        <Button
                          onClick={() => handleDeleteSender(sender.id)}
                          className="bg-brand-secondary hover:bg-brand-secondary/80 text-text-100 px-4 py-2 rounded-lg transition text-sm"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    {/* Sender Quota Section - Only show for verified senders */}
                    {isVerified && (
                      <div className="mt-4 pt-4 border-t border-brand-main/10">
                        <h4 className="text-sm font-semibold text-text-100 mb-3">
                          {sesProvider === "custom"
                            ? "Daily send pacing (BYO SES)"
                            : "Daily Sending Quota"}
                        </h4>
                        {sesProvider === "custom" && (
                          <div className="mb-4 p-3 rounded-lg bg-brand-main/5 border border-brand-main/15">
                            <p className="text-xs text-text-200 mb-2">
                              Set your target daily volume for this sender on the
                              platform. This is not your AWS SES quota — it only
                              paces queue sends here. After any UTC day where you
                              reach the full cap, the next day&apos;s cap increases
                              by 20%. If you don&apos;t hit the cap, it stays the
                              same.
                            </p>
                            <div className="flex flex-wrap items-end gap-2">
                              <div>
                                <label className="block text-xs text-text-200 mb-1">
                                  Target daily send cap
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  className="w-40 px-3 py-2 text-sm bg-brand-main/10 border border-brand-main/20 rounded-lg text-text-100"
                                  value={senderCapDrafts[sender.id] ?? ""}
                                  onChange={(e) =>
                                    setSenderCapDrafts((prev) => ({
                                      ...prev,
                                      [sender.id]: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <Button
                                type="button"
                                onClick={() => handleSaveByoDailyCap(sender.id)}
                                disabled={savingCapId === sender.id}
                                className="bg-brand-main hover:bg-brand-main/80 text-text-100 px-4 py-2 rounded-lg text-sm"
                              >
                                {savingCapId === sender.id ? "Saving…" : "Save cap"}
                              </Button>
                            </div>
                          </div>
                        )}
                        {isLoadingQuota ? (
                          <div className="flex items-center gap-2 text-text-200 text-sm">
                            <div className="w-4 h-4 border-2 border-brand-main border-t-transparent rounded-full animate-spin"></div>
                            Loading quota...
                          </div>
                        ) : quota ? (
                          <div className="space-y-3">
                            {/* Progress Bar */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-text-200 text-sm">
                                  {quota.used} /{" "}
                                  {quota.dailyCap > 0
                                    ? quota.dailyCap
                                    : "—"}{" "}
                                  emails sent
                                  today
                                </span>
                                <span className="text-text-200 text-sm">
                                  {quota.remaining} remaining
                                </span>
                              </div>
                              <div className="w-full bg-brand-main/10 rounded-full h-2.5">
                                <div
                                  className={`h-2.5 rounded-full transition-all ${
                                    quota.remaining === 0
                                      ? "bg-red-500"
                                      : quota.dailyCap > 0 &&
                                          quota.remaining < quota.dailyCap * 0.2
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                  }`}
                                  style={{
                                    width: `${quota.dailyCap > 0 ? Math.min((quota.used / quota.dailyCap) * 100, 100) : 0}%`,
                                  }}
                                ></div>
                              </div>
                            </div>

                            {/* Quota Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="bg-brand-main/5 rounded-lg p-3">
                                <p className="text-text-200 text-xs mb-1">
                                  {quota.quotaMode === "byo"
                                    ? "Effective daily cap"
                                    : "Daily Cap"}
                                </p>
                                <p className="text-text-100 font-semibold text-lg">
                                  {quota.dailyCap.toLocaleString()}
                                </p>
                              </div>
                              <div className="bg-brand-main/5 rounded-lg p-3">
                                <p className="text-text-200 text-xs mb-1">
                                  Used Today
                                </p>
                                <p className="text-text-100 font-semibold text-lg">
                                  {quota.used.toLocaleString()}
                                </p>
                              </div>
                              <div className="bg-brand-main/5 rounded-lg p-3">
                                <p className="text-text-200 text-xs mb-1">
                                  Remaining
                                </p>
                                <p
                                  className={`font-semibold text-lg ${
                                    quota.remaining === 0
                                      ? "text-red-400"
                                      : quota.remaining < quota.dailyCap * 0.2
                                      ? "text-yellow-400"
                                      : "text-green-400"
                                  }`}
                                >
                                  {quota.remaining.toLocaleString()}
                                </p>
                              </div>
                              <div className="bg-brand-main/5 rounded-lg p-3">
                                <p className="text-text-200 text-xs mb-1">
                                  Total Sent
                                </p>
                                <p className="text-text-100 font-semibold text-lg">
                                  {quota.totalSent.toLocaleString()}
                                </p>
                              </div>
                            </div>

                            {/* Domain Trust Level — managed SES reputation only */}
                            {quota.quotaMode !== "byo" &&
                            (quota.domainTrustLevel || quota.healthScore !== undefined) && (
                              <div className="bg-brand-main/5 rounded-lg p-3 mt-3">
                                <p className="text-text-200 text-xs mb-2 font-medium">
                                  Reputation & Ramp-Up Status
                                </p>
                                {quota.domainTrustLevel && getTrustLevelBadge(quota.domainTrustLevel, quota.domainAgeInDays)}
                                {quota.healthScore !== undefined && (
                                  <div className="mt-2 flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-text-200 text-xs">
                                        Health Score
                                      </span>
                                      <span className="text-text-100 text-sm font-semibold">
                                        {quota.healthScore}/100{" "}
                                        {quota.healthStatus &&
                                          `(${quota.healthStatus.charAt(0).toUpperCase()}${quota.healthStatus.slice(
                                            1
                                          )})`}
                                      </span>
                                    </div>
                                    {(quota.bounceRate7d !== undefined ||
                                      quota.complaintRate7d !== undefined) && (
                                      <p className="text-text-200 text-xs">
                                        7-day bounce:{" "}
                                        {((quota.bounceRate7d || 0) * 100).toFixed(2)}%, complaints:{" "}
                                        {((quota.complaintRate7d || 0) * 100).toFixed(3)}%
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Reset Time */}
                            <p className="text-text-200 text-xs mt-2">
                              Resets at:{" "}
                              {new Date(quota.resetAt).toLocaleString()}
                            </p>
                          </div>
                        ) : (
                          <p className="text-text-200 text-sm">
                            No quota data available
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="backdrop-blur-xl bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-300 mb-3">
            How Email Verification Works
          </h3>
          <ol className="text-text-200 space-y-2 text-sm">
            <li>
              1. Enter an email address from your verified domain{" "}
              {domain && `(${domain.domain})`}
            </li>
            <li>
              2. Email domain must match your verified domain to maintain AWS
              SES reputation
            </li>
            <li>3. AWS SES sends a verification email to that address</li>
            <li>4. Check your inbox and click the verification link</li>
            <li>5. Click "Check Status" to confirm verification</li>
            <li>6. Once verified, you can use this email to send campaigns</li>
          </ol>
          <p className="text-text-200 text-xs mt-4 border-t border-blue-500/20 pt-4">
            <strong>Why domain matching?</strong> AWS SES requires email senders
            to use verified domains to maintain account reputation and ensure
            high email deliverability. This is an industry best practice.
          </p>
        </div>
      </main>
    </div>
  );
}
