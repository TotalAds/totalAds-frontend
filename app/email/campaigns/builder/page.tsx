"use client";

/**
 * @deprecated Legacy builder route. Campaign editing lives at /email/campaigns/[id].
 */

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function CampaignBuilderRedirect() {
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-2 p-6 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      <p className="text-sm text-slate-600">Redirecting to campaign…</p>
    </div>
  );
}

export default function CampaignBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }
    >
      <CampaignBuilderRedirect />
    </Suspense>
  );
}
