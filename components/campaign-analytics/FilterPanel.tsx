"use client";

import { Calendar, Filter, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnhancedAnalyticsFilters } from "@/utils/api/emailClient";

interface FilterPanelProps {
  filters: EnhancedAnalyticsFilters;
  onFiltersChange: (filters: EnhancedAnalyticsFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

export function FilterPanel({
  filters,
  onFiltersChange,
  onApply,
  onReset,
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateRangeChange = (value: string) => {
    if (value === "7d" || value === "30d") {
      onFiltersChange({
        ...filters,
        dateRange: value,
        startDate: undefined,
        endDate: undefined,
      });
    } else if (value === "custom") {
      onFiltersChange({
        ...filters,
        dateRange: "custom",
      });
    }
  };

  const activeFiltersCount = [
    filters.dateRange && filters.dateRange !== "30d" ? 1 : 0,
    filters.tagIds?.length ? 1 : 0,
    filters.categoryIds?.length ? 1 : 0,
    filters.status?.length ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="relative border-[#2a2a2d] bg-[#1a1a1d] text-[#fafafa] hover:bg-[#2a2a2d]"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#eb857a] text-xs font-medium text-white">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 border-[#2a2a2d] bg-[#1a1a1d] p-4"
        align="end"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-[#fafafa]">Filters</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onReset();
                setIsOpen(false);
              }}
              className="h-8 px-2 text-gray-400 hover:text-[#fafafa]"
            >
              <X className="mr-1 h-3 w-3" />
              Reset
            </Button>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Date Range</label>
            <Select
              value={filters.dateRange || "30d"}
              onValueChange={handleDateRangeChange}
            >
              <SelectTrigger className="border-[#2a2a2d] bg-[#131313] text-[#fafafa]">
                <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent className="border-[#2a2a2d] bg-[#1a1a1d]">
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {filters.dateRange === "custom" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, startDate: e.target.value })
                  }
                  className="w-full rounded-md border border-[#2a2a2d] bg-[#131313] px-3 py-2 text-sm text-[#fafafa]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">End Date</label>
                <input
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, endDate: e.target.value })
                  }
                  className="w-full rounded-md border border-[#2a2a2d] bg-[#131313] px-3 py-2 text-sm text-[#fafafa]"
                />
              </div>
            </div>
          )}

          {/* Apply Button */}
          <Button
            onClick={() => {
              onApply();
              setIsOpen(false);
            }}
            className="w-full bg-[#eb857a] text-white hover:bg-[#d9746a]"
          >
            Apply Filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
