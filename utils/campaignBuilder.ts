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
  domainId: string;
  campaignId: string;
  mode?: CampaignBuilderMode;
  sequence?: CampaignSequenceStep[] | null;
  liveSequenceEdit?: boolean;
}): string {
  const mode = options.mode ?? getCampaignBuilderMode(options.sequence);
  const params = new URLSearchParams({
    mode,
    domainId: options.domainId,
    id: options.campaignId,
  });
  if (options.liveSequenceEdit && mode === "sequence") {
    params.set("liveSequenceEdit", "1");
  }
  return `/email/campaigns/builder?${params.toString()}`;
}
