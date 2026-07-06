"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Bitcoin, CreditCard, Loader2, Tag, X } from "lucide-react";
import emailClient from "@/utils/api/emailClient";
import { openRazorpayCheckout } from "@/utils/social/razorpayCheckout";
import {
  availablePaymentMethods,
  defaultPaymentMethod,
  formatInrFromPaise,
  formatUsdFromCents,
  inrPaiseToUsdCents,
  type DisplayCurrency,
} from "@/lib/currency";
import { useUserRegion } from "@/hooks/useUserRegion";

interface PricingTier {
  id: string;
  name: string;
  displayName: string;
  description: string;
  monthlyPriceInPaise: number;
  monthlyPriceUsdCents?: number | null;
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
  paymentMethod: "razorpay" | "cryptomus";
  onPaymentMethodChange: (method: "razorpay" | "cryptomus") => void;
}

export default function EmailCheckoutModal({
  tier,
  initialBillingCycle,
  open,
  onClose,
  onSuccess,
  paymentMethod,
  onPaymentMethodChange,
}: EmailCheckoutModalProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    initialBillingCycle,
  );
  const [showPromoInput, setShowPromoInput] = useState(false);
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
  const { isIndia: isIndiaUser } = useUserRegion();
  const displayCurrency: DisplayCurrency = isIndiaUser ? "INR" : "USD";

  useEffect(() => {
    onPaymentMethodChange(defaultPaymentMethod(isIndiaUser));
  }, [isIndiaUser, onPaymentMethodChange]);

  useEffect(() => {
    if (open) {
      setBillingCycle(initialBillingCycle);
      setShowPromoInput(false);
      setPromoCode("");
      setPromoValid(null);
      setProcessing(false);
      onPaymentMethodChange(defaultPaymentMethod(isIndiaUser));
    }
  }, [open, initialBillingCycle, onPaymentMethodChange, isIndiaUser]);

  if (!open || !tier) return null;

  const billingMultiplier = billingCycle === "yearly" ? 10 : 1;
  const periodMonths = billingCycle === "yearly" ? 12 : 1;

  const basePriceInr = tier.monthlyPriceInPaise * billingMultiplier;
  const basePriceUsd =
    tier.monthlyPriceUsdCents && tier.monthlyPriceUsdCents > 0
      ? tier.monthlyPriceUsdCents * billingMultiplier
      : inrPaiseToUsdCents(basePriceInr);

  let discountInr = 0;
  let discountUsd = 0;
  let finalPriceInr = basePriceInr;
  let finalPriceUsd = basePriceUsd;
  let isBogo = false;

  if (showPromoInput && promoValid?.valid && promoValid.promo) {
    const promo = promoValid.promo;
    if (promo.discountType === "percentage") {
      discountInr = Math.round(
        (basePriceInr * (promo.discountValue ?? 0)) / 100,
      );
      discountUsd = Math.round(
        (basePriceUsd * (promo.discountValue ?? 0)) / 100,
      );
      finalPriceInr = basePriceInr - discountInr;
      finalPriceUsd = basePriceUsd - discountUsd;
    } else if (promo.discountType === "flat") {
      discountInr = Math.min(basePriceInr, promo.discountValue ?? 0);
      discountUsd = Math.min(
        basePriceUsd,
        Math.round((promo.discountValue ?? 0) / 50),
      );
      finalPriceInr = basePriceInr - discountInr;
      finalPriceUsd = basePriceUsd - discountUsd;
    } else if (promo.discountType === "bogo") {
      isBogo = true;
      finalPriceInr = tier.monthlyPriceInPaise;
      finalPriceUsd =
        tier.monthlyPriceUsdCents && tier.monthlyPriceUsdCents > 0
          ? tier.monthlyPriceUsdCents
          : inrPaiseToUsdCents(tier.monthlyPriceInPaise);
      discountInr = basePriceInr - finalPriceInr;
      discountUsd = basePriceUsd - finalPriceUsd;
    } else if (promo.discountType === "free_months") {
      finalPriceInr = 0;
      finalPriceUsd = 0;
      discountInr = basePriceInr;
      discountUsd = basePriceUsd;
    }
  }

  const paysWithCryptocurrency = paymentMethod === "cryptomus";
  const activeCurrency: DisplayCurrency = paysWithCryptocurrency
    ? "USD"
    : displayCurrency;
  const finalMinor = activeCurrency === "USD" ? finalPriceUsd : finalPriceInr;
  const baseMinor = activeCurrency === "USD" ? basePriceUsd : basePriceInr;
  const discountMinor = activeCurrency === "USD" ? discountUsd : discountInr;

  const formatMinor = (amount: number) =>
    activeCurrency === "USD"
      ? formatUsdFromCents(amount)
      : formatInrFromPaise(amount);

  const paymentMethods = availablePaymentMethods(isIndiaUser);
  const promoBlocksCheckout =
    showPromoInput && promoCode.trim() !== "" && !promoValid?.valid;

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
    } catch (err: unknown) {
      console.error(err);
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Could not validate promo code";
      toast.error(message);
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleCheckout = async () => {
    if (processing) return;
    setProcessing(true);

    try {
      const codeToSend =
        showPromoInput && promoValid?.valid
          ? promoCode.trim().toUpperCase()
          : undefined;
      const orderResponse = await emailClient.post(
        "/api/payment/create-order",
        {
          tierId: tier.id,
          promoCode: codeToSend,
          billingCycle,
          paymentMethod,
        },
      );

      if (!orderResponse.data.success) {
        throw new Error(
          orderResponse.data.error || "Failed to initiate checkout",
        );
      }

      const orderData = orderResponse.data.data;

      if (orderData.freeTier || orderData.promoApplied) {
        toast.success(
          orderData.promoApplied
            ? `Promo applied — ${orderData.freeMonths} month(s) activated!`
            : "Subscription activated successfully!",
        );
        onClose();
        onSuccess?.();
        return;
      }

      if (orderData.provider === "cryptomus" && orderData.paymentUrl) {
        onClose();
        window.location.href = orderData.paymentUrl;
        return;
      }

      if (!orderData.orderId || !orderData.key) {
        throw new Error(
          "Checkout could not be started — missing order details",
        );
      }

      onClose();

      await openRazorpayCheckout({
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        orderId: orderData.orderId,
        name: "LeadSnipper Email Service",
        description: `Subscribe to ${tier.displayName} (${billingCycle})`,
        email: orderData.email,
        prefillName: orderData.name,
        onSuccess: async (response) => {
          try {
            const verifyResponse = await emailClient.post(
              "/api/payment/verify-payment",
              {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                tierId: tier.id,
              },
            );

            if (verifyResponse.data.success) {
              toast.success("Payment successful! Subscription updated.");
              onSuccess?.();
            } else {
              toast.error("Payment verification failed");
            }
          } catch (verifyErr: unknown) {
            console.error(verifyErr);
            toast.error("Payment verification failed");
          }
        },
        onDismiss: () => {
          toast("Payment cancelled", { icon: "ℹ️" });
        },
      });
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Checkout failed";
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const payButtonLabel = () => {
    if (processing) return null;
    if (finalMinor === 0) return "Activate plan";
    if (paysWithCryptocurrency) {
      return `Pay ${formatUsdFromCents(finalPriceUsd)} in cryptocurrency`;
    }
    return `Pay ${formatInrFromPaise(finalPriceInr)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-bg-200 shadow-2xl">
        {/* Header — fixed */}
        <div className="shrink-0 border-b border-white/5 px-4 py-3 sm:px-5 sm:py-4">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-text-200 hover:bg-white/5 hover:text-text-100"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary-100">
            Checkout
          </p>
          <h2 className="mt-0.5 text-lg font-bold text-text-100">
            {tier.displayName}
          </h2>
          <p className="mt-0.5 text-xs text-text-200 leading-relaxed">
            {isIndiaUser
              ? "Pay in rupees with Razorpay, or pay in cryptocurrency (USD)."
              : "Pay in cryptocurrency — billed in USD."}
          </p>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5 sm:py-4 space-y-3">
          {/* Payment method */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-text-200">
              How do you want to pay?
            </p>
            <div
              className={`grid gap-1.5 ${paymentMethods.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
            >
              {paymentMethods.includes("razorpay") && (
                <button
                  type="button"
                  onClick={() => onPaymentMethodChange("razorpay")}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-all ${
                    paymentMethod === "razorpay"
                      ? "border-primary-100 bg-primary-100/10 text-primary-100"
                      : "border-white/10 text-text-200 hover:bg-white/5"
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-xs font-semibold leading-tight">
                    Razorpay
                    <span className="block text-[10px] font-normal opacity-70">
                      Cards, UPI · ₹
                    </span>
                  </span>
                </button>
              )}
              {paymentMethods.includes("cryptomus") && (
                <button
                  type="button"
                  onClick={() => onPaymentMethodChange("cryptomus")}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-all ${
                    paymentMethod === "cryptomus"
                      ? "border-primary-100 bg-primary-100/10 text-primary-100"
                      : "border-white/10 text-text-200 hover:bg-white/5"
                  }`}
                >
                  <Bitcoin className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-xs font-semibold leading-tight">
                    Cryptocurrency
                    <span className="block text-[10px] font-normal opacity-70">
                      BTC, ETH, USDT · $
                    </span>
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Billing period */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-text-200">
              Billing period
            </p>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-bg-100 p-0.5 border border-white/5">
              <button
                type="button"
                onClick={() => {
                  setBillingCycle("monthly");
                  setPromoValid(null);
                }}
                className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-primary-100 text-white"
                    : "text-text-200 hover:text-text-100"
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
                className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
                  billingCycle === "yearly"
                    ? "bg-primary-100 text-white"
                    : "text-text-200 hover:text-text-100"
                }`}
              >
                Yearly · 2 mo free
              </button>
            </div>
          </div>

          {/* Promo — collapsed by default */}
          {!showPromoInput ? (
            <button
              type="button"
              onClick={() => setShowPromoInput(true)}
              className="flex items-center gap-1.5 text-xs text-text-200 hover:text-primary-100 transition-colors"
            >
              <Tag className="h-3 w-3" />
              Have a promo code?
            </button>
          ) : (
            <div className="rounded-lg border border-white/5 bg-bg-300/40 p-2.5 space-y-2">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    setPromoValid(null);
                  }}
                  placeholder="Promo code"
                  className="flex-1 rounded-md border border-white/10 bg-bg-100 px-2.5 py-1.5 text-xs font-mono text-text-100 placeholder:text-gray-600 focus:border-primary-100 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={validatingPromo || !promoCode.trim()}
                  onClick={handleValidatePromo}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-text-100 hover:bg-white/10 disabled:opacity-50"
                >
                  {validatingPromo ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </button>
              </div>
              {promoValid && (
                <p
                  className={`text-[11px] ${
                    promoValid.valid ? "text-green-400" : "text-amber-500"
                  }`}
                >
                  {promoValid.message ||
                    (promoValid.valid ? "Applied" : "Invalid code")}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowPromoInput(false);
                  setPromoCode("");
                  setPromoValid(null);
                }}
                className="text-[11px] text-text-200 hover:text-text-100"
              >
                Remove promo code
              </button>
            </div>
          )}

          {/* Price summary */}
          <div className="rounded-lg border border-white/5 bg-bg-300/30 p-2.5 space-y-1.5 text-xs">
            <div className="flex justify-between text-text-200">
              <span>Subtotal ({billingCycle})</span>
              <span>{formatMinor(baseMinor)}</span>
            </div>
            {discountMinor > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Discount</span>
                <span>-{formatMinor(discountMinor)}</span>
              </div>
            )}
            {isBogo && (
              <p className="text-[11px] text-green-400">
                2 months for the price of 1.
              </p>
            )}
            <div className="flex justify-between border-t border-white/5 pt-1.5 text-sm font-bold text-text-100">
              <span>Total</span>
              <span>{formatMinor(finalMinor)}</span>
            </div>
            <p className="text-[10px] text-text-200">
              {paysWithCryptocurrency
                ? "Charged in USD. You can pay with Bitcoin, Ethereum, or USDT."
                : "Charged in Indian rupees via Razorpay."}
            </p>
          </div>
        </div>

        {/* Footer — fixed */}
        <div className="shrink-0 flex gap-2 border-t border-white/5 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/10 py-2.5 text-xs font-semibold text-text-200 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={processing || promoBlocksCheckout}
            onClick={handleCheckout}
            className="flex-[1.4] flex items-center justify-center gap-1.5 rounded-lg bg-primary-100 py-2.5 text-xs font-bold text-white hover:bg-primary-100/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              payButtonLabel()
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
