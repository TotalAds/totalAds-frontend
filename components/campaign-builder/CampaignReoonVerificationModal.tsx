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
import {
  BulkVerifyLeadsResponse,
  BulkVerifyLeadsSummary,
  LeadVerificationResult,
  verifyCampaignLeadsWithReoon,
} from "@/utils/api/reoonClient";

const RISKY_STATUSES = new Set([
  "invalid",
  "disposable",
  "spamtrap",
  "catch_all",
  "role_account",
]);

interface CampaignReoonVerificationModalProps {
  open: boolean;
  domainId: string;
  campaignId: string;
  leadIds: string[];
  onDecision: (decision: {
    usedVerification: boolean;
    filteredLeadIds: string[];
  }) => void;
}

export default function CampaignReoonVerificationModal({
  open,
  domainId,
  campaignId,
  leadIds,
  onDecision,
}: CampaignReoonVerificationModalProps) {
  const [phase, setPhase] = useState<"prompt" | "verifying" | "results">(
    "prompt"
  );
  const [summary, setSummary] = useState<BulkVerifyLeadsSummary | null>(null);
  const [results, setResults] = useState<LeadVerificationResult[]>([]);
  const [selectedStatusesToExclude, setSelectedStatusesToExclude] = useState<
    Set<string>
  >(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setPhase("prompt");
      setSummary(null);
      setResults([]);
      setSelectedStatusesToExclude(new Set());
      setIsLoading(false);
    }
  }, [open]);

  const handleSkipVerification = () => {
    onDecision({ usedVerification: false, filteredLeadIds: leadIds });
  };

  const handleStartVerification = async () => {
    try {
      setIsLoading(true);
      setPhase("verifying");

      const response: BulkVerifyLeadsResponse =
        await verifyCampaignLeadsWithReoon({
          domainId,
          campaignId,
          leadIds,
          mode: "power",
        });

      const { summary: s, results: r } = response;
      setSummary(s);
      setResults(r);

      const defaultExcluded = new Set<string>();
      Object.entries(s.byStatus || {}).forEach(([status, count]) => {
        if (count > 0 && RISKY_STATUSES.has(status)) {
          defaultExcluded.add(status);
        }
      });
      setSelectedStatusesToExclude(defaultExcluded);

      setPhase("results");
    } catch (error: any) {
      console.error("Reoon verification error in modal:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to verify emails with Reoon. Continuing without verification.";
      toast.error(message);
      onDecision({ usedVerification: false, filteredLeadIds: leadIds });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = () => {
    if (!summary) {
      onDecision({ usedVerification: false, filteredLeadIds: leadIds });
      return;
    }

    const excluded = selectedStatusesToExclude;

    const allowedLeadIds = leadIds.filter((leadId) => {
      const match = results.find((r) => r.leadId === leadId);
      if (!match) return true;
      return !excluded.has(match.status);
    });

    if (allowedLeadIds.length === 0) {
      toast.error(
        "All selected leads are classified as risky based on your filters. No emails will be sent."
      );
      return;
    }

    onDecision({ usedVerification: true, filteredLeadIds: allowedLeadIds });
  };

  const handleUseAllLeads = () => {
    onDecision({ usedVerification: true, filteredLeadIds: leadIds });
  };

  const toggleStatus = (status: string) => {
    setSelectedStatusesToExclude((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="bg-brand-main/5 border border-brand-main/20 max-w-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-text-100 text-xl">
            Verify emails with Reoon
          </DialogTitle>
          <DialogDescription className="text-text-200/80 text-sm">
            Improve your deliverability by verifying {leadIds.length} leads
            before sending. This step is optional but recommended.
          </DialogDescription>
        </DialogHeader>

        {phase === "prompt" && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-text-200">
              We can verify all {leadIds.length} email addresses using Reoon
              Email Verifier. Verified results are cached so you won&apos;t pay
              twice for the same email.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={handleSkipVerification}
                disabled={isLoading}
              >
                Skip verification
              </Button>
              <Button
                className="bg-brand-main hover:bg-brand-main/80"
                onClick={handleStartVerification}
                disabled={isLoading}
              >
                {isLoading ? "Starting..." : "Verify now"}
              </Button>
            </div>
          </div>
        )}

        {phase === "verifying" && (
          <div className="py-6">
            <p className="text-sm text-text-200 mb-2">
              Verifying leads with Reoon Email Verifier...
            </p>
            <p className="text-xs text-text-200/70">
              This may take a few seconds for larger lists. We&apos;ll show you a
              breakdown by status once it&apos;s complete.
            </p>
          </div>
        )}

        {phase === "results" && summary && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-brand-main/10 border border-brand-main/20 rounded-lg p-3">
                <p className="text-text-200 text-xs">Total leads</p>
                <p className="text-text-100 text-lg font-semibold">
                  {summary.total}
                </p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                <p className="text-text-200 text-xs">Safe to send</p>
                <p className="text-emerald-300 text-lg font-semibold">
                  {summary.safeToSend}
                </p>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-text-200 text-xs">Risky</p>
                <p className="text-red-300 text-lg font-semibold">
                  {summary.risky}
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto bg-brand-main/5 border border-brand-main/10 rounded-lg p-3 text-sm">
              <p className="text-xs text-text-200/70 mb-1">
                Choose which statuses to exclude from this campaign. We
                recommend excluding invalid, disposable, spamtrap, catch-all and
                role accounts.
              </p>
              {Object.entries(summary.byStatus || {}).map(([status, count]) => (
                <label
                  key={status}
                  className="flex items-center justify-between gap-3 py-1 text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedStatusesToExclude.has(status)}
                      onChange={() => toggleStatus(status)}
                      className="w-4 h-4 rounded border-brand-main/40 text-brand-main focus:ring-brand-main"
                    />
                    <span className="text-text-100 font-medium">
                      {status} ({count})
                    </span>
                  </div>
                  {RISKY_STATUSES.has(status) && (
                    <span className="text-[10px] uppercase tracking-wide text-red-300">
                      Recommended to exclude
                    </span>
                  )}
                </label>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 text-xs text-text-200/80">
              <span>
                Your choices here affect only this campaign. Verification
                results are saved for future campaigns.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={handleUseAllLeads}
                disabled={isLoading}
              >
                Use all leads
              </Button>
              <Button
                className="bg-brand-main hover:bg-brand-main/80"
                onClick={handleApplyFilters}
                disabled={isLoading}
              >
                Apply filters &amp; continue
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

