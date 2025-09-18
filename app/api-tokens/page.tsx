"use client";

import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { useAuthContext } from "@/context/AuthContext";
import apiClient from "@/utils/api/apiClient";
import {
  ApiToken,
  createToken,
  deleteToken,
  listTokens,
} from "@/utils/api/tokenClient";
import {
  IconActivity,
  IconCalendar,
  IconCheck,
  IconCopy,
  IconKey,
  IconPlus,
  IconShieldCheck,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

export default function ApiTokensPage() {
  const { state } = useAuthContext();
  const { isAuthenticated, isLoading } = state;
  const router = useRouter();

  // Get API URL from environment variable
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [showNewTokenModal, setShowNewTokenModal] = useState(false);

  const [testingToken, setTestingToken] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { valid: boolean; message: string }>
  >({});

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const loadTokens = useCallback(async () => {
    try {
      setTokensLoading(true);
      setError(""); // Clear any previous errors
      const tokenList = await listTokens();
      console.log("Token list response:", tokenList);
      setTokens(tokenList.data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load tokens";
      console.error("Error loading tokens:", err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setTokensLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log("User is authenticated, loading tokens...");
      loadTokens();
    } else {
      console.log(
        "User not authenticated or still loading, isAuthenticated:",
        isAuthenticated,
        "isLoading:",
        isLoading
      );
    }
  }, [isAuthenticated, isLoading, loadTokens]);

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) return;

    try {
      setCreating(true);
      setError(""); // Clear any previous errors
      const token = await createToken({ name: newTokenName.trim() });

      console.log("Created token response:", token);
      console.log("Token value:", token.token);

      // Store the full token and show it to the user
      setNewToken(token.token || "");
      setShowNewTokenModal(true);

      // Add the new token to the list (it will show as masked when we reload)
      setTokens([token, ...tokens]);
      setNewTokenName("");
      setShowCreateForm(false);
      toast.success("API token created successfully!");

      // Reload tokens to get the updated list with masked tokens
      await loadTokens();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create token";
      console.error("Error creating token:", err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const testToken = async (tokenId: string, tokenValue: string) => {
    if (!tokenValue || tokenValue.trim().length === 0) {
      toast.error("Please provide a valid token to test");
      return;
    }

    try {
      setTestingToken(tokenId);
      const response = await apiClient.post("/api-management/validate-token", {
        token: tokenValue.trim(),
      });

      const result = {
        valid: response.data.valid,
        message: response.data.message,
      };

      setTestResults((prev) => ({
        ...prev,
        [tokenId]: result,
      }));

      if (result.valid) {
        toast.success("✅ Token is valid and active!");
      } else {
        toast.error(`❌ Token validation failed: ${result.message}`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to test token";
      setTestResults((prev) => ({
        ...prev,
        [tokenId]: {
          valid: false,
          message: errorMessage,
        },
      }));
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setTestingToken(null);
    }
  };

  const handleDeleteToken = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this token? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setError(""); // Clear any previous errors
      await deleteToken(id);
      setTokens(tokens.filter((token) => token.id !== id));
      toast.success("API token deleted successfully!");
      // Clear any test results for this token
      setTestResults((prev) => {
        const newResults = { ...prev };
        delete newResults[id];
        return newResults;
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete token";
      console.error("Error deleting token:", err);
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const copyToClipboard = async (
    text: string,
    allowMasked: boolean = false
  ) => {
    try {
      if (!text) {
        toast.error("No token to copy");
        return;
      }

      console.log("Copying token:", text, "allowMasked:", allowMasked);

      // Only check for masked tokens if not explicitly allowed
      if (!allowMasked && (text.startsWith("****") || text.includes("••••"))) {
        toast.error(
          "Cannot copy masked token. Full token is only available when first created."
        );
        return;
      }

      await navigator.clipboard.writeText(text);
      toast.success("Token copied to clipboard!");
    } catch (err) {
      console.error("Copy error:", err);
      toast.error("Failed to copy token to clipboard");
    }
  };

  // Simple copy function for new tokens that bypasses all checks
  const copyNewToken = async (token: string) => {
    try {
      if (!token) {
        toast.error("No token to copy");
        return;
      }

      console.log("Copying new token directly:", token);
      await navigator.clipboard.writeText(token);
      toast.success("Token copied to clipboard!");
    } catch (err) {
      console.error("Copy error:", err);
      toast.error("Failed to copy token to clipboard");
    }
  };

  const formatTokenDisplay = (token: string | undefined) => {
    if (!token) {
      return "••••••••••••••••••••••••••••••••";
    }
    // Handle backend format like "****e9c8"
    if (token.startsWith("****")) {
      return `ta_••••••••••••••••••••••••••${token.substring(4)}`;
    }
    // Handle full token format
    if (token.startsWith("ta_") && token.length > 8) {
      // Show first 4 chars after ta_ and last 4 chars
      const prefix = token.substring(0, 7); // ta_ + 4 chars
      const suffix = token.substring(token.length - 4);
      return `${prefix}••••••••••••••••••••••••${suffix}`;
    }
    return token;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading API tokens...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">API Tokens</h1>
            <p className="text-gray-300 text-lg">
              Manage your API tokens to access the Leadsnipperscraper API.
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all duration-200 transform hover:scale-105 font-semibold"
          >
            <IconPlus className="w-5 h-5 mr-2" />
            Create Token
          </button>
        </div>

        {error && (
          <div
            className="backdrop-blur-xl bg-red-500/20 border border-red-500/30 text-red-200 px-6 py-4 rounded-2xl mb-8 shadow-2xl"
            role="alert"
          >
            <div className="flex items-center justify-between">
              <p>{error}</p>
              <button
                onClick={() => setError("")}
                className="text-red-200 hover:text-white text-xl font-bold ml-4"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {newToken && (
          <div
            className="backdrop-blur-xl bg-green-500/20 border border-green-500/30 text-green-200 px-6 py-6 rounded-2xl mb-8 shadow-2xl"
            role="alert"
          >
            <div>
              <p className="font-bold text-xl mb-2">
                🎉 Token Created Successfully!
              </p>
              <p className="text-green-100 mb-4">
                Copy this token now - you won&apos;t be able to see it again:
              </p>
              <div className="flex items-center p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                <code className="flex-1 text-sm font-mono text-white break-all">
                  {newToken}
                </code>
                <button
                  onClick={() => copyToClipboard(newToken)}
                  className="ml-4 p-2 bg-green-500 hover:bg-green-600 rounded-xl transition-colors"
                  title="Copy to clipboard"
                >
                  <IconCopy className="w-5 h-5 text-white" />
                </button>
              </div>
              <button
                onClick={() => setNewToken(null)}
                className="mt-4 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-200 rounded-xl transition-colors border border-green-500/30"
              >
                I&apos;ve copied the token
              </button>
            </div>
          </div>
        )}

        {showCreateForm && (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <IconPlus className="w-6 h-6 mr-3 text-purple-400" />
              Create New API Token
            </h2>
            <form onSubmit={handleCreateToken}>
              <div className="mb-6">
                <label
                  htmlFor="tokenName"
                  className="block text-sm font-medium text-gray-300 mb-3"
                >
                  Token Name
                </label>
                <input
                  type="text"
                  id="tokenName"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  placeholder="e.g., Production API, Development, Mobile App"
                  className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all duration-200 transform hover:scale-105 font-semibold disabled:opacity-50 disabled:transform-none"
                >
                  {creating ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    "Create Token"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/20"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <IconKey className="w-6 h-6 mr-3 text-purple-400" />
              Your API Tokens
            </h2>

            {tokensLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-300 text-lg">Loading tokens...</p>
              </div>
            ) : tokens.length === 0 ? (
              <div className="text-center py-16">
                <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-12 max-w-md mx-auto">
                  <IconKey className="w-20 h-20 text-purple-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-4">
                    No API Tokens Yet
                  </h3>
                  <p className="text-gray-300 mb-8 leading-relaxed">
                    Create your first API token to start accessing
                    theLeadsnipper scraper API. Tokens allow you to authenticate
                    your applications and track usage.
                  </p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all duration-200 transform hover:scale-105 font-semibold text-lg shadow-lg"
                  >
                    <IconPlus className="w-6 h-6 mr-3" />
                    Create Your First Token
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {tokens?.length > 0 &&
                  tokens?.map((token) => (
                    <div
                      key={token.id}
                      className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-3">
                            <h3 className="text-xl font-semibold text-white mr-3">
                              {token.name}
                            </h3>
                            {testResults[token.id] && (
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  testResults[token.id].valid
                                    ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                    : "bg-red-500/20 text-red-300 border border-red-500/30"
                                }`}
                              >
                                {testResults[token.id].valid ? (
                                  <IconCheck className="w-3 h-3 mr-1" />
                                ) : (
                                  <IconX className="w-3 h-3 mr-1" />
                                )}
                                {testResults[token.id].valid
                                  ? "Valid"
                                  : "Invalid"}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-6 text-sm text-gray-300 mb-4">
                            <span className="flex items-center">
                              <IconCalendar className="w-4 h-4 mr-2 text-purple-400" />
                              Created:{" "}
                              {new Date(token.createdAt).toLocaleDateString()}
                            </span>
                            {token.lastUsedAt && (
                              <span className="flex items-center">
                                <IconActivity className="w-4 h-4 mr-2 text-green-400" />
                                Last used:{" "}
                                {new Date(
                                  token.lastUsedAt
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {/* Show token field (masked for existing tokens, full for new tokens) */}
                          <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  API Token
                                </label>
                                <code className="text-sm font-mono text-gray-300 break-all">
                                  {formatTokenDisplay(token.token)}
                                </code>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <button
                                  onClick={() =>
                                    copyToClipboard(token.token || "")
                                  }
                                  className="p-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl transition-colors"
                                  title="Copy token"
                                >
                                  <IconCopy className="w-4 h-4 text-purple-300" />
                                </button>
                                <button
                                  onClick={() => {
                                    // For masked tokens, prompt user to enter the full token
                                    if (
                                      !token.token ||
                                      token.token.startsWith("****") ||
                                      token.token.includes("••••")
                                    ) {
                                      const fullToken = prompt(
                                        `🔑 Test Token: ${token.name}\n\nEnter your full API token (starts with ta_):\n\nNote: This token is masked for security. You need the full token you saved when it was created.`
                                      );
                                      if (fullToken && fullToken.trim()) {
                                        testToken(token.id, fullToken.trim());
                                      }
                                    } else {
                                      // For new tokens, test directly
                                      testToken(token.id, token.token || "");
                                    }
                                  }}
                                  disabled={testingToken === token.id}
                                  className="p-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-xl transition-colors disabled:opacity-50"
                                  title="Test token"
                                >
                                  {testingToken === token.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-400 border-t-transparent"></div>
                                  ) : (
                                    <IconShieldCheck className="w-4 h-4 text-green-300" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteToken(token.id)}
                          className="p-3 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors border border-red-500/30 ml-4"
                          title="Delete token"
                        >
                          <IconTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* API Documentation */}
        <div className="mt-8 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <IconKey className="w-6 h-6 mr-3 text-blue-400" />
            API Documentation
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Authentication
              </h3>
              <p className="text-gray-300 mb-4">
                Include your API token in the Authorization header with Bearer
                authentication:
              </p>
              <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                <code className="text-sm font-mono text-green-300">
                  Authorization: Bearer YOUR_API_TOKEN
                </code>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Available Endpoints
              </h3>

              <div className="space-y-6">
                <div className="bg-black/20 rounded-xl p-6 border border-white/10">
                  <h4 className="text-white font-semibold mb-2">
                    POST /scraper
                  </h4>
                  <p className="text-gray-300 text-sm mb-4">
                    Scrape a website and extract data
                  </p>
                  <div className="bg-black/40 rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm font-mono text-gray-300 whitespace-pre">
                      {`curl -X POST ${apiUrl}/api/scraper \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "enableAI": true,
    "deepScrape": false,
    "maxPages": 1
  }'`}
                    </code>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Response Format
              </h3>
              <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                <code className="text-sm font-mono text-gray-300 whitespace-pre">
                  {`{
  "success": true,
  "data": {
    "url": "https://example.com",
    "title": "Example Website",
    "description": "Website description",
    "company_info": {
      "name": "Example Company",
      "industry": "Technology",
      "employees": "50-100"
    },
    "ai_summary": "AI-generated summary...",
    "structured_data": { ... }
  },
  "meta": {
    "requestId": "uuid",
    "aiEnhanced": true,
    "processingTime": 2500
  }
}`}
                </code>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Rate Limits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                  <h4 className="text-white font-medium mb-2">Free Tier</h4>
                  <p className="text-gray-300 text-sm">20 requests per month</p>
                </div>
                <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                  <h4 className="text-white font-medium mb-2">Pro Tier</h4>
                  <p className="text-gray-300 text-sm">Pay-per-call billing</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Token Modal */}
      {showNewTokenModal && newToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                🎉 Token Created Successfully!
              </h3>
              <button
                onClick={() => {
                  setShowNewTokenModal(false);
                  setNewToken(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <IconX size={20} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-300 text-sm mb-3">
                ⚠️ <strong>Important:</strong> This is the only time you&apos;ll
                see the full token. Copy it now and store it securely.
              </p>

              <div className="bg-gray-900 rounded-lg p-3 border border-gray-600">
                <div className="flex items-center justify-between">
                  <code className="text-green-400 text-sm break-all font-mono">
                    {newToken}
                  </code>
                  <button
                    onClick={() => copyNewToken(newToken)}
                    className="ml-2 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                    title="Copy token"
                  >
                    <IconCopy size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => copyNewToken(newToken)}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <IconCopy size={16} />
                Copy Token
              </button>
              <button
                onClick={() => {
                  setShowNewTokenModal(false);
                  setNewToken(null);
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                I&apos;ve Saved It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
