import { Button } from "@/components/ui/button";
import { CampaignLeadSequenceRow } from "@/utils/api/emailClient";

export function LeadSequenceTable({
  rows,
  markingReplied,
  onMarkReplied,
  title = "Lead sequence timeline",
}: {
  rows: CampaignLeadSequenceRow[];
  markingReplied: string | null;
  onMarkReplied: (leadId: string) => void;
  title?: string;
}) {
  const formatNextSend = (rawDate?: string | null) => {
    if (!rawDate) return "Now";
    const dt = new Date(rawDate);
    if (Number.isNaN(dt.getTime())) return "Now";
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startTomorrow = new Date(startToday);
    startTomorrow.setDate(startTomorrow.getDate() + 1);
    const time = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (dt < startTomorrow) return `Today ${time}`;
    return `Tomorrow ${time}`;
  };

  return (
    <div className="rounded-lg border border-slate-200">
      <div className="border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
        {title}
      </div>
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">Lead</th>
              <th className="px-3 py-2 text-left">Step</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Next send</th>
              <th className="px-3 py-2 text-left">Sent</th>
              <th className="px-3 py-2 text-left">Delivered</th>
              <th className="px-3 py-2 text-left">Read</th>
              <th className="px-3 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-slate-500">
                  No email activity in this step yet.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-800">{row.toEmail}</td>
                <td className="px-3 py-2 text-slate-600">Email {Number(row.sequenceStepIndex || 0) + 1}</td>
                <td className="px-3 py-2 text-slate-700">{row.engagementStatus || row.status}</td>
                <td className="px-3 py-2 text-slate-600">
                  {row.sentAt ? "-" : formatNextSend(row.nextRetryAt)}
                </td>
                <td className="px-3 py-2 text-slate-600">{row.sentAt ? "Yes" : "-"}</td>
                <td className="px-3 py-2 text-slate-600">{row.deliveredAt ? "Yes" : "-"}</td>
                <td className="px-3 py-2 text-slate-600">{row.readAt ? "Yes" : "-"}</td>
                <td className="px-3 py-2">
                  {row.leadId ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={markingReplied === row.leadId || !!row.repliedAt}
                      onClick={() => onMarkReplied(String(row.leadId))}
                    >
                      {row.repliedAt ? "Replied" : markingReplied === row.leadId ? "Saving..." : "Mark as replied"}
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

