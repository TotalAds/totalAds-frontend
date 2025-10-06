"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  IconChevronLeft, 
  IconChevronRight, 
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconFilter
} from "@tabler/icons-react";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
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
  maxHeight = "500px"
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter((row) =>
      columns.some((column) => {
        const value = row[column.key];
        return String(value || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
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
      <div className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl ${className}`}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-300 mx-auto"></div>
          <p className="text-white/70 mt-4">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl ${className}`}>
      {/* Header with Search */}
      {searchable && (
        <div className="p-4 border-b border-white/10 bg-white/5">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
            <Input
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-400"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto" style={{ maxHeight }}>
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b border-white/20 hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={`text-white/90 font-semibold bg-white/5 ${
                    column.sortable !== false && sortable ? "cursor-pointer hover:bg-white/10" : ""
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {column.sortable !== false && sortable && (
                      <div className="flex flex-col">
                        {sortConfig?.key === column.key ? (
                          sortConfig.direction === "asc" ? (
                            <IconSortAscending className="h-3 w-3 text-purple-300" />
                          ) : (
                            <IconSortDescending className="h-3 w-3 text-purple-300" />
                          )
                        ) : (
                          <IconFilter className="h-3 w-3 text-white/40" />
                        )}
                      </div>
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
                  className="text-center py-8 text-white/70"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow
                  key={index}
                  className="border-b border-white/10 hover:bg-white/5 transition-colors"
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className="text-white/90 py-3"
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : (
                          <div
                            className="truncate max-w-[200px]"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-white/10 bg-white/5 flex items-center justify-between">
          <div className="text-sm text-white/70">
            Showing {Math.min((currentPage - 1) * pageSize + 1, sortedData.length)} to{" "}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-white/90 px-3">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
