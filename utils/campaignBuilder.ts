import type { CampaignSequenceStep } from "@/utils/api/emailClient";

export type CampaignBuilderMode = "single" | "sequence";

/** Sequence campaigns have more than one step in the builder. */
export function getCampaignBuilderMode(
  sequence?: CampaignSequenceStep[] | null
): CampaignBuilderMode {
  const sequenceLength = Array.isArray(sequence) ? sequence.length : 0;
  return sequenceLength > 1 ? "sequence" : "single";
}

export function buildCampaignBuilderHref(options: {
  domainId?: string | null;
  campaignId: string;
  mode?: CampaignBuilderMode;
  sequence?: CampaignSequenceStep[] | null;
  liveSequenceEdit?: boolean;
}): string {
  // Legacy "builder" URL deprecated — send users to campaign detail tabs.
  return `/email/campaigns/${options.campaignId}`;
}
