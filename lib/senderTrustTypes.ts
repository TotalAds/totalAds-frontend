export type SenderCategory = "personal" | "business" | "custom_smtp" | "scale";

export type SenderCategoryInfo = {
  category: SenderCategory;
  badge: string;
  dailyLimitLabel: string;
  subtitle: string;
};

export type DomainAuthRecord = {
  applicable: boolean;
  spf: boolean | null;
  dkim: boolean | null;
  dmarc: boolean | null;
  note?: string;
};

export type SenderReputationBadge = {
  level: "excellent" | "good" | "risky";
  label: string;
  emoji: string;
};

export const SENDER_CATEGORY_STYLES: Record<
  SenderCategory,
  { bg: string; text: string; border: string }
> = {
  personal: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  },
  business: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
  },
  custom_smtp: {
    bg: "bg-violet-50",
    text: "text-violet-800",
    border: "border-violet-200",
  },
  scale: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
  },
};

export const REPUTATION_STYLES: Record<
  SenderReputationBadge["level"],
  { bg: string; text: string }
> = {
  excellent: { bg: "bg-emerald-50", text: "text-emerald-800" },
  good: { bg: "bg-amber-50", text: "text-amber-900" },
  risky: { bg: "bg-orange-50", text: "text-orange-900" },
};

export const CONNECT_FLOW_CATEGORIES = [
  {
    provider: "ses" as const,
    badge: "Scale",
    limit: "30/day default",
    subtitle: "AWS SES · cold outreach at volume",
  },
  {
    provider: "gmail" as const,
    badge: "Personal · Business",
    limit: "30/day default",
    subtitle: "Gmail or Google Workspace",
  },
  {
    provider: "outlook" as const,
    badge: "Personal · Business",
    limit: "30/day default",
    subtitle: "Outlook or Microsoft 365",
  },
  {
    provider: "smtp" as const,
    badge: "Custom SMTP",
    limit: "30/day default",
    subtitle: "Any provider · verify SPF/DKIM/DMARC",
  },
];
