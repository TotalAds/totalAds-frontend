"use client";

import { ColDef, ICellRendererParams } from "ag-grid-community";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import AGGridWrapper from "@/components/common/AGGridWrapper";
import apiClient from "@/utils/api/apiClient";

type PaymentItem = {
  id: string | number;
  amount: number; // cents
  currency: string;
  status: string;
  paymentType: string;
  description?: string | null;
  creditsGranted?: number | null; // cents
  createdAt?: string | null;
  paidAt?: string | null;
  metadata?: Record<string, any> | null;
  paddleTransactionId?: string | null;
};

type PageResp = {
  success: boolean;
  data: PaymentItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const formatCents = (c?: number | null) =>
  typeof c === "number" ? (c / 100).toFixed(2) : "-";

export default function PaymentHistoryTable() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 10;

  const fetchPage = async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.get<PageResp>(
        `/billing/history?page=${p}&limit=${limit}`
      );
      const payload = (resp.data as any)?.data
        ? resp.data
        : (resp.data as any)?.payload;
      setItems(payload?.data || []);
      setTotalPages(payload?.pagination?.totalPages || 1);
    } catch (e: any) {
      setError(
        e?.response?.data?.error || e?.message || "Failed to load history"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const canPrev = useMemo(() => page > 1, [page]);
  const canNext = useMemo(() => page < totalPages, [page, totalPages]);

  // AG Grid Cell Renderers
  const StatusCellRenderer = useCallback(
    (params: ICellRendererParams<PaymentItem>) => {
      const item = params.data;
      if (!item) return null;
      const statusColors: Record<string, string> = {
        completed: "bg-green-500/20 text-green-400",
        pending: "bg-yellow-500/20 text-yellow-400",
        failed: "bg-red-500/20 text-red-400",
      };
      const colorClass =
        statusColors[item.status.toLowerCase()] ||
        "bg-gray-500/20 text-gray-400";
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colorClass}`}
        >
          {item.status}
        </span>
      );
    },
    []
  );

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<PaymentItem>[]>(
    () => [
      {
        headerName: "Date",
        flex: 1,
        minWidth: 120,
        valueGetter: (params) =>
          params.data?.paidAt || params.data?.createdAt || "-",
        cellClass: "text-text-200 text-sm",
        sortable: true,
        filter: "agDateColumnFilter",
        filterParams: {
          buttons: ["reset", "apply"],
          closeOnApply: true,
        },
      },
      {
        headerName: "Type",
        field: "paymentType",
        flex: 1,
        minWidth: 100,
        cellClass: "text-text-200 text-sm capitalize",
        sortable: true,
        filter: "agTextColumnFilter",
        filterParams: {
          buttons: ["reset", "apply"],
          closeOnApply: true,
          filterOptions: ["equals", "notEqual", "contains"],
          defaultOption: "equals",
        },
      },
      {
        headerName: "Status",
        field: "status",
        flex: 1,
        minWidth: 100,
        cellRenderer: StatusCellRenderer,
        sortable: true,
        filter: "agTextColumnFilter",
        filterParams: {
          buttons: ["reset", "apply"],
          closeOnApply: true,
          filterOptions: ["equals", "notEqual", "contains"],
          defaultOption: "equals",
        },
      },
      {
        headerName: "Amount (USD)",
        field: "amount",
        flex: 1,
        minWidth: 120,
        valueFormatter: (params) => formatCents(params.value),
        cellClass: "text-text-200 text-sm text-right",
        headerClass: "ag-right-aligned-header",
        sortable: true,
        filter: "agNumberColumnFilter",
        filterParams: {
          buttons: ["reset", "apply"],
          closeOnApply: true,
        },
      },
      {
        headerName: "Credits",
        field: "creditsGranted",
        flex: 1,
        minWidth: 100,
        valueFormatter: (params) => formatCents(params.value),
        cellClass: "text-text-200 text-sm text-right",
        headerClass: "ag-right-aligned-header",
        sortable: true,
        filter: "agNumberColumnFilter",
        filterParams: {
          buttons: ["reset", "apply"],
          closeOnApply: true,
        },
      },
      {
        headerName: "Description",
        field: "description",
        flex: 1.5,
        minWidth: 150,
        valueFormatter: (params) => params.value || "-",
        cellClass: "text-text-200 text-sm",
        sortable: false,
        filter: "agTextColumnFilter",
        filterParams: {
          buttons: ["reset", "apply"],
          closeOnApply: true,
        },
      },
      {
        headerName: "Txn ID",
        flex: 1.5,
        minWidth: 150,
        valueGetter: (params) => {
          const item = params.data;
          if (!item) return "-";
          if (item.paddleTransactionId) return item.paddleTransactionId;
          if (item.metadata && (item.metadata as any).transactionId)
            return (item.metadata as any).transactionId;
          return "-";
        },
        cellClass: "text-text-200 text-sm",
        sortable: false,
        filter: "agTextColumnFilter",
        filterParams: {
          buttons: ["reset", "apply"],
          closeOnApply: true,
        },
      },
    ],
    [StatusCellRenderer]
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-text-100">Payment History</h2>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded bg-brand-main/10 hover:bg-brand-main/20 text-text-100 disabled:opacity-50 transition"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!canPrev || loading}
          >
            Prev
          </button>
          <span className="text-sm text-text-200">
            Page {page} / {totalPages}
          </span>
          <button
            className="px-3 py-1 rounded bg-brand-main/10 hover:bg-brand-main/20 text-text-100 disabled:opacity-50 transition"
            onClick={() => setPage((p) => p + 1)}
            disabled={!canNext || loading}
          >
            Next
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 mb-3 rounded bg-red-500/10 text-red-400 text-sm border border-red-500/20">
          {error}
        </div>
      )}

      <AGGridWrapper<PaymentItem>
        rowData={items}
        columnDefs={columnDefs}
        loading={loading}
        height={400}
        emptyMessage="No payments yet"
        getRowId={(params) => String(params.data.id)}
        showPagination={true}
        serverSidePagination={false}
        pageSize={10}
        pageSizeOptions={[10, 25, 50]}
      />
    </div>
  );
}
