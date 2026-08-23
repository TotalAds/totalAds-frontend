"use client";

import Link from "next/link";
import { IconKey, IconRocket } from "@tabler/icons-react";

import { buildCurl } from "@/components/developer/apiDocsContent";
import { Button } from "@/components/ui/button";

export default function DocsHomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-brand-main/20 bg-bg-200/50 p-6 md:p-8">
        <h1 className="text-3xl font-bold text-text-100">LeadSnipper API</h1>
        <p className="text-text-300 mt-2 max-w-2xl">
          Send single emails, launch campaigns, manage leads, and track delivery programmatically
          with REST API keys (<code className="text-brand-main">ls_live_*</code>).
        </p>
        <div className="flex flex-wrap gap-3 mt-6">
          <Link href="/email/settings/api">
            <Button className="bg-brand-main hover:bg-brand-main/90">
              <IconKey className="w-4 h-4 mr-2" />
              Manage API keys
            </Button>
          </Link>
          <Link href="/email/docs/reference">
            <Button variant="outline" className="border-brand-main/40">
              Endpoint reference
            </Button>
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-text-100 flex items-center gap-2">
          <IconRocket className="w-5 h-5 text-brand-main" />
          Quickstart
        </h2>
        <ol className="list-decimal list-inside space-y-3 text-text-300 text-sm">
          <li>
            Upgrade to Scale or Custom, then create an API key at{" "}
            <Link href="/email/settings/api" className="text-brand-main underline">
              Settings → API
            </Link>
            .
          </li>
          <li>List senders with <code>GET /v1/senders</code> and pick a verified sender ID.</li>
          <li>Send your first email:</li>
        </ol>
        <pre className="rounded-xl border border-brand-main/20 bg-bg-300/80 p-4 text-xs text-text-200 overflow-x-auto">
          {buildCurl("POST", "/emails/send", {
            from: { senderId: "123" },
            to: { email: "jane@example.com", name: "Jane" },
            subject: "Hello from LeadSnipper",
            html: "<p>Your first API email.</p>",
          })}
        </pre>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <Link
          href="/email/docs/reference"
          className="rounded-xl border border-brand-main/15 p-5 hover:border-brand-main/40 transition-colors"
        >
          <h3 className="font-semibold text-text-100">Reference</h3>
          <p className="text-sm text-text-400 mt-1">All endpoints, scopes, and copyable cURL examples.</p>
        </Link>
        <Link
          href="/email/docs/webhooks"
          className="rounded-xl border border-brand-main/15 p-5 hover:border-brand-main/40 transition-colors"
        >
          <h3 className="font-semibold text-text-100">Webhooks</h3>
          <p className="text-sm text-text-400 mt-1">Outbound delivery events and inbound lead ingest.</p>
        </Link>
        <Link
          href="/email/docs/examples"
          className="rounded-xl border border-brand-main/15 p-5 hover:border-brand-main/40 transition-colors"
        >
          <h3 className="font-semibold text-text-100">Examples</h3>
          <p className="text-sm text-text-400 mt-1">Single send, atomic campaigns, and error handling.</p>
        </Link>
      </section>
    </div>
  );
}
