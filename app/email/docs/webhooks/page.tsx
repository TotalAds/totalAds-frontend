"use client";

import { buildCurl } from "@/components/developer/apiDocsContent";

export default function DocsWebhooksPage() {
  return (
    <div className="space-y-8 prose prose-invert max-w-none">
      <div>
        <h1 className="text-2xl font-bold text-text-100">Webhooks</h1>
        <p className="text-text-400 text-sm mt-1">
          Subscribe to outbound email events or push leads into continuous campaigns.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-100">Outbound (REST API)</h2>
        <p className="text-sm text-text-300">
          Register endpoints with <code>POST /v1/webhooks</code>. LeadSnipper signs payloads with HMAC-SHA256 in{" "}
          <code>X-LeadSnipper-Signature</code>.
        </p>
        <ul className="text-sm text-text-400 list-disc list-inside space-y-1">
          <li>email.sent</li>
          <li>email.delivered</li>
          <li>email.opened</li>
          <li>email.clicked</li>
          <li>email.bounced</li>
          <li>email.complained</li>
        </ul>
        <pre className="rounded-xl border border-brand-main/20 bg-bg-300/80 p-4 text-xs text-text-200 overflow-x-auto">
          {buildCurl("POST", "/webhooks", {
            url: "https://your-app.com/webhooks/leadsnipper",
            events: ["email.delivered", "email.bounced"],
            description: "Production events",
          })}
        </pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-100">Inbound (campaign lead ingest)</h2>
        <p className="text-sm text-text-300">
          Continuous campaigns expose a public ingest URL in the campaign builder. POST leads with the ingest secret:
        </p>
        <pre className="rounded-xl border border-brand-main/20 bg-bg-300/80 p-4 text-xs text-text-200 overflow-x-auto">
{`POST /api/webhooks/campaign-leads/:publicToken
Authorization: Bearer <ingest-secret>
Content-Type: application/json

{ "email": "lead@example.com", "name": "Lead Name" }`}
        </pre>
      </section>
    </div>
  );
}
