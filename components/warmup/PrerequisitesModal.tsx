"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import warmupClient from "@/utils/api/warmupClient";
import { IconAlertCircle, IconCheck, IconX } from "@tabler/icons-react";

interface PrerequisitesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrerequisitesModal({
  isOpen,
  onClose,
}: PrerequisitesModalProps) {
  const [prerequisites, setPrerequisites] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchPrerequisites();
    }
  }, [isOpen]);

  const fetchPrerequisites = async () => {
    try {
      setLoading(true);
      const data = await warmupClient.get("/prerequisites");
      setPrerequisites(data.data);
    } catch (error: any) {
      console.error("Failed to fetch prerequisites:", error);
      toast.error("Failed to check prerequisites");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-200 rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-6">
          <IconAlertCircle className="w-6 h-6 text-yellow-400" />
          <h2 className="text-2xl font-bold text-text-100">
            Requirements Not Met
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-text-200">Checking requirements...</p>
          </div>
        ) : prerequisites ? (
          <div className="space-y-4 mb-6">
            {/* Verified Domain */}
            <div className="flex items-start gap-3 p-4 bg-bg-300 rounded-lg">
              {prerequisites.hasVerifiedDomain ? (
                <IconCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <IconX className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium text-text-100">Verified Domain</p>
                <p className="text-sm text-text-200 mt-1">
                  {prerequisites.hasVerifiedDomain
                    ? `You have ${prerequisites.verifiedDomains.length} verified domain(s)`
                    : "You need at least one verified domain"}
                </p>
                {!prerequisites.hasVerifiedDomain && (
                  <Link
                    href="/email/domains"
                    className="text-sm text-brand-main hover:underline mt-2 inline-block"
                  >
                    Add Domain →
                  </Link>
                )}
              </div>
            </div>

            {/* Verified Email */}
            <div className="flex items-start gap-3 p-4 bg-bg-300 rounded-lg">
              {prerequisites.hasVerifiedEmail ? (
                <IconCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <IconX className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium text-text-100">Verified Email</p>
                <p className="text-sm text-text-200 mt-1">
                  {prerequisites.hasVerifiedEmail
                    ? "You have verified email(s) in your domain"
                    : "You need at least one verified email in your domain"}
                </p>
                {!prerequisites.hasVerifiedEmail && (
                  <Link
                    href="/email/senders"
                    className="text-sm text-brand-main hover:underline mt-2 inline-block"
                  >
                    Add Email →
                  </Link>
                )}
              </div>
            </div>

            {/* Minimum Leads */}
            <div className="flex items-start gap-3 p-4 bg-bg-300 rounded-lg">
              {prerequisites.hasMinimumLeads ? (
                <IconCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <IconX className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium text-text-100">Minimum 100 Leads</p>
                <p className="text-sm text-text-200 mt-1">
                  {prerequisites.hasMinimumLeads
                    ? `You have ${prerequisites.leadCount} leads`
                    : `You have ${prerequisites.leadCount} leads, need 100`}
                </p>
                {!prerequisites.hasMinimumLeads && (
                  <Link
                    href="/email/leads"
                    className="text-sm text-brand-main hover:underline mt-2 inline-block"
                  >
                    Add Leads →
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex gap-3">
          <Button
            onClick={onClose}
            className="flex-1 bg-bg-300 hover:bg-bg-300/80 text-text-100 px-4 py-2 rounded-lg transition"
          >
            Close
          </Button>
          {prerequisites?.canCreateWarmupAccount && (
            <Button
              onClick={onClose}
              className="flex-1 bg-brand-main hover:bg-brand-main/80 text-text-100 px-4 py-2 rounded-lg transition"
            >
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
