"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { CheckScore } from "@/components/email/sender-health/CheckChips";
import { IssueCard } from "@/components/email/sender-health/IssueCard";
import { SummaryCards } from "@/components/email/sender-health/SummaryCards";
import { Button } from "@/components/ui/button";
import {
  applySenderHealthDns,
  getSenderHealth,
  previewSenderHealthDns,
  recheckSenderHealth,
  type SenderHealthAccount,
  type SenderHealthIssue,
  type SenderHealthResponse,
} from "@/utils/api/emailClient";

const CARD_RANK: Record<string, number> = {
  critical: 0,
  recommended: 1,
  info: 2,
  pending: 3,
};

const PASS_LINE = [
  "provider_reject",
  "provider_delay",
  "provider_throttle",
  "provider_auth",
  "personal_mailbox",
  "smtp_security",
];

function formatWhen(value: string | null | undefined): string {
  if (!value) return "Not checked";
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function cardsFor(issues: SenderHealthIssue[]): SenderHealthIssue[] {
  return issues
    .filter((issue) => issue.showsCard)
    .sort((a, b) => (CARD_RANK[a.severity] ?? 9) - (CARD_RANK[b.severity] ?? 9));
}

function mailboxKind(account: SenderHealthAccount): string {
  if (!account.personal) return "Business mailbox";
  if (account.provider === "gmail") return "Personal Gmail";
  if (account.provider === "outlook") return "Personal Outlook";
  if (account.provider === "zoho") return "Personal Zoho";
  return "Personal mailbox";
}

function mailboxBadge(account: SenderHealthAccount): { label: string; className: string } | null {
  if (account.cap > 0 && account.sendsToday >= account.cap) {
    return { label: "Limit reached", className: "bg-slate-100 text-slate-700" };
  }
  if (account.badge) {
    const critical = account.status === "critical";
    return {
      label: account.badge,
      className: critical ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800",
    };
  }
  if (account.sent7d < 100) {
    return { label: "Building history", className: "bg-slate-100 text-slate-600" };
  }
  if (account.status === "healthy") {
    return { label: "Healthy", className: "bg-emerald-50 text-emerald-700" };
  }
  return null;
}

function passingLine(account: SenderHealthAccount): string {
  const labels = account.issues
    .filter((issue) => issue.result === "pass" && PASS_LINE.includes(issue.checkKey))
    .map((issue) => issue.chipLabel.toLowerCase());
  if (account.issues.some((issue) => issue.checkKey === "provider_auth" && issue.result === "pass")) {
    labels.push("account active");
  }
  if (!labels.length) return "";
  return `Mailbox checks passing: ${labels.join(", ")}.`;
}

export function SenderHealthPanel({
  onViewInstructions,
  onShowAccounts,
}: {
  onViewInstructions: (senderId: string) => void;
  onShowAccounts?: () => void;
}) {
  const [data, setData] = useState<SenderHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<Record<string, number>>({});
  const [now, setNow] = useState(() => Date.now());
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof previewSenderHealthDns>> | null>(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    let cancelled = false;
    getSenderHealth()
      .then((health) => {
        if (!cancelled) setData(health);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Failed to load sender health");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const pending = Object.values(cooldownUntil).some((until) => until > Date.now());
    if (!pending) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  const recheck = async (domain: string, senderId?: string, checkKey?: string) => {
    const key = `${domain}:${senderId || ""}:${checkKey || ""}`;
    setBusyKey(key);
    try {
      setData(await recheckSenderHealth({ domain, senderId, checkKey }));
      setCooldownUntil((current) => ({ ...current, [key]: Date.now() + 30_000 }));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Recheck failed");
    } finally {
      setBusyKey(null);
    }
  };

  const openPreview = async (domain: string) => {
    try {
      setToken("");
      setPreview(await previewSenderHealthDns(domain));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Preview failed");
    }
  };

  const applyPreview = async () => {
    if (!preview) return;
    setBusyKey("apply");
    try {
      setData(
        await applySenderHealthDns({
          domain: preview.domain,
          apiToken: token,
          spfChoice: preview.spfChoice,
        }),
      );
      setPreview(null);
      toast.success("DNS changes applied. Health was rechecked.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Apply failed");
    } finally {
      setBusyKey(null);
    }
  };

  if (loading) return <p className="mt-6 text-sm text-slate-500">Checking domains and mailboxes…</p>;
  if (!data?.domains.length) {
    return (
      <p className="mt-6 text-sm text-slate-500">Connect a sending account to see domain and account health.</p>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <SummaryCards summary={data.summary} />
      {data.domains.map((domain) => {
        const domainCards = cardsFor(domain.issues);
        return (
          <section key={domain.domain} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-slate-950">{domain.domain}</h2>
                {domain.providerOwned ? (
                  <span className="text-sm text-slate-500">Provider domain · domain checks don&apos;t apply</span>
                ) : domain.badge ? (
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                      domain.status === "critical"
                        ? "border-rose-200 text-rose-700"
                        : "border-amber-200 text-amber-800"
                    }`}
                  >
                    {domain.badge}
                  </span>
                ) : null}
              </div>
              <p className="shrink-0 text-xs text-slate-400">Checked {formatWhen(domain.coverage.lastChecked)}</p>
            </div>
            {!domain.providerOwned ? <CheckScore issues={domain.issues} /> : null}
            {domainCards.length ? (
              <div className="mt-4 space-y-3">
                {domainCards.map((issue) => {
                  const key = `${domain.domain}::${issue.checkKey}`;
                  return (
                    <IssueCard
                      key={issue.checkKey}
                      issue={issue}
                      busy={busyKey === key}
                      cooling={(cooldownUntil[key] || 0) > now}
                      onRecheck={() => void recheck(domain.domain, undefined, issue.checkKey)}
                      onInstructions={() => {
                        const senderId = domain.accounts[0]?.senderId;
                        if (domain.sesDomainId) window.location.assign(`/email/domains/${domain.sesDomainId}/verify`);
                        else if (senderId) onViewInstructions(senderId);
                      }}
                      onPreview={domain.dnsApplyAvailable ? () => void openPreview(domain.domain) : undefined}
                      onReconnect={onShowAccounts}
                    />
                  );
                })}
              </div>
            ) : null}
            {domain.distribution !== "Current mailboxes cover this volume." ? (
              <p className="mt-3 text-sm leading-6 text-slate-600">{domain.distribution}</p>
            ) : null}
            {domain.accounts.map((account) => {
              const problems = cardsFor(account.issues);
              const badge = mailboxBadge(account);
              const history =
                account.sent7d < 100
                  ? `Building history: ${account.sent7d} of 100 sends in 7 days for a reputation score`
                  : "";
              const passed = passingLine(account);
              return (
                <div key={account.senderId} className="mt-4 border-t border-slate-100 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{account.email}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {mailboxKind(account)}
                        {history ? ` · ${history}` : ""}
                      </p>
                    </div>
                    {badge ? (
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    ) : null}
                  </div>
                  {problems.length ? (
                    <div className="mt-3 space-y-3">
                      {problems.map((issue) => {
                        const key = `${domain.domain}:${account.senderId}:${issue.checkKey}`;
                        return (
                          <IssueCard
                            key={issue.checkKey}
                            issue={issue}
                            busy={busyKey === key}
                            cooling={(cooldownUntil[key] || 0) > now}
                            onRecheck={() => void recheck(domain.domain, account.senderId, issue.checkKey)}
                            onInstructions={() => onViewInstructions(account.senderId)}
                            onReconnect={onShowAccounts}
                            onPreview={domain.dnsApplyAvailable ? () => void openPreview(domain.domain) : undefined}
                          />
                        );
                      })}
                    </div>
                  ) : null}
                  {passed ? <p className="mt-3 text-sm text-slate-500">{passed}</p> : null}
                </div>
              );
            })}
          </section>
        );
      })}

      {preview ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-950">DNS changes for {preview.domain}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{preview.note}</p>
          <ul className="mt-3 space-y-2">
            {preview.records.map((record) => (
              <li key={`${record.type}-${record.host}`} className="text-sm text-slate-700">
                <span className="font-medium text-slate-950">
                  {record.type} {record.host}
                </span>
                <p className="mt-1 break-all text-slate-600">{record.value}</p>
              </li>
            ))}
          </ul>
          <label className="mt-4 block text-sm text-slate-700">
            Cloudflare API token
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              autoComplete="off"
            />
          </label>
          <div className="mt-3 flex gap-2">
            <Button type="button" size="sm" disabled={!token || busyKey === "apply"} onClick={() => void applyPreview()}>
              Apply these records
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setPreview(null)}>
              Cancel
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
