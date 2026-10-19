"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

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

const SUMMARY: Array<{
  key: string;
  label: string;
  number: string;
  card: string;
}> = [
  {
    key: "needs_attention",
    label: "Needs attention",
    number: "text-amber-700",
    card: "border-amber-200",
  },
  {
    key: "at_risk",
    label: "At risk",
    number: "text-orange-700",
    card: "border-orange-200",
  },
  {
    key: "critical",
    label: "Critical",
    number: "text-rose-700",
    card: "border-rose-200",
  },
  {
    key: "insufficient_data",
    label: "Not enough data yet",
    number: "text-slate-900",
    card: "border-slate-200",
  },
  {
    key: "healthy",
    label: "Healthy",
    number: "text-emerald-700",
    card: "border-slate-200",
  },
];

const REQUIRED_DOMAIN_KEYS = [
  "dns_resolution",
  "spf",
  "dkim",
  "dmarc",
  "mx",
  "domain_blocklist",
  "https",
];

function isProblem(issue: SenderHealthIssue): boolean {
  return issue.result === "fail" && issue.severity !== "informational";
}

function providerOwned(issues: SenderHealthIssue[]): boolean {
  return issues.some(
    (issue) => issue.listingDetail === "provider_owned_domain",
  );
}

function chipLabel(issue: SenderHealthIssue): string {
  if (issue.checkKey === "dkim" && issue.result === "pass") return "DKIM found";
  if (issue.checkKey === "dmarc" && issue.result === "pass") {
    const policy = /p=([a-z]+)/i.exec(issue.evidence)?.[1];
    return policy ? `DMARC enforced (${policy})` : "DMARC enforced";
  }
  if (issue.checkKey === "mx" && issue.result === "pass")
    return "MX records found";
  if (issue.checkKey === "dns_resolution" && issue.result === "pass")
    return "Domain resolves";
  if (issue.checkKey === "domain_blocklist" && issue.result === "pass")
    return "Not on Spamhaus DBL";
  if (issue.checkKey === "https" && issue.result === "pass")
    return "Website HTTPS 200";
  if (issue.checkKey === "bimi" && issue.result !== "pass")
    return "BIMI not set (optional)";
  if (issue.checkKey === "bimi") return "BIMI record found";
  if (issue.checkKey === "provider_auth" && issue.result === "pass")
    return "Mailbox auth current";
  if (issue.checkKey === "personal_mailbox" && issue.result === "pass")
    return "Suitable for cold outreach";
  if (issue.checkKey === "ip_blocklist" && issue.result === "pass")
    return "Sending IP not listed";
  if (issue.checkKey === "smtp_security" && issue.result === "pass")
    return "SMTP connection ok";
  return issue.issue;
}

function spfChip(issue: SenderHealthIssue): string {
  if (/google/i.test(issue.evidence)) return "SPF authorizes Google";
  if (/outlook|microsoft/i.test(issue.evidence))
    return "SPF authorizes Microsoft";
  if (/zoho/i.test(issue.evidence)) return "SPF authorizes Zoho";
  if (/amazonses|ses/i.test(issue.evidence)) return "SPF authorizes SES";
  return "SPF authorizes this sender";
}

function labelFor(issue: SenderHealthIssue): string {
  if (issue.checkKey === "spf" && issue.result === "pass")
    return spfChip(issue);
  return chipLabel(issue);
}

