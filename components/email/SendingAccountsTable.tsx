"use client";

import Link from "next/link";

import { SenderTrustIndicators } from "@/components/email/SenderTrustIndicators";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatSenderFromPreview } from "@/lib/senderDisplayName";
import {
  accountTypeLabel,
  coldOutreachWarning,
  providerConnectionLabel,
  providerDisplayName,
} from "@/lib/senderProviderEducation";
import { cn } from "@/lib/utils";
import { SendingAccount } from "@/utils/api/emailClient";
import {
  IconAlertTriangle,
  IconDots,
  IconExternalLink,
  IconMail,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconSettings,
  IconTrash,
} from "@tabler/icons-react";

const PROVIDER_AVATAR: Record<string, string> = {
  gmail: "bg-red-50 text-red-600 border-red-100",
  outlook: "bg-blue-50 text-blue-600 border-blue-100",
  zoho: "bg-orange-50 text-orange-700 border-orange-100",
  smtp: "bg-violet-50 text-violet-700 border-violet-100",
  ses: "bg-amber-50 text-amber-700 border-amber-100",
};

const STATUS_STYLES: Record<SendingAccount["status"], string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paused: "bg-amber-50 text-amber-800 border-amber-200",
  error: "bg-red-50 text-red-700 border-red-200",
  warming: "bg-sky-50 text-sky-700 border-sky-200",
};

const STATUS_LABEL: Record<SendingAccount["status"], string> = {
  active: "Sending",
  paused: "Paused",
  error: "Needs attention",
  warming: "Warming up",
};

function bounceStyles(bounceRate?: number, status?: string): string {
  if (status === "paused" || status === "error") return "text-red-600";
  if ((bounceRate ?? 0) >= 5) return "text-red-600";
  if ((bounceRate ?? 0) >= 3) return "text-amber-600";
  return "text-emerald-600";
}

function SenderAvatar({
  provider,
  email,
}: {
  provider: string;
  email: string;
}) {
  const initial = email?.[0]?.toUpperCase() ?? "?";
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
        PROVIDER_AVATAR[provider] ?? PROVIDER_AVATAR.smtp
      )}
    >
      {initial}
    </div>
  );
}

