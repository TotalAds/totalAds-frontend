"use client";

import React, { useMemo, useState } from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconFilter,
  IconSearch,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface DataTableProps {
  data: Record<string, unknown>[];
  columns: Column[];
  pageSize?: number;
  searchable?: boolean;
  sortable?: boolean;
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
  maxHeight?: string;
}

export default function DataTable({
  data,
  columns,
  pageSize = 10,
  searchable = true,
  sortable = true,
  className = "",
  emptyMessage = "No data available",
  loading = false,
  maxHeight = "500px",
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((row) =>
      columns.some((column) => {
        const value = row[column.key];
        return String(value ?? "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key: string) => {
    if (!sortable) return;
    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === "asc"
          ? { key, direction: "desc" }
          : null;
      }
      return { key, direction: "asc" };
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (loading) {
    return (
      <div
        className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
      >
        <div className="p-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-main" />
          <p className="mt-4 text-sm text-slate-600">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {searchable && (
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:ring-brand-main"
            />
          </div>
        </div>
      )}

      <div className="overflow-auto" style={{ maxHeight }}>
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b border-slate-200 bg-slate-50 hover:bg-slate-50">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={`text-xs font-semibold uppercase tracking-wide text-slate-600 ${
                    column.sortable !== false && sortable
                      ? "cursor-pointer select-none hover:text-slate-900"
                      : ""
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{column.label}</span>
                    {column.sortable !== false && sortable && (
                      <>
                        {sortConfig?.key === column.key ? (
                          sortConfig.direction === "asc" ? (
                            <IconSortAscending className="h-3.5 w-3.5 text-brand-main" />
                          ) : (
                            <IconSortDescending className="h-3.5 w-3.5 text-brand-main" />
                          )
                        ) : (
                          <IconFilter className="h-3 w-3 text-slate-300" />
                        )}
                      </>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-12 text-center text-sm text-slate-500"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow
                  key={index}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50/80"
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className="py-3 text-sm text-slate-800"
                    >
                      {column.render ? (
                        column.render(row[column.key], row)
                      ) : (
                        <div
                          className="max-w-[240px] truncate"
                          title={String(row[column.key] ?? "")}
                        >
                          {String(row[column.key] ?? "")}
                        </div>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-3">
          <div className="text-sm text-slate-600">
            Showing {Math.min((currentPage - 1) * pageSize + 1, sortedData.length)}–
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="border-slate-200 text-slate-700"
            >
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm font-medium text-slate-700">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="border-slate-200 text-slate-700"
            >
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
