"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import SinglePageCampaignBuilder from "@/components/campaign-builder/SinglePageCampaignBuilder";

function CampaignBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDomainId = searchParams.get("domainId") || "";
  const existingCampaignId = searchParams.get("id") || undefined;
  const mode = searchParams.get("mode");

  useEffect(() => {
    if (mode === "sequence") return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", "sequence");
    router.replace(`/email/campaigns/builder?${params.toString()}`);
  }, [mode, router, searchParams]);

  const handleCancel = () => {
    router.push("/email/campaigns");
  };

  const handleSuccess = () => {
    router.push("/email/campaigns");
  };

  return (
    <SinglePageCampaignBuilder
      campaignMode="sequence"
      onCancel={handleCancel}
      onSuccess={handleSuccess}
      initialDomainId={initialDomainId}
      campaignId={existingCampaignId}
    />
  );
}

export default function CampaignBuilderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-main"></div>
      </div>
    }>
      <CampaignBuilderContent />
    </Suspense>
  );
}
