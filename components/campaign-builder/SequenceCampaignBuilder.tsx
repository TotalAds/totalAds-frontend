"use client";

import { useRouter, useSearchParams } from "next/navigation";

import SinglePageCampaignBuilder from "./SinglePageCampaignBuilder";

export default function SequenceCampaignBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDomainId = searchParams.get("domainId") || "";
  const existingCampaignId = searchParams.get("id") || undefined;

  return (
    <SinglePageCampaignBuilder
      campaignMode="sequence"
      initialDomainId={initialDomainId}
      campaignId={existingCampaignId}
      onCancel={() => router.push("/email/campaigns")}
      onSuccess={() => router.push("/email/campaigns")}
    />
  );
}

