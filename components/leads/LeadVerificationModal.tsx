"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

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
  LeadVerificationResult,
  verifyLeadWithReoon,
} from "@/utils/api/reoonClient";

interface LeadVerificationModalProps {
  isOpen: boolean;
  lead: {
    id: string;
    email: string;
  } | null;
  onClose: () => void;
}

export function LeadVerificationModal({
  isOpen,
  lead,
  onClose,
}: LeadVerificationModalProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<LeadVerificationResult | null>(null);

  useEffect(() => {
    if (!isOpen || !lead) {
      setResult(null);
      setIsVerifying(false);
      return;
    }

    const runVerification = async () => {
      try {
        setIsVerifying(true);
        const response: BulkVerifyLeadsResponse = await verifyLeadWithReoon({
          leadId: lead.id,
          mode: "power",
        });

        const match = response.results.find((r) => r.leadId === lead.id);
        if (match) {
          setResult(match);
        } else if (response.results.length > 0) {
          setResult(response.results[0]);
        } else {
          toast.error("No verification result returned for this lead.");
        }
      } catch (error: any) {
        console.error("Lead verification error:", error);
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to verify lead with Reoon. Please check your Reoon configuration in Settings → Integrations.";
        toast.error(message);
      } finally {
        setIsVerifying(false);
      }
    };

    runVerification();
  }, [isOpen, lead]);

  const statusBadgeClass = (status: string | undefined) => {
    if (!status) return "bg-gray-500/20 text-text-200";
    const normalized = status.toLowerCase();
    if (normalized === "safe" || normalized === "valid") {
      return "bg-emerald-500/20 text-emerald-300";
    }
    if (["invalid", "disposable", "spamtrap"].includes(normalized)) {
      return "bg-red-500/20 text-red-300";
    }
    if (["catch_all", "role_account"].includes(normalized)) {
      return "bg-amber-500/20 text-amber-300";
    }
    return "bg-blue-500/20 text-blue-300";
  };

  const renderFlag = (label: string, value: boolean | null | undefined) => {
    if (value == null) return null;
    return (
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-200/80">{label}</span>
        <span className={value ? "text-emerald-300" : "text-text-400"}>
          {value ? "Yes" : "No"}
        </span>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-brand-main/5 border border-brand-main/20 max-w-md backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-text-100 text-xl">
            Verify lead with Reoon
          </DialogTitle>
          <DialogDescription className="text-text-200/80 text-sm">
            {lead ? lead.email : "No lead selected"}
          </DialogDescription>
        </DialogHeader>

        {!lead ? (
          <p className="text-sm text-text-200">No lead selected.</p>
        ) : (
          <div className="space-y-4 py-2">
            {isVerifying && !result && (
              <p className="text-sm text-text-200">
                Verifying this email address with Reoon Email Verifier...
              </p>
            )}

            {result && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-200">Status</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(
                      result.status
                    )}`}
                  >
                    {result.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-200">Safe to send</span>
                  <span
                    className={
                      result.isSafeToSend
                        ? "text-emerald-300 font-medium"
                        : "text-red-300 font-medium"
                    }
                  >
                    {result.isSafeToSend ? "Yes" : "No"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs bg-brand-main/5 border border-brand-main/10 rounded-lg p-3">
                  {renderFlag("Disposable", result.isDisposable)}
                  {renderFlag("Spamtrap", result.isSpamtrap)}
                  {renderFlag("Catch-all", result.isCatchAll)}
                  {renderFlag("Role account", result.isRoleAccount)}
                  {renderFlag("Inbox full", result.hasInboxFull)}
                  {renderFlag("Disabled", result.isDisabled)}
                  {renderFlag("SMTP connectable", result.canConnectSmtp)}
                  {renderFlag("MX accepts mail", result.mxAcceptsMail)}
                </div>
                <p className="text-[11px] text-text-200/70">
                  Verification provider: {result.provider} (
                  {result.mode || "n/a"}) . Result cached at{" "}
                  {new Date(result.verifiedAt).toLocaleString()}.
                </p>
              </div>
            )}

            {!isVerifying && !result && lead && (
              <p className="text-sm text-text-200">
                No result yet. Click &quot;Close&quot; to dismiss this dialog.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isVerifying}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
