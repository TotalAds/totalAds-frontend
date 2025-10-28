"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { CampaignBuilderState } from "@/app/email/campaigns/builder/page";
import { Button } from "@/components/ui/button";
import emailClient, { getDomains } from "@/utils/api/emailClient";

interface Step4Props {
  state: CampaignBuilderState;
  setState: (state: CampaignBuilderState) => void;
  onNext: () => void;
  onPrev: () => void;
}

interface Domain {
  id: string;
  domain: string;
}

interface EmailSender {
  id: string;
  email: string;
  domainId: string;
}

export default function CampaignStep4Send({
  state,
  setState,
  onNext,
  onPrev,
}: Step4Props) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [senders, setSenders] = useState<EmailSender[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [loadingSenders, setLoadingSenders] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    if (state.domainId) {
      fetchSenders();
    }
  }, [state.domainId]);

  const fetchDomains = async () => {
    try {
      setLoadingDomains(true);
      const response = await emailClient.get("/api/domains", {
        params: { page: 1, limit: 100 },
      });
      setDomains(response.data?.data?.domains || []);
    } catch (error: any) {
      toast.error("Failed to fetch domains");
      console.error(error);
    } finally {
      setLoadingDomains(false);
    }
  };

  const fetchSenders = async () => {
    try {
      setLoadingSenders(true);
      const response = await emailClient.get("/api/email-senders", {
        params: { page: 1, limit: 100 },
      });
      const allSenders = response.data?.data?.senders || [];
      const filteredSenders = allSenders.filter(
        (sender: EmailSender) => sender.domainId === state.domainId
      );
      console.log(filteredSenders, state, "------------");
      setSenders(filteredSenders);
    } catch (error: any) {
      toast.error("Failed to fetch email senders");
      console.error(error);
    } finally {
      setLoadingSenders(false);
    }
  };

  const handleSend = async () => {
    if (!state.domainId) {
      toast.error("Please select a domain");
      return;
    }
    if (!state.senderId) {
      toast.error("Please select an email sender");
      return;
    }

    if (!state.csvData || state.csvData.length === 0) {
      toast.error("No leads uploaded. Please upload a CSV file first.");
      return;
    }

    try {
      setSending(true);

      // Step 1: Create campaign FIRST (without leads)
      toast.loading("Creating campaign...");

      let campaignId: string = "";
      let attachmentData: any = null;

      try {
        const campaignResponse = await emailClient.post(
          `/api/domains/${state.domainId}/campaigns`,
          {
            name: state.campaignName,
            description: state.campaignDescription,
            sequence: [
              {
                subject: state.emailTemplate.subject,
                body: state.emailTemplate.htmlContent,
                delayMinutes: 0,
              },
            ],
            tags: [],
          }
        );

        campaignId = campaignResponse.data?.data?.id;

        if (!campaignId) {
          toast.dismiss();
          toast.error("Failed to create campaign");
          return;
        }

        toast.dismiss();
        toast.success("Campaign created successfully!");
      } catch (campaignError: any) {
        toast.dismiss();
        const errorMsg =
          campaignError.response?.data?.message ||
          campaignError.message ||
          "Failed to create campaign";
        toast.error(errorMsg);
        console.error("Campaign creation error:", campaignError);
        return;
      }

      // Step 2: Create leads from CSV data
      toast.loading(`Creating ${state.csvData.length} leads...`);

      let leadIds: string[] = [];

      try {
        const leadsResponse = await emailClient.post(
          `/api/domains/${state.domainId}/campaigns/leads/create-from-csv`,
          {
            csvData: state.csvData,
          }
        );

        leadIds = leadsResponse.data?.data?.leadIds;

        if (!leadIds || leadIds.length === 0) {
          toast.dismiss();
          toast.error("Failed to create leads from CSV");
          console.error("No lead IDs returned:", leadsResponse.data);
          return;
        }

        toast.dismiss();
        toast.success(`Created ${leadIds.length} leads successfully!`);
      } catch (csvError: any) {
        toast.dismiss();
        const errorMsg =
          csvError.response?.data?.message ||
          csvError.message ||
          "Failed to create leads from CSV";
        toast.error(errorMsg);
        console.error("CSV creation error:", csvError);
        return;
      }

      // Step 3: Add leads to campaign
      toast.loading("Adding leads to campaign...");

      try {
        await emailClient.post(
          `/api/domains/${state.domainId}/campaigns/${campaignId}/add-leads`,
          {
            leadIds,
          }
        );

        toast.dismiss();
        toast.success("Leads added to campaign successfully!");
      } catch (addLeadsError: any) {
        toast.dismiss();
        const errorMsg =
          addLeadsError.response?.data?.message ||
          addLeadsError.message ||
          "Failed to add leads to campaign";
        toast.error(errorMsg);
        console.error("Add leads error:", addLeadsError);
        return;
      }

      // Step 2.5: Upload attachment if exists
      if (
        state.emailTemplate.attachments &&
        state.emailTemplate.attachments.length > 0
      ) {
        toast.loading("Uploading attachment...");
        try {
          const attachment = state.emailTemplate.attachments[0];
          const fileBuffer = await attachment.file.arrayBuffer();
          const base64 = Buffer.from(fileBuffer).toString("base64");

          const attachmentResponse = await emailClient.post(
            `/api/domains/${state.domainId}/campaigns/${campaignId}/upload-attachment`,
            {
              fileBuffer: base64,
              fileName: attachment.name,
              mimeType: attachment.type,
            }
          );

          attachmentData = attachmentResponse.data?.data;
          toast.dismiss();
          toast.success("Attachment uploaded successfully!");

          // Update campaign with attachment metadata
          await emailClient.patch(
            `/api/domains/${state.domainId}/campaigns/${campaignId}`,
            {
              attachment: attachmentData,
            }
          );
        } catch (attachmentError: any) {
          toast.dismiss();
          const errorMsg =
            attachmentError.response?.data?.message ||
            attachmentError.message ||
            "Failed to upload attachment";
          toast.error(errorMsg);
          console.error("Attachment upload error:", attachmentError);
          // Continue without attachment
        }
      }

      // Step 3: Send campaign to leads
      toast.loading(`Sending campaign...`);

      try {
        const sendResponse = await emailClient.post(
          `/api/domains/${state.domainId}/campaigns/${campaignId}/send`,
          {
            senderId: state.senderId,
          }
        );

        if (sendResponse.data?.success) {
          const sentCount =
            sendResponse.data?.data?.sentCount || leadIds.length;
          setState({
            ...state,
            campaignId,
          });
          toast.dismiss();
          toast.success(`Campaign sent successfully to ${sentCount} leads!`);
          onNext();
        } else {
          toast.dismiss();
          toast.error("Failed to send campaign");
        }
      } catch (sendError: any) {
        toast.dismiss();
        const errorMsg =
          sendError.response?.data?.message ||
          sendError.message ||
          "Failed to send campaign";
        toast.error(errorMsg);
        console.error("Campaign send error:", sendError);
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Failed to send campaign");
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Domain Selection */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Domain *
        </label>
        {loadingDomains ? (
          <div className="text-gray-400 text-sm">Loading domains...</div>
        ) : (
          <select
            value={state.domainId}
            onChange={(e) => {
              setState({ ...state, domainId: e.target.value, senderId: "" });
            }}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Choose a domain...</option>
            {domains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.domain}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Email Sender Selection */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Email Sender *
        </label>
        {loadingSenders ? (
          <div className="text-gray-400 text-sm">Loading senders...</div>
        ) : senders.length === 0 ? (
          <div className="text-gray-400 text-sm">
            No verified senders for this domain. Please verify a sender first.
          </div>
        ) : (
          <select
            value={state.senderId}
            onChange={(e) => setState({ ...state, senderId: e.target.value })}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Choose a sender...</option>
            {senders.map((sender) => (
              <option key={sender.id} value={sender.id}>
                {sender.email}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-6">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Campaign Summary
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-400">Campaign Name:</p>
              <p className="text-white font-medium">{state.campaignName}</p>
            </div>
            <div>
              <p className="text-gray-400">Total Leads:</p>
              <p className="text-white font-medium">{state.csvData.length}</p>
            </div>
            <div>
              <p className="text-gray-400">Subject:</p>
              <p className="text-white font-medium truncate">
                {state.emailTemplate.subject}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Credits Required:</p>
              <p className="font-medium text-lg text-green-400">
                {state.csvData.length}
              </p>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Important Notes
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              <span>Tracking pixel will be added automatically</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              <span>Opens and clicks will be tracked</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              <span>Bounces and complaints will be monitored</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              <span>You can pause or stop the campaign anytime</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <Button
          onClick={onPrev}
          className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition"
        >
          ← Back
        </Button>
        <Button
          onClick={handleSend}
          disabled={sending || !state.domainId || !state.senderId}
          className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-6 py-2 rounded-lg transition"
        >
          {sending ? "Sending..." : "Send Campaign →"}
        </Button>
      </div>
    </div>
  );
}
