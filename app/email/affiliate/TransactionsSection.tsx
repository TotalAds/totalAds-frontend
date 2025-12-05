"use client";

import { useEffect, useState } from "react";

import { getTransactions, Transaction } from "@/utils/api/affiliateClient";
import { IconArrowDown, IconArrowUp, IconClock } from "@tabler/icons-react";

export default function TransactionsSection() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPendingWithdrawal, setHasPendingWithdrawal] = useState(false);
  const [pendingWithdrawalAmount, setPendingWithdrawalAmount] = useState<
    string | undefined
  >();

  useEffect(() => {
    fetchTransactions();
  }, [page]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await getTransactions(page, 10);
      setTransactions(data.transactions);
      setTotalPages(data.pagination.totalPages);
      setHasPendingWithdrawal(data.hasPendingWithdrawal);
      setPendingWithdrawalAmount(data.pendingWithdrawalAmount);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-brand-main border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-text-200">No transactions yet.</p>
      </div>
    );
  }

  const getDescription = (tx: Transaction) => {
    if (tx.type === "commission") {
      return tx.referredUserEmail
        ? `Commission from ${tx.referredUserEmail}`
        : "Commission earned";
    }
    return `Withdrawal via ${
      tx.paymentMethod === "upi" ? "UPI" : "Bank Transfer"
    }`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
      case "processing":
        return "text-yellow-500";
      case "available":
      case "completed":
        return "text-green-500";
      case "failed":
      case "cancelled":
        return "text-red-500";
      case "withdrawn":
        return "text-blue-500";
      default:
        return "text-text-200";
    }
  };

  return (
    <div>
      {/* Pending Withdrawal Banner */}
      {hasPendingWithdrawal && pendingWithdrawalAmount && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-3">
          <IconClock className="w-5 h-5 text-yellow-500" />
          <div>
            <p className="text-yellow-500 font-medium">
              Pending Withdrawal: ₹{pendingWithdrawalAmount}
            </p>
            <p className="text-sm text-text-200">
              Your withdrawal request is being processed. This usually takes 2-3
              business days.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between p-4 bg-bg-300 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  tx.type === "commission"
                    ? "bg-green-500/20 text-green-500"
                    : "bg-blue-500/20 text-blue-500"
                }`}
              >
                {tx.type === "commission" ? (
                  <IconArrowDown className="w-4 h-4" />
                ) : (
                  <IconArrowUp className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="text-text-100 font-medium">
                  {getDescription(tx)}
                </p>
                <p className="text-sm text-text-200">
                  {formatDate(tx.createdAt)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={`font-medium ${
                  tx.type === "commission" ? "text-green-500" : "text-blue-500"
                }`}
              >
                {tx.type === "commission" ? "+" : "-"}₹{tx.amount}
              </p>
              <p className={`text-xs capitalize ${getStatusColor(tx.status)}`}>
                {tx.status}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-bg-300 rounded text-text-200 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-text-200 text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 bg-bg-300 rounded text-text-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
