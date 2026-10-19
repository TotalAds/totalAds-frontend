"use client";

import { useEffect, useState } from "react";
import { IconFilter, IconMinus, IconSearch, IconX } from "@tabler/icons-react";

import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface FilterOption {
  id: string;
  name: string;
  count?: number;
  color?: string;
}

type OptionMode = "include" | "exclude";

interface TextColumnFilterProps {
  type: "text";
  label: string;
  value: string;
  excludeValue: string;
  placeholder?: string;
  onApply: (value: string, excludeValue: string) => void;
  /** Show label next to the filter icon (toolbar). Default: icon-only for table headers. */
  showLabel?: boolean;
}

interface MultiColumnFilterProps {
  type: "multi";
  label: string;
  options: FilterOption[];
  selectedIds: string[];
  excludedIds: string[];
  onApply: (selectedIds: string[], excludedIds: string[]) => void;
  searchable?: boolean;
  /** Show label next to the filter icon (toolbar). Default: icon-only for table headers. */
  showLabel?: boolean;
}

type ColumnFilterMenuProps = TextColumnFilterProps | MultiColumnFilterProps;

export default function ColumnFilterMenu(props: ColumnFilterMenuProps) {
  const [open, setOpen] = useState(false);
  const includeCount = props.type === "multi" ? props.selectedIds.length : 0;
  const excludeCount = props.type === "multi" ? props.excludedIds.length : 0;
  const isActive =
    props.type === "text"
      ? props.value.trim().length > 0 || props.excludeValue.trim().length > 0
      : includeCount > 0 || excludeCount > 0;
  const showLabel = props.showLabel === true;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center rounded-md transition-colors",
            showLabel
              ? "gap-1.5 border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              : "h-6 w-6",
            isActive
              ? showLabel
                ? "border-brand-main/40 bg-brand-main/10 text-brand-main"
                : "bg-brand-main/15 text-brand-main"
              : showLabel
                ? ""
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          )}
          aria-label={`Filter ${props.label}`}
        >
          <IconFilter size={14} stroke={isActive ? 2.25 : 1.75} />
          {showLabel && <span>{props.label}</span>}
          {showLabel && includeCount > 0 && (
            <span className="rounded-full bg-brand-main px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
              {includeCount}
            </span>
          )}
          {showLabel && excludeCount > 0 && (
            <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
              −{excludeCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 border-slate-200 bg-white p-0 shadow-lg"
      >
        {props.type === "text" ? (
          <TextFilterPanel {...props} onClose={() => setOpen(false)} />
        ) : (
          <MultiFilterPanel {...props} onClose={() => setOpen(false)} />
        )}
      </PopoverContent>
    </Popover>
  );
}

function TextFilterPanel({
  label,
  value,
  excludeValue,
  placeholder,
  onApply,
  onClose,
}: TextColumnFilterProps & { onClose: () => void }) {
  const [draft, setDraft] = useState(value);
  const [excludeDraft, setExcludeDraft] = useState(excludeValue);

  useEffect(() => {
    setDraft(value);
    setExcludeDraft(excludeValue);
  }, [value, excludeValue]);

  const handleApply = () => {
    onApply(draft.trim(), excludeDraft.trim());
    onClose();
  };

  const handleClear = () => {
    setDraft("");
    setExcludeDraft("");
    onApply("", "");
    onClose();
  };

  return (
    <div className="p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <label className="mb-1 block text-[11px] font-medium text-slate-500">
        Contains
      </label>
      <div className="relative">
        <IconSearch
          size={14}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder ?? "Contains…"}
          className="h-9 border-slate-200 bg-white pl-8 text-sm text-slate-900"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleApply();
          }}
          autoFocus
        />
      </div>
      <label className="mb-1 mt-3 block text-[11px] font-medium text-rose-600">
        Does not contain
      </label>
      <div className="relative">
        <IconMinus
          size={14}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-rose-400"
        />
        <Input
          value={excludeDraft}
          onChange={(e) => setExcludeDraft(e.target.value)}
          placeholder="Does not contain…"
          className="h-9 border-rose-200 bg-white pl-8 text-sm text-slate-900 focus-visible:ring-rose-200"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleApply();
          }}
        />
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="rounded-md bg-brand-main px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-main/90"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

