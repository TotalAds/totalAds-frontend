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
  const params = new URLSearchParams({
    mode: "sequence",
    id: options.campaignId,
  });
  if (options.domainId && options.domainId !== "0") {
    params.set("domainId", options.domainId);
  }
  const hasMultipleSteps =
    (Array.isArray(options.sequence) ? options.sequence.length : 0) > 1;
  if (options.liveSequenceEdit && hasMultipleSteps) {
    params.set("liveSequenceEdit", "1");
  }
  return `/email/campaigns/builder?${params.toString()}`;
}
