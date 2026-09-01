"use client";

import { IconArrowUpRight } from "@tabler/icons-react";

import IntegrationStatusBadge from "./IntegrationStatusBadge";
import type { IntegrationDefinition, IntegrationStatus } from "./types";

export default function IntegrationCard({
  integration,
  status,
  onOpen,
}: {
  integration: IntegrationDefinition;
  status: IntegrationStatus;
  onOpen: () => void;
}) {
  const { icon: Icon, name, tagline, tags } = integration;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${name} setup and guide`}
      className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-brand-main/20 bg-bg-100/50 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-main/45 hover:bg-bg-100/80 hover:shadow-lg hover:shadow-brand-main/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-main focus-visible:ring-offset-2 focus-visible:ring-offset-bg-200"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-brand-main/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="relative flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-main/25 bg-brand-main/10 text-brand-main transition-colors group-hover:border-brand-main/45 group-hover:bg-brand-main/20">
          <Icon className="h-5 w-5" />
        </span>
        <IntegrationStatusBadge status={status} />
      </div>

      <div className="relative min-w-0 flex-1 space-y-1.5">
        <h4 className="text-base font-semibold text-text-100">{name}</h4>
        <p className="text-sm leading-relaxed text-text-300">{tagline}</p>
      </div>

      <div className="relative flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-brand-main/15 bg-bg-200/60 px-2 py-0.5 text-[11px] font-medium text-text-400"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="relative flex items-center justify-between gap-2 border-t border-brand-main/10 pt-3">
        <span className="truncate text-xs text-text-400">
          {status.state === "loading" ? "\u00a0" : status.detail || ""}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand-main">
          Setup &amp; guide
          <IconArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </button>
  );
}
