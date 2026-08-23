"use client";

import Link from "next/link";
import {
  IconKey,
  IconLock,
  IconRocket,
  IconServer,
  IconShield,
} from "@tabler/icons-react";

import {
  API_VERSION,
  RATE_LIMITS,
  RESPONSE_ENVELOPE_EXAMPLE,
  SCOPES,
  buildCurl,
} from "@/components/developer/apiDocsContent";
import { CodeBlock } from "@/components/developer/ApiDocComponents";
import { Button } from "@/components/ui/button";
import { getDeveloperApiV1BaseUrl } from "@/lib/emailServiceUrl";

export default function DocsHomePage() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-brand-main/25 bg-gradient-to-br from-bg-200 to-bg-300/80 p-6 md:p-8">
        <p className="text-xs uppercase tracking-widest text-brand-main font-semibold mb-2">
          Developer API · v{API_VERSION}
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-text-100">LeadSnipper REST API</h1>
        <p className="text-text-300 mt-3 max-w-2xl leading-relaxed">
          Integrate email outreach into your product: send one-off emails, launch multi-step campaigns,
          sync leads, and receive delivery webhooks — all without using the LeadSnipper UI.
        </p>
        <div className="flex flex-wrap gap-3 mt-6">
          <Link href="/email/settings/api">
            <Button className="bg-brand-main hover:bg-brand-main/90 text-white">
              <IconKey className="w-4 h-4 mr-2" />
              Manage API keys
            </Button>
          </Link>
          <Link href="/email/docs/reference">
            <Button variant="outline" className="border-brand-main/40 text-text-100">
              Full reference
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <InfoCard
          icon={<IconServer className="w-5 h-5 text-brand-main" />}
          title="Base URL"
          body={
            <>
              All endpoints are prefixed with{" "}
              <code className="text-brand-main text-xs">{getDeveloperApiV1BaseUrl()}</code>
            </>
          }
        />
        <InfoCard
          icon={<IconLock className="w-5 h-5 text-brand-main" />}
          title="Authentication"
          body="Bearer token with your ls_live_* key. Optional X-Workspace-Id header."
        />
        <InfoCard
          icon={<IconShield className="w-5 h-5 text-brand-main" />}
          title="Plan requirement"
          body="API access is available on Scale and Custom plans."
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-text-100 flex items-center gap-2">
          <IconRocket className="w-5 h-5 text-brand-main" />
          Quickstart
        </h2>
        <ol className="space-y-4 text-sm text-text-300">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-main/20 text-brand-main text-xs font-bold">1</span>
            <span>
              Create an API key at{" "}
              <Link href="/email/settings/api" className="text-brand-main underline font-medium">
                Settings → API
              </Link>{" "}
              (Scale or Custom plan required). Choose scopes: <code>read</code>, <code>write</code>,{" "}
              <code>send</code>.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-main/20 text-brand-main text-xs font-bold">2</span>
            <span>
              Verify you can send: <code className="text-text-200">GET /account/eligibility</code> then list
              senders with <code className="text-text-200">GET /senders</code> and note a{" "}
              <code className="text-text-200">senderId</code>.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-main/20 text-brand-main text-xs font-bold">3</span>
            <span>Send your first email with the request below (returns 202 Accepted when queued).</span>
          </li>
        </ol>
        <CodeBlock
          title="POST /emails/send"
          code={buildCurl("POST", "/emails/send", {
            from: { senderId: "123" },
            to: { email: "jane@example.com", name: "Jane" },
            subject: "Hello from LeadSnipper",
            html: "<p>Your first API email.</p>",
          })}
        />
      </section>

      <section className="space-y-4 rounded-2xl border border-brand-main/20 bg-bg-200/70 p-6">
        <h2 className="text-lg font-semibold text-text-100">API scopes</h2>
        <div className="rounded-xl border border-brand-main/15 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-300/80 text-text-300 text-left">
                <th className="px-4 py-2.5 w-24">Scope</th>
                <th className="px-4 py-2.5">Allows</th>
              </tr>
            </thead>
            <tbody>
              {SCOPES.map((s) => (
                <tr key={s.name} className="border-t border-brand-main/10">
                  <td className="px-4 py-2.5 font-mono text-brand-main">{s.name}</td>
                  <td className="px-4 py-2.5 text-text-300">{s.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text-100">Response format</h2>
        <p className="text-sm text-text-400">
          Every endpoint returns JSON with <code>success</code>, optional <code>data</code> or{" "}
          <code>error</code>, and <code>meta</code> (request ID, API version, rate limits).
        </p>
        <CodeBlock title="Envelope" code={JSON.stringify(RESPONSE_ENVELOPE_EXAMPLE, null, 2)} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text-100">Rate limits</h2>
        <div className="rounded-xl border border-brand-main/15 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-300/80 text-text-300 text-left">
                <th className="px-4 py-2.5">Tier</th>
                <th className="px-4 py-2.5">Requests / hour</th>
                <th className="px-4 py-2.5">Send calls / minute</th>
              </tr>
            </thead>
            <tbody>
              {RATE_LIMITS.map((row) => (
                <tr key={row.tier} className="border-t border-brand-main/10">
                  <td className="px-4 py-2.5 text-text-200 font-medium">{row.tier}</td>
                  <td className="px-4 py-2.5 text-text-400">{row.hourly}</td>
                  <td className="px-4 py-2.5 text-text-400">{row.sendPerMin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        {[
          { href: "/email/docs/reference", title: "Reference", desc: "Every endpoint with request body, response schema, and cURL." },
          { href: "/email/docs/webhooks", title: "Webhooks", desc: "Outbound delivery events and inbound campaign lead ingest." },
          { href: "/email/docs/examples", title: "Examples", desc: "Single send, atomic campaigns, bulk leads, verification." },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-brand-main/20 bg-bg-200/60 p-5 hover:border-brand-main/50 hover:bg-bg-200 transition-colors"
          >
            <h3 className="font-semibold text-text-100">{card.title}</h3>
            <p className="text-sm text-text-400 mt-1">{card.desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-brand-main/20 bg-bg-200/60 p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="font-semibold text-text-100 text-sm">{title}</h3>
      </div>
      <p className="text-sm text-text-400 leading-relaxed">{body}</p>
    </div>
  );
}