function formatWhen(value: string | null | undefined): string {
  if (!value) return "Not checked";
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mailboxKind(account: SenderHealthAccount): string {
  if (!account.personal) return "Business mailbox";
  if (account.provider === "gmail") return "Personal Gmail";
  if (account.provider === "outlook") return "Personal Outlook";
  if (account.provider === "zoho") return "Personal Zoho";
  return "Personal mailbox";
}

function accountSubtitle(account: SenderHealthAccount): string {
  const limited =
    account.sent7d < 100
      ? " · Limited reputation data (under 100 sends in 7 days)"
      : "";
  return `${mailboxKind(account)}${limited}`;
}

function calloutTitle(
  issue: SenderHealthIssue,
  account: SenderHealthAccount,
): string {
  if (issue.checkKey === "personal_mailbox") {
    return `Move cold outreach off ${mailboxKind(account).replace(
      "Personal ",
      "personal ",
    )}`;
  }
  return issue.issue;
}

function calloutBody(issue: SenderHealthIssue): string {
  if (issue.checkKey === "personal_mailbox") {
    return `${issue.evidence} Providers can restrict personal mailboxes used for cold email. Leaving it connected is fine; LeadSnipper won't block it.`;
  }
  return `${issue.evidence} ${issue.impact}`;
}

function Chip({
  label,
  optional = false,
}: {
  label: string;
  optional?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
        optional
          ? "border-dashed border-slate-300 text-slate-500"
          : "border-slate-200 bg-white text-slate-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          optional ? "bg-slate-300" : "bg-emerald-500"
        }`}
      />
      {label}
    </span>
  );
}

function ProblemCallout({
  issue,
  account,
  busy,
  onInstructions,
  onPreview,
  onRecheck,
}: {
  issue: SenderHealthIssue;
  account?: SenderHealthAccount;
  busy: boolean;
  onInstructions?: () => void;
  onPreview?: () => void;
  onRecheck: () => void;
}) {
  const personal = issue.checkKey === "personal_mailbox";
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-4">
      <p className="text-sm font-semibold text-amber-950">
        {account ? calloutTitle(issue, account) : issue.issue}
      </p>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-amber-900/90">
        {calloutBody(issue)}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {personal && onInstructions ? (
          <Button
            type="button"
            size="sm"
            className="rounded-lg"
            onClick={onInstructions}
          >
            Switch to a business domain
          </Button>
        ) : null}
        {!personal &&
        issue.actions.includes("view_instructions") &&
        onInstructions ? (
          <Button
            type="button"
            size="sm"
            className="rounded-lg"
            onClick={onInstructions}
          >
            View instructions
          </Button>
        ) : null}
        {issue.actions.includes("preview_dns") && onPreview ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg bg-white"
            onClick={onPreview}
          >
            Preview DNS change
          </Button>
        ) : null}
        {personal ? (
          <span className="text-sm text-amber-900/80">
            Use Google Workspace, Microsoft 365, Zoho Workplace or SES
          </span>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg bg-white"
            disabled={busy}
            onClick={onRecheck}
          >
            Recheck
          </Button>
        )}
      </div>
    </div>
  );
}

export function SenderHealthPanel({
  onViewInstructions,
}: {
  onViewInstructions: (senderId: string) => void;
}) {
  const [data, setData] = useState<SenderHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [preview, setPreview] = useState<Awaited<
    ReturnType<typeof previewSenderHealthDns>
  > | null>(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    let cancelled = false;
    getSenderHealth()
      .then((health) => {
        if (!cancelled) setData(health);
      })
      .catch((error: unknown) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load sender health",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const recheck = async (
    domain: string,
    senderId?: string,
    checkKey?: string,
  ) => {
    setBusyKey(`${domain}:${senderId || ""}:${checkKey || ""}`);
    try {
      setData(await recheckSenderHealth({ domain, senderId, checkKey }));
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

  if (loading)
    return (
      <p className="text-sm text-slate-500">Checking domains and mailboxes…</p>
    );
  if (!data?.domains.length) {
    return (
      <p className="text-sm text-slate-500">
        Connect a sending account to see domain and account health.
      </p>
    );
  }

  const cards = SUMMARY.filter((item) => (data.summary[item.key] || 0) > 0);

  return (
    <div className="space-y-4 mt-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((item) => (
          <div
            key={item.key}
            className={`rounded-xl border bg-white px-5 py-4 ${item.card}`}
          >
            <p
              className={`text-3xl font-semibold tracking-tight ${item.number}`}
            >
              {data.summary[item.key]}
            </p>
            <p className="mt-1 text-sm text-slate-600">{item.label}</p>
          </div>
        ))}
      </div>

      {data.domains.map((domain) => {
        const owned = providerOwned(domain.issues);
        const domainPasses = [
          ...domain.issues.filter(
            (issue) =>
              issue.result === "pass" &&
              REQUIRED_DOMAIN_KEYS.includes(issue.checkKey),
          ),
          ...(domain.website?.result === "pass" ? [domain.website] : []),
        ];
        const optional = domain.issues.filter(
          (issue) => issue.checkKey === "bimi",
        );
        const requiredTotal = owned ? 0 : REQUIRED_DOMAIN_KEYS.length;
        const requiredPassing = domainPasses.filter((issue) =>
          REQUIRED_DOMAIN_KEYS.includes(issue.checkKey),
        ).length;
        const domainProblems = domain.issues.filter(isProblem);
        return (
          <section
            key={domain.domain}
            className="rounded-xl border border-slate-200 bg-white px-5 py-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-slate-950">
                  {domain.domain}
                </h2>
                {owned ? (
                  <span className="text-sm text-slate-500">
                    Provider domain · domain checks don&apos;t apply
                  </span>
                ) : domain.status === "healthy" ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    Healthy
                  </span>
                ) : (
                  <span className="text-sm text-slate-500">
                    {domain.statusReason}
                  </span>
                )}
              </div>
              <p className="shrink-0 text-xs text-slate-400">
                Checked {formatWhen(domain.coverage.lastChecked)}
              </p>
            </div>

            {!owned && domainPasses.length ? (
              <div className="mt-4">
                <p className="text-[11px] font-medium tracking-wide text-slate-400">
                  DOMAIN SETUP · {requiredPassing} OF {requiredTotal} REQUIRED
                  PASSING
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {domainPasses.map((issue) => (
                    <Chip key={issue.checkKey} label={labelFor(issue)} />
                  ))}
                  {optional.map((issue) => (
                    <Chip
                      key={issue.checkKey}
                      label={labelFor(issue)}
                      optional={issue.result !== "pass"}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {domainProblems.length ? (
              <div className="mt-4 space-y-3">
                {domainProblems.map((issue) => (
                  <ProblemCallout
                    key={issue.checkKey}
                    issue={issue}
                    busy={busyKey !== null}
                    onRecheck={() =>
                      void recheck(domain.domain, undefined, issue.checkKey)
                    }
                    onInstructions={() => {
                      const senderId = domain.accounts[0]?.senderId;
                      if (domain.sesDomainId)
                        window.location.assign(
                          `/email/domains/${domain.sesDomainId}/verify`,
                        );
                      else if (senderId) onViewInstructions(senderId);
                    }}
                    onPreview={
                      domain.dnsApplyAvailable
                        ? () => void openPreview(domain.domain)
                        : undefined
                    }
                  />
                ))}
              </div>
            ) : null}

            {domain.distribution !== "Current mailboxes cover this volume." ? (
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {domain.distribution}
              </p>
            ) : null}

            {domain.accounts.map((account) => {
              const problems = account.issues.filter(isProblem);
              const passing = account.issues.filter(
                (issue) =>
                  issue.result === "pass" &&
                  issue.checkKey !== "bounce_rate" &&
                  issue.checkKey !== "complaint_rate",
              );
              const authOk = passing.some(
                (issue) => issue.checkKey === "provider_auth",
              );
              return (
                <div
                  key={account.senderId}
                  className="mt-4 border-t border-slate-100 pt-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {account.email}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {accountSubtitle(account)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        account.status === "needs_attention"
                          ? "bg-amber-50 text-amber-800"
                          : account.status === "critical"
                          ? "bg-rose-50 text-rose-700"
                          : account.status === "at_risk"
                          ? "bg-orange-50 text-orange-800"
                          : account.status === "healthy"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {account.status === "insufficient_data"
                        ? "Not enough data"
                        : account.status === "needs_attention"
                        ? "Needs attention"
                        : account.status === "at_risk"
                        ? "At risk"
                        : account.status === "critical"
                        ? "Critical"
                        : "Healthy"}
                    </span>
                  </div>
                  {problems.length ? (
                    <div className="mt-3 space-y-3">
                      {problems.map((issue) => (
                        <ProblemCallout
                          key={issue.checkKey}
                          issue={issue}
                          account={account}
                          busy={busyKey !== null}
                          onRecheck={() =>
                            void recheck(
                              domain.domain,
                              account.senderId,
                              issue.checkKey,
                            )
                          }
                          onInstructions={() =>
                            onViewInstructions(account.senderId)
                          }
                          onPreview={
                            domain.dnsApplyAvailable
                              ? () => void openPreview(domain.domain)
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  ) : null}
                  {passing.length ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-medium tracking-wide text-slate-400">
                        PASSING
                      </span>
                      {passing.map((issue) => (
                        <Chip key={issue.checkKey} label={labelFor(issue)} />
                      ))}
                      {authOk ? <Chip label="Account active" /> : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </section>
        );
      })}

      {preview ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-950">
            DNS changes for {preview.domain}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {preview.note}
          </p>
          <ul className="mt-3 space-y-2">
            {preview.records.map((record) => (
              <li
                key={`${record.type}-${record.host}`}
                className="text-sm text-slate-700"
              >
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
            <Button
              type="button"
              size="sm"
              disabled={!token || busyKey === "apply"}
              onClick={() => void applyPreview()}
            >
              Apply these records
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setPreview(null)}
            >
              Cancel
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
