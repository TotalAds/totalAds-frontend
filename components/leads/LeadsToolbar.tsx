"use client";

import type { ReactNode } from "react";
import { IconSearch, IconX } from "@tabler/icons-react";

import ColumnFilterMenu from "@/components/leads/ColumnFilterMenu";
import { LeadColumnFilters, LeadFilterOptions } from "@/components/leads/LeadsTable";
import type { LeadVerificationCounts } from "@/components/leads/leadsFilterUtils";

export type { LeadVerificationCounts };

const VERIFICATION_CHIP_OPTIONS = [
  { id: "unverified", label: "Unverified", tone: "slate" as const },
  { id: "safe", label: "Safe", tone: "emerald" as const },
  { id: "catch_all", label: "Catch-all", tone: "amber" as const },
  { id: "unknown", label: "Unknown", tone: "amber" as const },
  { id: "risky", label: "Risky", tone: "rose" as const },
];

const chipToneClasses = {
  slate: {
    active: "bg-slate-800 text-white ring-slate-800",
    idle: "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300",
  },
  emerald: {
    active: "bg-emerald-600 text-white ring-emerald-600",
    idle: "bg-white text-emerald-700 ring-emerald-200 hover:ring-emerald-300",
  },
  amber: {
    active: "bg-amber-600 text-white ring-amber-600",
    idle: "bg-white text-amber-700 ring-amber-200 hover:ring-amber-300",
  },
  rose: {
    active: "bg-rose-600 text-white ring-rose-600",
    idle: "bg-white text-rose-700 ring-rose-200 hover:ring-rose-300",
  },
};

interface LeadsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: LeadColumnFilters;
  filterOptions: LeadFilterOptions;
  onFiltersChange: (filters: LeadColumnFilters) => void;
  counts: LeadVerificationCounts;
  onClearAll: () => void;
  /** Rendered inline next to the count chips (e.g. archive-by-type actions). */
  trailingActions?: ReactNode;
}

function countForChip(id: string, counts: LeadVerificationCounts): number {
  if (id === "unverified") return counts.unverified;
  if (id === "safe") return counts.safe;
  if (id === "catch_all") return counts.catchAll;
  if (id === "unknown") return counts.unknown;
  if (id === "risky") return counts.risky;
  return 0;
}

export default function LeadsToolbar({
  search,
  onSearchChange,
  filters,
  filterOptions,
  onFiltersChange,
  counts,
  onClearAll,
  trailingActions,
}: LeadsToolbarProps) {
  const updateFilter = <K extends keyof LeadColumnFilters>(
    key: K,
    value: LeadColumnFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleVerificationChip = (chipId: string) => {
    const current = filters.verification;
    const next = current.includes(chipId)
      ? current.filter((id) => id !== chipId)
      : [chipId];
    updateFilter("verification", next);
  };

  const hasToolbarFilters =
    search.trim().length > 0 ||
    filters.name.trim().length > 0 ||
    filters.verification.length > 0 ||
    filters.tagIds.length > 0 ||
    filters.categoryIds.length > 0 ||
    filters.listIds.length > 0 ||
    filters.campaignIds.length > 0;

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <IconSearch className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search email, name, or company…"
            className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main/20"
          />
        </div>

        <ColumnFilterMenu
          type="multi"
          label="Verification"
          showLabel
          options={[
            { id: "safe", name: "Safe to send" },
            { id: "catch_all", name: "Catch-all" },
            { id: "unknown", name: "Unknown" },
            { id: "risky", name: "Risky" },
            { id: "unverified", name: "Unverified" },
          ]}
          selectedIds={filters.verification}
          onApply={(value) => updateFilter("verification", value)}
          searchable={false}
        />
        <ColumnFilterMenu
          type="text"
          label="Name"
          showLabel
          value={filters.name}
          placeholder="Filter by name…"
          onApply={(value) => updateFilter("name", value)}
        />
        <ColumnFilterMenu
          type="multi"
          label="Tags"
          showLabel
          options={filterOptions.tags}
          selectedIds={filters.tagIds}
          onApply={(value) => updateFilter("tagIds", value)}
        />
        <ColumnFilterMenu
          type="multi"
          label="Categories"
          showLabel
          options={filterOptions.categories}
          selectedIds={filters.categoryIds}
          onApply={(value) => updateFilter("categoryIds", value)}
        />
        <ColumnFilterMenu
          type="multi"
          label="Lists"
          showLabel
          options={filterOptions.lists}
          selectedIds={filters.listIds}
          onApply={(value) => updateFilter("listIds", value)}
        />
        <ColumnFilterMenu
          type="multi"
          label="Campaigns"
          showLabel
          options={filterOptions.campaigns}
          selectedIds={filters.campaignIds}
          onApply={(value) => updateFilter("campaignIds", value)}
        />

        {hasToolbarFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
          >
            <IconX size={14} />
            Clear
          </button>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2.5">
        <span className="mr-1 inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
          Total
          <span className="font-semibold tabular-nums text-slate-900">
            {counts.total.toLocaleString()}
          </span>
        </span>
        {VERIFICATION_CHIP_OPTIONS.map((chip) => {
          const active = filters.verification.includes(chip.id);
          const tone = chipToneClasses[chip.tone];
          const value = countForChip(chip.id, counts);
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => toggleVerificationChip(chip.id)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ring-1 transition-colors ${active ? tone.active : tone.idle}`}
            >
              {chip.label}
              <span className="font-semibold tabular-nums">
                {value.toLocaleString()}
              </span>
            </button>
          );
        })}
        {trailingActions && (
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {trailingActions}
          </div>
        )}
      </div>
    </div>
  );
}
