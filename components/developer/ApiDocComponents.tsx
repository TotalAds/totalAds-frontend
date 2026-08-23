"use client";

import { toast } from "react-hot-toast";
import { IconCopy } from "@tabler/icons-react";

import type { SchemaField } from "@/components/developer/apiDocsContent";
import { Button } from "@/components/ui/button";

export function CodeBlock({
  title,
  code,
  language = "json",
}: {
  title?: string;
  code: string;
  language?: string;
}) {
  return (
    <div className="rounded-xl border border-brand-main/25 bg-[#0d1117] overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/30">
          <span className="text-xs font-medium text-text-200 uppercase tracking-wide">{title}</span>
          <CopyCodeButton text={code} />
        </div>
      )}
      <pre className="p-4 text-xs leading-relaxed text-emerald-100/90 overflow-x-auto font-mono">
        <code>{code}</code>
      </pre>
      {!title && (
        <div className="px-4 pb-3">
          <CopyCodeButton text={code} />
        </div>
      )}
    </div>
  );
}

function CopyCodeButton({ text }: { text: string }) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-7 border-white/20 text-text-200 hover:bg-white/10"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          toast.success("Copied");
        } catch {
          toast.error("Copy failed");
        }
      }}
    >
      <IconCopy className="w-3.5 h-3.5 mr-1" />
      Copy
    </Button>
  );
}

export function SchemaTable({ fields, title }: { fields: SchemaField[]; title: string }) {
  if (!fields.length) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-text-100">{title}</h4>
      <div className="rounded-xl border border-brand-main/20 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg-300/80 text-left text-text-300">
              <th className="px-4 py-2.5 font-medium w-[28%]">Field</th>
              <th className="px-4 py-2.5 font-medium w-[18%]">Type</th>
              <th className="px-4 py-2.5 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => (
              <tr key={field.name} className="border-t border-brand-main/10">
                <td className="px-4 py-2.5 font-mono text-brand-main text-xs align-top">
                  {field.name}
                  {field.required && (
                    <span className="ml-1.5 text-red-400 text-[10px] font-sans uppercase">required</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-text-400 text-xs align-top">{field.type}</td>
                <td className="px-4 py-2.5 text-text-300 align-top">{field.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    POST: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    PATCH: "bg-amber-500/20 text-amber-200 border-amber-500/40",
    DELETE: "bg-red-500/20 text-red-300 border-red-500/40",
  };
  return (
    <span
      className={`text-[11px] font-bold px-2 py-0.5 rounded border ${colors[method] ?? "bg-brand-main/20 text-brand-main"}`}
    >
      {method}
    </span>
  );
}
