"use client";

import React, { useState } from "react";

import { CreateTokenRequest } from "@/utils/api/tokenClient";

interface CreateTokenFormProps {
  onSubmit: (data: CreateTokenRequest) => void;
  isLoading: boolean;
}

const CreateTokenForm: React.FC<CreateTokenFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const [name, setName] = useState("");
  const [expiration, setExpiration] = useState<string>("never");
  const [customDays, setCustomDays] = useState<number>(30);
  const [errors, setErrors] = useState<{ name?: string; customDays?: string }>(
    {}
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: { name?: string; customDays?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Token name is required";
    }

    if (expiration === "custom" && (!customDays || customDays <= 0)) {
      newErrors.customDays = "Please enter a valid number of days";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear any previous errors
    setErrors({});

    // Calculate expiration days (null for 'never')
    const expireInDays =
      expiration === "never"
        ? null
        : expiration === "custom"
        ? customDays
        : parseInt(expiration, 10);

    onSubmit({
      name: name.trim(),
      expireIn: expireInDays,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="token-name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Token Name
        </label>
        <input
          id="token-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Production API, Development App"
          className={`w-full px-3 py-2 border rounded-md ${
            errors.name ? "border-red-500" : "border-gray-300"
          } focus:outline-none focus:ring-1 focus:ring-primary-500`}
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name}</p>
        )}
        <p className="text-gray-500 text-xs mt-1">
          Choose a descriptive name to help identify this token&apos;s purpose
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Token Expiration
        </label>

        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="radio"
              id="expire-never"
              name="expiration"
              value="never"
              checked={expiration === "never"}
              onChange={() => setExpiration("never")}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              disabled={isLoading}
            />
            <label
              htmlFor="expire-never"
              className="ml-2 text-sm text-gray-700"
            >
              Never expires
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="radio"
              id="expire-30"
              name="expiration"
              value="30"
              checked={expiration === "30"}
              onChange={() => setExpiration("30")}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              disabled={isLoading}
            />
            <label htmlFor="expire-30" className="ml-2 text-sm text-gray-700">
              30 days
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="radio"
              id="expire-90"
              name="expiration"
              value="90"
              checked={expiration === "90"}
              onChange={() => setExpiration("90")}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              disabled={isLoading}
            />
            <label htmlFor="expire-90" className="ml-2 text-sm text-gray-700">
              90 days
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="radio"
              id="expire-custom"
              name="expiration"
              value="custom"
              checked={expiration === "custom"}
              onChange={() => setExpiration("custom")}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              disabled={isLoading}
            />
            <label
              htmlFor="expire-custom"
              className="ml-2 text-sm text-gray-700"
            >
              Custom:
            </label>
            <div className="ml-2 flex items-center">
              <input
                type="number"
                value={customDays}
                onChange={(e) => setCustomDays(parseInt(e.target.value, 10))}
                className={`w-20 px-2 py-1 border rounded-md ${
                  errors.customDays ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-1 focus:ring-primary-500`}
                min="1"
                disabled={isLoading || expiration !== "custom"}
              />
              <span className="ml-2 text-sm text-gray-700">days</span>
            </div>
          </div>

          {errors.customDays && expiration === "custom" && (
            <p className="text-red-500 text-xs mt-1">{errors.customDays}</p>
          )}
        </div>

        <p className="text-gray-500 text-xs mt-2">
          For security, we recommend setting an expiration date for your tokens
        </p>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <span className="inline-block animate-spin mr-2">⟳</span>
              Creating...
            </>
          ) : (
            "Create Token"
          )}
        </button>
      </div>
    </form>
  );
};

export default CreateTokenForm;
