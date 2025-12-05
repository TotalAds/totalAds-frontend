"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { useAuthContext } from "@/context/AuthContext";
import {
  AffiliateDashboardResponse,
  getAffiliateDashboard,
  requestWithdrawal,
  updatePaymentDetails,
} from "@/utils/api/affiliateClient";
import {
  IconCheck,
  IconClock,
  IconCopy,
  IconCurrencyRupee,
  IconLink,
  IconUsers,
  IconWallet,
} from "@tabler/icons-react";

import PaymentDetailsModal from "./PaymentDetailsModal";
import ReferralsTable from "./ReferralsTable";
import TransactionsSection from "./TransactionsSection";
import WithdrawModal from "./WithdrawModal";

export default function AffiliatePage() {
  const router = useRouter();
  const { state } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AffiliateDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboard = await getAffiliateDashboard();
      setData(dashboard);
    } catch (error: any) {
      console.error("Failed to fetch affiliate data:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to load affiliate data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!state.isLoading && !state.isAuthenticated) {
      router.push("/login");
      return;
    }
    if (state.isAuthenticated) {
      fetchData();
    }
  }, [state.isLoading, state.isAuthenticated, router, fetchData]);

  const copyToClipboard = async () => {
    if (!data?.referralLink) return;
    try {
      await navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleWithdraw = async (paymentMethod: "upi" | "bank") => {
    try {
      setWithdrawing(true);
      const result = await requestWithdrawal(paymentMethod);
      toast.success(result.message);
      setShowWithdrawModal(false);
      fetchData(); // Refresh data
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Withdrawal failed");
    } finally {
      setWithdrawing(false);
    }
  };

  const handlePaymentUpdate = async (formData: any) => {
    try {
      await updatePaymentDetails(formData);
      toast.success("Payment details updated!");
      setShowPaymentModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to update payment details"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-main border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-200">Loading affiliate dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-100">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <IconLink className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-text-100 mb-2">
            Unable to Load Affiliate Dashboard
          </h2>
          <p className="text-text-200 mb-4">
            {error || "Something went wrong. Please try again."}
          </p>
          <button
            onClick={fetchData}
            className="px-6 py-3 bg-brand-main hover:bg-brand-main/90 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const availableAmount = parseFloat(data.stats.availableBalance);
  const canWithdraw =
    availableAmount >= 100 && data.paymentDetails.hasPaymentDetails;

  return (
    <div className="min-h-screen bg-bg-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-100 mb-2">
            Affiliate Program
          </h1>
          <p className="text-text-200">
            Earn 30% commission on first payment from users you refer.
          </p>
        </div>

        {/* Referral Link Card */}
        <div className="backdrop-blur-xl bg-bg-200 border border-brand-main/20 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <IconLink className="w-6 h-6 text-brand-main" />
            <h2 className="text-xl font-semibold text-text-100">
              Your Referral Link
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              readOnly
              value={data.referralLink}
              className="flex-1 px-4 py-3 bg-bg-300 border border-brand-main/20 rounded-lg text-text-100 text-sm"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-3 bg-brand-main hover:bg-brand-main/90 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              {copied ? (
                <IconCheck className="w-5 h-5" />
              ) : (
                <IconCopy className="w-5 h-5" />
              )}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="mt-3 text-sm text-text-200">
            Share this link to earn commissions when users sign up and make
            their first payment.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<IconCurrencyRupee className="w-6 h-6" />}
            label="Total Earnings"
            value={`₹${data.stats.totalEarnings}`}
            color="text-green-500"
          />
          <StatCard
            icon={<IconWallet className="w-6 h-6" />}
            label="Available Balance"
            value={`₹${data.stats.availableBalance}`}
            color="text-brand-main"
            action={
              canWithdraw ? (
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="text-xs bg-brand-main/20 text-brand-main px-2 py-1 rounded"
                >
                  Withdraw
                </button>
              ) : null
            }
          />
          <StatCard
            icon={<IconClock className="w-6 h-6" />}
            label="Pending (30-day lock)"
            value={`₹${data.stats.pendingBalance}`}
            color="text-yellow-500"
          />
          <StatCard
            icon={<IconUsers className="w-6 h-6" />}
            label="Total Referrals"
            value={data.stats.totalReferrals.toString()}
            subValue={`${data.stats.successfulReferrals} converted`}
            color="text-blue-500"
          />
        </div>

        {/* Payment Details */}
        <div className="backdrop-blur-xl bg-bg-200 border border-brand-main/20 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text-100">
              Payment Details
            </h2>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-4 py-2 bg-brand-main/20 hover:bg-brand-main/30 text-brand-main rounded-lg text-sm transition-colors"
            >
              {data.paymentDetails.hasPaymentDetails ? "Update" : "Add"} Payment
              Details
            </button>
          </div>
          {data.paymentDetails.hasPaymentDetails ? (
            <div className="text-text-200">
              {data.paymentDetails.paymentMethod === "upi" ? (
                <p>UPI: {data.paymentDetails.upiId}</p>
              ) : (
                <>
                  <p>
                    Bank:{" "}
                    {data.paymentDetails.bankAccountNumber?.replace(
                      /\d(?=\d{4})/g,
                      "*"
                    )}
                  </p>
                  <p>IFSC: {data.paymentDetails.bankIfscCode}</p>
                  <p>Name: {data.paymentDetails.accountHolderName}</p>
                </>
              )}
            </div>
          ) : (
            <p className="text-text-200">
              Add your UPI ID or bank details to receive withdrawals.
            </p>
          )}
        </div>

        {/* Referrals Table */}
        <div className="backdrop-blur-xl bg-bg-200 border border-brand-main/20 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-text-100 mb-4">
            Your Referrals
          </h2>
          <ReferralsTable referrals={data.referredUsers} />
        </div>

        {/* Transactions */}
        <div className="backdrop-blur-xl bg-bg-200 border border-brand-main/20 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-text-100 mb-4">
            Transaction History
          </h2>
          <TransactionsSection />
        </div>
      </main>

      {/* Modals */}
      {showPaymentModal && (
        <PaymentDetailsModal
          currentDetails={data.paymentDetails}
          onClose={() => setShowPaymentModal(false)}
          onSubmit={handlePaymentUpdate}
        />
      )}

      {showWithdrawModal && (
        <WithdrawModal
          availableBalance={data.stats.availableBalance}
          paymentDetails={data.paymentDetails}
          onClose={() => setShowWithdrawModal(false)}
          onWithdraw={handleWithdraw}
          isLoading={withdrawing}
        />
      )}
    </div>
  );
}

// Stats Card Component
function StatCard({
  icon,
  label,
  value,
  subValue,
  color,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  color: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="backdrop-blur-xl bg-bg-200 border border-brand-main/20 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg bg-bg-300 ${color}`}>{icon}</div>
        {action}
      </div>
      <p className="text-sm text-text-200 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {subValue && <p className="text-xs text-text-200 mt-1">{subValue}</p>}
    </div>
  );
}