function StatusBadge({ status }: { status: SendingAccount["status"] }) {
  return (
    <Badge
      variant="outline"
      className={cn("h-5 shrink-0 px-1.5 text-[10px] font-medium", STATUS_STYLES[status])}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}

function DailySendMeter({
  sendsToday,
  dailyLimit,
}: {
  sendsToday: number;
  dailyLimit: number;
}) {
  const pct = dailyLimit > 0 ? Math.min(100, (sendsToday / dailyLimit) * 100) : 0;
  const remaining = Math.max(0, dailyLimit - sendsToday);
  const nearCap = pct >= 80;

  return (
    <div className="min-w-[7.5rem]">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          Sent today
        </p>
        <p className="text-[10px] text-slate-500">{remaining} left</p>
      </div>
      <p className="mt-0.5 text-sm font-semibold tabular-nums leading-none text-slate-900">
        {sendsToday}
        <span className="ml-0.5 text-xs font-normal text-slate-500">/ {dailyLimit}</span>
      </p>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            nearCap ? "bg-amber-500" : "bg-blue-600"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function AccountActions({
  account,
  onTogglePause,
  onDelete,
}: {
  account: SendingAccount;
  onTogglePause: (account: SendingAccount) => void;
  onDelete: (id: string, provider: string) => void;
}) {
  if (account.provider === "ses") {
    return (
      <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs" asChild>
        <Link href="/email/domains">
          <IconExternalLink className="h-3.5 w-3.5" />
          Domains
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs" asChild>
        <Link href={`/email/sending-accounts/${account.id}/settings`}>
          <IconSettings className="h-3.5 w-3.5" />
          Settings
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-7 w-7 shrink-0">
            <IconDots className="h-3.5 w-3.5" />
            <span className="sr-only">More actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onTogglePause(account)}>
            {account.status === "active" ? (
              <>
                <IconPlayerPause className="mr-2 h-4 w-4" />
                Pause sending
              </>
            ) : (
              <>
                <IconPlayerPlay className="mr-2 h-4 w-4" />
                Resume sending
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={() => onDelete(account.id, account.provider)}
          >
            <IconTrash className="mr-2 h-4 w-4" />
            Remove account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function SendingAccountCard({
  account,
  onTogglePause,
  onDelete,
  onDnsSetup,
}: {
  account: SendingAccount;
  onTogglePause: (account: SendingAccount) => void;
  onDelete: (id: string, provider: string) => void;
  onDnsSetup: (account: SendingAccount) => void;
}) {
  const typeLabel = accountTypeLabel(account.accountType);
  const usageWarning = coldOutreachWarning(
    account.coldOutreachRecommended,
    account.accountType
  );
  const dailyLimit = account.campaignDailyLimit ?? 30;
  const needsDnsSetup =
    account.provider !== "ses" &&
    account.domainAuth?.applicable &&
    (!account.domainAuth.spf ||
      !account.domainAuth.dkim ||
      !account.domainAuth.dmarc);
  const senderName = account.displayName?.trim() || "No sender name set";

  const fromPreview = formatSenderFromPreview(account.email, account.displayName);

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="flex items-start gap-2.5">
        <SenderAvatar provider={account.provider} email={account.email} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <h3
                  className="truncate text-sm font-semibold text-slate-900"
                  title={fromPreview}
                >
                  {account.email}
                </h3>
                <StatusBadge status={account.status} />
                {typeLabel && (
                  <Badge
                    variant="outline"
                    className="h-5 border-slate-200 bg-slate-50 px-1.5 text-[10px] font-medium text-slate-600"
                  >
                    {typeLabel}
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                <span className="font-medium text-slate-700">{senderName}</span>
                <span className="mx-1 text-slate-300">·</span>
                <span>{providerDisplayName(account.provider)}</span>
                <span className="mx-1 text-slate-300">·</span>
                <span className="text-slate-400">
                  {providerConnectionLabel(account.provider, account.email)}
                </span>
              </p>
            </div>
            <AccountActions
              account={account}
              onTogglePause={onTogglePause}
              onDelete={onDelete}
            />
          </div>

          <div className="mt-1.5 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 flex-1">
              <SenderTrustIndicators
                senderCategory={account.senderCategory}
                reputation={account.reputation}
                domainAuth={account.domainAuth}
                compact
                onDomainAuthSetupClick={
                  needsDnsSetup ? () => onDnsSetup(account) : undefined
                }
              />
            </div>

            <div className="flex shrink-0 flex-wrap items-end gap-4 sm:gap-5">
              <DailySendMeter
                sendsToday={account.sendsToday}
                dailyLimit={dailyLimit}
              />
              <div className="min-w-[4.25rem]">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  Bounce
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-sm font-semibold tabular-nums leading-none",
                    bounceStyles(account.bounceRate, account.status)
                  )}
                >
                  {(account.bounceRate ?? 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {usageWarning && (
            <div className="mt-1.5 flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1">
              <IconAlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
              <p className="text-[11px] leading-snug text-amber-900">{usageWarning}</p>
            </div>
          )}

          {account.pauseReason && (
            <p className="mt-1.5 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-700">
              {account.pauseReason}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

type SendingAccountsTableProps = {
  accounts: SendingAccount[];
  loading: boolean;
  onAdd: () => void;
  onTogglePause: (account: SendingAccount) => void;
  onDelete: (id: string, provider: string) => void;
  onDnsSetup: (account: SendingAccount) => void;
};

export function SendingAccountsTable({
  accounts,
  loading,
  onAdd,
  onTogglePause,
  onDelete,
  onDnsSetup,
}: SendingAccountsTableProps) {
  if (loading) {
    return (
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="flex items-center justify-center py-16">
          <p className="text-sm text-slate-500">Loading sending accounts…</p>
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <IconMail className="h-7 w-7 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            Connect your first inbox
          </h3>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            Add Gmail, Outlook, or SMTP so campaigns know which address to send
            from. You can set the display name recipients see in their inbox.
          </p>
          <Button onClick={onAdd} className="mt-6 gap-2">
            <IconPlus className="h-4 w-4" />
            Add sending account
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm">
        <p className="text-xs text-slate-600 sm:text-sm">
          <span className="font-semibold text-slate-900">{accounts.length}</span>{" "}
          sending account{accounts.length === 1 ? "" : "s"} connected. Use{" "}
          <span className="font-medium text-slate-900">Settings</span> on each
          inbox to change the daily send cap and sender name.
        </p>
      </div>

      <div className="space-y-2">
        {accounts.map((account) => (
          <SendingAccountCard
            key={account.id}
            account={account}
            onTogglePause={onTogglePause}
            onDelete={onDelete}
            onDnsSetup={onDnsSetup}
          />
        ))}
      </div>

      <details className="rounded-lg border border-slate-200 bg-slate-50 open:bg-white">
        <summary className="cursor-pointer list-none px-3.5 py-2.5 text-xs font-medium text-slate-700 marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-2">
            Quick guide — what the numbers mean
            <span className="text-slate-400">Show</span>
          </span>
        </summary>
        <div className="border-t border-slate-200 px-3.5 pb-3 pt-2">
          <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
            <div className="rounded-md border border-slate-200 bg-white p-2.5">
              <p className="text-xs font-medium text-slate-900">Daily cap</p>
              <p className="mt-0.5 text-[11px] leading-relaxed">
                Max emails this inbox can send per day across all campaigns (30–300).
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-2.5">
              <p className="text-xs font-medium text-slate-900">Trust & auth</p>
              <p className="mt-0.5 text-[11px] leading-relaxed">
                Inbox type, reputation, and SPF/DKIM/DMARC when you use your own domain.
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-2.5">
              <p className="text-xs font-medium text-slate-900">Personal inboxes</p>
              <p className="mt-0.5 text-[11px] leading-relaxed">
                Best for warm follow-ups — not large cold outreach to strangers.
              </p>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
