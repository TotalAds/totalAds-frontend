import emailClient from "@/utils/api/emailClient";
import { getSenderConfiguredDailyCap } from "@/lib/senderPacing";

import type { RotationSender } from "./campaignSenderRotation";

async function attachQuotaToSenders(senders: RotationSender[]): Promise<RotationSender[]> {
  return Promise.all(
    senders.map(async (sender) => {
      const configuredCap = getSenderConfiguredDailyCap(sender);
      try {
        const quotaResponse = await emailClient.get(
          `/api/email-senders/${sender.id}/quota`
        );
        if (quotaResponse.data?.success) {
          const data = quotaResponse.data.data;
          return {
            ...sender,
            quota: {
              ...data,
              targetDailyCap: configuredCap,
              dailyCap: data?.dailyCap != null ? data.dailyCap : configuredCap,
              remaining: data?.remaining != null ? data.remaining : configuredCap,
              used: data?.used,
            },
          };
        }
      } catch {
        // fall through to defaults
      }
      return {
        ...sender,
        quota: {
          dailyCap: configuredCap,
          remaining: configuredCap,
          used: 0,
        },
      };
    })
  );
}

export type CampaignSendersLoad = {
  senders: RotationSender[];
  unverifiedSenders: RotationSender[];
};

export async function fetchCampaignSendersWithQuota(): Promise<CampaignSendersLoad> {
  const response = await emailClient.get("/api/email-senders", {
    params: { page: 1, limit: 100 },
  });
  const all: RotationSender[] = response.data?.data?.senders || [];
  const active = all.filter((s) => s.status !== "error");
  const verified = active.filter((s) => s.verificationStatus === "verified");
  const unverified = active.filter(
    (s) =>
      s.verificationStatus !== "verified" &&
      (s.provider === "smtp" ||
        s.provider === "gmail" ||
        s.provider === "outlook" ||
        s.provider === "zoho")
  );

  const [senders, unverifiedSenders] = await Promise.all([
    attachQuotaToSenders(verified),
    attachQuotaToSenders(unverified),
  ]);

  return { senders, unverifiedSenders };
}

export async function fetchVerifiedSendersWithQuota(): Promise<RotationSender[]> {
  const { senders } = await fetchCampaignSendersWithQuota();
  return senders;
}
