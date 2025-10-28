"use client";

import React from "react";

import CreditBalance from "@/components/credits/CreditBalance";
import RazorpayPayment from "@/components/payment/RazorpayPayment";
import { cn } from "@/lib/utils";
import {
  IconCalendar,
  IconCheck,
  IconCreditCard,
  IconDownload,
  IconRocket,
  IconTrendingUp,
  IconX,
} from "@tabler/icons-react";

export interface BillingData {
  totalCalls: number;
  freeCalls: number;
  billableCalls: number;
  rate: number;
  totalAmount: number;
  month: string;
}

export interface UsageData {
  daily: any[];
  monthly: number;
}

export function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300",
        className
      )}
    >
      {children}
    </div>
  );
}

export function MonthSelectorCard({
  selectedMonth,
  onChange,
}: {
  selectedMonth: string;
  onChange: (value: string) => void;
}) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mr-4">
            <IconCalendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Select Month</h3>
            <p className="text-gray-300 text-sm">
              View usage for specific month
            </p>
          </div>
        </div>
        <div className="relative">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => onChange(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 hover:bg-white/15"
          />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
        </div>
      </div>
    </GlassCard>
  );
}

export function CreditBalanceSection({
  refreshKey,
  onPurchase,
  onRefresh,
}: {
  refreshKey: number;
  onPurchase: () => void;
  onRefresh: () => void;
}) {
  return (
    <GlassCard>
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mr-4">
            <IconCreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Credit Balance
            </h2>
            <p className="text-gray-300 text-sm">
              Manage your API credits and usage
            </p>
          </div>
        </div>
      </div>
      <CreditBalance
        key={refreshKey}
        onPurchaseClick={onPurchase}
        onRefresh={onRefresh}
        variant="glass"
      />
    </GlassCard>
  );
}

export function CurrentPlanCard({
  currentPlan,
  onUpgrade,
}: {
  currentPlan: "free" | "starter" | "pro";
  onUpgrade: () => void;
}) {
  return (
    <GlassCard>
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-4">
          {currentPlan === "free" ? (
            <IconTrendingUp className="w-6 h-6 text-white" />
          ) : (
            <IconRocket className="w-6 h-6 text-white" />
          )}
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-white">
            {currentPlan === "free"
              ? "Free Tier"
              : currentPlan === "starter"
              ? "Starter Plan"
              : "Pro Plan"}
          </h2>
          <p className="text-gray-300">
            {currentPlan === "free"
              ? "20 free API calls per month"
              : "Using purchased credits"}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
          <span className="text-gray-300 flex items-center">
            <IconCheck className="w-4 h-4 mr-2 text-green-400" /> Monthly Limit
          </span>
          <span className="text-white font-semibold">
            {currentPlan === "free" ? "20 API calls" : "Based on balance"}
          </span>
        </div>
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
          <span className="text-gray-300 flex items-center">
            <IconCreditCard className="w-4 h-4 mr-2 text-blue-400" /> Rate per
            credit
          </span>
          <span className="text-white font-semibold">
            {currentPlan === "free" ? "Free" : "$0.05"}
          </span>
        </div>
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
          <span className="text-gray-300 flex items-center">
            <IconTrendingUp className="w-4 h-4 mr-2 text-purple-400" /> Billing
          </span>
          <span className="text-white font-semibold">
            {currentPlan === "free" ? "No charges" : "Credit-based"}
          </span>
        </div>
      </div>

      {currentPlan === "free" && (
        <div className="mt-6 p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300">
          <div className="flex items-center mb-3">
            <IconRocket className="w-5 h-5 text-purple-400 mr-2" />
            <h4 className="text-white font-semibold">Need More Credits?</h4>
          </div>
          <p className="text-gray-300 text-sm mb-4">
            Purchase credits to continue using the API beyond your free tier.
            Pay only for what you use.
          </p>
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-300">
              <IconCheck className="w-4 h-4 text-green-400 mr-2" />
              <span>No monthly subscription</span>
            </div>
            <div className="flex items-center text-sm text-gray-300">
              <IconCheck className="w-4 h-4 text-green-400 mr-2" />
              <span>Pay per credit used</span>
            </div>
            <div className="flex items-center text-sm text-gray-300">
              <IconCheck className="w-4 h-4 text-green-400 mr-2" />
              <span>Credits never expire</span>
            </div>
          </div>
          <button
            onClick={onUpgrade}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Purchase Credits
          </button>
        </div>
      )}
    </GlassCard>
  );
}

