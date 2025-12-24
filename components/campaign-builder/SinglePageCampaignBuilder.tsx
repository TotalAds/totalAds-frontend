"use client";

import {
  AlertCircle,
  CheckCircle2,
  Mail,
  Send,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import emailClient, {
  getCampaignEligibility,
  getDomains,
  LeadCategory,
  LeadTag,
} from "@/utils/api/emailClient";

import CampaignReoonVerificationModal from "./CampaignReoonVerificationModal";
import EmailTemplateEditor from "./EmailTemplateEditor";
import RecipientSelectionModal from "./RecipientSelectionModal";

interface SinglePageCampaignBuilderProps {
  onCancel?: () => void;
  onSuccess?: () => void;
  campaignId?: string;
  initialDomainId?: string;
}

interface CampaignState {
  campaignName: string;
  campaignDescription: string;
  domainId: string;
  senderId: string;
  emailTemplate: {
    subject: string;
    previewText?: string;
    htmlContent: string;
    textContent: string;
    attachments?: Array<{
      name: string;
      size: number;
      type: string;
      file: File;
    }>;
  };
  replyTo?: string; // Optional reply-to email address
  useReplyTo: boolean; // Checkbox state for reply-to
  useAttachment: boolean; // Checkbox state for attachment
  selectedRecipients: {
    type: "list" | "filter" | "individual" | "csv";
    ids: string[];
    count: number;
  };
  selectedTags: LeadTag[];
  selectedCategories: LeadCategory[];
  csvData: Array<Record<string, string>>;
  columns: string[];
  emailColumn: string;
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

export default function SinglePageCampaignBuilder({
  onCancel,
  onSuccess,
  campaignId,
  initialDomainId = "",
}: SinglePageCampaignBuilderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [eligibility, setEligibility] = useState<null | {
    eligible: boolean;
    verifiedDomainCount: number;
    verifiedSenderCount: number;
  }>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [senders, setSenders] = useState<EmailSender[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [loadingSenders, setLoadingSenders] = useState(false);
  const [sending, setSending] = useState(false);
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [showReoonModal, setShowReoonModal] = useState(false);
  const [reoonModalPayload, setReoonModalPayload] = useState<{
    domainId: string;
    campaignId: string;
    leadIds: string[];
    leadEmails?: string[];
  } | null>(null);

  const [state, setState] = useState<CampaignState>({
    campaignName: "",
    campaignDescription: "",
    domainId: initialDomainId,
    senderId: "",
    emailTemplate: {
      subject: "",
      previewText: "",
      htmlContent: "",
      textContent: "",
      attachments: [],
    },
    replyTo: "",
    useReplyTo: false,
    useAttachment: false,
    selectedRecipients: {
      type: "individual",
      ids: [],
      count: 0,
    },
    selectedTags: [],
    selectedCategories: [],
    csvData: [],
    columns: [],
    emailColumn: "email",
  });

  // Check eligibility and load domains
  useEffect(() => {
    const initialize = async () => {
      try {
        const [eligibilityData, domainsData] = await Promise.all([
          getCampaignEligibility(),
          getDomains(1, 100),
        ]);
        setEligibility(eligibilityData);
        const loadedDomains = domainsData.data.domains || [];
        setDomains(loadedDomains);

        // Get verified domains (domains that are verified and have DKIM verified)
        const verifiedDomains = loadedDomains.filter(
          (d) =>
            d.verificationStatus === "verified" &&
            d.dkimStatus === "verified"
        );

        let domainToSelect = initialDomainId;

        // If no domainId in URL, select the first verified domain as default
        if (!initialDomainId && verifiedDomains.length > 0) {
          // Select the first verified domain (most recently created)
          domainToSelect = verifiedDomains[0].id;
          console.log(
            `No domain in URL, selecting default verified domain: ${domainToSelect}`
          );
        }

        // If initialDomainId is provided, validate it exists
        if (initialDomainId && loadedDomains.length > 0) {
          const domainExists = loadedDomains.some(
            (d) => d.id === initialDomainId
          );
          if (!domainExists) {
            // Domain from URL doesn't exist, use default verified domain
            console.warn(
              `Domain ${initialDomainId} from URL not found. Using default domain.`
            );
            domainToSelect =
              verifiedDomains.length > 0 ? verifiedDomains[0].id : "";
          }
        }

        // Update state and URL with selected domain
        if (domainToSelect) {
          setState((prev) => ({ ...prev, domainId: domainToSelect }));
          // Update URL to include domainId if it's not already there or if it changed
          const params = new URLSearchParams(searchParams.toString());
          if (params.get("domainId") !== domainToSelect) {
            params.set("domainId", domainToSelect);
            router.replace(`/email/campaigns/builder?${params.toString()}`, {
              scroll: false,
            });
          }
        } else if (initialDomainId) {
          // No verified domains available, clear the invalid domain from URL
          const params = new URLSearchParams(searchParams.toString());
          params.delete("domainId");
          router.replace(`/email/campaigns/builder?${params.toString()}`, {
            scroll: false,
          });
        }
      } catch (error: any) {
        toast.error("Failed to initialize campaign builder");
        console.error(error);
      } finally {
        setLoadingDomains(false);
      }
    };
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load senders when domain is selected
  useEffect(() => {
    if (state.domainId) {
      fetchSenders();
    } else {
      setSenders([]);
    }
  }, [state.domainId]);

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
      setSenders(filteredSenders);
    } catch (error: any) {
      toast.error("Failed to fetch email senders");
      console.error(error);
    } finally {
      setLoadingSenders(false);
    }
  };

  // Validation helpers
  const validation = {
    recipients: state.selectedRecipients.count > 0,
    subject: state.emailTemplate.subject.trim().length > 0,
    content: state.emailTemplate.htmlContent.trim().length > 0,
    campaignName: state.campaignName.trim().length > 0,
    domain: state.domainId.length > 0,
    sender: state.senderId.length > 0,
  };

  const isFormValid = Object.values(validation).every((v) => v === true);

  const handleRecipientsSelected = (data: {
    type: "list" | "filter" | "individual" | "csv";
    ids: string[];
    count: number;
    csvData?: Array<Record<string, string>>;
    columns?: string[];
    emailColumn?: string;
  }) => {
    setState((prev) => ({
      ...prev,
      selectedRecipients: {
        type: data.type,
        ids: data.ids,
        count: data.count,
      },
      csvData: data.csvData || prev.csvData,
      columns: data.columns || prev.columns,
      emailColumn: data.emailColumn || prev.emailColumn,
    }));
    setShowRecipientModal(false);
  };

  const handleSend = async () => {
    // Final validation
    if (!validation.recipients) {
      toast.error("Please select at least one recipient");
      return;
    }
    if (!validation.subject) {
      toast.error("Please enter an email subject");
      return;
    }
    if (!validation.content) {
      toast.error("Please enter email content");
      return;
    }
    if (!validation.campaignName) {
      toast.error("Please enter a campaign name");
      return;
    }
    if (!validation.domain) {
      toast.error("Please select a domain");
      return;
    }
    if (!validation.sender) {
      toast.error("Please select an email sender");
      return;
    }

    try {
      setSending(true);

      // Step 1: Create campaign
      toast.loading("Creating campaign...");
      let campaignId: string = "";

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
                replyTo:
                  state.useReplyTo && state.replyTo ? state.replyTo : undefined,
              },
            ],
            replyTo:
              state.useReplyTo && state.replyTo ? state.replyTo : undefined,
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

      // Step 2: Create leads from CSV if needed, or use existing lead IDs
      let leadIds: string[] = [];

      if (state.selectedRecipients.type === "csv" && state.csvData.length > 0) {
        toast.loading(`Creating ${state.csvData.length} leads...`);

        try {
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
              tags: state.selectedTags?.map((t: any) => t.name) || [],
              categories:
                state.selectedCategories?.map((c: any) => c.name) || [],
            }
          );

          leadIds = leadsResponse.data?.data?.leadIds || [];

          if (leadIds.length === 0) {
            toast.dismiss();
            toast.error("Failed to create leads from CSV");
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
      } else {
        // Use existing lead IDs
        leadIds = state.selectedRecipients.ids;
      }

      // Step 3: Optional Reoon verification
      const leadEmails =
        state.selectedRecipients.type === "csv"
          ? state.csvData.map((row: any) => {
              const emailColumn = state.emailColumn || "email";
              return (row[emailColumn] || row.email || "").toLowerCase().trim();
            })
          : [];

      setReoonModalPayload({
        domainId: state.domainId,
        campaignId,
        leadIds,
        leadEmails,
      });
      setShowReoonModal(true);
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Failed to send campaign");
      console.error(error);
      setSending(false);
    }
  };

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
      // Add leads to campaign
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

      // Upload attachment if exists and enabled
      if (
        state.useAttachment &&
        state.emailTemplate.attachments &&
        state.emailTemplate.attachments.length > 0
      ) {
        toast.loading("Uploading attachment...");
        try {
          const attachment = state.emailTemplate.attachments[0];
          const fileBuffer = await attachment.file.arrayBuffer();
          // Convert ArrayBuffer to base64 (browser-compatible)
          const bytes = new Uint8Array(fileBuffer);
          const binary = bytes.reduce(
            (acc, byte) => acc + String.fromCharCode(byte),
            ""
          );
          const base64 = btoa(binary);

          // Upload attachment and capture the response with s3Key
          const uploadResponse = await emailClient.post(
            `/api/domains/${domainId}/campaigns/${campaignId}/upload-attachment`,
            {
              fileBuffer: base64,
              fileName: attachment.name,
              mimeType: attachment.type,
            }
          );

          // Get s3Key from upload response
          const uploadData = uploadResponse.data?.data;
          if (!uploadData?.s3Key) {
            throw new Error("Failed to get s3Key from upload response");
          }

          // Update campaign with attachment metadata including s3Key
          await emailClient.patch(
            `/api/domains/${domainId}/campaigns/${campaignId}`,
            {
              attachment: {
                s3Key: uploadData.s3Key,
                fileName: uploadData.fileName || attachment.name,
                mimeType: uploadData.mimeType || attachment.type,
                size: uploadData.size || attachment.size,
              },
            }
          );

          toast.dismiss();
          toast.success("Attachment uploaded successfully!");
        } catch (attachmentError: any) {
          toast.dismiss();
          console.error("Attachment upload error:", attachmentError);
          toast.error(
            attachmentError.response?.data?.message ||
              "Failed to upload attachment"
          );
          // Continue without attachment
        }
      }

      // Send campaign
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
          toast.dismiss();
          toast.success(
            `Campaign sent successfully to ${sentCount} recipients!`
          );
          if (onSuccess) onSuccess();
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

  // Extract variables from CSV columns
  const INTERNAL_FIELDS = [
    "id",
    "lead_id",
    "user_id",
    "created_at",
    "updated_at",
    "campaign_id",
    "category_id",
    "status",
    "enriched_data",
    "bounce_reason",
    "complaint_reason",
    "unsubscribe_reason",
    "last_email_sent_at",
    "last_interaction_at",
  ];

  const availableVariables = state.columns
    .filter((e) => e !== "__EMPTY")
    .filter((e) => !INTERNAL_FIELDS.includes(e.toLowerCase()))
    .map((e) => `{{${e.trim()}}}`);

  if (eligibility && !eligibility.eligible) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full">
          <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-text-100 mb-2">
              You're almost ready to send
            </h2>
            <p className="text-text-200 mb-6">
              To build a campaign, you'll need at least one verified domain with
              DKIM and one verified sender.
            </p>
            <div className="space-y-2 text-left max-w-md mx-auto mb-6">
              {eligibility.verifiedDomainCount === 0 && (
                <p className="text-text-200">
                  • No verified domains found. Verify your domain first.
                </p>
              )}
              {eligibility.verifiedSenderCount === 0 && (
                <p className="text-text-200">
                  • No verified senders found. Add and verify a sender.
                </p>
              )}
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={() => (window.location.href = "/email/domains")}
                className="px-4 py-2 rounded-lg bg-brand-main text-text-100"
              >
                Manage Domains
              </Button>
              <Button
                onClick={() => (window.location.href = "/email/domains")}
                className="px-4 py-2 rounded-lg bg-brand-main/20 text-text-100 border border-brand-main/30"
              >
                Add Sender
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-100">
      {/* Header */}
      <header className="backdrop-blur-xl bg-brand-main/5 border-b border-brand-main/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-text-100">
                Create Campaign
              </h1>
              <p className="text-xs text-text-200 mt-0.5">
                Build your email campaign - all in one place
              </p>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-text-200 hover:text-text-100 transition p-2 rounded-lg hover:bg-brand-main/10"
              >
                <X size={24} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - All sections visible */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Section 1: Recipients */}
            <div className="backdrop-blur-xl bg-brand-main/5 border border-brand-main/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      validation.recipients
                        ? "bg-success/20"
                        : "bg-brand-main/10"
                    }`}
                  >
                    {validation.recipients ? (
                      <CheckCircle2 size={16} className="text-success" />
                    ) : (
                      <Users size={16} className="text-brand-main" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-text-100">
                      Recipients
                    </h2>
                    <p className="text-xs text-text-200">
                      Select who will receive your campaign
                    </p>
                  </div>
                </div>
                {!validation.recipients && (
                  <div className="flex items-center gap-2 text-error text-xs">
                    <AlertCircle size={14} />
                    <span>Required</span>
                  </div>
                )}
              </div>

              {state.selectedRecipients.count > 0 ? (
                <div className="bg-success/10 border-2 border-success/30 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 size={16} className="text-success" />
                        <p className="font-semibold text-sm text-text-100">
                          {state.selectedRecipients.count} recipient
                          {state.selectedRecipients.count !== 1 ? "s" : ""}{" "}
                          selected
                        </p>
                      </div>
                      <p className="text-xs text-text-200">
                        Type: {state.selectedRecipients.type}
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowRecipientModal(true)}
                      variant="outline"
                      className="border-brand-main/20 text-xs px-3 py-1.5"
                    >
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-brand-main/20 rounded-lg p-6 text-center mb-3">
                  <Users size={40} className="mx-auto text-text-200/40 mb-3" />
                  <p className="text-sm text-text-200 mb-3">
                    No recipients selected
                  </p>
                  <Button
                    onClick={() => setShowRecipientModal(true)}
                    className="bg-brand-main hover:bg-brand-main/90 text-white text-sm px-4 py-2"
                  >
                    Select Recipients
                  </Button>
                </div>
              )}
            </div>

            {/* Section 2: Email Content */}
            <div className="backdrop-blur-xl bg-brand-main/5 border border-brand-main/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      validation.subject && validation.content
                        ? "bg-success/20"
                        : "bg-brand-main/10"
                    }`}
                  >
                    {validation.subject && validation.content ? (
                      <CheckCircle2 size={16} className="text-success" />
                    ) : (
                      <Mail size={16} className="text-brand-main" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-text-100">
                      Email Content
                    </h2>
                    <p className="text-xs text-text-200">
                      Create your email subject and content
                    </p>
                  </div>
                </div>
                {(!validation.subject || !validation.content) && (
                  <div className="flex items-center gap-2 text-error text-xs">
                    <AlertCircle size={14} />
                    <span>Required</span>
                  </div>
                )}
              </div>

              <EmailTemplateEditor
                subject={state.emailTemplate.subject}
                previewText={state.emailTemplate.previewText || ""}
                htmlContent={state.emailTemplate.htmlContent}
                availableVariables={availableVariables}
                onSubjectChange={(subject) =>
                  setState((prev) => ({
                    ...prev,
                    emailTemplate: { ...prev.emailTemplate, subject },
                  }))
                }
                onPreviewTextChange={(previewText) =>
                  setState((prev) => ({
                    ...prev,
                    emailTemplate: { ...prev.emailTemplate, previewText },
                  }))
                }
                onHtmlContentChange={(htmlContent) =>
                  setState((prev) => ({
                    ...prev,
                    emailTemplate: { ...prev.emailTemplate, htmlContent },
                  }))
                }
              />
            </div>

            {/* Section 3: Campaign Settings */}
            <div className="backdrop-blur-xl bg-brand-main/5 border border-brand-main/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      validation.campaignName &&
                      validation.domain &&
                      validation.sender
                        ? "bg-success/20"
                        : "bg-brand-main/10"
                    }`}
                  >
                    {validation.campaignName &&
                    validation.domain &&
                    validation.sender ? (
                      <CheckCircle2 size={16} className="text-success" />
                    ) : (
                      <Settings size={16} className="text-brand-main" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-text-100">
                      Campaign Settings
                    </h2>
                    <p className="text-xs text-text-200">
                      Configure campaign details and sending options
                    </p>
                  </div>
                </div>
                {(!validation.campaignName ||
                  !validation.domain ||
                  !validation.sender) && (
                  <div className="flex items-center gap-2 text-error text-xs">
                    <AlertCircle size={14} />
                    <span>Required</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Campaign Info */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-text-100">
                    Campaign Information
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-text-200 mb-1.5">
                      Campaign Name *
                    </label>
                    <input
                      type="text"
                      value={state.campaignName}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          campaignName: e.target.value,
                        }))
                      }
                      placeholder="e.g., Q4 Product Launch"
                      className="w-full px-3 py-2 text-sm bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200/50 focus:outline-none focus:ring-2 focus:ring-brand-main"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-200 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={state.campaignDescription}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          campaignDescription: e.target.value,
                        }))
                      }
                      placeholder="Campaign description (optional)"
                      rows={3}
                      className="w-full px-3 py-2 text-sm bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200/50 focus:outline-none focus:ring-2 focus:ring-brand-main"
                    />
                  </div>
                </div>

                {/* Sending Configuration */}
                <div className="space-y-3 pt-3 border-t border-brand-main/10">
                  <h3 className="text-sm font-medium text-text-100">
                    Sending Configuration
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-text-200 mb-1.5">
                      Select Domain *
                    </label>
                    {loadingDomains ? (
                      <div className="text-text-200 text-xs py-2">
                        Loading domains...
                      </div>
                    ) : (
                      <select
                        value={state.domainId}
                        onChange={(e) => {
                          const newDomainId = e.target.value;
                          setState((prev) => ({
                            ...prev,
                            domainId: newDomainId,
                            senderId: "",
                          }));

                          // Update URL query parameter to maintain domain selection
                          const params = new URLSearchParams(
                            searchParams.toString()
                          );
                          if (newDomainId) {
                            params.set("domainId", newDomainId);
                          } else {
                            params.delete("domainId");
                          }
                          router.replace(
                            `/email/campaigns/builder?${params.toString()}`,
                            { scroll: false }
                          );
                        }}
                        className="w-full px-3 py-2 text-sm bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
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
                  <div>
                    <label className="block text-xs font-medium text-text-200 mb-1.5">
                      Select Email Sender *
                    </label>
                    {loadingSenders ? (
                      <div className="text-text-200 text-xs py-2">
                        Loading senders...
                      </div>
                    ) : senders.length === 0 ? (
                      <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
                        <p className="text-xs text-text-200">
                          {state.domainId
                            ? "No verified senders for this domain. Please verify a sender first."
                            : "Please select a domain first."}
                        </p>
                      </div>
                    ) : (
                      <select
                        value={state.senderId}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            senderId: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
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
                </div>

                {/* Email Settings */}
                <div className="pt-3 border-t border-brand-main/10">
                  <h3 className="text-sm font-medium text-text-100 mb-3">
                    Email Settings
                  </h3>
                  <div className="space-y-4">
                    {/* Reply-To Address */}
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input
                          type="checkbox"
                          checked={state.useReplyTo}
                          onChange={(e) =>
                            setState((prev) => ({
                              ...prev,
                              useReplyTo: e.target.checked,
                              replyTo: e.target.checked ? prev.replyTo : "",
                            }))
                          }
                          className="w-4 h-4 rounded border-brand-main/20 text-brand-main focus:ring-brand-main"
                        />
                        <span className="text-xs font-medium text-text-200">
                          Use a different Reply-to address
                        </span>
                      </label>
                      {state.useReplyTo && (
                        <div className="mt-2">
                          <input
                            type="email"
                            value={state.replyTo || ""}
                            onChange={(e) =>
                              setState((prev) => ({
                                ...prev,
                                replyTo: e.target.value,
                              }))
                            }
                            placeholder="Enter an email address"
                            className="w-full px-3 py-2 text-sm bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200/50 focus:outline-none focus:ring-2 focus:ring-brand-main"
                          />
                        </div>
                      )}
                    </div>

                    {/* Attachments */}
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input
                          type="checkbox"
                          checked={state.useAttachment}
                          onChange={(e) =>
                            setState((prev) => ({
                              ...prev,
                              useAttachment: e.target.checked,
                              emailTemplate: {
                                ...prev.emailTemplate,
                                attachments: e.target.checked
                                  ? prev.emailTemplate.attachments
                                  : [],
                              },
                            }))
                          }
                          className="w-4 h-4 rounded border-brand-main/20 text-brand-main focus:ring-brand-main"
                        />
                        <span className="text-xs font-medium text-text-200">
                          Add an attachment
                        </span>
                      </label>
                      {state.useAttachment && (
                        <div className="mt-2">
                          {(state.emailTemplate.attachments || []).length ===
                          0 ? (
                            <label className="flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-dashed border-brand-main/20 rounded-lg cursor-pointer hover:border-brand-main/40 hover:bg-brand-main/5 transition-all">
                              <div className="text-center">
                                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-brand-main/10 flex items-center justify-center">
                                  <span className="text-xl">📎</span>
                                </div>
                                <p className="text-xs font-medium text-text-100 mb-1">
                                  Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-text-200/60">
                                  PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (Max 7MB)
                                </p>
                              </div>
                              <input
                                type="file"
                                onChange={(e) => {
                                  const files = e.target.files;
                                  if (!files || files.length === 0) return;
                                  const file = files[0];
                                  const MAX_FILE_SIZE = 7 * 1024 * 1024; // 7MB
                                  if (file.size > MAX_FILE_SIZE) {
                                    toast.error(
                                      `File ${file.name} is too large (max 7MB)`
                                    );
                                    return;
                                  }
                                  setState((prev) => ({
                                    ...prev,
                                    emailTemplate: {
                                      ...prev.emailTemplate,
                                      attachments: [
                                        {
                                          name: file.name,
                                          size: file.size,
                                          type: file.type,
                                          file,
                                        },
                                      ],
                                    },
                                  }));
                                  toast.success(`Added ${file.name}`);
                                }}
                                className="hidden"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                              />
                            </label>
                          ) : (
                            <div className="space-y-2">
                              {(state.emailTemplate.attachments || []).map(
                                (attachment, index) => {
                                  const sizeInMB = (
                                    attachment.size /
                                    1024 /
                                    1024
                                  ).toFixed(2);
                                  const fileType = attachment.type || "Unknown";
                                  const getFileIcon = (type: string) => {
                                    if (type.includes("pdf")) return "📕";
                                    if (
                                      type.includes("word") ||
                                      type.includes("document")
                                    )
                                      return "📘";
                                    if (
                                      type.includes("sheet") ||
                                      type.includes("excel")
                                    )
                                      return "📗";
                                    if (type.includes("image")) return "🖼️";
                                    return "📄";
                                  };

                                  return (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-3 bg-bg-300/50 border border-brand-main/20 rounded-lg"
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className="text-xl">
                                          {getFileIcon(fileType)}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs font-medium text-text-100 truncate">
                                            {attachment.name}
                                          </p>
                                          <p className="text-xs text-text-200/60 mt-0.5">
                                            {sizeInMB} MB •{" "}
                                            {fileType
                                              .split("/")[1]
                                              ?.toUpperCase() || "FILE"}
                                          </p>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => {
                                          setState((prev) => ({
                                            ...prev,
                                            emailTemplate: {
                                              ...prev.emailTemplate,
                                              attachments: (
                                                prev.emailTemplate
                                                  .attachments || []
                                              ).filter((_, i) => i !== index),
                                            },
                                          }));
                                        }}
                                        className="px-2 py-1 text-xs font-medium text-error hover:bg-error/10 rounded transition-colors"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Summary & Send */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* Summary Card */}
              <div className="backdrop-blur-xl bg-brand-main/5 border border-brand-main/20 rounded-xl p-4">
                <h3 className="text-base font-semibold text-text-100 mb-3">
                  Campaign Summary
                </h3>
                <div className="space-y-3">
                  {/* Recipients */}
                  <div>
                    <p className="text-xs text-text-200 mb-1">Recipients</p>
                    <div className="flex items-center gap-2">
                      {validation.recipients ? (
                        <CheckCircle2 size={14} className="text-success" />
                      ) : (
                        <AlertCircle size={14} className="text-error" />
                      )}
                      <p
                        className={`text-xs font-medium ${
                          validation.recipients ? "text-success" : "text-error"
                        }`}
                      >
                        {state.selectedRecipients.count || 0} selected
                      </p>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <p className="text-xs text-text-200 mb-1">Subject</p>
                    <div className="flex items-center gap-2">
                      {validation.subject ? (
                        <CheckCircle2 size={14} className="text-success" />
                      ) : (
                        <AlertCircle size={14} className="text-error" />
                      )}
                      <p
                        className={`text-xs font-medium truncate ${
                          validation.subject ? "text-text-100" : "text-error"
                        }`}
                      >
                        {state.emailTemplate.subject || "Not set"}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <p className="text-xs text-text-200 mb-1">Content</p>
                    <div className="flex items-center gap-2">
                      {validation.content ? (
                        <CheckCircle2 size={14} className="text-success" />
                      ) : (
                        <AlertCircle size={14} className="text-error" />
                      )}
                      <p
                        className={`text-xs font-medium ${
                          validation.content ? "text-success" : "text-error"
                        }`}
                      >
                        {validation.content ? "Ready" : "Not set"}
                      </p>
                    </div>
                  </div>

                  {/* Domain */}
                  <div>
                    <p className="text-xs text-text-200 mb-1">Domain</p>
                    <div className="flex items-center gap-2">
                      {validation.domain ? (
                        <CheckCircle2 size={14} className="text-success" />
                      ) : (
                        <AlertCircle size={14} className="text-error" />
                      )}
                      <p
                        className={`text-xs font-medium truncate ${
                          validation.domain ? "text-text-100" : "text-error"
                        }`}
                      >
                        {domains.find((d) => d.id === state.domainId)?.domain ||
                          "Not selected"}
                      </p>
                    </div>
                  </div>

                  {/* Sender */}
                  <div>
                    <p className="text-xs text-text-200 mb-1">Sender</p>
                    <div className="flex items-center gap-2">
                      {validation.sender ? (
                        <CheckCircle2 size={14} className="text-success" />
                      ) : (
                        <AlertCircle size={14} className="text-error" />
                      )}
                      <p
                        className={`text-xs font-medium truncate ${
                          validation.sender ? "text-text-100" : "text-error"
                        }`}
                      >
                        {senders.find((s) => s.id === state.senderId)?.email ||
                          "Not selected"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSend}
                disabled={sending || !isFormValid}
                className="w-full bg-success hover:bg-success/90 disabled:bg-success/50 text-white py-3 text-base font-semibold shadow-lg"
              >
                {sending ? (
                  "Sending Campaign..."
                ) : (
                  <>
                    <Send size={18} className="mr-2" />
                    Send Campaign
                  </>
                )}
              </Button>

              {!isFormValid && (
                <div className="bg-error/10 border border-error/30 rounded-lg p-3">
                  <p className="text-xs text-error text-center">
                    Please complete all required fields to send
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Recipient Selection Modal */}
      {showRecipientModal && (
        <RecipientSelectionModal
          open={showRecipientModal}
          onClose={() => setShowRecipientModal(false)}
          onSelect={handleRecipientsSelected}
          initialSelection={state.selectedRecipients}
          selectedTags={state.selectedTags}
          selectedCategories={state.selectedCategories}
          onTagsChange={(tags) =>
            setState((prev) => ({ ...prev, selectedTags: tags }))
          }
          onCategoriesChange={(categories) =>
            setState((prev) => ({ ...prev, selectedCategories: categories }))
          }
        />
      )}

      {/* Reoon Verification Modal */}
      {reoonModalPayload && (
        <CampaignReoonVerificationModal
          open={showReoonModal}
          domainId={reoonModalPayload.domainId}
          campaignId={reoonModalPayload.campaignId}
          leadIds={reoonModalPayload.leadIds}
          leadEmails={reoonModalPayload.leadEmails}
          onDecision={handleReoonDecision}
        />
      )}
    </div>
  );
}
