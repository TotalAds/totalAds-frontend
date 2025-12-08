"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { useAuthContext } from "@/context/AuthContext";
import {
  AffiliateDashboardResponse,
  AvailableReward,
  checkReferralRewards,
  CheckReferralRewardsResponse,
  getAffiliateDashboard,
  redeemReferralReward,
  requestWithdrawal,
  updatePaymentDetails,
} from "@/utils/api/affiliateClient";
import {
  IconCheck,
  IconClock,
  IconCopy,
  IconCurrencyRupee,
  IconGift,
  IconLink,
  IconStar,
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
  const [rewardsData, setRewardsData] = useState<CheckReferralRewardsResponse | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashboard, rewards] = await Promise.all([
        getAffiliateDashboard(),
        checkReferralRewards().catch(() => null), // Don't fail if rewards check fails
      ]);
      setData(dashboard);
      setRewardsData(rewards);
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

  const handleRedeemReward = async (reward: AvailableReward) => {
    try {
      setRedeeming(true);
      const result = await redeemReferralReward(
        reward.planTierName as "starter" | "business",
        reward.id || undefined
      );
      toast.success(result.message);
      fetchData(); // Refresh data
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to redeem reward"
      );
    } finally {
      setRedeeming(false);
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
            Earn 1 point for each referral signup + 20% commission when they make their first purchase. Redeem points for free plans!
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
          <StatCard
            icon={<IconStar className="w-6 h-6" />}
            label="Points"
            value={data.stats.points.toString()}
            subValue={`20 = Starter • 40 = Business`}
            color="text-purple-500"
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

        {/* Rewards Redemption Section */}
        <div className="backdrop-blur-xl bg-bg-200 border border-brand-main/20 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <IconGift className="w-6 h-6 text-brand-main" />
            <h2 className="text-xl font-semibold text-text-100">
              Redeem Free Plans
            </h2>
          </div>
          
          {/* How it works */}
          <div className="bg-bg-300/50 rounded-lg p-4 mb-6 border border-brand-main/10">
            <h3 className="font-semibold text-text-100 mb-2">How It Works</h3>
            <ul className="space-y-2 text-sm text-text-200">
              <li className="flex items-start gap-2">
                <IconCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong className="text-text-100">1 point</strong> = 1 referral signup</span>
              </li>
              <li className="flex items-start gap-2">
                <IconCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong className="text-text-100">20 points</strong> = Free Starter Plan (1 month)</span>
              </li>
              <li className="flex items-start gap-2">
                <IconCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong className="text-text-100">40 points</strong> = Free Business Plan (1 month)</span>
              </li>
              <li className="flex items-start gap-2">
                <IconCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong className="text-text-100">Bonus:</strong> Earn 20% commission when referrals make their first purchase</span>
              </li>
            </ul>
          </div>

          {/* Available Rewards */}
          {rewardsData && rewardsData.availableRewards.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-text-100 mb-3">Available Rewards</h3>
              {rewardsData.availableRewards.map((reward) => (
                <div
                  key={reward.id || reward.planTierName}
                  className="flex items-center justify-between p-5 bg-bg-300 rounded-lg border-2 border-brand-main/20 hover:border-brand-main/40 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-text-100">
                        {reward.planDisplayName} Plan
                      </h4>
                      <span className="px-2 py-1 bg-green-500/20 text-green-500 text-xs font-medium rounded">
                        {reward.pointsRequired} Points
                      </span>
                    </div>
                    <p className="text-sm text-text-200">
                      {reward.currentPoints >= reward.pointsRequired ? (
                        <span className="text-green-500 font-medium">✓ You have enough points!</span>
                      ) : (
                        <span>You need <strong className="text-text-100">{reward.pointsNeeded} more points</strong> to redeem</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRedeemReward(reward)}
                    disabled={!reward.canRedeem || redeeming}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      reward.canRedeem
                        ? "bg-brand-main hover:bg-brand-main/90 text-white shadow-lg shadow-brand-main/20"
                        : "bg-gray-500/20 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {redeeming ? "Redeeming..." : reward.canRedeem ? "Redeem Now" : "Not Enough Points"}
                  </button>
                </div>
              ))}
            </div>
          ) : rewardsData ? (
            <div className="text-center py-8 bg-bg-300/50 rounded-lg border border-brand-main/10">
              <IconGift className="w-12 h-12 text-text-200 mx-auto mb-3 opacity-50" />
              <p className="text-text-200 font-medium mb-1">
                {data.stats.points === 0 
                  ? "Start referring to earn points!"
                  : data.stats.points < 20
                  ? `You have ${data.stats.points} points. Need ${20 - data.stats.points} more for Starter plan.`
                  : data.stats.points < 40
                  ? `You have ${data.stats.points} points. Need ${40 - data.stats.points} more for Business plan.`
                  : "All rewards redeemed!"}
              </p>
              <p className="text-sm text-text-200 mt-2">
                Share your referral link to earn more points
              </p>
            </div>
          ) : null}

          {/* Redeemed Rewards */}
          {rewardsData && rewardsData.redeemedRewards.length > 0 && (
            <div className="mt-6 pt-6 border-t border-brand-main/10">
              <h3 className="font-semibold text-text-100 mb-3">Redeemed Rewards</h3>
              <div className="space-y-3">
                {rewardsData.redeemedRewards.map((reward) => (
                  <div
                    key={reward.id || reward.planTierName}
                    className="flex items-center justify-between p-4 bg-bg-300/50 rounded-lg border border-green-500/20"
                  >
                    <div>
                      <h4 className="font-semibold text-text-100">
                        {reward.planDisplayName} Plan
                      </h4>
                      <p className="text-sm text-text-200">
                        Redeemed {reward.redeemedAt ? new Date(reward.redeemedAt).toLocaleDateString() : "recently"}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-500/20 text-green-500 text-xs font-medium rounded">
                      Redeemed
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