export function UsageStatsCard({
  monthly,
  plan = "free",
  freeLimit = 20,
  creditsRemaining,
}: {
  monthly: number;
  plan?: "free" | "starter" | "pro";
  freeLimit?: number;
  creditsRemaining?: number | null;
}) {
  const isFree = plan === "free";
  const usedPct = isFree
    ? Math.min(Math.round(((monthly || 0) / freeLimit) * 100), 100)
    : undefined;

  return (
    <GlassCard>
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mr-4">
          <IconTrendingUp className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Usage Statistics
          </h2>
          <p className="text-gray-300 text-sm">Track your API consumption</p>
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-300 flex items-center">
              <IconTrendingUp className="w-4 h-4 mr-2 text-blue-400" /> Total
              API Calls
            </span>
            <span className="text-white font-semibold text-2xl">
              {monthly || 0}
            </span>
          </div>
          {isFree ? (
            <div className="relative">
              <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-4 rounded-full transition-all duration-500 ease-out relative"
                  style={{
                    width: `${Math.min(
                      ((monthly || 0) / freeLimit) * 100,
                      100
                    )}%`,
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-400 mt-2">
                <span>0</span>
                <span className="text-center">{usedPct}% used</span>
                <span>{freeLimit} (Free limit)</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-300 text-sm">
              No free cap on Pro. Usage is credit-based.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {isFree ? (
            <>
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                    <IconCheck className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-gray-300 text-sm font-medium">
                    Free Credits
                  </span>
                </div>
                <div className="flex items-baseline">
                  <span className="text-white font-bold text-2xl">
                    {Math.min(freeLimit, monthly || 0)}
                  </span>
                  <span className="text-gray-400 text-sm ml-1">
                    /{freeLimit}
                  </span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl p-4 border border-orange-500/20">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center mr-3">
                    <IconCreditCard className="w-4 h-4 text-orange-400" />
                  </div>
                  <span className="text-gray-300 text-sm font-medium">
                    Billable
                  </span>
                </div>
                <div className="flex items-baseline">
                  <span className="text-white font-bold text-2xl">
                    {Math.max(0, (monthly || 0) - freeLimit)}
                  </span>
                  <span className="text-gray-400 text-sm ml-1">credits</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-xl p-4 border border-emerald-500/20">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center mr-3">
                    <IconCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-gray-300 text-sm font-medium">
                    Credits Remaining
                  </span>
                </div>
                <div className="flex items-baseline">
                  <span className="text-white font-bold text-2xl">
                    {typeof creditsRemaining === "number"
                      ? creditsRemaining
                      : "-"}
                  </span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/20">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                    <IconTrendingUp className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-gray-300 text-sm font-medium">
                    Credits Used (This Month)
                  </span>
                </div>
                <div className="flex items-baseline">
                  <span className="text-white font-bold text-2xl">
                    {monthly || 0}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

export function BillingSummaryCard({
  data,
  onDownload,
  onPayNow,
  paymentLoading,
}: {
  data: BillingData | null;
  onDownload: () => void;
  onPayNow: () => void;
  paymentLoading: boolean;
}) {
  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mr-4">
            <IconCreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Billing Summary
            </h2>
            <p className="text-gray-300 text-sm">Monthly usage breakdown</p>
          </div>
        </div>
        <button
          onClick={onDownload}
          className="flex items-center px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 border border-white/20 hover:border-white/30"
        >
          <IconDownload className="w-4 h-4 mr-2 text-white" />
          <span className="text-white font-medium">Download Invoice</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatBox
          label="Total Calls"
          value={data?.totalCalls || 0}
          accent="text-blue-400"
          icon={<IconTrendingUp className="w-5 h-5 text-blue-400" />}
        />
        <StatBox
          label="Free Calls"
          value={data?.freeCalls || 0}
          accent="text-green-400"
          icon={<IconCheck className="w-5 h-5 text-green-400" />}
        />
        <StatBox
          label="Billable Calls"
          value={data?.billableCalls || 0}
          accent="text-orange-400"
          icon={<IconCreditCard className="w-5 h-5 text-orange-400" />}
        />
        <StatBox
          label="Total Amount"
          value={`$${data?.totalAmount?.toFixed(2) || "0.00"}`}
          accent="text-purple-400"
          icon={<IconCreditCard className="w-5 h-5 text-purple-400" />}
        />
      </div>

      {data && data.totalAmount > 0 && (
        <div className="mt-6 p-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl border border-orange-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center mr-4">
                <IconCreditCard className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-lg">
                  Payment Required
                </h4>
                <p className="text-gray-300 text-sm">
                  You have outstanding charges for this month.
                </p>
              </div>
            </div>
            <button
              onClick={onPayNow}
              disabled={paymentLoading}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-200"
            >
              {paymentLoading ? "Processing..." : "Pay Now"}
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

function StatBox({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
      <div className="flex items-center justify-center mb-2">
        {icon}
        <p className="text-gray-300 text-sm font-medium ml-2">{label}</p>
      </div>
      <p className={cn("font-bold text-3xl", accent ? accent : "text-white")}>
        {value}
      </p>
    </div>
  );
}

export function UsageSummaryCard({ usage }: { usage: UsageData }) {
  return (
    <GlassCard>
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mr-4">
          <IconTrendingUp className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Monthly Usage Summary
          </h2>
          <p className="text-gray-300 text-sm">
            Detailed breakdown of your API usage
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-white/10 to-white/5 rounded-xl border border-white/20">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center mr-4">
            <IconTrendingUp className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-lg">Total API Calls</p>
            <p className="text-gray-300 text-sm">
              This Month (
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
              )
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white font-bold text-3xl">{usage.monthly}</p>
          <p className="text-gray-300 text-sm">calls</p>
        </div>
      </div>
    </GlassCard>
  );
}

export function PaymentModal({
  open,
  onClose,
  onSuccess,
  onError,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (v: any) => void;
  onError: (err: string) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white">
              Purchase Credits
            </h2>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white transition-colors"
            >
              <IconX className="w-6 h-6" />
            </button>
          </div>
          <RazorpayPayment onSuccess={onSuccess} onError={onError} />
        </div>
      </div>
    </div>
  );
}
