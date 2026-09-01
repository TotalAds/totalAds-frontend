"use client";

import Link from "next/link";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBan,
  IconBook,
  IconCheck,
  IconLifebuoy,
  IconListCheck,
  IconShieldLock,
} from "@tabler/icons-react";

import type { IntegrationGuideContent } from "./types";

function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-brand-main shrink-0" />
      <h4 className="text-xs font-semibold uppercase tracking-wider text-text-200">
        {children}
      </h4>
    </div>
  );
}

export default function IntegrationGuide({
  guide,
}: {
  guide: IntegrationGuideContent;
}) {
  return (
    <div className="space-y-7">
      <p className="text-sm leading-relaxed text-text-200">{guide.summary}</p>

      {guide.worksWith?.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-text-400">
            Works with
          </span>
          {guide.worksWith.map((item) => (
            <span
              key={item}
              className="rounded-full border border-brand-main/25 bg-brand-main/10 px-2.5 py-1 text-xs font-medium text-text-100"
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}

      {guide.prerequisites?.length ? (
        <section className="space-y-3">
          <SectionHeading icon={IconListCheck}>Before you start</SectionHeading>
          <ul className="space-y-2">
            {guide.prerequisites.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm text-text-200">
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-main" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-4">
        <SectionHeading icon={IconArrowRight}>Setup walkthrough</SectionHeading>
        <ol className="relative space-y-5 border-l border-brand-main/20 pl-6">
          {guide.steps.map((step, index) => (
            <li key={step.title} className="relative">
              <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border border-brand-main/40 bg-bg-100 text-[11px] font-bold text-brand-main">
                {index + 1}
              </span>
              <p className="text-sm font-semibold text-text-100">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-text-200">
                {step.body}
              </p>
              {step.bullets?.length ? (
                <ul className="mt-2 space-y-1.5">
                  {step.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex gap-2 text-xs leading-relaxed text-text-300"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-main/60" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {step.warning ? (
                <p className="mt-2.5 flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-200">
                  <IconAlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                  <span>{step.warning}</span>
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      {guide.capabilities ? (
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-success/25 bg-success/5 p-4">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-success">
              What it can do
            </p>
            <ul className="space-y-2">
              {guide.capabilities.allowed.map((item) => (
                <li key={item} className="flex gap-2 text-xs leading-relaxed text-text-200">
                  <IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          {guide.capabilities.blocked?.length ? (
            <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-4">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-red-300">
                What it cannot do
              </p>
              <ul className="space-y-2">
                {guide.capabilities.blocked.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-xs leading-relaxed text-text-200"
                  >
                    <IconBan className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {guide.troubleshooting?.length ? (
        <section className="space-y-3">
          <SectionHeading icon={IconLifebuoy}>Troubleshooting</SectionHeading>
          <div className="divide-y divide-brand-main/10 overflow-hidden rounded-xl border border-brand-main/20">
            {guide.troubleshooting.map((entry) => (
              <div key={entry.problem} className="bg-bg-100/40 px-4 py-3">
                <p className="text-sm font-medium text-text-100">{entry.problem}</p>
                <p className="mt-1 text-xs leading-relaxed text-text-300">
                  {entry.fix}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {guide.security?.length ? (
        <section className="space-y-3">
          <SectionHeading icon={IconShieldLock}>Security notes</SectionHeading>
          <ul className="space-y-2">
            {guide.security.map((item) => (
              <li key={item} className="flex gap-2.5 text-xs leading-relaxed text-text-300">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-main/60" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {guide.docsHref ? (
        <Link
          href={guide.docsHref}
          {...(guide.docsHref.startsWith("http")
            ? { target: "_blank", rel: "noreferrer noopener" }
            : {})}
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-main hover:underline"
        >
          <IconBook className="h-4 w-4" />
          {guide.docsLabel || "Read the docs"}
        </Link>
      ) : null}
    </div>
  );
}
