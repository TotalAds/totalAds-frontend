"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import emailClient from "@/utils/api/emailClient";

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
}

interface Domain {
  id: string;
  domain: string;
  verificationStatus: string;
}

export default function EmailSendersPage() {
  const params = useParams();
  const domainId = params.id as string;

  const [senders, setSenders] = useState<EmailSender[]>([]);
  const [domain, setDomain] = useState<Domain | null>(null);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [creating, setCreating] = useState(false);
  const [emailError, setEmailError] = useState("");

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
        setSenders(response.data.data.senders || []);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to load email senders";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
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
      const response = await emailClient.post("/api/email-senders", {
        email: newEmail,
        displayName: newDisplayName,
        domainId,
      });

      if (response.data.success) {
        toast.success(response.data.data.message);
        setNewEmail("");
        setNewDisplayName("");
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
            <div className="space-y-3">
              {senders.map((sender) => (
                <div
                  key={sender.id}
                  className="bg-black/30 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="text-text-100 font-medium">
                      {sender.displayName && <span>{sender.displayName} </span>}
                      <span className="font-mono text-text-200">
                        &lt;{sender.email}&gt;
                      </span>
                    </p>
                    <p className="text-text-200 text-sm">
                      Created: {new Date(sender.createdAt).toLocaleDateString()}
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
              ))}
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
