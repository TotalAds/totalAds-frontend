"use client";

import { buildCurl } from "@/components/developer/apiDocsContent";

export default function DocsExamplesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-100">Examples</h1>
        <p className="text-text-400 text-sm mt-1">Common integration patterns with cURL.</p>
      </div>

      <ExampleBlock
        title="Send a single email"
        curl={buildCurl("POST", "/emails/send", {
          from: { senderId: "42" },
          to: { email: "prospect@company.com", name: "Alex" },
          subject: "Quick question",
          html: "<p>Hi Alex — wanted to reach out about...</p>",
          trackOpens: true,
        })}
      />

      <ExampleBlock
        title="Atomic campaign (create + send)"
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
        title="Check account eligibility before sending"
        curl={buildCurl("GET", "/account/eligibility")}
      />
    </div>
  );
}

function ExampleBlock({ title, curl }: { title: string; curl: string }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-text-100 mb-2">{title}</h2>
      <pre className="rounded-xl border border-brand-main/20 bg-bg-300/80 p-4 text-xs text-text-200 overflow-x-auto whitespace-pre-wrap">
        {curl}
      </pre>
    </section>
  );
}
