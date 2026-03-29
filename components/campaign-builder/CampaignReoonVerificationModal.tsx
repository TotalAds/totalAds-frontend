"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  BulkVerifyLeadsResponse,
  BulkVerifyLeadsSummary,
  checkEmailsVerificationStatus,
  LeadVerificationResult,
  queueCampaignLeadsVerification,
  verifyCampaignLeadsWithReoon,
} from "@/utils/api/reoonClient";

const RISKY_STATUSES = new Set([
  "invalid",
  "disposable",
  "spamtrap",
  "catch_all",
  "role_account",
]);

// Batch size for checking verification status (to avoid overwhelming the server)
const CHECK_BATCH_SIZE = 5000;

interface CampaignReoonVerificationModalProps {
  open: boolean;
  domainId: string;
  campaignId: string;
  leadIds: string[];
  // We also need emails to check verification status
  leadEmails?: string[];
  onDecision: (decision: {
    usedVerification: boolean;
    filteredLeadIds: string[];
    verificationQueued?: boolean;
  }) => void;
}

type Phase =
  | "prompt"
  | "checking"
  | "ready"
  | "verifying"
  | "queued"
  | "results";

interface PreCheckResult {
  total: number;
  alreadyVerified: number;
  needsVerification: number;
  verifiedLeadIds: string[];
  unverifiedLeadIds: string[];
}

