"use client";

import { useState } from "react";

import { IconX } from "@tabler/icons-react";

interface PaymentDetails {
  hasPaymentDetails: boolean;
  paymentMethod: "upi" | "bank" | null;
  upiId: string | null;
  bankAccountNumber: string | null;
  bankIfscCode: string | null;
  accountHolderName: string | null;
}

interface WithdrawModalProps {
  availableBalance: string;
  paymentDetails: PaymentDetails;
  onClose: () => void;
  onWithdraw: (method: "upi" | "bank") => Promise<void>;
  isLoading: boolean;
}

export default function WithdrawModal({
  availableBalance,
  paymentDetails,
  onClose,
  onWithdraw,
  isLoading,
}: WithdrawModalProps) {
  const [method, setMethod] = useState<"upi" | "bank">(
    paymentDetails.paymentMethod || "upi"
  );

  const hasUpi = !!paymentDetails.upiId;
  const hasBank =
    !!paymentDetails.bankAccountNumber &&
    !!paymentDetails.bankIfscCode &&
    !!paymentDetails.accountHolderName;

  const canProceed = method === "upi" ? hasUpi : hasBank;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-200 border border-brand-main/20 rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-brand-main/10">
          <h3 className="text-lg font-semibold text-text-100">
            Withdraw Funds
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-bg-300 rounded-lg transition-colors"
          >
            <IconX className="w-5 h-5 text-text-200" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="text-center py-4 bg-bg-300 rounded-lg">
            <p className="text-sm text-text-200">Available Balance</p>
            <p className="text-3xl font-bold text-brand-main">
              ₹{availableBalance}
            </p>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm text-text-200 mb-2">
              Withdraw To
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMethod("upi")}
                disabled={!hasUpi}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                  method === "upi"
                    ? "bg-brand-main text-white"
                    : "bg-bg-300 text-text-200 hover:text-text-100"
                } ${!hasUpi ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                UPI
                {hasUpi && (
                  <span className="block text-xs opacity-75">
                    {paymentDetails.upiId}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setMethod("bank")}
                disabled={!hasBank}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                  method === "bank"
                    ? "bg-brand-main text-white"
                    : "bg-bg-300 text-text-200 hover:text-text-100"
                } ${!hasBank ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Bank
                {hasBank && (
                  <span className="block text-xs opacity-75">
                    ****{paymentDetails.bankAccountNumber?.slice(-4)}
                  </span>
                )}
              </button>
            </div>
          </div>

          {!canProceed && (
            <p className="text-yellow-500 text-sm text-center">
              Please add {method === "upi" ? "UPI ID" : "bank details"} in
              payment settings first.
            </p>
          )}

          <div className="text-xs text-text-200 bg-bg-300 p-3 rounded-lg space-y-1">
            <p>• Minimum withdrawal: ₹100</p>
            <p>• Processing time: 2-3 business days</p>
            <p>• Our team will manually process your withdrawal</p>
            <p>• You will receive an email once processed</p>
          </div>

          <button
            onClick={() => onWithdraw(method)}
            disabled={isLoading || !canProceed}
            className="w-full py-3 bg-brand-main hover:bg-brand-main/90 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {isLoading
              ? "Submitting..."
              : `Request Withdrawal of ₹${availableBalance}`}
          </button>
        </div>
      </div>
    </div>
  );
}
