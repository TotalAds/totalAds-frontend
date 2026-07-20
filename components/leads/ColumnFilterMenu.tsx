"use client";

import { useEffect, useState } from "react";
import { IconFilter, IconSearch, IconX } from "@tabler/icons-react";

import { Checkbox } from "@/components/ui/checkbox";
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

interface TextColumnFilterProps {
  type: "text";
  label: string;
  value: string;
  placeholder?: string;
  onApply: (value: string) => void;
}

interface MultiColumnFilterProps {
  type: "multi";
  label: string;
  options: FilterOption[];
  selectedIds: string[];
  onApply: (selectedIds: string[]) => void;
  searchable?: boolean;
}

type ColumnFilterMenuProps = TextColumnFilterProps | MultiColumnFilterProps;

export default function ColumnFilterMenu(props: ColumnFilterMenuProps) {
  const [open, setOpen] = useState(false);
  const isActive =
    props.type === "text"
      ? props.value.trim().length > 0
      : props.selectedIds.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors",
            isActive
              ? "bg-brand-main/15 text-brand-main"
              : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          )}
          aria-label={`Filter ${props.label}`}
        >
          <IconFilter size={14} stroke={isActive ? 2.25 : 1.75} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-64 border-slate-200 bg-white p-0 shadow-lg"
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
  placeholder,
  onApply,
  onClose,
}: TextColumnFilterProps & { onClose: () => void }) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleApply = () => {
    onApply(draft.trim());
    onClose();
  };

  const handleClear = () => {
    setDraft("");
    onApply("");
    onClose();
  };

  return (
    <div className="p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="relative">
        <IconSearch
          size={14}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder ?? "Filter…"}
          className="h-9 border-slate-200 bg-white pl-8 text-sm text-slate-900"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleApply();
          }}
          autoFocus
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

function MultiFilterPanel({
  label,
  options,
  selectedIds,
  onApply,
  searchable = true,
  onClose,
}: MultiColumnFilterProps & { onClose: () => void }) {
  const [draft, setDraft] = useState<string[]>(selectedIds);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setDraft(selectedIds);
  }, [selectedIds]);

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (id: string) => {
    setDraft((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleClear = () => {
    setDraft([]);
    onApply([]);
    onClose();
  };

  return (
    <div className="flex max-h-80 flex-col">
      <div className="border-b border-slate-100 px-3 py-2.5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
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
              const checked = draft.includes(option.id);
              return (
                <li key={option.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                      checked
                        ? "bg-brand-main/5 text-slate-900"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleOption(option.id)}
                      className="border-slate-300 data-[state=checked]:border-brand-main data-[state=checked]:bg-brand-main"
                    />
                    <span className="min-w-0 flex-1 truncate">{option.name}</span>
                    {typeof option.count === "number" && (
                      <span className="shrink-0 text-xs tabular-nums text-slate-400">
                        {option.count}
                      </span>
                    )}
                  </label>
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
          Apply{draft.length > 0 ? ` (${draft.length})` : ""}
        </button>
      </div>
    </div>
  );
}
