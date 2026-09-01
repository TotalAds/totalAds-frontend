"use client";

import { IconLoader2 } from "@tabler/icons-react";

export default function PanelLoading({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-brand-main/15 bg-bg-100/40 px-4 py-6 text-sm text-text-300">
      <IconLoader2 className="h-4 w-4 animate-spin text-brand-main" />
      {label || "Loading…"}
    </div>
  );
}
