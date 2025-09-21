import React from "react";

export default function DataUsePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-slate-200/90">
      <h1 className="mb-3 text-lg font-semibold text-white">
        Data Use & Web Respect
      </h1>
      <p className="mb-2 text-sm">
        We access and process only publicly available information.
      </p>
      <p className="mb-2 text-sm">
        We respect website terms and robots.txt directives and do not bypass
        paywalls, authentication, or other access controls. Our service does not
        target sensitive or proprietary content.
      </p>
      <p className="mb-2 text-sm">
        If we receive a request regarding content removal or access concerns, we
        will promptly review and take appropriate action. Users are responsible
        for complying with applicable laws and site policies.
      </p>
      <p className="mb-2 text-sm">
        For takedown or access concerns, contact us at
        <a
          href="mailto:hello@leadsnipper.com"
          className="ml-1 underline underline-offset-2"
        >
          hello@leadsnipper.com
        </a>
        . See our{" "}
        <a href="/privacy-policy" className="underline underline-offset-2">
          Privacy Policy
        </a>{" "}
        and
        <a
          href="/terms-of-service"
          className="ml-1 underline underline-offset-2"
        >
          Terms of Service
        </a>
        .
      </p>
      <p className="text-xs text-slate-400">
        Last updated: {new Date().toISOString().slice(0, 10)}
      </p>
    </main>
  );
}
