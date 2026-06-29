"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Check, Loader2, X } from "lucide-react";
import emailClient from "@/utils/api/emailClient";
import { openRazorpayCheckout } from "@/utils/social/razorpayCheckout";

interface PricingTier {
  id: string;
  name: string;
  displayName: string;
  description: string;
  monthlyPriceInPaise: number;
  originalPriceInPaise?: number | null;
  trialDurationDays?: number | null;
  monthlyEmailLimit: number;
  monthlyCredits: number;
  maxContacts?: number;
  volumeSendingEnabled: boolean;
  apiAccessEnabled: boolean;
  analyticsEnabled: boolean;
  customDomainEnabled: boolean;
  prioritySupportEnabled: boolean;
}

interface EmailCheckoutModalProps {
  tier: PricingTier | null;
  initialBillingCycle: "monthly" | "yearly";
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EmailCheckoutModal({
  tier,
  initialBillingCycle,
  open,
  onClose,
  onSuccess,
}: EmailCheckoutModalProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(initialBillingCycle);
  const [hasPromo, setHasPromo] = useState<boolean | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoValid, setPromoValid] = useState<{
    valid: boolean;
    message?: string;
    promo?: {
      discountType: "free_months" | "percentage" | "flat" | "bogo";
      discountValue: number | null;
      freeMonths: number;
    };
  } | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      setBillingCycle(initialBillingCycle);
      setHasPromo(null);
      setPromoCode("");
      setPromoValid(null);
      setProcessing(false);
    }
  }, [open, initialBillingCycle]);

  if (!open || !tier) return null;

  // Calculate base price
  const basePrice =
    billingCycle === "yearly"
      ? tier.monthlyPriceInPaise * 10 // 12 months for the price of 10
      : tier.monthlyPriceInPaise;

  const periodMonths = billingCycle === "yearly" ? 12 : 1;

  // Calculate discount and final price
  let discountAmount = 0;
  let finalPrice = basePrice;
  let isBogo = false;
  let isFreeTrial = false;

  if (hasPromo && promoValid?.valid && promoValid.promo) {
    const promo = promoValid.promo;
    if (promo.discountType === "percentage") {
      discountAmount = Math.round(basePrice * (promo.discountValue ?? 0) / 100);
      finalPrice = basePrice - discountAmount;
    } else if (promo.discountType === "flat") {
      discountAmount = Math.min(basePrice, promo.discountValue ?? 0);
      finalPrice = basePrice - discountAmount;
    } else if (promo.discountType === "bogo") {
      isBogo = true;
      // BOGO: Pays 1 month price, gets 2 months. 
      // Base price here would have been for 1 month, so price is just tier.monthlyPriceInPaise.
      finalPrice = tier.monthlyPriceInPaise;
      discountAmount = basePrice - finalPrice; // Difference is the discount
    } else if (promo.discountType === "free_months") {
      isFreeTrial = true;
      finalPrice = 0;
      discountAmount = basePrice;
    }
  }

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return;
    setValidatingPromo(true);
    try {
      const response = await emailClient.post("/api/payment/validate-coupon", {
        code: promoCode.trim().toUpperCase(),
        tierId: Number(tier.id),
        periodMonths,
      });

      const result = response.data.data;
      setPromoValid(result);

      if (result.valid) {
        toast.success(result.message || "Promo code applied");
      } else {
        toast.error(result.message || "Invalid promo code");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Could not validate promo code");
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleCheckout = async () => {
    if (processing) return;
    setProcessing(true);

    try {
      const codeToSend = hasPromo && promoValid?.valid ? promoCode.trim().toUpperCase() : undefined;
      const orderResponse = await emailClient.post("/api/payment/create-order", {
        tierId: tier.id,
        promoCode: codeToSend,
        billingCycle,
      });

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.error || "Failed to initiate checkout");
      }

      const orderData = orderResponse.data.data;

      // Check if immediate free activation happened
      if (orderData.freeTier || orderData.promoApplied) {
        toast.success(
          orderData.promoApplied
            ? `Promo applied — ${orderData.freeMonths} month(s) activated!`
            : "Subscription activated successfully!"
        );
        onClose();
        onSuccess?.();
        return;
      }

      if (!orderData.orderId || !orderData.key) {
        throw new Error("Checkout could not be started — missing order details");
      }

      // Close checkout modal before Razorpay opens
      onClose();

      await openRazorpayCheckout({
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        orderId: orderData.orderId,
        name: "LeadSniper Email Service",
        description: `Subscribe to ${tier.displayName} (${billingCycle})`,
        email: orderData.email,
        prefillName: orderData.name,
        onSuccess: async (response) => {
          try {
            const verifyResponse = await emailClient.post("/api/payment/verify-payment", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              tierId: tier.id,
            });

            if (verifyResponse.data.success) {
              toast.success("Payment successful! Subscription updated.");
              onSuccess?.();
            } else {
              toast.error("Payment verification failed");
            }
          } catch (verifyErr: any) {
            console.error(verifyErr);
            toast.error("Payment verification failed");
          }
        },
        onDismiss: () => {
          toast("Payment cancelled", { icon: "ℹ️" });
        },
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Checkout failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-bg-200 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-text-200 hover:bg-white/5 hover:text-text-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="border-b border-white/5 pb-5">
          <span className="text-xs font-bold uppercase tracking-wide text-primary-100">
            LeadSniper Checkout
          </span>
          <h2 className="mt-1 text-2xl font-bold text-text-100">
            Subscribe to {tier.displayName}
          </h2>
          <p className="mt-1 text-sm text-text-200">
            Unlock premium lead outreach & deliverability tools
          </p>
        </div>

        {/* Cycle Toggle inside checkout */}
        <div className="py-4">
          <label className="block text-sm font-medium text-text-200 mb-2">
            Choose Billing Period
          </label>
          <div className="grid grid-cols-2 gap-2 bg-bg-100 p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => {
                setBillingCycle("monthly");
                setPromoValid(null);
              }}
              className={`rounded-lg py-2 text-sm font-semibold transition-all ${
                billingCycle === "monthly"
                  ? "bg-primary-100 text-white shadow-lg"
                  : "text-text-200 hover:text-text-100 hover:bg-white/5"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => {
                setBillingCycle("yearly");
                setPromoValid(null);
              }}
              className={`rounded-lg py-2 text-sm font-semibold transition-all ${
                billingCycle === "yearly"
                  ? "bg-primary-100 text-white shadow-lg"
                  : "text-text-200 hover:text-text-100 hover:bg-white/5"
              }`}
            >
              Yearly (2 Months Free)
            </button>
          </div>
        </div>

        {/* Promo code Section */}
        <div className="space-y-4 py-4">
          {hasPromo === null && (
            <div className="rounded-xl border border-white/5 bg-bg-300/50 p-4">
              <p className="text-sm font-semibold text-text-100">
                Do you have a promo code?
              </p>
              <p className="mt-1 text-xs text-text-200">
                Apply percentage discounts, cash-off, BOGO, or free trial months.
              </p>
              <div className="mt-3.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setHasPromo(true)}
                  className="flex-1 rounded-lg border border-primary-100/40 bg-primary-100/10 px-3 py-2 text-xs font-semibold text-primary-100 hover:bg-primary-100/20 transition-all"
                >
                  Yes, apply code
                </button>
                <button
                  type="button"
                  onClick={() => setHasPromo(false)}
                  className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-text-200 hover:bg-white/5 transition-all"
                >
                  No, skip code
                </button>
              </div>
            </div>
          )}

          {hasPromo === true && (
            <div className="rounded-xl border border-white/5 bg-bg-300/50 p-4 space-y-3">
              <label className="block text-sm font-semibold text-text-100">
                Enter Promo Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    setPromoValid(null);
                  }}
                  placeholder="CODE"
                  className="flex-1 rounded-lg border border-white/10 bg-bg-100 px-3 py-2 text-sm font-mono text-text-100 placeholder:text-gray-600 focus:border-primary-100 focus:ring-1 focus:ring-primary-100"
                />
                <button
                  type="button"
                  disabled={validatingPromo || !promoCode.trim()}
                  onClick={handleValidatePromo}
                  className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-sm font-semibold text-text-100 hover:bg-white/10 disabled:opacity-50 transition-all"
                >
                  {validatingPromo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </button>
              </div>
              {promoValid && (
                <p
                  className={`text-xs ${
                    promoValid.valid ? "text-green-400 font-semibold" : "text-amber-500"
                  }`}
                >
                  {promoValid.valid
                    ? promoValid.message
                    : promoValid.message || "Invalid coupon code"}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setHasPromo(false);
                  setPromoCode("");
                  setPromoValid(null);
                }}
                className="text-xs text-text-200 hover:text-text-100 transition-colors"
              >
                Skip promo code
              </button>
            </div>
          )}
        </div>

        {/* Pricing breakdown */}
        <div className="border-t border-white/5 pt-4 space-y-2.5">
          <div className="flex justify-between text-sm text-text-200">
            <span>Base price ({billingCycle})</span>
            <span>₹{(basePrice / 100).toLocaleString()}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-400 font-medium">
              <span>Discount applied</span>
              <span>-₹{(discountAmount / 100).toLocaleString()}</span>
            </div>
          )}

          {isBogo && (
            <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 p-2.5 rounded-lg">
              🎉 <strong>BOGO Promo Applied:</strong> You will get 2 months of subscription plan for the price of 1 month.
            </div>
          )}

          <div className="flex justify-between text-base font-bold text-text-100 border-t border-white/5 pt-2.5">
            <span>Total amount due</span>
            <span>₹{(finalPrice / 100).toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-text-200 hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={
              processing ||
              (hasPromo === null) ||
              (hasPromo === true && promoCode.trim() !== "" && !promoValid?.valid)
            }
            onClick={handleCheckout}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary-100 hover:bg-primary-100/90 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary-100/20 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : finalPrice === 0 ? (
              "Activate Promo Plan"
            ) : (
              `Pay ₹${(finalPrice / 100).toLocaleString()}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
