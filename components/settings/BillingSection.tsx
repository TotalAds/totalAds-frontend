"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { getBillingInfo, getPaymentHistory } from "@/utils/api/billingClient";
import { IconDownload, IconLoader } from "@tabler/icons-react";

interface BillingOverview {
  currentPlan: string;
  currentCredits: number;
  nextBillingDate: string;
  monthlyLimit: number;
  totalSpent: number;
}

interface PaymentRecord {
  id: string;
  amount: number;
  status: string;
  paymentType: string;
  description: string;
  createdAt: string;
  paidAt?: string;
}

const BillingSection = () => {
  const [billingData, setBillingData] = useState<BillingOverview | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatCurrency = (amount: number, currency: string = "INR") =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(
      amount
    );
  const formatCents = (cents: number, currency: string = "INR") =>
    formatCurrency(cents / 100, currency);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    setIsLoading(true);
    try {
      const [billing, history] = await Promise.all([
        getBillingInfo(),
        getPaymentHistory(1, 50),
      ]);
      // Normalize envelopes from backend
      const normalizedBilling = (billing as any)?.data ?? billing;
      const rawHistory = history as any;
      const historyArray = Array.isArray(rawHistory?.data)
        ? rawHistory.data
        : Array.isArray(rawHistory?.payload?.data)
        ? rawHistory.payload.data
        : Array.isArray(rawHistory)
        ? rawHistory
        : [];
      setBillingData(normalizedBilling);
      setPaymentHistory(historyArray);
    } catch (error: any) {
      toast.error(error?.message || "Failed to fetch billing data");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      succeeded: "bg-green-500/20 text-green-400",
      pending: "bg-yellow-500/20 text-yellow-400",
      failed: "bg-red-500/20 text-red-400",
      refunded: "bg-blue-500/20 text-blue-400",
    };
    return statusStyles[status] || "bg-gray-500/20 text-gray-400";
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <IconLoader className="w-6 h-6 animate-spin mx-auto text-brand-main" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Billing Overview */}
      {billingData && (
        <div>
          <h2 className="text-2xl font-bold text-text-100 mb-6">
            Billing Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-xl border border-brand-main/10 bg-bg-300/40 p-5 shadow-sm hover:shadow-md transition">
              <p className="text-text-200 text-sm mb-1">Current Plan</p>
              <p className="text-2xl font-bold text-brand-main">
                {billingData.currentPlan}
              </p>
            </div>

            <div className="rounded-xl border border-brand-main/10 bg-bg-300/40 p-5 shadow-sm hover:shadow-md transition">
              <p className="text-text-200 text-sm mb-1">Available Credits</p>
              <p className="text-2xl font-bold text-text-100">
                {billingData.currentCredits}
              </p>
            </div>

            <div className="rounded-xl border border-brand-main/10 bg-bg-300/40 p-5 shadow-sm hover:shadow-md transition">
              <p className="text-text-200 text-sm mb-1">Monthly Limit</p>
              <p className="text-2xl font-bold text-text-100">
                {billingData.monthlyLimit}
              </p>
            </div>

            <div className="rounded-xl border border-brand-main/10 bg-bg-300/40 p-5 shadow-sm hover:shadow-md transition">
              <p className="text-text-200 text-sm mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-text-100">
                {formatCurrency(billingData.totalSpent)}
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-bg-300/40 border border-brand-main/10 rounded-xl">
            <p className="text-text-100 text-sm">
              <span className="font-medium">Next Billing Date:</span>{" "}
              {format(new Date(billingData.nextBillingDate), "MMM dd, yyyy")}
            </p>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="border-t border-brand-main/20 pt-8">
        <h2 className="text-2xl font-bold text-text-100 mb-6">
          Payment History
        </h2>

        {paymentHistory.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-brand-main/20 rounded-xl bg-bg-300/40">
            <p className="text-text-200 text-sm">No payment history</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-brand-main/10 bg-bg-300/30">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-main/20">
                  <th className="text-left py-3 px-4 text-text-200 font-medium">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-text-200 font-medium">
                    Description
                  </th>
                  <th className="text-left py-3 px-4 text-text-200 font-medium">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-text-200 font-medium">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-text-200 font-medium">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory?.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-brand-main/10 hover:bg-bg-300/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-text-100">
                      {format(new Date(payment.createdAt), "MMM dd, yyyy")}
                    </td>
                    <td className="py-3 px-4 text-text-100">
                      {payment.description}
                    </td>
                    <td className="py-3 px-4 text-text-100 font-medium">
                      {formatCents(payment.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                          payment.status
                        )}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="outline" className="py-1 px-2 text-xs">
                        <IconDownload className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingSection;