export default function CampaignReoonVerificationModal({
  open,
  domainId,
  campaignId,
  leadIds,
  leadEmails,
  onDecision,
}: CampaignReoonVerificationModalProps) {
  const [phase, setPhase] = useState<Phase>("prompt");
  const [summary, setSummary] = useState<BulkVerifyLeadsSummary | null>(null);
  const [results, setResults] = useState<LeadVerificationResult[]>([]);
  const [selectedStatusesToExclude, setSelectedStatusesToExclude] = useState<
    Set<string>
  >(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Pre-check state
  const [preCheckResult, setPreCheckResult] = useState<PreCheckResult | null>(
    null
  );
  const [checkProgress, setCheckProgress] = useState(0);
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

  // Track if verification was cancelled
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (open) {
      setPhase("prompt");
      setSummary(null);
      setResults([]);
      setSelectedStatusesToExclude(new Set());
      setIsLoading(false);
      setPreCheckResult(null);
      setCheckProgress(0);
      setVerifyProgress(0);
      setProgressMessage("");
      cancelledRef.current = false;
    }
  }, [open]);

  const handleSkipVerification = () => {
    cancelledRef.current = true;
    onDecision({ usedVerification: false, filteredLeadIds: leadIds });
  };

  // Fetch lead emails from backend if not provided
  const fetchLeadEmails = useCallback(async (): Promise<
    Map<string, string>
  > => {
    const leadIdToEmail = new Map<string, string>();

    // Fetch leads in batches
    const batchSize = 1000;
    for (let i = 0; i < leadIds.length; i += batchSize) {
      if (cancelledRef.current) break;

      const batchIds = leadIds.slice(i, i + batchSize);
      try {
        const response = await emailClient.post("/api/leads/batch-get", {
          leadIds: batchIds,
        });
        const leads = response.data?.data?.leads || [];
        for (const lead of leads) {
          if (lead.id && lead.email) {
            leadIdToEmail.set(String(lead.id), lead.email.toLowerCase().trim());
          }
        }
      } catch (error) {
        console.error("Error fetching lead emails batch:", error);
      }

      setCheckProgress(Math.round(((i + batchSize) / leadIds.length) * 30));
    }

    return leadIdToEmail;
  }, [leadIds]);

  const handleStartVerification = async () => {
    try {
      setIsLoading(true);
      setPhase("checking");
      setProgressMessage("Checking existing verification records...");

      // Step 1: Get lead emails (either from props or fetch from backend)
      let leadIdToEmail: Map<string, string>;

      if (leadEmails && leadEmails.length === leadIds.length) {
        leadIdToEmail = new Map();
        leadIds.forEach((id, idx) => {
          leadIdToEmail.set(id, leadEmails[idx].toLowerCase().trim());
        });
        setCheckProgress(30);
      } else {
        leadIdToEmail = await fetchLeadEmails();
      }

      if (cancelledRef.current) return;

      // Step 2: Check which emails are already verified (in batches)
      const allEmails = Array.from(new Set(Array.from(leadIdToEmail.values())));
      const verifiedEmails = new Set<string>();

      setProgressMessage(`Checking ${allEmails.length} unique emails...`);

      for (let i = 0; i < allEmails.length; i += CHECK_BATCH_SIZE) {
        if (cancelledRef.current) return;

        const batch = allEmails.slice(i, i + CHECK_BATCH_SIZE);
        try {
          const statusResult = await checkEmailsVerificationStatus(batch);
          for (const email of statusResult.verifiedEmails) {
            verifiedEmails.add(email.toLowerCase().trim());
          }
        } catch (error) {
          console.error("Error checking verification status batch:", error);
        }

        const progress =
          30 + Math.round(((i + batch.length) / allEmails.length) * 70);
        setCheckProgress(Math.min(progress, 100));
      }

      if (cancelledRef.current) return;

      // Step 3: Categorize leads
      const verifiedLeadIds: string[] = [];
      const unverifiedLeadIds: string[] = [];

      for (const [leadId, email] of leadIdToEmail.entries()) {
        if (verifiedEmails.has(email)) {
          verifiedLeadIds.push(leadId);
        } else {
          unverifiedLeadIds.push(leadId);
        }
      }

      const preCheck: PreCheckResult = {
        total: leadIds.length,
        alreadyVerified: verifiedLeadIds.length,
        needsVerification: unverifiedLeadIds.length,
        verifiedLeadIds,
        unverifiedLeadIds,
      };

      setPreCheckResult(preCheck);
      setPhase("ready");
      setProgressMessage("");
    } catch (error: any) {
      console.error("Pre-check error:", error);
      // If pre-check fails, fall back to verifying all leads
      setPreCheckResult({
        total: leadIds.length,
        alreadyVerified: 0,
        needsVerification: leadIds.length,
        verifiedLeadIds: [],
        unverifiedLeadIds: leadIds,
      });
      setPhase("ready");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedWithVerification = async () => {
    if (!preCheckResult) return;

    try {
      setIsLoading(true);
      setPhase("verifying");
      setVerifyProgress(0);

      const idsToVerify = preCheckResult.unverifiedLeadIds;

      if (idsToVerify.length === 0) {
        // All emails are already verified, fetch their results using sync endpoint
        setProgressMessage("All emails already verified. Fetching results...");
        const response = await verifyCampaignLeadsWithReoon({
          domainId,
          campaignId,
          leadIds, // Send all to get cached results
          mode: "power",
        });

        const { summary: s, results: r } = response;
        setSummary(s);
        setResults(r);
        setDefaultExclusions(s);
        setPhase("results");
        return;
      }

      setProgressMessage(
        `Queueing verification for ${idsToVerify.length} emails...${
          preCheckResult.alreadyVerified > 0
            ? ` (${preCheckResult.alreadyVerified} already cached)`
            : ""
        }`
      );

      // Queue verification job (async - returns immediately)
      await queueCampaignLeadsVerification({
        domainId,
        campaignId,
        leadIds, // Send all IDs - backend will use cache for verified ones
        mode: "power",
      });

      if (cancelledRef.current) return;

      // Show queued state
      setPhase("queued");
      toast.success(
        "Verification queued! You'll receive an email when it's complete."
      );
    } catch (error: any) {
      console.error("Reoon verification error:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to queue verification. Continuing without verification.";
      toast.error(message);
      onDecision({ usedVerification: false, filteredLeadIds: leadIds });
    } finally {
      setIsLoading(false);
      setProgressMessage("");
    }
  };

  const handleContinueAfterQueue = () => {
    // User can continue with all leads - verification will happen in background
    // When verification completes, they'll get an email notification
    onDecision({
      usedVerification: false,
      filteredLeadIds: leadIds,
      verificationQueued: true,
    });
  };

  const setDefaultExclusions = (s: BulkVerifyLeadsSummary) => {
    const defaultExcluded = new Set<string>();
    Object.entries(s.byStatus || {}).forEach(([status, count]) => {
      if (count > 0 && RISKY_STATUSES.has(status)) {
        defaultExcluded.add(status);
      }
    });
    setSelectedStatusesToExclude(defaultExcluded);
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
      <DialogContent className="bg-bg-200 border border-brand-main/20 max-w-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-text-100 text-xl">
            Verify emails with Reoon
          </DialogTitle>
          <DialogDescription className="text-text-200/80 text-sm">
            In our campaign builder, email verification is required for every lead. If a lead is not already verified, we need to verify it before you can send. This step checks all {leadIds.length} leads and verifies any that aren&apos;t verified yet.
          </DialogDescription>
        </DialogHeader>

        {phase === "prompt" && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-text-200">
              We will verify all {leadIds.length} email addresses using Reoon
              Email Verifier. Verified results are cached so you won&apos;t pay
              twice for the same email. Unverified leads cannot receive campaign emails until verification is complete.
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
                className="bg-brand-main hover:bg-brand-main/80 text-white"
                onClick={handleStartVerification}
                disabled={isLoading}
              >
                {isLoading ? "Starting..." : "Verify now"}
              </Button>
            </div>
          </div>
        )}

        {/* Checking phase - checking which emails are already verified */}
        {phase === "checking" && (
          <div className="py-6 space-y-4">
            <p className="text-sm text-text-200">
              {progressMessage || "Checking verification status..."}
            </p>
            <div className="w-full bg-brand-main/10 rounded-full h-2.5">
              <div
                className="bg-brand-main h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${checkProgress}%` }}
              />
            </div>
            <p className="text-xs text-text-200/70">
              We&apos;re checking which emails are already verified to save you
              credits.
            </p>
            <div className="flex justify-end pt-2">
              <Button variant="ghost" onClick={handleSkipVerification}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Ready phase - show pre-check results and let user proceed */}
        {phase === "ready" && preCheckResult && (
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-brand-main/5 border border-brand-main/20 rounded-lg p-3">
                <p className="text-text-100 text-xs">Total leads</p>
                <p className="text-text-100 text-lg font-semibold">
                  {preCheckResult.total.toLocaleString()}
                </p>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-lg p-3">
                <p className="text-text-100 text-xs">Already verified</p>
                <p className="text-emerald-300 text-lg font-semibold">
                  {preCheckResult.alreadyVerified.toLocaleString()}
                </p>
                <p className="text-xs text-emerald-400 mt-1">No credits used</p>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/30 rounded-lg p-3">
                <p className="text-text-100 text-xs">Need verification</p>
                <p className="text-amber-300 text-lg font-semibold">
                  {preCheckResult.needsVerification.toLocaleString()}
                </p>
                <p className="text-xs text-amber-400 mt-1">
                  {preCheckResult.needsVerification > 0
                    ? "Will use credits"
                    : "None needed"}
                </p>
              </div>
            </div>

            {preCheckResult.alreadyVerified > 0 && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                <p className="text-xs text-emerald-500">
                  <span className="font-semibold">
                    {preCheckResult.alreadyVerified.toLocaleString()}
                  </span>{" "}
                  emails are already verified from previous campaigns.
                  {preCheckResult.needsVerification > 0
                    ? ` Only ${preCheckResult.needsVerification.toLocaleString()} emails will be sent to Reoon for verification.`
                    : " No additional verification needed!"}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={handleSkipVerification}
                disabled={isLoading}
              >
                Skip verification
              </Button>
              <Button
                className="bg-brand-main hover:bg-brand-main/80 text-white"
                onClick={handleProceedWithVerification}
                disabled={isLoading}
              >
                {isLoading
                  ? "Starting..."
                  : preCheckResult.needsVerification === 0
                  ? "Use cached results"
                  : `Verify ${preCheckResult.needsVerification.toLocaleString()} emails`}
              </Button>
            </div>
          </div>
        )}

        {/* Verifying phase - calling Reoon API */}
        {phase === "verifying" && (
          <div className="py-6 space-y-4">
            <p className="text-sm text-text-200">
              {progressMessage || "Verifying emails with Reoon..."}
            </p>
            <div className="w-full bg-brand-main/10 rounded-full h-2.5 overflow-hidden">
              <div className="bg-brand-main h-2.5 rounded-full animate-pulse w-full" />
            </div>
            <p className="text-xs text-text-200/70">
              This may take a moment for larger lists. We&apos;ll show you a
              breakdown by status once it&apos;s complete.
            </p>
            <div className="flex justify-end pt-2">
              <Button variant="ghost" onClick={handleSkipVerification}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Queued phase - verification job has been queued */}
        {phase === "queued" && (
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-text-100">
                Verification Queued!
              </h3>
              <p className="text-sm text-text-200">
                Your email verification is being processed in the background.
                You&apos;ll receive an email notification when it&apos;s
                complete with a summary of the results.
              </p>
            </div>
            <div className="bg-brand-main/10 border border-brand-main/20 rounded-lg p-4 text-sm">
              <p className="text-text-200">
                <strong className="text-text-100">What happens next?</strong>
              </p>
              <ul className="mt-2 space-y-1 text-text-200/80 text-xs">
                <li>• Verification runs in the background</li>
                <li>• You&apos;ll get an email when it&apos;s done</li>
                <li>• Results are cached for future campaigns</li>
                <li>• You can continue setting up your campaign now</li>
              </ul>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                className="bg-brand-main hover:bg-brand-main/80 text-white"
                onClick={handleContinueAfterQueue}
              >
                Continue with campaign
              </Button>
            </div>
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
                className="bg-brand-main hover:bg-brand-main/80 text-white"
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
