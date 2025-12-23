"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import toast from "react-hot-toast";

import SinglePageCampaignBuilder from "@/components/campaign-builder/SinglePageCampaignBuilder";
import emailClient, { getCampaignEligibility } from "@/utils/api/emailClient";

function CampaignBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDomainId = searchParams.get("domainId") || "";

  const handleCancel = () => {
    if (
      confirm("Are you sure you want to cancel? All progress will be lost.")
    ) {
      router.push("/email/campaigns");
    }
  };

  const handleSuccess = () => {
    router.push("/email/campaigns");
  };

  return (
    <SinglePageCampaignBuilder
      onCancel={handleCancel}
      onSuccess={handleSuccess}
      initialDomainId={initialDomainId}
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
