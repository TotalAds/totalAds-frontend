"use client";

import React, { useEffect, useMemo, useState } from "react";

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
      const payload = (resp.data as any)?.data ? resp.data : resp.data?.payload;
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

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Payment History</h2>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!canPrev || loading}
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">
            Page {page} / {totalPages}
          </span>
          <button
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
            onClick={() => setPage((p) => p + 1)}
            disabled={!canNext || loading}
          >
            Next
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 mb-3 rounded bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="overflow-auto rounded border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Amount (USD)</th>
              <th className="px-3 py-2 text-right">Credits</th>
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-left">Txn ID</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-4 text-center text-gray-500" colSpan={7}>
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-center text-gray-500" colSpan={7}>
                  No payments yet
                </td>
              </tr>
            ) : (
              items.map((it, idx) => (
                <tr key={(it.id as any) ?? idx} className="border-t">
                  <td className="px-3 py-2">
                    {it.paidAt || it.createdAt || "-"}
                  </td>
                  <td className="px-3 py-2 capitalize">{it.paymentType}</td>
                  <td className="px-3 py-2 capitalize">{it.status}</td>
                  <td className="px-3 py-2 text-right">
                    {formatCents(it.amount)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatCents(it.creditsGranted)}
                  </td>
                  <td className="px-3 py-2">{it.description || "-"}</td>
                  <td className="px-3 py-2">
                    {it?.paddleTransactionId
                      ? it.paddleTransactionId
                      : it?.metadata && (it.metadata as any).transactionId
                      ? (it.metadata as any).transactionId
                      : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
