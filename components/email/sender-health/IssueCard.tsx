import type { SenderHealthIssue } from "@/utils/api/emailClient";

function badge(issue: SenderHealthIssue): { label: string; className: string } | null {
  if (issue.severity === "critical") return { label: "FIX FIRST", className: "bg-rose-600 text-white" };
  if (issue.severity === "recommended") return { label: "RECOMMENDED", className: "bg-amber-500 text-white" };
  if (issue.severity === "info") return { label: "INFO", className: "bg-slate-200 text-slate-700" };
  if (issue.severity === "pending") return { label: "NOTICE", className: "bg-slate-200 text-slate-700" };
  return null;
}

function shell(issue: SenderHealthIssue): string {
  if (issue.severity === "critical") return "border-rose-200 bg-rose-50/60";
  if (issue.severity === "recommended") return "border-amber-200 bg-amber-50/70";
  return "border-slate-200 bg-white";
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const area = document.createElement("textarea");
    area.value = value;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
}

function developerMail(issue: SenderHealthIssue) {
  const lines = [
    issue.title,
    "",
    "What we found",
    issue.found,
    "",
    "Why it matters",
    issue.why,
    "",
    "Sending status",
    issue.sendingImpactLabel,
    "",
    "How to fix it",
    ...issue.steps.map((step, index) => `${index + 1}. ${step}`),
  ];
  if (issue.record) {
    lines.push("", `${issue.record.type} ${issue.record.name}`, issue.record.value);
  }
  const href = `mailto:?subject=${encodeURIComponent(`DNS fix: ${issue.title}`)}&body=${encodeURIComponent(lines.join("\n"))}`;
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function IssueCard({
  issue,
  busy,
  cooling,
  onRecheck,
  onInstructions,
  onReconnect,
  onPreview,
}: {
  issue: SenderHealthIssue;
  busy: boolean;
  cooling: boolean;
  onRecheck: () => void;
  onInstructions?: () => void;
  onReconnect?: () => void;
  onPreview?: () => void;
}) {
  const tag = badge(issue);
  const recordText = issue.record ? `${issue.record.type} ${issue.record.name} ${issue.record.value}` : "";
  return (
    <article className={`rounded-xl border px-4 py-4 ${shell(issue)}`}>
      <div className="flex flex-wrap items-center gap-2">
        {tag ? (
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${tag.className}`}>{tag.label}</span>
        ) : null}
        <h3 className="text-sm font-semibold text-slate-950">{issue.title}</h3>
      </div>
      <div className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
        <p>
          <span className="font-semibold text-slate-950">What we found. </span>
          {issue.found}
        </p>
        {issue.why ? (
          <p>
            <span className="font-semibold text-slate-950">Why it matters. </span>
            {issue.why}
          </p>
        ) : null}
        <p>
          <span className="font-semibold text-slate-950">Sending status. </span>
          {issue.sendingImpactLabel}
        </p>
        {issue.dnsWaitNote ? <p className="text-slate-600">{issue.dnsWaitNote}</p> : null}
        {issue.steps.length ? (
          <div>
            <p className="font-semibold text-slate-950">How to fix it</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5">
              {issue.steps.slice(0, 4).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
      {issue.record ? (
        <div className="mt-3 flex items-start justify-between gap-3 rounded-lg bg-slate-900 px-3 py-3 text-sm text-slate-100">
          <p className="break-all font-mono text-[13px] leading-5">
            <span className="text-slate-400">
              {issue.record.type} {issue.record.name}
            </span>
            <br />
            {issue.record.value}
          </p>
          <button
            type="button"
            className="shrink-0 rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/20"
            onClick={() => void copyText(issue.record?.value || recordText)}
          >
            Copy
          </button>
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          disabled={busy || cooling}
          onClick={onRecheck}
        >
          {busy ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : null}
          Recheck now
        </button>
        {issue.record ? (
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => void copyText(recordText)}
          >
            Copy DNS record
          </button>
        ) : null}
        <button
          type="button"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => developerMail(issue)}
        >
          Send steps to my developer
        </button>
        {issue.actions.includes("switch_domain") && onInstructions ? (
          <button
            type="button"
            className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            onClick={onInstructions}
          >
            Switch to a business domain
          </button>
        ) : null}
        {issue.actions.includes("reconnect") && onReconnect ? (
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={onReconnect}
          >
            Reconnect
          </button>
        ) : null}
        {issue.actions.includes("preview_dns") && onPreview ? (
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={onPreview}
          >
            Preview DNS change
          </button>
        ) : null}
      </div>
    </article>
  );
}
