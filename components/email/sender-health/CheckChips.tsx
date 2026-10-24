import type { SenderHealthIssue } from "@/utils/api/emailClient";

const SCORED = ["mx", "spf", "dkim", "dns_resolution", "dmarc", "domain_blocklist", "https"];
const OPTIONAL = ["bimi", "mta_sts", "tls_rpt"];

function toneClass(tone: string): string {
  if (tone === "pass") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (tone === "critical") return "border-rose-200 bg-rose-50 text-rose-700";
  if (tone === "recommended") return "border-amber-200 bg-amber-50 text-amber-800";
  if (tone === "pending" || tone === "optional") return "border-dashed border-slate-300 bg-white text-slate-500";
  return "border-slate-200 bg-white text-slate-600";
}

function dotClass(tone: string): string {
  if (tone === "pass") return "bg-emerald-500";
  if (tone === "critical") return "bg-rose-500";
  if (tone === "recommended") return "bg-amber-500";
  return "bg-slate-300";
}

function segmentClass(tone: string): string {
  if (tone === "pass") return "bg-emerald-500";
  if (tone === "critical") return "bg-rose-500";
  if (tone === "recommended") return "bg-amber-400";
  return "bg-slate-200";
}

export function scoreChecks(issues: SenderHealthIssue[]): { passing: number; total: number; rows: SenderHealthIssue[] } {
  const rows = SCORED.map((key) => issues.find((issue) => issue.checkKey === key)).filter(
    (issue): issue is SenderHealthIssue => Boolean(issue),
  );
  const passing = rows.filter((issue) => issue.result === "pass").length;
  return { passing, total: SCORED.length, rows };
}

export function CheckScore({ issues }: { issues: SenderHealthIssue[] }) {
  const { passing, total, rows } = scoreChecks(issues);
  const optional = OPTIONAL.map((key) => issues.find((issue) => issue.checkKey === key)).filter(
    (issue): issue is SenderHealthIssue => Boolean(issue),
  );
  return (
    <div className="mt-4">
      <p className="text-xs font-medium text-slate-500">
        {passing} of {total} checks passing
      </p>
      <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-slate-200">
        {(rows.length ? rows : SCORED.map(() => null)).map((issue, index) => (
          <div
            key={issue?.checkKey || index}
            className={`h-full flex-1 ${issue ? segmentClass(issue.chipTone) : "bg-slate-200"}`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {rows.map((issue) => (
          <span
            key={issue.checkKey}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${toneClass(issue.chipTone)}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${dotClass(issue.chipTone)}`} />
            {issue.chipLabel}
          </span>
        ))}
        {optional.map((issue) => (
          <span
            key={issue.checkKey}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${toneClass(
              issue.result === "pass" ? "pass" : "optional",
            )}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${issue.result === "pass" ? "bg-emerald-500" : "bg-slate-300"}`} />
            {issue.chipLabel}
          </span>
        ))}
      </div>
    </div>
  );
}
