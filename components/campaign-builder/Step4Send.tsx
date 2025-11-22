"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { CampaignBuilderState } from "@/app/email/campaigns/builder/page";
import CampaignReoonVerificationModal from "@/components/campaign-builder/CampaignReoonVerificationModal";
import CampaignSendImportantNotes from "@/components/campaign-builder/CampaignSendImportantNotes";
import { Button } from "@/components/ui/button";
import emailClient, { getDomains } from "@/utils/api/emailClient";
import { verifyCampaignLeadsWithReoon } from "@/utils/api/reoonClient";

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
  displayName?: string;
  domainId: string;
  verificationStatus: "pending" | "verified" | "failed";
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
        (sender: EmailSender) =>
          sender.domainId === state.domainId &&
          sender.verificationStatus === "verified"
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

  const [showReoonModal, setShowReoonModal] = useState(false);
  const [reoonModalPayload, setReoonModalPayload] = useState<{
    domainId: string;
    campaignId: string;
    leadIds: string[];
  } | null>(null);

  const handleReoonDecision = async (decision: {
    usedVerification: boolean;
    filteredLeadIds: string[];
  }) => {
    if (!reoonModalPayload) {
      setShowReoonModal(false);
      setSending(false);
      return;
    }

    const { domainId, campaignId, leadIds } = reoonModalPayload;
    const idsToUse =
      decision &&
      decision.filteredLeadIds &&
      decision.filteredLeadIds.length > 0
        ? decision.filteredLeadIds
        : leadIds;

    setShowReoonModal(false);

    try {
      // Step 3: Add leads to campaign
      toast.loading("Adding leads to campaign...");

      try {
        await emailClient.post(
          `/api/domains/${domainId}/campaigns/${campaignId}/add-leads`,
          {
            leadIds: idsToUse,
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
            `/api/domains/${domainId}/campaigns/${campaignId}/upload-attachment`,
            {
              fileBuffer: base64,
              fileName: attachment.name,
              mimeType: attachment.type,
            }
          );

          const attachmentData = attachmentResponse.data?.data;
          toast.dismiss();
          toast.success("Attachment uploaded successfully!");

          // Update campaign with attachment metadata
          await emailClient.patch(
            `/api/domains/${domainId}/campaigns/${campaignId}`,
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

      // Step 2.75: Persist Reoon verification summary on campaign (for analytics)
      if (decision.usedVerification) {
        const totalLeadsBeforeVerification = leadIds.length;
        const totalLeadsAfterVerification = idsToUse.length;
        const excludedAsRisky =
          totalLeadsBeforeVerification - totalLeadsAfterVerification;

        try {
          const summaryPayload = {
            reoonVerificationSummary: {
              used: true,
              mode: "power",
              totalLeadsBeforeVerification,
              totalLeadsAfterVerification,
              excludedAsRisky,
            },
          };

          const updateResponse = await emailClient.patch(
            `/api/domains/${domainId}/campaigns/${campaignId}`,
            summaryPayload
          );

          if (!updateResponse.data?.success) {
            console.warn(
              "Failed to store Reoon verification summary on campaign",
              updateResponse.data
            );
          }
        } catch (summaryError: any) {
          console.error(
            "Error while storing Reoon verification summary on campaign:",
            summaryError
          );
          // Do not block sending the campaign if summary storage fails
        }
      }

      // Step 3: Send campaign to leads
      toast.loading(`Sending campaign...`);

      try {
        const sendResponse = await emailClient.post(
          `/api/domains/${domainId}/campaigns/${campaignId}/send`,
          {
            senderId: state.senderId,
          }
        );

        if (sendResponse.data?.success) {
          const sentCount =
            sendResponse.data?.data?.sentCount || idsToUse.length;
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
      setReoonModalPayload(null);
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
                previewText: state.emailTemplate.previewText || "",
                body: state.emailTemplate.htmlContent,
                delayMinutes: 0,
              },
            ],
            tags: state.selectedTags?.map((t: any) => t.name) || [],
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
        // Ensure the backend receives a normalized `email` field based on selected emailColumn
        const csvDataForApi = state.csvData.map((row: any) => {
          if (state.emailColumn && state.emailColumn !== "email") {
            return { ...row, email: row[state.emailColumn] };
          }
          return row;
        });

        const leadsResponse = await emailClient.post(
          `/api/domains/${state.domainId}/campaigns/leads/create-from-csv`,
          {
            csvData: csvDataForApi,
            // Send tag/category names for bulk assignment
            tags: state.selectedTags?.map((t: any) => t.name) || [],
            categories: state.selectedCategories?.map((c: any) => c.name) || [],
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

      // Step 2.5: Optional Reoon verification before adding leads

      // Ask user whether they want to run Reoon verification via rich modal
      setReoonModalPayload({
        domainId: state.domainId,
        campaignId,
        leadIds,
      });
      setShowReoonModal(true);
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Failed to send campaign");
      console.error(error);
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Domain Selection */}
      <div className="backdrop-blur-xl bg-brand-main/5 border border-brand-main/20 rounded-2xl p-6">
        <label className="block text-sm font-medium text-text-200 mb-2">
          Select Domain *
        </label>
        {loadingDomains ? (
          <div className="text-text-200 text-sm">Loading domains...</div>
        ) : (
          <select
            value={state.domainId}
            onChange={(e) => {
              setState({ ...state, domainId: e.target.value, senderId: "" });
            }}
            className="w-full px-4 py-2 bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
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
      <div className="backdrop-blur-xl bg-brand-main/5 border border-brand-main/20 rounded-2xl p-6">
        <label className="block text-sm font-medium text-text-200 mb-2">
          Select Email Sender *
        </label>
        {loadingSenders ? (
          <div className="text-text-200 text-sm">Loading senders...</div>
        ) : senders.length === 0 ? (
          <div className="text-text-200 text-sm">
            No verified senders for this domain. Please verify a sender first.
          </div>
        ) : (
          <select
            value={state.senderId}
            onChange={(e) => setState({ ...state, senderId: e.target.value })}
            className="w-full px-4 py-2 bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
          >
            <option value="">Choose a sender...</option>
            {senders.map((sender) => (
              <option key={sender.id} value={sender.id}>
                {sender.displayName
                  ? `${sender.displayName} <${sender.email}>`
                  : sender.email}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-6">
        <div className="backdrop-blur-xl bg-brand-main/5 border border-brand-main/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text-100 mb-4">
            Campaign Summary
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-text-200">Campaign Name:</p>
              <p className="text-text-100 font-medium">{state.campaignName}</p>
            </div>
            <div>
              <p className="text-text-200">Total Leads:</p>
              <p className="text-text-100 font-medium">
                {state.csvData.length}
              </p>
            </div>
            <div>
              <p className="text-text-200">Subject:</p>
              <p className="text-text-100 font-medium truncate">
                {state.emailTemplate.subject}
              </p>
            </div>
            <div>
              <p className="text-text-200">Credits Required:</p>
              <p className="font-medium text-lg text-success">
                {state.csvData.length}
              </p>
            </div>
          </div>
        </div>

        <CampaignSendImportantNotes />
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <Button
          onClick={onPrev}
          className="bg-brand-main/10 hover:bg-brand-main/20 text-brand-main px-6 py-2 rounded-lg transition"
        >
          ← Back
        </Button>
        <Button
          onClick={handleSend}
          disabled={sending || !state.domainId || !state.senderId}
          className="bg-success hover:bg-success/90 disabled:bg-success/50 text-brand-white px-6 py-2 rounded-lg transition"
        >
          {sending ? "Sending..." : "Send Campaign →"}
        </Button>
      </div>

      {reoonModalPayload && (
        <CampaignReoonVerificationModal
          open={showReoonModal}
          domainId={reoonModalPayload.domainId}
          campaignId={reoonModalPayload.campaignId}
          leadIds={reoonModalPayload.leadIds}
          onDecision={async (decision) => {
            await handleReoonDecision(decision);
          }}
        />
      )}
    </div>
  );
}
