"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import emailClient from "@/utils/api/emailClient";

interface EmailSender {
  id: string;
  email: string;
  displayName?: string;
  verificationStatus: "pending" | "verified" | "failed";
  domainId: string;
}

interface Lead {
  id: string;
  email: string;
  name?: string;
  company?: string;
  role?: string;
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  totalLeads: number;
}

export default function SendCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [emailSenders, setEmailSenders] = useState<EmailSender[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedSender, setSelectedSender] = useState<string>("");
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchData();
  }, [campaignId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch campaign
      const campaignRes = await emailClient.get(`/api/campaigns/${campaignId}`);
      setCampaign(campaignRes.data.data);

      // Fetch email senders
      const sendersRes = await emailClient.get("/api/email-senders");
      const senders = sendersRes.data.data || [];
      setEmailSenders(senders);

      // Set first verified sender as default
      const verifiedSender = senders.find(
        (sender: EmailSender) => sender.verificationStatus === "verified"
      );
      if (verifiedSender) {
        setSelectedSender(verifiedSender.id);
      } else if (senders.length > 0) {
        setSelectedSender(senders[0].id);
      }

      // Fetch leads
      const leadsRes = await emailClient.get("/api/leads");
      const leadsData = leadsRes.data.data || [];
      setLeads(leadsData);

      // Select all leads by default
      setSelectedLeads(leadsData.map((lead: Lead) => lead.id));
      setSelectAll(true);
    } catch (error: any) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load campaign data");
      router.push("/email/campaigns");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedLeads(leads.map((lead) => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter((id) => id !== leadId));
    }
  };

  const handleSend = async () => {
    if (!selectedSender) {
      toast.error("Please select an email sender");
      return;
    }

    if (selectedLeads.length === 0) {
      toast.error("Please select at least one lead");
      return;
    }

    setSending(true);

    try {
      const response = await emailClient.post(
        `/api/campaigns/${campaignId}/send`,
        {
          senderId: selectedSender,
          leadIds: selectedLeads,
        }
      );

      if (response.data.success) {
        toast.success(
          `Campaign queued for sending to ${selectedLeads.length} leads!`
        );
        router.push("/email/campaigns");
      }
    } catch (error: any) {
      console.error("Failed to send campaign:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to send campaign";
      toast.error(errorMessage);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Campaign not found</p>
          <Link
            href="/email/campaigns"
            className="text-blue-600 hover:underline"
          >
            Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/email/campaigns/${campaignId}`}
            className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
          >
            ← Back to Campaign
          </Link>
          <h1 className="text-4xl font-bold text-text-100 mb-2">
            Send Campaign
          </h1>
          <p className="text-text-200">
            Configure and send "{campaign.name}" to your leads
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Email Sender Selection */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-text-100 mb-4">
                Select Email Sender
              </h2>
              {emailSenders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-text-200 mb-4">No email senders found</p>
                  <Link
                    href="/email/domains"
                    className="text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    Add Email Sender
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {emailSenders.map((sender) => (
                    <label
                      key={sender.id}
                      className="flex items-center p-4 border border-slate-600 rounded-lg hover:border-slate-500 cursor-pointer transition-all"
                    >
                      <input
                        type="radio"
                        name="emailSender"
                        value={sender.id}
                        checked={selectedSender === sender.id}
                        onChange={(e) => setSelectedSender(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="ml-4 flex-1">
                        <p className="text-text-100 font-semibold">
                          {sender.displayName && (
                            <span>{sender.displayName} </span>
                          )}
                          <span className="text-text-200">
                            &lt;{sender.email}&gt;
                          </span>
                        </p>
                        <p className="text-text-200 text-sm">
                          Status: {sender.verificationStatus}
                          {sender.verificationStatus === "verified" && (
                            <span className="ml-2 text-green-400">
                              ✓ Verified
                            </span>
                          )}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Leads Selection */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-100">
                  Select Leads ({selectedLeads.length})
                </h2>
                <label className="flex items-center gap-2 text-text-200 hover:text-text-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Select All</span>
                </label>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {leads.length === 0 ? (
                  <p className="text-text-200 text-center py-8">
                    No leads available
                  </p>
                ) : (
                  leads.map((lead) => (
                    <label
                      key={lead.id}
                      className="flex items-center p-3 border border-slate-600 rounded hover:border-slate-500 cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={(e) =>
                          handleSelectLead(lead.id, e.target.checked)
                        }
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="ml-3 flex-1">
                        <p className="text-text-100 text-sm font-semibold">
                          {lead.email}
                        </p>
                        {lead.name && (
                          <p className="text-text-200 text-xs">{lead.name}</p>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Campaign Preview */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-text-100 mb-4">
                Campaign Preview
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-text-200 text-xs uppercase tracking-wide mb-1">
                    Campaign Name
                  </p>
                  <p className="text-text-100 font-semibold">{campaign.name}</p>
                </div>
                <div>
                  <p className="text-text-200 text-xs uppercase tracking-wide mb-1">
                    Subject
                  </p>
                  <p className="text-text-100 font-semibold">
                    {campaign.subject}
                  </p>
                </div>
                <div>
                  <p className="text-text-200 text-xs uppercase tracking-wide mb-1">
                    Recipients
                  </p>
                  <p className="text-2xl font-bold text-blue-400">
                    {selectedLeads.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={
                sending || selectedLeads.length === 0 || !selectedSender
              }
              className="w-full bg-brand-tertiary hover:bg-brand-tertiary/80 disabled:bg-gray-600 text-text-100 px-6 py-4 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {sending ? "Sending..." : `Send to ${selectedLeads.length} Leads`}
            </button>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-blue-200 text-sm">
                <strong>ℹ️ Note:</strong> Each email will be tracked for opens,
                clicks, and bounces.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
