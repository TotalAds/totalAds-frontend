export type InboxUsageTier = "personal" | "business" | "infrastructure";

export type SenderProvider = "ses" | "gmail" | "outlook" | "smtp";

export function providerDisplayName(provider?: string): string {
  switch (provider) {
    case "gmail":
      return "Gmail";
    case "outlook":
      return "Microsoft";
    case "smtp":
      return "Custom SMTP";
    case "ses":
      return "AWS SES";
    default:
      return "Email";
  }
}

export function accountTypeLabel(accountType?: string | null): string | null {
  switch (accountType) {
    case "gmail_free":
      return "Personal Gmail";
    case "google_workspace":
      return "Google Workspace";
    case "gmail_address_via_microsoft":
      return "Gmail address (via Microsoft sign-in)";
    case "m365_personal":
      return "Personal Outlook / Hotmail";
    case "m365_business":
      return "Microsoft 365 business";
    case "smtp_custom":
      return "Custom SMTP inbox";
    default:
      return null;
  }
}

export function usageTierLabel(
  tier?: InboxUsageTier | string | null,
): string | null {
  switch (tier) {
    case "personal":
      return "Personal inbox";
    case "business":
      return "Business inbox";
    case "infrastructure":
      return "Dedicated sending";
    default:
      return null;
  }
}

export function providerConnectionLabel(
  provider?: string,
  email?: string,
): string {
  const domain = email?.split("@")[1]?.toLowerCase() ?? "";
  if (provider === "gmail") {
    return domain === "gmail.com" || domain === "googlemail.com"
      ? "Connected via Google · personal Gmail"
      : "Connected via Google · Google Workspace";
  }
  if (provider === "outlook") {
    if (domain === "gmail.com" || domain === "googlemail.com") {
      return "Connected via Microsoft · Gmail address on this mailbox";
    }
    return "Connected via Microsoft · Outlook / Microsoft 365";
  }
  if (provider === "smtp") return "Connected via SMTP";
  if (provider === "ses") return "AWS SES verified sender";
  return "Connected sender";
}

export function personalInboxUsageCopy(accountType?: string | null): string {
  if (accountType === "gmail_free") {
    return "Personal Gmail is for warm follow-ups to people who know you — not large cold outreach. Use your own small, opted-in list if you send here. For cold campaigns at scale, use AWS SES or a work domain inbox instead.";
  }
  if (accountType === "gmail_address_via_microsoft") {
    return "This is a Gmail address signed in through Microsoft. It is treated as a personal inbox, not Microsoft 365 business volume. Not recommended for cold campaigns — use AWS SES or a work domain inbox instead.";
  }
  if (accountType === "m365_personal") {
    return "Personal Outlook/Hotmail accounts have low daily limits and are not built for cold outreach. Best for small, warm conversations — not prospecting strangers at scale.";
  }
  return "Personal inboxes are best for small, warm mail. Cold outreach at scale belongs on AWS SES or a work domain inbox instead, not a personal mailbox.";
}

export function dailyLimitExplanation(
  accountType?: string | null,
  dailySendLimit?: number | null,
  limitReason?: string | null,
): string {
  if (limitReason?.trim()) return limitReason;
  switch (accountType) {
    case "gmail_free":
      return `Personal Gmail cap: ${dailySendLimit ?? 450}/day (Google ~500 max; we use 450 for safety)`;
    case "google_workspace":
      return `Google Workspace cap: ${dailySendLimit ?? 1800}/day (~2,000 provider max)`;
    case "gmail_address_via_microsoft":
      return `Personal Gmail cap: ${dailySendLimit ?? 450}/day (Gmail address via Microsoft sign-in)`;
    case "m365_personal":
      return `Personal Microsoft cap: ${dailySendLimit ?? 270}/day (~300 provider max)`;
    case "m365_business":
      return `Microsoft 365 cap: ${dailySendLimit ?? 9000}/day (~10,000 provider max)`;
    case "smtp_custom":
      return `SMTP cap: ${dailySendLimit ?? 500}/day (adjust in account settings)`;
    default:
      return dailySendLimit
        ? `Daily cap: ${dailySendLimit} emails`
        : "Daily cap set by your mail provider";
  }
}

export function isPersonalInbox(
  usageTier?: InboxUsageTier | string | null,
  accountType?: string | null,
): boolean {
  if (usageTier === "personal") return true;
  return (
    accountType === "gmail_free" ||
    accountType === "gmail_address_via_microsoft" ||
    accountType === "m365_personal"
  );
}

export function providerGroupLabel(provider: SenderProvider): string {
  switch (provider) {
    case "ses":
      return "AWS SES — domain senders";
    case "gmail":
      return "Google — connect multiple Workspace or Gmail accounts";
    case "outlook":
      return "Microsoft — connect multiple Outlook / M365 accounts";
    case "smtp":
      return "Custom SMTP — one email address per connection";
  }
}

export function providerEducationTip(provider: SenderProvider): string {
  switch (provider) {
    case "ses":
      return "Best for cold outreach at scale. Add verified domains and sender addresses; caps follow your SES quota and pacing settings.";
    case "gmail":
      return "Personal @gmail.com accounts are not intended for cold campaigns. Set your daily email cap in inbox settings. Google Workspace on your own domain supports higher volume.";
    case "outlook":
      return "Personal Outlook/Hotmail is not ideal for cold campaigns. Set your daily email cap in inbox settings. Microsoft 365 work mailboxes on your company domain support higher volume.";
    case "smtp":
      return "Each SMTP connection is one email address. Set your daily email cap in inbox settings after connecting.";
  }
}

export function capResponsibilityNote(isManagedSes: boolean): string {
  if (isManagedSes) {
    return "LeadSnipper adjusts managed SES caps when bounce or complaint rates rise. You still control list quality and email content.";
  }
  return "Daily email caps are set in each inbox's settings. LeadSnipper enforces them to protect inbox placement.";
}

export function coldOutreachWarning(
  coldOutreachRecommended?: boolean,
  accountType?: string | null,
): string | null {
  if (coldOutreachRecommended !== false) return null;
  return personalInboxUsageCopy(accountType);
}
