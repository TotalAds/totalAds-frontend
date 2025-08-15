"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { useAuthContext } from "@/context/AuthContext";
import apiClient from "@/utils/api/apiClient";

declare global {
  interface Window {
    Paddle?: any;
  }
}

interface PaddlePrice {
  priceId: string;
  credits: number;
  name: string;
  currency: string;
  checkoutUrl: string;
}

interface CreditPricing {
  normalScrapingCredits: number;
  aiScrapingCredits: number;
  creditValue: number;
}

interface PaddlePaymentProps {
  onSuccess?: (creditBalance: any) => void;
  onError?: (error: string) => void;
  variant?: "light" | "glass";
}

const PaddlePayment: React.FC<PaddlePaymentProps> = ({
  onSuccess,
  onError,
  variant = "light",
}) => {
  const { state } = useAuthContext();
  const [prices, setPrices] = useState<PaddlePrice[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [pricing, setPricing] = useState<CreditPricing | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Load price packages
        const res = await apiClient.get("/paddle/prices");
        const wrapper = res.data?.payload ?? res.data;
        if (wrapper?.success && Array.isArray(wrapper?.data)) {
          setPrices(wrapper.data);
          setSelected(wrapper.data[0]?.priceId || "");
        }
        // Load credit pricing to show better messaging
        try {
          const pr = await apiClient.get("/credits/pricing");
          const prw = pr.data?.payload ?? pr.data;
          if (prw?.success && prw?.data) {
            setPricing(prw.data as CreditPricing);
          } else if (pr.data?.success && pr.data?.data) {
            setPricing(pr.data.data as CreditPricing);
          }
        } catch (e) {
          // non-fatal: pricing details missing
        }
      } catch (e) {
        onError?.("Failed to load prices");
      }
    })();
  }, [onError]);

  // Load Paddle.js SDK script
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ensureScript = () => {
      if (window.Paddle) return true;
      const script = document.createElement("script");
      script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
      script.async = true;
      script.onload = () => setSdkReady(true);
      script.onerror = () => setSdkReady(false);
      document.body.appendChild(script);
      return false;
    };
    const has = ensureScript();
    if (has) setSdkReady(true);
  }, []);

  // Initialize Paddle with client token when needed
  const initializePaddle = async (): Promise<boolean> => {
    try {
      if (!window.Paddle) return false;
      // fetch client token from backend
      const resp = await apiClient.get("/paddle/client-token");
      const data = resp.data?.payload ?? resp.data;
      const token = data?.token;
      const env = data?.env || process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox";
      if (!token) return false;
      try {
        window.Paddle?.Environment?.set(env);
      } catch {}
      window.Paddle.Initialize({ token });
      return true;
    } catch (e) {
      console.warn("Failed to init Paddle SDK", e);
      return false;
    }
  };

  const handleCheckout = async () => {
    if (!selected) {
      toast.error("Please select a package");
      return;
    }
    const current = prices.find((p) => p.priceId === selected);
    if (!current) {
      toast.error("Invalid package");
      return;
    }

    try {
      setLoading(true);
      const userId = state.user?.id;
      const resp = await apiClient.post("/paddle/create-checkout", {
        priceId: selected,
        userId,
      });
      const payload = resp.data?.payload;
      const url = payload?.data?.url || payload?.url || resp.data?.url;
      const transactionId =
        payload?.data?.transactionId ||
        payload?.transactionId ||
        resp.data?.transactionId;
      const ok = (resp.data?.success ?? payload?.success) === true;

      // Frontend fallback: if backend didn't return a URL but we have a prebuilt hosted checkout
      const fallbackUrl =
        !url && current?.checkoutUrl ? current.checkoutUrl : undefined;

      if (!ok && !fallbackUrl && !transactionId) {
        toast.error(
          payload?.error || resp.data?.error || "Failed to create checkout"
        );
        return;
      }
      const finalUrl = url || fallbackUrl;

      // Redirect only if it's a real Paddle checkout URL
      const isPaddleCheckoutUrl = (u?: string) => {
        if (!u) return false;
        try {
          const h = new URL(u).hostname;
          return (
            h.endsWith("pay.paddle.io") ||
            h.endsWith("sandbox-pay.paddle.io") ||
            u.includes("/checkout/")
          );
        } catch {
          return false;
        }
      };

      if (finalUrl && isPaddleCheckoutUrl(finalUrl)) {
        window.location.href = finalUrl as string;
        return;
      }

      // Overlay flow with client token
      if (sdkReady && transactionId) {
        const ready = await initializePaddle();
        if (ready && window.Paddle?.Checkout?.open) {
          try {
            window.Paddle.Checkout.open({ transactionId });
            return;
          } catch (err) {
            console.warn("Paddle SDK open failed for transactionId", err);
          }
        }
      }

      toast.error("Could not start checkout. Please contact support.");
    } catch (e) {
      console.error(e);
      onError?.("Failed to initiate checkout");
    } finally {
      setLoading(false);
    }
  };

  const isGlass = variant === "glass";
  const mostPopular = prices.reduce(
    (max, p) => (p.credits > max ? p.credits : max),
    0
  );
  const selectedPack = prices.find((p) => p.priceId === selected);
  const hitsNormal = pricing?.normalScrapingCredits
    ? Math.floor((selectedPack?.credits || 0) / pricing.normalScrapingCredits)
    : null;
  const hitsAI = pricing?.aiScrapingCredits
    ? Math.floor((selectedPack?.credits || 0) / pricing.aiScrapingCredits)
    : null;

  return (
    <div
      className={
        isGlass
          ? "bg-white/10 border border-white/20 rounded-2xl p-6"
          : "bg-white rounded-lg shadow-lg p-6"
      }
    >
      {/* Headline messaging */}
      <div className={isGlass ? "mb-4 text-gray-200" : "mb-4 text-gray-700"}>
        <p className="text-sm">
          No subscription. Pay only for what you use. Credits never expire.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {prices.map((p) => (
          <div
            key={p.priceId}
            className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selected === p.priceId
                ? isGlass
                  ? "border-purple-400/60 bg-purple-400/10"
                  : "border-blue-500 bg-blue-50"
                : isGlass
                ? "border-white/20 hover:border-white/30 bg-white/5"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setSelected(p.priceId)}
          >
            {p.credits === mostPopular && (
              <span
                className={
                  isGlass
                    ? "absolute -top-2 -right-2 bg-pink-500 text-white text-xs px-2 py-1 rounded"
                    : "absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded"
                }
              >
                Most popular
              </span>
            )}
            <div className="text-center">
              <h4
                className={
                  isGlass
                    ? "font-semibold text-white"
                    : "font-semibold text-gray-900"
                }
              >
                {p.name}
              </h4>
              <div
                className={
                  isGlass
                    ? "text-2xl font-bold text-pink-300 my-2"
                    : "text-2xl font-bold text-blue-600 my-2"
                }
              >
                {p.credits} Credits
              </div>

              {/* Show actual price */}
              <div
                className={
                  isGlass
                    ? "text-lg font-semibold text-white mb-2"
                    : "text-lg font-semibold text-gray-900 mb-2"
                }
              >
                ${p.credits === 100 ? "5" : p.credits === 500 ? "19" : "—"}
              </div>

              {pricing && (
                <div
                  className={
                    isGlass ? "text-xs text-gray-300" : "text-xs text-gray-600"
                  }
                >
                  ≈{" "}
                  {Math.floor(p.credits / (pricing.normalScrapingCredits || 1))}{" "}
                  normal hits
                  {pricing.aiScrapingCredits
                    ? ` • ≈ ${Math.floor(
                        p.credits / pricing.aiScrapingCredits
                      )} AI hits`
                    : ""}
                </div>
              )}
              <div
                className={
                  isGlass
                    ? "text-sm text-gray-300 mt-1 uppercase"
                    : "text-sm text-gray-500 mt-1 uppercase"
                }
              >
                {p.currency}
              </div>
            </div>
          </div>
        ))}
      </div>
      {!loading && prices.length === 0 && (
        <div
          className={
            isGlass ? "mb-4 text-sm text-red-300" : "mb-4 text-sm text-red-600"
          }
        >
          No credit packages are currently available. Please contact support.
        </div>
      )}

      {/* How credits work */}
      {pricing && (
        <div
          className={
            isGlass
              ? "mb-4 p-4 bg-white/5 border border-white/10 rounded-lg"
              : "mb-4 p-4 bg-gray-50 rounded-lg"
          }
        >
          <p
            className={
              isGlass
                ? "text-sm font-semibold text-white mb-2"
                : "text-sm font-semibold text-gray-900 mb-2"
            }
          >
            How credits work
          </p>
          <ul
            className={
              isGlass
                ? "text-sm text-gray-300 space-y-1"
                : "text-sm text-gray-700 space-y-1"
            }
          >
            <li>• Starter: $5 for 100 credits (5¢ per credit)</li>
            <li>• Pro: $19 for 500 credits (3.8¢ per credit) - Save 24%</li>
            {pricing && (
              <>
                <li>
                  • Normal scraping: {pricing.normalScrapingCredits} credits per
                  request
                </li>
                <li>
                  • AI-enhanced scraping: {pricing.aiScrapingCredits} credits
                  per request
                </li>
                {selectedPack && (
                  <li>
                    • Selected pack ≈ {hitsNormal ?? "—"} normal hits
                    {hitsAI ? ` or ≈ ${hitsAI} AI hits` : ""}
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading || prices.length === 0}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          loading || prices.length === 0
            ? isGlass
              ? "bg-white/10 text-white/40 cursor-not-allowed"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
            : isGlass
            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {loading ? "Processing..." : "Continue to Checkout"}
      </button>

      <div
        className={
          isGlass ? "mt-4 text-sm text-gray-300" : "mt-4 text-sm text-gray-600"
        }
      >
        <p>• Secure checkout powered by Paddle</p>
        <p>• Credits are added after payment confirmation (via webhook)</p>
        <p>• Taxes handled at checkout by Paddle; USD currency</p>
      </div>
    </div>
  );
};

export default PaddlePayment;
