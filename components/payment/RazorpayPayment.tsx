"use client";

import React, { useState } from "react";
import { toast } from "react-hot-toast";

import apiClient from "../../utils/api/apiClient";

interface CreditPackage {
  credits: number;
  price: number;
  name: string;
}

interface RazorpayPaymentProps {
  onSuccess?: (creditBalance: any) => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RazorpayPayment: React.FC<RazorpayPaymentProps> = ({
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<Record<string, CreditPackage>>({});
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [razorpayConfig, setRazorpayConfig] = useState<any>(null);

  React.useEffect(() => {
    loadRazorpayScript();
    fetchPackages();
    fetchRazorpayConfig();
  }, []);

  const loadRazorpayScript = () => {
    if (window.Razorpay) return;

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  };

  const fetchPackages = async () => {
    try {
      console.log("Fetching packages...");
      const response = await apiClient.get("/razorpay/packages");
      console.log("Packages response:", response.data);
      if (response.data.success) {
        setPackages(response.data.packages);
        // Set default selection to BASIC package
        setSelectedPackage("BASIC");
        console.log("Packages loaded:", response.data.packages);
      } else {
        console.error("Failed to fetch packages:", response.data);
        toast.error("Failed to load credit packages");
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast.error(
        "Failed to load credit packages. Please try refreshing the page."
      );
    }
  };

  const fetchRazorpayConfig = async () => {
    try {
      console.log("Fetching Razorpay config...");
      const response = await apiClient.get("/razorpay/config");
      console.log("Razorpay config response:", response.data);
      if (response.data.success) {
        setRazorpayConfig(response.data);
        console.log("Razorpay config loaded:", response.data);
      } else {
        console.error("Failed to fetch Razorpay config:", response.data);
      }
    } catch (error) {
      console.error("Error fetching Razorpay config:", error);
      toast.error(
        "Failed to load payment configuration. Please try refreshing the page."
      );
    }
  };

  const handlePayment = async () => {
    if (!selectedPackage || !packages[selectedPackage]) {
      toast.error("Please select a credit package");
      return;
    }

    if (!window.Razorpay) {
      toast.error("Razorpay SDK not loaded. Please refresh the page.");
      return;
    }

    setLoading(true);

    try {
      // Create order
      const orderResponse = await apiClient.post("/razorpay/create-order", {
        packageType: selectedPackage,
      });

      if (!orderResponse.data.success) {
        throw new Error("Failed to create order");
      }

      const order = orderResponse.data.order;
      const packageInfo = packages[selectedPackage];

      // Configure Razorpay options
      const options = {
        key: razorpayConfig?.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "TotalAds",
        description: `Purchase ${packageInfo.name} - ${packageInfo.credits} credits`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await apiClient.post(
              "/razorpay/verify-payment",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                packageType: selectedPackage,
              }
            );

            if (verifyResponse.data.success) {
              toast.success(
                `Successfully purchased ${packageInfo.credits} credits!`
              );
              onSuccess?.(verifyResponse.data.creditBalance);
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error("Payment verification failed. Please contact support.");
            onError?.("Payment verification failed");
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#3B82F6",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initiate payment. Please try again.");
      onError?.("Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Package Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.keys(packages).length === 0 ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading credit packages...</p>
          </div>
        ) : (
          Object.entries(packages).map(([key, pkg]) => (
            <div
              key={key}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedPackage === key
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedPackage(key)}
            >
              <div className="text-center">
                <h4 className="font-semibold text-gray-900">{pkg.name}</h4>
                <div className="text-2xl font-bold text-blue-600 my-2">
                  {pkg.credits} Credits
                </div>
                <div className="text-lg text-gray-700">
                  ₹{(pkg.price / 100).toFixed(2)}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  ₹{(pkg.price / 100 / pkg.credits).toFixed(3)} per credit
                </div>
                {key === "PREMIUM" && (
                  <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-2">
                    Most Popular
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Selected Package Info */}
      {selectedPackage && packages[selectedPackage] && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Selected Package</h4>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">
              {packages[selectedPackage].name} -{" "}
              {packages[selectedPackage].credits} Credits
            </span>
            <span className="font-semibold text-gray-900">
              ₹{(packages[selectedPackage].price / 100).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={loading || !selectedPackage}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          loading || !selectedPackage
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processing...
          </div>
        ) : (
          `Pay ₹${
            selectedPackage && packages[selectedPackage]
              ? (packages[selectedPackage].price / 100).toFixed(2)
              : "0.00"
          }`
        )}
      </button>

      {/* Payment Info */}
      <div className="mt-4 text-sm text-gray-600">
        <p>• Secure payment powered by Razorpay</p>
        <p>• Credits are added instantly after successful payment</p>
        <p>• All major payment methods accepted</p>
      </div>
    </div>
  );
};

export default RazorpayPayment;
