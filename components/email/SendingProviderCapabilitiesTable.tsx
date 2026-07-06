"use client";

import { IconCheck, IconMinus } from "@tabler/icons-react";

type CapabilityCell = "yes" | "partial" | "no";

export type SendingProviderCapabilityRow = {
  label: string;
  inbox: CapabilityCell;
  smtp: CapabilityCell;
  ses: CapabilityCell;
  inboxDetail?: string;
  smtpDetail?: string;
  sesDetail?: string;
};

export const SENDING_PROVIDER_CAPABILITY_ROWS: SendingProviderCapabilityRow[] = [
  {
    label: "Send campaigns",
    inbox: "yes",
    smtp: "yes",
    ses: "yes",
  },
  {
    label: "Reply detection",
    inbox: "yes",
    smtp: "yes",
    ses: "no",
    inboxDetail: "Reads your connected inbox",
    smtpDetail: "Requires IMAP (next step)",
    sesDetail: "Not automatic — connect an inbox or mark replies manually",
  },
  {
    label: "Bounce & complaint tracking",
    inbox: "yes",
    smtp: "yes",
    ses: "yes",
    inboxDetail: "From your inbox",
    smtpDetail: "Requires IMAP",
    sesDetail: "Via Amazon SNS",
  },
  {
    label: "Open & click tracking",
    inbox: "yes",
    smtp: "yes",
    ses: "yes",
    sesDetail: "Pixel tracking + SNS when configured",
  },
];

function CellIcon({ value }: { value: CapabilityCell }) {
  if (value === "yes") {
    return <IconCheck className="mx-auto h-4 w-4 text-emerald-600" aria-hidden />;
  }
  if (value === "partial") {
    return <IconMinus className="mx-auto h-4 w-4 text-amber-600" aria-hidden />;
  }
  return (
    <span className="text-xs font-medium text-slate-400" aria-hidden>
      —
    </span>
  );
}

function cellAriaLabel(value: CapabilityCell): string {
  if (value === "yes") return "Supported";
  if (value === "partial") return "Partially supported";
  return "Not supported";
}

interface SendingProviderCapabilitiesTableProps {
  showSes?: boolean;
  className?: string;
  compact?: boolean;
}

export function SendingProviderCapabilitiesTable({
  showSes = true,
  className = "",
  compact = false,
}: SendingProviderCapabilitiesTableProps) {
  const rows = SENDING_PROVIDER_CAPABILITY_ROWS;

  return (
    <div
      className={`rounded-lg border border-slate-200 bg-slate-50/80 ${className}`}
    >
      <div className={`px-3 ${compact ? "py-2" : "py-3"} border-b border-slate-200`}>
        <p className={`font-medium text-slate-800 ${compact ? "text-xs" : "text-sm"}`}>
          What each connection gives you
        </p>
        {!compact && (
          <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">
            Pick based on whether you need inbox reply tracking or high-volume SES sending.
          </p>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-left text-[11px]">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="px-3 py-2 font-medium">Capability</th>
              <th className="px-2 py-2 text-center font-medium whitespace-nowrap">
                Google / Microsoft
              </th>
              <th className="px-2 py-2 text-center font-medium whitespace-nowrap">
                Custom SMTP
              </th>
              {showSes && (
                <th className="px-2 py-2 text-center font-medium whitespace-nowrap">
                  AWS SES
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-2 text-slate-700 align-top">{row.label}</td>
                <td className="px-2 py-2 text-center align-top">
                  <span title={row.inboxDetail} aria-label={cellAriaLabel(row.inbox)}>
                    <CellIcon value={row.inbox} />
                  </span>
                  {row.inboxDetail && !compact && (
                    <p className="mt-1 text-[10px] text-slate-500 leading-snug">
                      {row.inboxDetail}
                    </p>
                  )}
                </td>
                <td className="px-2 py-2 text-center align-top">
                  <span title={row.smtpDetail} aria-label={cellAriaLabel(row.smtp)}>
                    <CellIcon value={row.smtp} />
                  </span>
                  {row.smtpDetail && !compact && (
                    <p className="mt-1 text-[10px] text-slate-500 leading-snug">
                      {row.smtpDetail}
                    </p>
                  )}
                </td>
                {showSes && (
                  <td className="px-2 py-2 text-center align-top">
                    <span title={row.sesDetail} aria-label={cellAriaLabel(row.ses)}>
                      <CellIcon value={row.ses} />
                    </span>
                    {row.sesDetail && !compact && (
                      <p className="mt-1 text-[10px] text-slate-500 leading-snug">
                        {row.sesDetail}
                      </p>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SesCapabilitiesCallout({
  hasConnectedInbox = false,
  className = "",
}: {
  hasConnectedInbox?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 leading-relaxed space-y-1.5 ${className}`}
    >
      <p className="font-medium text-blue-950">AWS SES tracks delivery via Amazon SNS</p>
      <p>
        Sends, bounces, complaints, and deliveries are reported through SNS — not by reading
        your mailbox. Campaign reply counts are <strong>not</strong> detected automatically
        for SES-only sends.
      </p>
      {hasConnectedInbox ? (
        <p>
          You already have connected inboxes — reply detection still works for campaigns sent
          from Gmail, Microsoft, or SMTP accounts. SES senders rely on SNS analytics and
          manual reply marking.
        </p>
      ) : (
        <p>
          Connect Gmail, Microsoft, or SMTP (with IMAP) if you need automatic reply detection,
          or mark replies manually in campaign analytics.
        </p>
      )}
    </div>
  );
}

export function SmtpImapRequiredCallout({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs text-violet-900 leading-relaxed ${className}`}
    >
      <p className="font-medium text-violet-950">Why IMAP is required</p>
      <p className="mt-1">
        SMTP only sends mail. We use IMAP to read your inbox for{" "}
        <strong>reply detection</strong> and <strong>bounce (NDR) messages</strong> — without
        it we cannot track engagement or stop sequences when someone replies. IMAP is read-only
        polling and does not affect deliverability.
      </p>
    </div>
  );
}

export function InboxOAuthCapabilitiesCallout({
  provider,
  className = "",
}: {
  provider: "gmail" | "outlook";
  className?: string;
}) {
  const brand = provider === "gmail" ? "Google" : "Microsoft";
  return (
    <div
      className={`rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 leading-relaxed ${className}`}
    >
      <p className="font-medium text-blue-950">Full inbox access after {brand} sign-in</p>
      <p className="mt-1">
        We send through your mailbox and read replies and delivery failures from your inbox —
        no separate IMAP setup. Open and click tracking use standard campaign pixels.
      </p>
    </div>
  );
}
