"use client";

import { format } from "date-fns";
import { PauseIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/AuthContext";
import { getBillingInfo } from "@/utils/api/billingClient";
import {
  cancelSubscription,
  getPaymentHistory,
  getSubscriptionStatus,
  pauseSubscription,
  PaymentHistoryRecord,
  resumeSubscription,
  SubscriptionStatus,
} from "@/utils/api/subscriptionClient";
import {
  IconAward,
  IconDownload,
  IconLoader,
  IconPlayerPlay,
  IconX,
} from "@tabler/icons-react";

interface BillingOverview {
  currentPlan: string;
  currentCredits: number;
  nextBillingDate: string;
  monthlyLimit: number;
  totalSpent: number;
}

const BillingSection = () => {
  const { state } = useAuthContext();
  const [billingData, setBillingData] = useState<BillingOverview | null>(null);
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionStatus | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryRecord[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const formatCurrency = (amount: number, currency: string = "INR") =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(
      amount
    );
  const formatCents = (cents: number, currency: string = "INR") =>
    formatCurrency(cents / 100, currency);

  const formatMaybeDate = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : format(d, "MMM dd, yyyy");
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    setIsLoading(true);
    try {
      const [billing, subscription, history] = await Promise.all([
        getBillingInfo(),
        getSubscriptionStatus(),
        getPaymentHistory(50, 0),
      ]);

      // Normalize billing data from backend
      let normalizedBilling = billing;
      if (billing && typeof billing === "object") {
        // Handle nested response envelopes
        if ((billing as any)?.data) {
          normalizedBilling = (billing as any).data;
        } else if ((billing as any)?.payload?.data) {
          normalizedBilling = (billing as any).payload.data;
        }
      }

      setBillingData(normalizedBilling as BillingOverview);
      setSubscriptionData(subscription);
      setPaymentHistory(history);
    } catch (error: any) {
      console.error("Billing fetch error:", error);
      toast.error(error?.message || "Failed to fetch billing data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async (cancelAtCycleEnd: boolean) => {
    setIsActionLoading(true);
    try {
      const result = await cancelSubscription(cancelAtCycleEnd, cancelReason);
      toast.success(result.message);
      setShowCancelModal(false);
      setCancelReason("");
      await fetchBillingData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to cancel subscription");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePauseSubscription = async () => {
    setIsActionLoading(true);
    try {
      const result = await pauseSubscription();
      toast.success(result.message);
      await fetchBillingData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to pause subscription");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResumeSubscription = async () => {
    setIsActionLoading(true);
    try {
      const result = await resumeSubscription();
      toast.success(result.message);
      await fetchBillingData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to resume subscription");
    } finally {
      setIsActionLoading(false);
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

  const getSubscriptionStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { color: string; label: string; icon: string }
    > = {
      active: {
        color: "bg-green-500/20 text-green-400",
        label: "Active",
        icon: "●",
      },
      paused: {
        color: "bg-yellow-500/20 text-yellow-400",
        label: "Paused",
        icon: "⏸",
      },
      cancelled: {
        color: "bg-red-500/20 text-red-400",
        label: "Cancelled",
        icon: "✕",
      },
      expired: {
        color: "bg-gray-500/20 text-gray-400",
        label: "Expired",
        icon: "○",
      },
      created: {
        color: "bg-blue-500/20 text-blue-400",
        label: "Created",
        icon: "◐",
      },
    };
    return (
      statusConfig[status] || {
        color: "bg-gray-500/20 text-gray-400",
        label: status,
        icon: "○",
      }
    );
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
      {/* Early Signup Bonus Badge */}
      {state.user?.foundingMember && (
        <div className="rounded-xl border-2 border-brand-main bg-gradient-to-r from-brand-main/10 to-brand-secondary/10 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <IconAward className="w-8 h-8 text-brand-main" />
            <div>
              <h3 className="text-xl font-bold text-text-100">
                🎉 Early Signup Bonus
              </h3>
              <p className="text-sm text-text-200">
                Early Adopter - Special Discounted Pricing
              </p>
            </div>
          </div>
          <div className="bg-bg-300/60 rounded-lg p-4 mt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-text-200 mb-1">
                  Your Discounted Price
                </p>
                <p className="text-3xl font-bold text-brand-main">
                  ₹
                  {((state.user.foundingTierLockedPrice || 0) / 100).toFixed(0)}
                  <span className="text-sm text-text-200 ml-2">/month</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-text-200 mb-1">Status</p>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  Active
                </span>
              </div>
            </div>
            <p className="text-xs text-text-200/70 mt-3">
              You're enjoying our Early Signup Bonus pricing. Thank you for
              being an early supporter! 🚀
            </p>
          </div>
        </div>
      )}

      {/* Subscription Status */}
      {subscriptionData && (
        <div>
          <h2 className="text-2xl font-bold text-text-100 mb-6">
            Subscription Status
          </h2>

          <div className="rounded-xl border border-brand-main/10 bg-bg-300/40 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-text-200 mb-1">Status</p>
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                      getSubscriptionStatusBadge(subscriptionData.status).color
                    }`}
                  >
                    <span>
                      {getSubscriptionStatusBadge(subscriptionData.status).icon}
                    </span>
                    {getSubscriptionStatusBadge(subscriptionData.status).label}
                  </span>
                </div>
                {subscriptionData.tier && (
                  <div className="ml-6">
                    <p className="text-sm text-text-200 mb-1">Current Plan</p>
                    <p className="text-lg font-bold text-brand-main">
                      {subscriptionData.tier.displayName}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {/* <div className="flex gap-2">
                {subscriptionData.status === "active" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handlePauseSubscription}
                      disabled={isActionLoading}
                      className="flex items-center gap-2"
                    >
                      <PauseIcon className="w-4 h-4" />
                      Pause
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowCancelModal(true)}
                      disabled={isActionLoading}
                      className="flex items-center gap-2"
                    >
                      <IconX className="w-4 h-4" />
                      Cancel
                    </Button>
                  </>
                )}
                {subscriptionData.status === "paused" && (
                  <Button
                    variant="default"
                    onClick={handleResumeSubscription}
                    disabled={isActionLoading}
                    className="flex items-center gap-2"
                  >
                    <IconPlayerPlay className="w-4 h-4" />
                    Resume
                  </Button>
                )}
              </div> */}
            </div>

            {/* Subscription Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-brand-main/10">
              {subscriptionData.nextBillingDate && (
                <div>
                  <p className="text-sm text-text-200 mb-1">
                    Next Billing Date
                  </p>
                  <p className="text-base font-medium text-text-100">
                    {formatMaybeDate(subscriptionData.nextBillingDate)}
                  </p>
                </div>
              )}
              {subscriptionData.activatedAt && (
                <div>
                  <p className="text-sm text-text-200 mb-1">Activated On</p>
                  <p className="text-base font-medium text-text-100">
                    {formatMaybeDate(subscriptionData.activatedAt)}
                  </p>
                </div>
              )}
              {subscriptionData.cancelAtCycleEnd && (
                <div>
                  <p className="text-sm text-text-200 mb-1">
                    Cancellation Scheduled
                  </p>
                  <p className="text-base font-medium text-red-400">
                    Will cancel on{" "}
                    {formatMaybeDate(
                      subscriptionData.nextBillingDate as string
                    )}
                  </p>
                </div>
              )}
              {subscriptionData.failedPaymentCount > 0 && (
                <div>
                  <p className="text-sm text-text-200 mb-1">Failed Payments</p>
                  <p className="text-base font-medium text-red-400">
                    {subscriptionData.failedPaymentCount} failed attempt(s)
                  </p>
                </div>
              )}
              {subscriptionData.gracePeriodEndsAt && (
                <div>
                  <p className="text-sm text-text-200 mb-1">
                    Grace Period Ends
                  </p>
                  <p className="text-base font-medium text-yellow-400">
                    {formatMaybeDate(subscriptionData.gracePeriodEndsAt)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Billing Overview */}
      {billingData && (
        <div>
          <h2 className="text-2xl font-bold text-text-100 mb-6">
            Billing Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-xl border border-brand-main/10 bg-bg-300/40 p-5 shadow-sm hover:shadow-md transition">
              <p className="text-text-200 text-sm mb-1">Current Plan</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-brand-main">
                  {billingData.currentPlan || "—"}
                </p>
                {state.user?.foundingMember && (
                  <IconAward className="w-5 h-5 text-brand-main" />
                )}
              </div>
            </div>

            <div className="rounded-xl border border-brand-main/10 bg-bg-300/40 p-5 shadow-sm hover:shadow-md transition">
              <p className="text-text-200 text-sm mb-1">Available Credits</p>
              <p className="text-2xl font-bold text-text-100">
                {typeof billingData.currentCredits === "number"
                  ? billingData.currentCredits
                  : "—"}
              </p>
            </div>

            <div className="rounded-xl border border-brand-main/10 bg-bg-300/40 p-5 shadow-sm hover:shadow-md transition">
              <p className="text-text-200 text-sm mb-1">Monthly Limit</p>
              <p className="text-2xl font-bold text-text-100">
                {typeof billingData.monthlyLimit === "number"
                  ? billingData.monthlyLimit.toLocaleString()
                  : "—"}
              </p>
            </div>

            {/* <div className="rounded-xl border border-brand-main/10 bg-bg-300/40 p-5 shadow-sm hover:shadow-md transition">
              <p className="text-text-200 text-sm mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-text-100">
                {formatCurrency(billingData.totalSpent)}
              </p>
            </div> */}
          </div>

          <div className="mt-4 p-4 bg-bg-300/40 border border-brand-main/10 rounded-xl">
            <p className="text-text-100 text-sm">
              <span className="font-medium">Next Billing Date:</span>{" "}
              {formatMaybeDate(subscriptionData?.nextBillingDate ?? "")}
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

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-200 border border-brand-main/20 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-text-100 mb-4">
              Cancel Subscription
            </h3>
            <p className="text-text-200 text-sm mb-4">
              Are you sure you want to cancel your subscription? You can choose
              to cancel immediately or at the end of your current billing cycle.
            </p>

            <div className="mb-4">
              <label className="block text-sm text-text-200 mb-2">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 bg-bg-300 border border-brand-main/20 rounded-lg text-text-100 text-sm focus:outline-none focus:border-brand-main"
                rows={3}
                placeholder="Let us know why you're cancelling..."
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                disabled={isActionLoading}
                className="flex-1"
              >
                Keep Subscription
              </Button>
              <Button
                variant="outline"
                onClick={() => handleCancelSubscription(true)}
                disabled={isActionLoading}
                className="flex-1"
              >
                {isActionLoading ? (
                  <IconLoader className="w-4 h-4 animate-spin" />
                ) : (
                  "Cancel at Cycle End"
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleCancelSubscription(false)}
                disabled={isActionLoading}
                className="flex-1"
              >
                {isActionLoading ? (
                  <IconLoader className="w-4 h-4 animate-spin" />
                ) : (
                  "Cancel Now"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingSection;
