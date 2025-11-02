"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import emailClient from "@/utils/api/emailClient";

interface TestEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  domainId: string;
  campaignId?: string;
  templateVariables: string[];
  emailTemplate?: { subject: string; htmlContent: string };
  onCampaignCreated?: (campaignId: string) => void;
}

export function TestEmailModal({
  isOpen,
  onClose,
  domainId,
  campaignId,
  templateVariables,
  emailTemplate,
  onCampaignCreated,
}: TestEmailModalProps) {
  const [testEmail, setTestEmail] = useState("");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [loadingSenders, setLoadingSenders] = useState(false);
  const [domains, setDomains] = useState<Array<{ id: string; domain: string }>>(
    []
  );
  const [senders, setSenders] = useState<
    Array<{ id: string; email: string; displayName?: string; domainId: string }>
  >([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string>(
    domainId || ""
  );
  const [selectedSenderId, setSelectedSenderId] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        setLoadingDomains(true);
        const res = await emailClient.get("/api/domains", {
          params: { page: 1, limit: 100 },
        });
        const domainsList = res.data?.data?.domains || [];
        setDomains(domainsList);
        if (!selectedDomainId && domainsList.length > 0) {
          setSelectedDomainId(domainsList[0].id);
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load domains");
      } finally {
        setLoadingDomains(false);
      }
    })();
  }, [isOpen]);

  useEffect(() => {
    if (!selectedDomainId) {
      setSenders([]);
      setSelectedSenderId("");
      return;
    }
    (async () => {
      try {
        setLoadingSenders(true);
        const res = await emailClient.get("/api/email-senders", {
          params: { page: 1, limit: 100 },
        });
        const all = res.data?.data?.senders || [];
        const filtered = all.filter(
          (s: any) => s.domainId === selectedDomainId
        );
        setSenders(filtered);
        if (filtered.length > 0 && !selectedSenderId) {
          setSelectedSenderId(filtered[0].id);
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load senders");
      } finally {
        setLoadingSenders(false);
      }
    })();
  }, [selectedDomainId]);

  const ensureCampaign = async (): Promise<string> => {
    // If campaignId exists, use it
    if (campaignId) return campaignId;

    // For test emails without a campaign, return a placeholder
    // The backend will use template data instead
    return "test-email-no-campaign";
  };

  const handleSendTest = async () => {
    if (!testEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!selectedDomainId) {
      toast.error("Please select a domain");
      return;
    }

    if (!selectedSenderId) {
      toast.error("Please select a sender email");
      return;
    }

    try {
      setLoading(true);
      toast.loading("Sending test email...");

      const cid = await ensureCampaign();

      const payload: any = {
        testEmail,
        senderId: selectedSenderId,
      };

      // Only add variables if they have values
      // Variables should be passed WITHOUT {{}} wrapper
      if (Object.keys(variables).length > 0) {
        const filledVariables = Object.fromEntries(
          Object.entries(variables)
            .filter(([_, value]) => value !== "")
            .map(([key, value]) => {
              // Remove {{}} if present in key
              const cleanKey = key.replace(/^{{|}}$/g, "");
              return [cleanKey, value];
            })
        );
        if (Object.keys(filledVariables).length > 0) {
          payload.variables = filledVariables;
          console.log("Variables to send:", filledVariables);
        }
      }

      // If no campaign ID, pass template data directly
      if (!campaignId && emailTemplate) {
        payload.templateSubject = emailTemplate.subject;
        payload.templateBody = emailTemplate.htmlContent;

        // Note: Attachment must be uploaded to S3 first via campaign creation
        // For test emails without campaign, attachment is not supported
      }

      console.log("Sending test email with payload:", payload);

      await emailClient.post(
        `/api/domains/${selectedDomainId}/campaigns/${cid}/test-email`,
        payload
      );

      toast.dismiss();
      toast.success("Test email sent successfully!");
      setTestEmail("");
      setVariables({});
      onClose();
    } catch (error: any) {
      toast.dismiss();
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to send test email";
      toast.error(errorMsg);
      console.error("Test email error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-brand-main/5 border border-brand-main/20 max-w-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-text-100 text-2xl">
            Send Test Email
          </DialogTitle>
          <DialogDescription className="text-text-200/70 text-sm">
            Configure sender and recipient for your test email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Domain Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-text-100">
              1. Select Domain <span className="text-error">*</span>
            </label>
            <select
              value={selectedDomainId}
              onChange={(e) => {
                setSelectedDomainId(e.target.value);
                setSelectedSenderId("");
              }}
              disabled={loading || loadingDomains || domains.length === 0}
              className="w-full px-4 py-3 bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-main disabled:opacity-50 transition"
            >
              <option value="">
                {loadingDomains ? "Loading domains..." : "Choose a domain..."}
              </option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.domain}
                </option>
              ))}
            </select>
            {domains.length === 0 && !loadingDomains && (
              <p className="text-xs text-error">
                No domains found. Please create a domain first.
              </p>
            )}
          </div>

          {/* Step 2: Sender Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-text-100">
              2. Select Sender Email <span className="text-error">*</span>
            </label>
            <select
              value={selectedSenderId}
              onChange={(e) => setSelectedSenderId(e.target.value)}
              disabled={
                loading ||
                loadingSenders ||
                !selectedDomainId ||
                senders.length === 0
              }
              className="w-full px-4 py-3 bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-main disabled:opacity-50 transition"
            >
              <option value="">
                {loadingSenders ? "Loading senders..." : "Choose a sender..."}
              </option>
              {senders.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.displayName ? `${s.displayName} <${s.email}>` : s.email}
                </option>
              ))}
            </select>
            {selectedDomainId && senders.length === 0 && !loadingSenders && (
              <p className="text-xs text-error">
                No senders found for this domain. Please add a sender first.
              </p>
            )}
          </div>

          {/* Step 3: Test Email Address */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-text-100">
              3. Test Email Address <span className="text-error">*</span>
            </label>
            <input
              type="email"
              placeholder="your-email@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200/50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent disabled:opacity-50 transition"
            />
          </div>

          {/* Step 4: Template Variables */}
          {templateVariables.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-100">
                4. Template Variables{" "}
                <span className="text-text-200/60">(Optional)</span>
              </label>
              <div className="space-y-3 max-h-40 overflow-y-auto bg-brand-main/5 p-3 rounded-lg border border-brand-main/10">
                {templateVariables.map((variable) => (
                  <div key={variable}>
                    <label className="block text-xs text-text-200/60 mb-1">
                      {`{{${variable}}}`}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., John Doe"
                      value={variables[variable] || ""}
                      onChange={(e) =>
                        setVariables({
                          ...variables,
                          [variable]: e.target.value,
                        })
                      }
                      disabled={loading}
                      className="w-full px-3 py-2 bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200/50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent disabled:opacity-50 transition"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-brand-main/10">
          <Button onClick={onClose} variant="ghost" disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSendTest}
            disabled={
              loading || !testEmail || !selectedDomainId || !selectedSenderId
            }
            className="bg-brand-main hover:bg-brand-main/80 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Test Email"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
