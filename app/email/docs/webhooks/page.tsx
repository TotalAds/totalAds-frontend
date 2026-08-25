"use client";

import { API_ENDPOINTS, buildCurl } from "@/components/developer/apiDocsContent";
import { CodeBlock, SchemaTable } from "@/components/developer/ApiDocComponents";
import { getEmailServiceUrl } from "@/lib/emailServiceUrl";

const webhookEndpoint = API_ENDPOINTS.flatMap((g) => g.items).find((e) => e.id === "post-webhooks");
const getWebhookEndpoint = API_ENDPOINTS.flatMap((g) => g.items).find((e) => e.id === "get-webhooks");

export default function DocsWebhooksPage() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold text-text-100">Webhooks</h1>
        <p className="text-text-400 mt-2 leading-relaxed max-w-2xl">
          Receive real-time delivery events at your HTTPS endpoint, or push leads into continuous
          campaigns via the existing ingest URL.
        </p>
      </header>

      <section className="space-y-5 rounded-2xl border border-brand-main/20 bg-bg-200/60 p-6">
        <h2 className="text-lg font-semibold text-text-100">Outbound events (REST API)</h2>
        <p className="text-sm text-text-300 leading-relaxed">
          Register a subscription with <code className="text-brand-main">POST /v1/webhooks</code>.
          LeadSnipper POSTs JSON to your URL and signs the body with HMAC-SHA256 in the{" "}
          <code className="text-text-200">X-LeadSnipper-Signature</code> header.
        </p>

        {getWebhookEndpoint?.responseData && (
          <SchemaTable
            title="Supported event types"
            fields={[
              { name: "email.sent", type: "event", description: "Email accepted by provider" },
              { name: "email.delivered", type: "event", description: "Delivered to recipient inbox" },
              { name: "email.opened", type: "event", description: "Tracking pixel opened" },
              { name: "email.clicked", type: "event", description: "Link clicked" },
              { name: "email.bounced", type: "event", description: "Hard or soft bounce" },
              { name: "email.complained", type: "event", description: "Spam complaint" },
            ]}
          />
        )}

        {webhookEndpoint?.requestBody && (
          <>
            <SchemaTable fields={webhookEndpoint.requestBody.fields} title="Create subscription — request body" />
            <CodeBlock
              title="POST /webhooks"
              code={buildCurl("POST", "/webhooks", webhookEndpoint.requestBody.example)}
            />
          </>
        )}

        <CodeBlock
          title="Webhook payload your server receives"
          code={JSON.stringify(
            {
              id: "evt_1710000000_1",
              type: "email.delivered",
              createdAt: "2026-08-23T12:00:00.000Z",
              data: {
                messageId: "98765",
                campaignId: "456",
                leadId: "789",
                toEmail: "jane@example.com",
              },
            },
            null,
            2
          )}
        />
      </section>

      <section className="space-y-4 rounded-2xl border border-brand-main/20 bg-bg-200/60 p-6">
        <h2 className="text-lg font-semibold text-text-100">Inbound — campaign lead ingest</h2>
        <p className="text-sm text-text-300 leading-relaxed">
          Continuous campaigns expose a public ingest URL in the campaign builder (Leads tab → Webhook).
          POST leads with the ingest secret. They appear in the pending send queue
          immediately. Pass <code>queueDelayMinutes</code> to control when the email
          sends (including <code>0</code> for immediate); if omitted, the default is
          5 minutes. Response <code>message</code> and{" "}
          <code>data.queueDelayMinutes</code> always reflect the delay that was applied.
          Optional <code>tags</code>, <code>categories</code>, and <code>lists</code> arrays
          create or reuse those labels. Duplicate submissions for a lead already in queue
          return HTTP 409.
        </p>
        <SchemaTable
          title="Request body"
          fields={[
            { name: "email", type: "string", required: true, description: "Lead email address" },
            { name: "name", type: "string", required: true, description: "Lead display name" },
            { name: "tags", type: "string[]", description: "Tag names to assign (created if missing)" },
            { name: "categories", type: "string[]", description: "Category names to assign (created if missing)" },
            { name: "lists", type: "string[]", description: "List names to assign (created if missing)" },
            { name: "queueDelayMinutes", type: "number", description: "Optional per-lead send delay override (default 5)" },
          ]}
        />
        <CodeBlock
          title="POST /api/webhooks/campaign-leads/:publicToken"
          code={`curl -X POST "${getEmailServiceUrl()}/api/webhooks/campaign-leads/YOUR_PUBLIC_TOKEN" \\
  -H "Authorization: Bearer YOUR_INGEST_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "lead@example.com",
    "name": "Lead Name",
    "tags": ["webinar"],
    "categories": ["SaaS"],
    "lists": ["Inbound Webhook"],
    "queueDelayMinutes": 5
  }'`}
        />
      </section>
    </div>
  );
}
