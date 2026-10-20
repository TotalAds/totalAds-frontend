"use client";

import { cn } from "@/lib/utils";

type ProviderKey =
  | "google"
  | "gmail"
  | "microsoft"
  | "outlook"
  | "zoho"
  | "yahoo"
  | "apple_icloud"
  | "proton"
  | "fastmail"
  | "smtp"
  | "other_smtp"
  | "ses"
  | "unknown"
  | "security_gateway"
  | string;

const LABELS: Record<string, string> = {
  google: "Google",
  gmail: "Gmail",
  microsoft: "Microsoft",
  outlook: "Outlook",
  zoho: "Zoho",
  yahoo: "Yahoo",
  apple_icloud: "iCloud",
  proton: "Proton",
  fastmail: "Fastmail",
  smtp: "SMTP",
  other_smtp: "SMTP",
  ses: "SES",
  unknown: "Unknown",
  security_gateway: "Gateway",
};

function normalizeProvider(provider?: string | null): string {
  const value = (provider || "unknown").toLowerCase().trim();
  if (value === "gmail") return "google";
  if (value === "outlook") return "microsoft";
  if (value === "other_smtp") return "smtp";
  return value;
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.3-.2-1.9H12z" />
      <path fill="#34A853" d="M5.3 14.3l-.8.6-2.5 1.9C3.5 20 7.4 22.5 12 22.5c2.7 0 5-.9 6.7-2.4l-3.1-2.4c-.9.6-2 .9-3.6.9-2.8 0-5.1-1.9-5.9-4.4z" />
      <path fill="#4A90E2" d="M3.9 6.2C3.1 7.8 2.7 9.5 2.7 11.3c0 1.7.4 3.4 1.1 4.9l3.3-2.6c-.4-1.1-.6-2.2-.6-2.3 0-.8.2-1.6.4-2.3L3.9 6.2z" />
      <path fill="#FBBC05" d="M12 5.4c1.5 0 2.8.5 3.9 1.5l2.9-2.9C16.9 2.3 14.7 1.5 12 1.5 7.4 1.5 3.5 4 1.9 8.1l3.4 2.6C6.1 7.3 8.5 5.4 12 5.4z" />
    </svg>
  );
}

function MicrosoftMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 23 23" aria-hidden="true">
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M12 1h10v10H12z" />
      <path fill="#05a6f0" d="M1 12h10v10H1z" />
      <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
  );
}

function ZohoMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="#E42527" />
      <path
        fill="#fff"
        d="M6.2 7.2h3.1c2.4 0 3.9 1.3 3.9 3.3 0 1.3-.7 2.4-1.9 2.9l2.5 3.4h-2.5l-2.2-3.1H8.4v3.1H6.2V7.2zm2.2 1.8v2.7h.9c1.1 0 1.8-.6 1.8-1.4 0-.8-.7-1.3-1.8-1.3H8.4z"
      />
    </svg>
  );
}

function YahooMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="#6001D2" />
      <path fill="#fff" d="M7.2 6.5h2.3l2.5 5.2 2.5-5.2h2.3L12.8 14v3.5h-2.1V14L7.2 6.5z" />
    </svg>
  );
}

function AppleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#111827"
        d="M16.4 12.7c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.3-.1-2.6.8-3.3.8-.7 0-1.8-.8-3-.7-1.5.1-2.9.9-3.7 2.2-1.6 2.7-.4 6.7 1.1 8.9.8 1.1 1.7 2.3 2.9 2.2 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.2.9-1.3 1.3-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.5zM14.6 5.9c.6-.8 1.1-1.9.9-3-.9 0-2 .6-2.6 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2-.5 2.6-1.3z"
      />
    </svg>
  );
}

function ProtonMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="#6D4AFF" />
      <path fill="#fff" d="M7 7.5h5.2c2.4 0 4 1.4 4 3.5 0 1.8-1.2 3.1-3 3.4V18H10.6v-3.4H7V7.5zm3.6 1.8v2.7h1.5c1 0 1.6-.5 1.6-1.4 0-.8-.6-1.3-1.6-1.3H10.6z" />
    </svg>
  );
}

function FastmailMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="#1F4B99" />
      <path fill="#fff" d="M6.5 7h11v2.1H9.2v2.2h7.4v2.1H9.2V17H6.5V7z" />
    </svg>
  );
}

function SmtpMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="#6D28D9" />
      <path fill="#fff" d="M5.5 8.2 12 4.8l6.5 3.4v7.6L12 19.2l-6.5-3.4V8.2zm2 1.1v5.4L12 17l4.5-2.3V9.3L12 7 7.5 9.3z" />
    </svg>
  );
}

function SesMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="#FF9900" />
      <path fill="#232F3E" d="M6 15.2 12 18l6-2.8V9.5L12 6.8 6 9.5v5.7zm2-4.5 4-1.9 4 1.9v3.5l-4 1.9-4-1.9V10.7z" />
    </svg>
  );
}

function UnknownMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="#64748B" />
      <path fill="#fff" d="M11 16.5h2v2h-2v-2zm1-11c2.2 0 4 1.5 4 3.6 0 1.7-1 2.6-2.1 3.3-.8.5-1.1.9-1.1 1.6v.5h-2v-.7c0-1.3.7-2.1 1.9-2.9.9-.6 1.3-1.1 1.3-1.8 0-.8-.7-1.4-1.8-1.4-1.2 0-1.9.7-2 1.8H8.1C8.3 7.1 9.7 5.5 12 5.5z" />
    </svg>
  );
}

function Mark({ provider, className }: { provider: string; className?: string }) {
  switch (provider) {
    case "google":
      return <GoogleMark className={className} />;
    case "microsoft":
      return <MicrosoftMark className={className} />;
    case "zoho":
      return <ZohoMark className={className} />;
    case "yahoo":
      return <YahooMark className={className} />;
    case "apple_icloud":
      return <AppleMark className={className} />;
    case "proton":
      return <ProtonMark className={className} />;
    case "fastmail":
      return <FastmailMark className={className} />;
    case "smtp":
      return <SmtpMark className={className} />;
    case "ses":
      return <SesMark className={className} />;
    default:
      return <UnknownMark className={className} />;
  }
}

export function providerLabel(provider?: string | null): string {
  const raw = (provider || "unknown").toLowerCase();
  return LABELS[raw] || LABELS[normalizeProvider(raw)] || raw;
}

export function ProviderLogo({
  provider,
  className,
  size = "md",
  showLabel = false,
  labelClassName,
}: {
  provider?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  labelClassName?: string;
}) {
  const key = normalizeProvider(provider);
  const px = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-7 w-7" : "h-5 w-5";
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Mark provider={key} className={cn(px, "shrink-0")} />
      {showLabel ? (
        <span className={cn("text-xs text-slate-700", labelClassName)}>
          {providerLabel(provider)}
        </span>
      ) : null}
    </span>
  );
}

export type { ProviderKey };
