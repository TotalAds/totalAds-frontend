"use client";

import { useEffect, useRef, useState } from "react";
import { IconChevronDown, IconDownload, IconFileSpreadsheet, IconFileTypeCsv } from "@tabler/icons-react";

import type { LeadExportFormat } from "@/utils/api/emailClient";

interface ExportLeadsMenuProps {
  disabled?: boolean;
  busy?: boolean;
  onExport: (format: LeadExportFormat) => void;
  buttonClassName?: string;
  align?: "left" | "right";
}

export default function ExportLeadsMenu({
  disabled = false,
  busy = false,
  onExport,
  buttonClassName,
  align = "right",
}: ExportLeadsMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => setOpen((current) => !current)}
        className={
          buttonClassName ??
          "flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
        }
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <IconDownload size={16} />
        {busy ? "Exporting…" : "Export"}
        <IconChevronDown size={14} className={open ? "rotate-180" : ""} />
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute top-full z-30 mt-1 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg ${
            align === "left" ? "left-0" : "right-0"
          }`}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onExport("csv");
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <IconFileTypeCsv size={16} className="text-slate-500" />
            CSV file
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onExport("xlsx");
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <IconFileSpreadsheet size={16} className="text-emerald-600" />
            Excel file
          </button>
        </div>
      )}
    </div>
  );
}
