"use client";

import { buildCurl } from "@/components/developer/apiDocsContent";
import { CodeBlock } from "@/components/developer/ApiDocComponents";

export default function DocsExamplesPage() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold text-text-100">Examples</h1>
        <p className="text-text-400 mt-2 leading-relaxed max-w-2xl">
          Copy-paste cURL examples for common workflows. Replace{" "}
          <code className="text-brand-main">ls_live_YOUR_KEY</code> and sender/lead IDs with values
          from your account.
        </p>
      </header>

      <ExampleBlock
        title="1. Send a single email"
        description="Queues one email immediately. Returns 202 with messageId, campaignId, and leadId."
        curl={buildCurl("POST", "/emails/send", {
          from: { senderId: "42" },
          to: { email: "prospect@company.com", name: "Alex" },
          subject: "Quick question",
          html: "<p>Hi Alex — wanted to reach out about...</p>",
          trackOpens: true,
        })}
        response={`{
  "success": true,
  "data": {
    "messageId": "98765",
    "campaignId": "456",
    "leadId": "789",
    "status": "sending"
  },
  "meta": { "requestId": "ls_...", "apiVersion": "2026-08-23" }
}`}
      />

      <ExampleBlock
        title="2. Atomic campaign (create + send)"
        description="Creates leads from recipients, builds the campaign, and launches in one call."
        curl={buildCurl("POST", "/campaigns/send", {
          name: "API Outreach Jan 2026",
          domainId: "0",
          senderConfig: { senderIds: ["42"] },
          sequence: [
            { subject: "Hi {{name}}", body: "<p>First touch</p>", delayMinutes: 0 },
            { subject: "Following up", body: "<p>Second touch</p>", delayMinutes: 2880 },
          ],
          recipients: [
            { email: "a@example.com", name: "A" },
            { email: "b@example.com", name: "B" },
          ],
          requireLeadVerification: false,
        })}
      />

      <ExampleBlock
        title="3. Draft campaign → add leads → send"
        description="Multi-step flow when you need to prepare a campaign before launching."
        curl={`# Step 1: Create draft
${buildCurl("POST", "/campaigns", {
  name: "Q1 Outreach",
  domainId: "0",
  sequence: [{ subject: "Hello", body: "<p>Hi</p>", delayMinutes: 0 }],
})}

# Step 2: Add recipients
${buildCurl("POST", "/campaigns/456/leads", {
  recipients: [{ email: "lead@example.com", name: "Lead" }],
})}

# Step 3: Launch
${buildCurl("POST", "/campaigns/456/send", { senderIds: ["42"] })}`}
      />

      <ExampleBlock
        title="4. Bulk create leads"
        curl={buildCurl("POST", "/leads/bulk", {
          leads: [
            { email: "one@example.com", name: "One" },
            { email: "two@example.com", name: "Two" },
          ],
        })}
      />

      <ExampleBlock
        title="5. Check eligibility before sending"
        curl={buildCurl("GET", "/account/eligibility")}
        response={`{
  "success": true,
  "data": {
    "eligible": true,
    "verifiedDomainCount": 1,
    "verifiedSenderCount": 2,
    "connectedInboxCount": 1
  }
}`}
      />
    </div>
  );
}

function ExampleBlock({
  title,
  description,
  curl,
  response,
}: {
  title: string;
  description?: string;
  curl: string;
  response?: string;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-brand-main/20 bg-bg-200/60 p-5">
      <div>
        <h2 className="text-lg font-semibold text-text-100">{title}</h2>
        {description && <p className="text-sm text-text-400 mt-1">{description}</p>}
      </div>
      <CodeBlock title="Request" code={curl} />
      {response && <CodeBlock title="Example response" code={response} />}
    </section>
  );
}
