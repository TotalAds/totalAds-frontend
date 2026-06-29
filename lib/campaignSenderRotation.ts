import { getSenderConfiguredDailyCap } from "@/lib/senderPacing";

export interface SenderQuotaInfo {
  dailyCap: number;
  remaining: number;
  used?: number;
  targetDailyCap?: number;
}

export interface RotationSender {
  id: string;
  email: string;
  displayName?: string | null;
  provider?: string;
  status?: string;
  verificationStatus?: string;
  campaignDailyLimit?: number | null;
  slowRampEnabled?: boolean | null;
  quota?: SenderQuotaInfo;
}

export interface RotationDistributionEntry {
  sender: RotationSender;
  leads: number;
}

export interface RotationResult {
  distribution: RotationDistributionEntry[];
  totalCapacity: number;
  canSend: boolean;
  excess: number;
}

export function getSenderDailyCapDisplay(sender: RotationSender): {
  configuredCap: number;
  effectiveCap: number;
  remaining: number;
  usedToday: number;
} {
  const configuredCap = getSenderConfiguredDailyCap(sender);
  const effectiveCap = sender.quota?.dailyCap ?? configuredCap;
  const remaining = sender.quota?.remaining ?? effectiveCap;
  const usedToday = Math.max(
    0,
    sender.quota?.used ?? effectiveCap - remaining
  );
  return { configuredCap, effectiveCap, remaining, usedToday };
}

export function calculateSenderRotationDistribution(
  senders: RotationSender[],
  selectedIds: string[],
  leadCount: number,
  options?: { isByoSes?: boolean; campaignDailyLimit?: number | null }
): RotationResult | null {
  if (selectedIds.length === 0 || leadCount <= 0) return null;

  const isByoSes = options?.isByoSes ?? false;

  const selectedSenders = senders
    .filter((s) => selectedIds.includes(s.id))
    .sort((a, b) => {
      const bounceA = 0;
      const bounceB = 0;
      if (bounceA !== bounceB) return bounceA - bounceB;
      const remA = a.quota?.remaining ?? a.quota?.dailyCap ?? 0;
      const remB = b.quota?.remaining ?? b.quota?.dailyCap ?? 0;
      if (remA !== remB) return remB - remA;
      return (a.provider || "ses").localeCompare(b.provider || "ses");
    });

  if (selectedSenders.length === 0) return null;

  const weightedSenders = selectedSenders.map((sender) => {
    if (isByoSes) {
      const cap = sender.quota?.dailyCap || sender.quota?.remaining || 0;
      return { sender, weight: Math.max(0, cap) };
    }
    const cap = getSenderConfiguredDailyCap(sender);
    return { sender, weight: Math.max(1, cap) };
  });

  const totalWeight = weightedSenders.reduce((sum, w) => sum + w.weight, 0);

  if (totalWeight === 0) {
    return {
      distribution: weightedSenders.map((w) => ({ sender: w.sender, leads: 0 })),
      totalCapacity: 0,
      canSend: false,
      excess: leadCount,
    };
  }

  let remainingLeads = leadCount;
  const provisional = weightedSenders.map((w) => {
    const raw = (leadCount * w.weight) / totalWeight;
    const assigned = Math.floor(raw);
    remainingLeads -= assigned;
    return {
      sender: w.sender,
      leads: assigned,
      fractional: raw - assigned,
    };
  });

  if (remainingLeads > 0) {
    provisional
      .sort((a, b) => b.fractional - a.fractional)
      .forEach((entry) => {
        if (remainingLeads <= 0) return;
        entry.leads += 1;
        remainingLeads -= 1;
      });
  }

  const distribution = provisional.map(({ sender, leads }) => ({ sender, leads }));
  const totalAssigned = distribution.reduce((sum, d) => sum + d.leads, 0);
  const senderCombinedCapacity = weightedSenders.reduce(
    (sum, w) =>
      sum + (w.sender.quota?.remaining ?? getSenderConfiguredDailyCap(w.sender)),
    0
  );
  const campaignCap =
    options?.campaignDailyLimit != null && options.campaignDailyLimit > 0
      ? options.campaignDailyLimit
      : null;
  const totalCapacity =
    campaignCap != null
      ? Math.min(senderCombinedCapacity, campaignCap)
      : senderCombinedCapacity;

  return {
    distribution,
    totalCapacity,
    canSend: totalAssigned === leadCount && totalCapacity > 0,
    excess: 0,
  };
}

export function estimateSendDays(leadCount: number, dailyCapacity: number): number {
  if (leadCount <= 0 || dailyCapacity <= 0) return 0;
  return Math.max(1, Math.ceil(leadCount / dailyCapacity));
}
