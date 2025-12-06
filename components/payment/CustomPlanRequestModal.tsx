"use client";

import { X } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";

import emailClient from "@/utils/api/emailClient";

interface CustomPlanRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const budgetRanges = [
  "₹1,000 - ₹2,000/month",
  "₹2,000 - ₹5,000/month",
  "₹5,000 - ₹10,000/month",
  "₹10,000+/month",
];

export default function CustomPlanRequestModal({
  isOpen,
  onClose,
  onSuccess,
}: CustomPlanRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    expectedMonthlyEmails: "",
    expectedContacts: "",
    useCase: "",
    additionalRequirements: "",
    budgetRange: "",
    contactPhone: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.companyName ||
      !formData.expectedMonthlyEmails ||
      !formData.useCase ||
      !formData.budgetRange
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await emailClient.post("/custom-plan/request", {
        companyName: formData.companyName,
        expectedMonthlyEmails: parseInt(formData.expectedMonthlyEmails, 10),
        expectedContacts: parseInt(formData.expectedContacts, 10) || 0,
        useCase: formData.useCase,
        additionalRequirements: formData.additionalRequirements || undefined,
        budgetRange: formData.budgetRange,
        contactPhone: formData.contactPhone || undefined,
      });

      if (response.data.success) {
        toast.success(
          "Request submitted! We'll contact you within 24-48 hours."
        );
        onSuccess?.();
        onClose();
        setFormData({
          companyName: "",
          expectedMonthlyEmails: "",
          expectedContacts: "",
          useCase: "",
          additionalRequirements: "",
          budgetRange: "",
          contactPhone: "",
        });
      } else {
        toast.error(response.data.error || "Failed to submit request");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-bg-200 rounded-xl border border-brand-main/20 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-brand-main/10">
          <div>
            <h2 className="text-xl font-bold text-text-100">
              Request Custom Plan
            </h2>
            <p className="text-sm text-text-200 mt-1">
              Tell us about your needs and we&apos;ll create a custom plan for
              you
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-300 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-200" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-100 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-bg-100 border border-brand-main/20 rounded-lg text-text-100 
								focus:outline-none focus:border-primary-100"
              placeholder="Your company name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-100 mb-1">
                Monthly Emails <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="expectedMonthlyEmails"
                value={formData.expectedMonthlyEmails}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-bg-100 border border-brand-main/20 rounded-lg text-text-100 
									focus:outline-none focus:border-primary-100"
                placeholder="e.g., 50000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-100 mb-1">
                Contacts Needed
              </label>
              <input
                type="number"
                name="expectedContacts"
                value={formData.expectedContacts}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-bg-100 border border-brand-main/20 rounded-lg text-text-100 
									focus:outline-none focus:border-primary-100"
                placeholder="e.g., 20000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-100 mb-1">
              Budget Range <span className="text-red-500">*</span>
            </label>
            <select
              name="budgetRange"
              value={formData.budgetRange}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-bg-100 border border-brand-main/20 rounded-lg text-text-100
								focus:outline-none focus:border-primary-100"
            >
              <option value="">Select budget range</option>
              {budgetRanges.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-100 mb-1">
              Use Case <span className="text-red-500">*</span>
            </label>
            <textarea
              name="useCase"
              value={formData.useCase}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 bg-bg-100 border border-brand-main/20 rounded-lg text-text-100
								focus:outline-none focus:border-primary-100 resize-none"
              placeholder="Describe how you plan to use our email service..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-100 mb-1">
              Additional Requirements
            </label>
            <textarea
              name="additionalRequirements"
              value={formData.additionalRequirements}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 bg-bg-100 border border-brand-main/20 rounded-lg text-text-100
								focus:outline-none focus:border-primary-100 resize-none"
              placeholder="Any specific features or requirements..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-100 mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-bg-100 border border-brand-main/20 rounded-lg text-text-100
								focus:outline-none focus:border-primary-100"
              placeholder="+91 XXXXXXXXXX"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-brand-main/20 rounded-lg text-text-200
								hover:bg-bg-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-primary-100 text-white rounded-lg font-medium
								hover:bg-primary-100/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
