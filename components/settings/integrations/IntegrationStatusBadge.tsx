"use client";

import { IconCheck, IconCircleDashed, IconLock } from "@tabler/icons-react";

import type { IntegrationStatus } from "./types";

export default function IntegrationStatusBadge({
  status,
}: {
  status: IntegrationStatus;
}) {
  if (status.state === "loading") {
    return (
      <span className="inline-flex h-6 w-20 animate-pulse rounded-full bg-brand-main/10" />
    );
  }

  const config = {
    connected: {
      Icon: IconCheck,
      label: "Connected",
      className: "border-success/40 bg-success/10 text-success",
    },
    not_connected: {
      Icon: IconCircleDashed,
      label: "Not connected",
      className: "border-brand-main/25 bg-bg-100/60 text-text-300",
    },
    locked: {
      Icon: IconLock,
      label: "Unavailable",
      className: "border-amber-500/35 bg-amber-500/10 text-amber-300",
    },
  }[status.state];

  const { Icon, label, className } = config;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
