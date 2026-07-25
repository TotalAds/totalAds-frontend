"use client";

import {
  extractUsedMergeVariables,
  getCoverageStatus,
  lookupTokenCoverage,
  highlightMergeTagsInPlainText,
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
};

/**
 * Subject / preview input with in-field merge-tag colors + coverage pills.
 * Hover pills for a formatted coverage popover (warning only).
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
}: Props) {
  const used = extractUsedMergeVariables(value);
  const hasMergeTags = used.length > 0;
  const hasCoverageData = Boolean(
    tokenCoverage && Object.keys(tokenCoverage).length > 0
  );
  const highlightedHtml = hasMergeTags
    ? highlightMergeTagsInPlainText(value, tokenCoverage, tokenSampleValues)
    : "";

  return (
    <div className="space-y-1.5">
      <div className="relative">
        {hasMergeTags ? (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 z-0 overflow-hidden whitespace-pre rounded-md border border-transparent px-3 py-2 text-sm leading-5",
              className
            )}
            dangerouslySetInnerHTML={{ __html: highlightedHtml || "&nbsp;" }}
          />
        ) : null}
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            "relative z-10 h-9 bg-bg-100 text-sm",
            hasMergeTags &&
              "bg-transparent text-transparent caret-slate-900 selection:bg-blue-200/50 selection:text-transparent",
            className
          )}
        />
      </div>
      {used.length > 0 && hasCoverageData ? (
        <div className="flex flex-wrap gap-1">
          {used.map((field) => {
            const coverage = lookupTokenCoverage(tokenCoverage, field);
            const status = getCoverageStatus(coverage);
            const sample = lookupSampleValue(tokenSampleValues, field);
            return (
              <PersonalizationHoverTrigger
                key={field}
                field={field}
                sample={sample}
                coverage={coverage}
                hasCoverageData
              >
                <span
                  className={cn(
                    "inline-flex cursor-help items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    status === "missing" &&
                      "border-red-300 bg-red-50 text-red-700",
                    status === "warning" &&
                      "border-amber-300 bg-amber-50 text-amber-800",
                    status === "ok" && "border-blue-200 bg-blue-50 text-blue-700"
                  )}
                >
                  {`{{${field}}}`}
                  {coverage && coverage.total > 0 ? (
                    <span className="ml-1 font-normal opacity-80">
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
