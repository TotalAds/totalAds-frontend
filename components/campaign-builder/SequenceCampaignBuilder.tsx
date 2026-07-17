"use client";

/**
 * @deprecated Prefer /email/campaigns/[id] (CampaignDetailPage).
 * Legacy sequence-builder route redirects there.
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SequenceCampaignBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingCampaignId = searchParams.get("id") || "";

  useEffect(() => {
    if (existingCampaignId) {
      router.replace(`/email/campaigns/${existingCampaignId}`);
    } else {
      router.replace("/email/campaigns");
    }
  }, [existingCampaignId, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}
