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

interface PaymentDetailsModalProps {
  currentDetails: PaymentDetails;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function PaymentDetailsModal({
  currentDetails,
  onClose,
  onSubmit,
}: PaymentDetailsModalProps) {
  const [method, setMethod] = useState<"upi" | "bank">(
    currentDetails.paymentMethod || "upi"
  );
  const [upiId, setUpiId] = useState(currentDetails.upiId || "");
  const [accountHolderName, setAccountHolderName] = useState(
    currentDetails.accountHolderName || ""
  );
  const [bankAccountNumber, setBankAccountNumber] = useState(
    currentDetails.bankAccountNumber || ""
  );
  const [bankIfscCode, setBankIfscCode] = useState(
    currentDetails.bankIfscCode || ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (method === "upi" && !upiId.trim()) {
      setError("Please enter your UPI ID");
      return;
    }

    if (method === "bank") {
      if (!accountHolderName.trim() || !bankAccountNumber.trim() || !bankIfscCode.trim()) {
        setError("Please fill all bank details");
        return;
      }
    }

    try {
      setLoading(true);
      await onSubmit({
        paymentMethod: method,
        upiId: method === "upi" ? upiId.trim() : undefined,
        accountHolderName: accountHolderName.trim() || undefined,
        bankAccountNumber: method === "bank" ? bankAccountNumber.trim() : undefined,
        bankIfscCode: method === "bank" ? bankIfscCode.trim().toUpperCase() : undefined,
      });
    } catch (err: any) {
      setError(err.message || "Failed to update payment details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-200 border border-brand-main/20 rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-brand-main/10">
          <h3 className="text-lg font-semibold text-text-100">Payment Details</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-bg-300 rounded-lg transition-colors"
          >
            <IconX className="w-5 h-5 text-text-200" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Payment Method Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMethod("upi")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                method === "upi"
                  ? "bg-brand-main text-white"
                  : "bg-bg-300 text-text-200 hover:text-text-100"
              }`}
            >
              UPI
            </button>
            <button
              type="button"
              onClick={() => setMethod("bank")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                method === "bank"
                  ? "bg-brand-main text-white"
                  : "bg-bg-300 text-text-200 hover:text-text-100"
              }`}
            >
              Bank Transfer
            </button>
          </div>

          {method === "upi" ? (
            <div>
              <label className="block text-sm text-text-200 mb-1">UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                className="w-full px-4 py-2 bg-bg-300 border border-brand-main/20 rounded-lg text-text-100"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm text-text-200 mb-1">Account Holder Name</label>
                <input type="text" value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="w-full px-4 py-2 bg-bg-300 border border-brand-main/20 rounded-lg text-text-100"
                />
              </div>
              <div>
                <label className="block text-sm text-text-200 mb-1">Account Number</label>
                <input type="text" value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  className="w-full px-4 py-2 bg-bg-300 border border-brand-main/20 rounded-lg text-text-100"
                />
              </div>
              <div>
                <label className="block text-sm text-text-200 mb-1">IFSC Code</label>
                <input type="text" value={bankIfscCode}
                  onChange={(e) => setBankIfscCode(e.target.value)}
                  className="w-full px-4 py-2 bg-bg-300 border border-brand-main/20 rounded-lg text-text-100 uppercase"
                />
              </div>
            </>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-main hover:bg-brand-main/90 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Payment Details"}
          </button>
        </form>
      </div>
    </div>
  );
}

