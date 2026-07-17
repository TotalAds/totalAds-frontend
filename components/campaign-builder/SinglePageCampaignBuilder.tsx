"use client";

/**
 * @deprecated SinglePageCampaignBuilder is retired.
 * Campaign create/edit now uses CampaignDetailPage tabs:
 *   /email/campaigns/[id] → Leads / Sequence / Schedule / Options
 * This stub only redirects legacy /email/campaigns/builder links.
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface SinglePageCampaignBuilderProps {
  onCancel?: () => void;
  onSuccess?: () => void;
  initialDomainId?: string;
  campaignId?: string;
  campaignMode?: "single" | "sequence";
}

/**
 * @deprecated Do not add features here. Use CampaignDetailPage / LeadsTab instead.
 */
export default function SinglePageCampaignBuilder({
  campaignId,
  onCancel,
}: SinglePageCampaignBuilderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = campaignId || searchParams.get("id") || "";

  useEffect(() => {
    if (id) {
      router.replace(`/email/campaigns/${id}`);
      return;
    }
    if (onCancel) {
      onCancel();
      return;
    }
    router.replace("/email/campaigns");
  }, [id, onCancel, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      <p className="text-sm text-slate-600">
        Redirecting to the campaign editor…
      </p>
      <p className="text-xs text-slate-400 max-w-md">
        The old single-page campaign builder is deprecated. Use Campaign → Leads
        tab (including LeadHub Autopilot) instead.
      </p>
    </div>
  );
}
