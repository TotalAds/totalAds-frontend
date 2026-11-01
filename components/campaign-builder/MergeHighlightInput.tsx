"use client";

import type {
  FocusEventHandler,
  ReactEventHandler,
} from "react";

import {
  extractUsedMergeVariables,
  getCoverageStatus,
  lookupTokenCoverage,
  type PersonalizationTokenCoverage,
} from "@/components/campaign-builder/htmlPreviewUtils";
import {
  PersonalizationHoverTrigger,
  lookupSampleValue,
} from "@/components/campaign-builder/PersonalizationCoveragePopover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  tokenCoverage?: Record<string, PersonalizationTokenCoverage>;
  tokenSampleValues?: Record<string, string>;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  onSelect?: ReactEventHandler<HTMLInputElement>;
};

function humanizeField(field: string): string {
  return field
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Subject / preview input. Shows editable `{{merge}}` syntax in the field;
 * coverage lives in a compact helper row under the input (hover for details).
 */
export function MergeHighlightInput({
  id,
  value,
  onChange,
  placeholder,
  maxLength,
  className,
  tokenCoverage,
  tokenSampleValues,
  onFocus,
  onBlur,
  onSelect,
}: Props) {
  const used = extractUsedMergeVariables(value);
  const hasCoverageData = Boolean(
    tokenCoverage && Object.keys(tokenCoverage).length > 0
  );

  return (
    <div className="space-y-1">
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onSelect={onSelect}
        placeholder={placeholder}
        maxLength={maxLength}
        className={cn("relative z-10 h-9 bg-bg-100 text-sm", className)}
      />
      {used.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1">
          {used.map((field) => {
            const coverage = lookupTokenCoverage(tokenCoverage, field);
            const status = hasCoverageData
              ? getCoverageStatus(coverage)
              : "ok";
            const sample = lookupSampleValue(tokenSampleValues, field);
            return (
              <PersonalizationHoverTrigger
                key={field}
                field={field}
                sample={sample}
                coverage={coverage}
                hasCoverageData={hasCoverageData}
              >
                <span
                  className={cn(
                    "inline-flex max-w-full cursor-help items-center gap-1 truncate rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-tight",
                    status === "missing" &&
                      "border-red-200 bg-red-50 text-red-700",
                    status === "warning" &&
                      "border-amber-200 bg-amber-50 text-amber-800",
                    status === "ok" &&
                      "border-slate-200 bg-slate-50 text-slate-600"
                  )}
                  title={`{{${field}}}`}
                >
                  <span className="truncate">{humanizeField(field)}</span>
                  {hasCoverageData && coverage && coverage.total > 0 ? (
                    <span className="shrink-0 font-normal tabular-nums opacity-70">
                      {coverage.withValue}/{coverage.total}
                    </span>
                  ) : null}
                </span>
              </PersonalizationHoverTrigger>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
