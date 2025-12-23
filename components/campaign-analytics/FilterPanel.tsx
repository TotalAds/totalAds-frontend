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
          size="sm"
          className="relative border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 border-slate-200 bg-white p-4 shadow-lg"
        align="end"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-900">Filters</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onReset();
                setIsOpen(false);
              }}
              className="h-8 px-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            >
              <X className="mr-1 h-3 w-3" />
              Reset
            </Button>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Date Range</label>
            <Select
              value={filters.dateRange || "30d"}
              onValueChange={handleDateRangeChange}
            >
              <SelectTrigger className="border-slate-200 bg-white text-slate-900 hover:bg-slate-50">
                <Calendar className="mr-2 h-4 w-4 text-slate-500" />
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent className="border-slate-200 bg-white">
                <SelectItem value="7d" className="text-slate-900 hover:bg-slate-50">
                  Last 7 days
                </SelectItem>
                <SelectItem value="30d" className="text-slate-900 hover:bg-slate-50">
                  Last 30 days
                </SelectItem>
                <SelectItem value="custom" className="text-slate-900 hover:bg-slate-50">
                  Custom range
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {filters.dateRange === "custom" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, startDate: e.target.value })
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">End Date</label>
                <input
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, endDate: e.target.value })
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
          >
            Apply Filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