function modesFromIds(selectedIds: string[], excludedIds: string[]) {
  const modes: Record<string, OptionMode> = {};
  for (const id of selectedIds) {
    if (!excludedIds.includes(id)) modes[id] = "include";
  }
  for (const id of excludedIds) modes[id] = "exclude";
  return modes;
}

function MultiFilterPanel({
  label,
  options,
  selectedIds,
  excludedIds,
  onApply,
  searchable = true,
  onClose,
}: MultiColumnFilterProps & { onClose: () => void }) {
  const [modes, setModes] = useState<Record<string, OptionMode>>(() =>
    modesFromIds(selectedIds, excludedIds)
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    setModes(modesFromIds(selectedIds, excludedIds));
  }, [selectedIds, excludedIds]);

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  const cycleOption = (id: string) => {
    setModes((prev) => {
      const current = prev[id];
      const next = { ...prev };
      if (!current) next[id] = "include";
      else if (current === "include") next[id] = "exclude";
      else delete next[id];
      return next;
    });
  };

  const includeIds = Object.entries(modes)
    .filter(([, mode]) => mode === "include")
    .map(([id]) => id);
  const excludeIds = Object.entries(modes)
    .filter(([, mode]) => mode === "exclude")
    .map(([id]) => id);

  const handleApply = () => {
    onApply(includeIds, excludeIds);
    onClose();
  };

  const handleClear = () => {
    setModes({});
    onApply([], []);
    onClose();
  };

  return (
    <div className="flex max-h-96 flex-col">
      <div className="border-b border-slate-100 px-3 py-2.5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-[11px] leading-4 text-slate-400">
          Click once to include, again to exclude.
        </p>
        {searchable && (
          <div className="relative mt-2">
            <IconSearch
              size={14}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search options…"
              className="h-8 border-slate-200 bg-white pl-8 text-sm"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filteredOptions.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-slate-400">
            No options available
          </p>
        ) : (
          <ul className="space-y-0.5">
            {filteredOptions.map((option) => {
              const mode = modes[option.id];
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => cycleOption(option.id)}
                    aria-pressed={mode ? true : false}
                    aria-label={
                      mode === "include"
                        ? `Include ${option.name}`
                        : mode === "exclude"
                          ? `Exclude ${option.name}`
                          : `${option.name}, not filtered`
                    }
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                      mode === "include" && "bg-brand-main/5 text-slate-900",
                      mode === "exclude" && "bg-rose-50 text-rose-900",
                      !mode && "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border",
                        mode === "include" && "border-brand-main bg-brand-main text-white",
                        mode === "exclude" && "border-rose-600 bg-rose-600 text-white",
                        !mode && "border-slate-300 bg-white"
                      )}
                    >
                      {mode === "include" && (
                        <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden>
                          <path
                            d="M3.5 8.2 6.4 11l6.1-6.2"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      {mode === "exclude" && <IconMinus size={12} stroke={2.5} />}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{option.name}</span>
                    {mode === "exclude" && (
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-rose-600">
                        Excl
                      </span>
                    )}
                    {typeof option.count === "number" && (
                      <span className="shrink-0 text-xs tabular-nums text-slate-400">
                        {option.count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2">
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        >
          <IconX size={12} />
          Clear
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="rounded-md bg-brand-main px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-main/90"
        >
          Apply
          {includeIds.length + excludeIds.length > 0
            ? ` (${includeIds.length + excludeIds.length})`
            : ""}
        </button>
      </div>
    </div>
  );
}
