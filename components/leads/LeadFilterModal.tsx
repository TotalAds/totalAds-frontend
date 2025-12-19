"use client";

import { useMemo, useState } from "react";

import MultiSelect, {
  MultiSelectOption,
} from "@/components/common/MultiSelect";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IconFilter, IconX } from "@tabler/icons-react";

interface FilterOptions {
  categories: MultiSelectOption[];
  tags: MultiSelectOption[];
  campaigns: MultiSelectOption[];
  statuses: Array<{ value: string; label: string; count: number }>;
}

interface LeadFilterModalProps {
  filterOptions: FilterOptions;
  statusFilter: string[];
  categoryFilter: string[];
  tagFilter: string[];
  campaignFilter: string[];
  verificationFilter: string[];
  onStatusFilterChange: (selected: string[]) => void;
  onCategoryFilterChange: (selected: string[]) => void;
  onTagFilterChange: (selected: string[]) => void;
  onCampaignFilterChange: (selected: string[]) => void;
  onVerificationFilterChange: (selected: string[]) => void;
  onApply: () => void;
  onClearAll: () => void;
}

export default function LeadFilterModal({
  filterOptions,
  statusFilter,
  categoryFilter,
  tagFilter,
  campaignFilter,
  verificationFilter,
  onStatusFilterChange,
  onCategoryFilterChange,
  onTagFilterChange,
  onCampaignFilterChange,
  onVerificationFilterChange,
  onApply,
  onClearAll,
}: LeadFilterModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Temporary filter states for Apply/Cancel behavior
  const [tempStatusFilter, setTempStatusFilter] =
    useState<string[]>(statusFilter);
  const [tempCategoryFilter, setTempCategoryFilter] =
    useState<string[]>(categoryFilter);
  const [tempTagFilter, setTempTagFilter] = useState<string[]>(tagFilter);
  const [tempCampaignFilter, setTempCampaignFilter] =
    useState<string[]>(campaignFilter);
  const [tempVerificationFilter, setTempVerificationFilter] =
    useState<string[]>(verificationFilter);

  // Sync temp state when modal opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setTempStatusFilter(statusFilter);
      setTempCategoryFilter(categoryFilter);
      setTempTagFilter(tagFilter);
      setTempCampaignFilter(campaignFilter);
      setTempVerificationFilter(verificationFilter);
    }
    setIsOpen(open);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter.length > 0) count++;
    if (categoryFilter.length > 0) count++;
    if (tagFilter.length > 0) count++;
    if (campaignFilter.length > 0) count++;
    if (verificationFilter.length > 0) count++;
    return count;
  }, [
    statusFilter,
    categoryFilter,
    tagFilter,
    campaignFilter,
    verificationFilter,
  ]);

  const handleApply = () => {
    onStatusFilterChange(tempStatusFilter);
    onCategoryFilterChange(tempCategoryFilter);
    onTagFilterChange(tempTagFilter);
    onCampaignFilterChange(tempCampaignFilter);
    onVerificationFilterChange(tempVerificationFilter);
    onApply();
    setIsOpen(false);
  };

  const handleClearAll = () => {
    setTempStatusFilter([]);
    setTempCategoryFilter([]);
    setTempTagFilter([]);
    setTempCampaignFilter([]);
    setTempVerificationFilter([]);
  };

  const handleClearAllAndApply = () => {
    handleClearAll();
    onClearAll();
    setIsOpen(false);
  };

  const verificationOptions: MultiSelectOption[] = [
    { id: "safe", name: "Safe to send" },
    { id: "risky", name: "Risky" },
    { id: "unverified", name: "Unverified" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-main/10 hover:bg-brand-main/20 border border-brand-main/20 text-text-100 rounded-xl transition-all duration-200">
          <IconFilter size={18} />
          <span className="font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 text-xs font-bold bg-brand-main text-text-100 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="bg-bg-200 border border-brand-main/20 max-w-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-text-100 text-xl flex items-center gap-2">
            <IconFilter size={24} className="text-brand-main" />
            Filter Leads
          </DialogTitle>
          <DialogDescription className="text-text-200">
            Apply filters to narrow down your lead list
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Primary Filters - Tags and Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tag Filter */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Tags
                {tempTagFilter.length > 0 && (
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                    {tempTagFilter.length}
                  </span>
                )}
              </label>
              <MultiSelect
                options={filterOptions.tags}
                selectedIds={tempTagFilter}
                onChange={setTempTagFilter}
                placeholder="Select tags..."
                searchable
              />
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Categories
                {tempCategoryFilter.length > 0 && (
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                    {tempCategoryFilter.length}
                  </span>
                )}
              </label>
              <MultiSelect
                options={filterOptions.categories}
                selectedIds={tempCategoryFilter}
                onChange={setTempCategoryFilter}
                placeholder="Select categories..."
                searchable
              />
            </div>
          </div>

          {/* Secondary Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-brand-main/10">
            {/* Campaign Filter */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Campaigns
                {tempCampaignFilter.length > 0 && (
                  <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">
                    {tempCampaignFilter.length}
                  </span>
                )}
              </label>
              <MultiSelect
                options={filterOptions.campaigns}
                selectedIds={tempCampaignFilter}
                onChange={setTempCampaignFilter}
                placeholder="Select campaigns..."
                searchable
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Status
                {tempStatusFilter.length > 0 && (
                  <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                    {tempStatusFilter.length}
                  </span>
                )}
              </label>
              <MultiSelect
                options={filterOptions.statuses.map((s) => ({
                  id: s.value,
                  name: s.label,
                  count: s.count,
                }))}
                selectedIds={tempStatusFilter}
                onChange={setTempStatusFilter}
                placeholder="Select status..."
                searchable
              />
            </div>

            {/* Verification Filter */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-text-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Verification Status
                {tempVerificationFilter.length > 0 && (
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                    {tempVerificationFilter.length}
                  </span>
                )}
              </label>
              <MultiSelect
                options={verificationOptions}
                selectedIds={tempVerificationFilter}
                onChange={setTempVerificationFilter}
                placeholder="Select verification status..."
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-3 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClearAllAndApply}
            className="flex items-center gap-2 bg-transparent border-brand-main/20 text-text-100 hover:bg-brand-main/10"
          >
            <IconX size={16} />
            Clear All
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="bg-brand-main hover:bg-brand-main/80 text-text-100"
          >
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
