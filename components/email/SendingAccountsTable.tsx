"use client";

import Link from "next/link";

import { SenderTrustIndicators } from "@/components/email/SenderTrustIndicators";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
        PROVIDER_AVATAR[provider] ?? PROVIDER_AVATAR.smtp
      )}
    >
      {initial}
    </div>
  );
}

function StatusBadge({ status }: { status: SendingAccount["status"] }) {
  return (
    <Badge variant="outline" className={cn("shrink-0", STATUS_STYLES[status])}>
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
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Sent today
          </p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">
            {sendsToday}
            <span className="ml-1 text-sm font-normal text-slate-500">
              / {dailyLimit}
            </span>
          </p>
        </div>
        <p className="text-xs text-slate-500">
          {remaining} left today
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
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
      <Button variant="outline" size="sm" className="h-9 gap-1.5" asChild>
        <Link href="/email/domains">
          <IconExternalLink className="h-4 w-4" />
          Manage in Domains
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="outline" size="sm" className="h-9 gap-1.5" asChild>
        <Link href={`/email/sending-accounts/${account.id}/settings`}>
          <IconSettings className="h-4 w-4" />
          Settings
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
            <IconDots className="h-4 w-4" />
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

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <SenderAvatar provider={account.provider} email={account.email} />
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-semibold text-slate-900">
                    {account.displayName?.trim() || "No sender name set"}
                  </h3>
                  <StatusBadge status={account.status} />
                </div>
                <p className="truncate text-sm text-slate-600">{account.email}</p>
                <p className="truncate font-mono text-xs text-slate-400">
                  Recipients see:{" "}
                  {formatSenderFromPreview(account.email, account.displayName)}
                </p>
                {typeLabel && (
                  <Badge
                    variant="outline"
                    className="mt-1 border-slate-200 bg-slate-50 text-xs font-medium text-slate-600"
                  >
                    {typeLabel}
                  </Badge>
                )}
              </div>
            </div>
            <AccountActions
              account={account}
              onTogglePause={onTogglePause}
              onDelete={onDelete}
            />
          </div>

          {usageWarning && (
            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm leading-relaxed text-amber-900">
                {usageWarning}
              </p>
            </div>
          )}

          {account.pauseReason && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {account.pauseReason}
            </p>
          )}

          <div className="grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Connection
              </p>
              <p className="font-medium text-slate-900">
                {providerDisplayName(account.provider)}
              </p>
              <p className="text-sm leading-snug text-slate-500">
                {providerConnectionLabel(account.provider, account.email)}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Trust & authentication
              </p>
              <SenderTrustIndicators
                senderCategory={account.senderCategory}
                reputation={account.reputation}
                domainAuth={account.domainAuth}
                onDomainAuthSetupClick={
                  needsDnsSetup ? () => onDnsSetup(account) : undefined
                }
              />
            </div>

            <div className="space-y-3">
              <DailySendMeter
                sendsToday={account.sendsToday}
                dailyLimit={dailyLimit}
              />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Bounce rate
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-lg font-semibold tabular-nums",
                    bounceStyles(account.bounceRate, account.status)
                  )}
                >
                  {(account.bounceRate ?? 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{accounts.length}</span>{" "}
          sending account{accounts.length === 1 ? "" : "s"} connected. Use{" "}
          <span className="font-medium text-slate-900">Settings</span> on each
          inbox to change the daily send cap and sender name.
        </p>
      </div>

      <div className="space-y-4">
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

      <Card className="border-slate-200 bg-slate-50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Quick guide
          </CardTitle>
          <CardDescription>
            What the numbers on each account mean
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="font-medium text-slate-900">Daily cap</p>
            <p className="mt-1 text-xs leading-relaxed">
              Max emails this inbox can send per day across all campaigns (30–300).
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="font-medium text-slate-900">Trust & auth</p>
            <p className="mt-1 text-xs leading-relaxed">
              Inbox type, reputation, and SPF/DKIM/DMARC when you use your own domain.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="font-medium text-slate-900">Personal inboxes</p>
            <p className="mt-1 text-xs leading-relaxed">
              Best for warm follow-ups — not large cold outreach to strangers.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
