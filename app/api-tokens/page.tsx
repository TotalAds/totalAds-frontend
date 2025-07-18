"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { useAuthContext } from "@/context/AuthContext";
import {
  ApiToken,
  createToken,
  deleteToken,
  listTokens,
} from "@/utils/api/tokenClient";
import {
  IconCopy,
  IconEye,
  IconEyeOff,
  IconKey,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";

export default function ApiTokensPage() {
  const { state } = useAuthContext();
  const { isAuthenticated, isLoading } = state;
  const router = useRouter();

  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTokens();
    }
  }, [isAuthenticated]);

  const loadTokens = async () => {
    try {
      setLoading(true);
      const tokenList = await listTokens();
      setTokens(tokenList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tokens");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) return;

    try {
      setCreating(true);
      const token = await createToken({ name: newTokenName.trim() });
      setNewToken(token.token || "");
      setTokens([token, ...tokens]);
      setNewTokenName("");
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create token");
    } finally {
      setCreating(false);
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
      await deleteToken(id);
      setTokens(tokens.filter((token) => token.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete token");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleTokenVisibility = (tokenId: string) => {
    const newVisible = new Set(visibleTokens);
    if (newVisible.has(tokenId)) {
      newVisible.delete(tokenId);
    } else {
      newVisible.add(tokenId);
    }
    setVisibleTokens(newVisible);
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
              Manage your API tokens to access the Leadsnipper scraper API.
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
          <div className="bg-white p-6 rounded-lg shadow-sm border border-bg-200 mb-6">
            <h2 className="text-xl font-semibold text-text mb-4">
              Create New Token
            </h2>
            <form onSubmit={handleCreateToken}>
              <div className="mb-4">
                <label
                  htmlFor="tokenName"
                  className="block text-sm font-medium text-text mb-2"
                >
                  Token Name
                </label>
                <input
                  type="text"
                  id="tokenName"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  placeholder="e.g., Production API, Development, Mobile App"
                  className="w-full px-3 py-2 border border-bg-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {creating ? "Creating..." : "Create Token"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-bg-200 text-text rounded-lg hover:bg-bg-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-bg-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-text mb-4">
              Your API Tokens
            </h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-text-200 mt-2">Loading tokens...</p>
              </div>
            ) : tokens.length === 0 ? (
              <div className="text-center py-8">
                <IconKey className="w-12 h-12 text-text-200 mx-auto mb-4" />
                <p className="text-text-200">No API tokens found</p>
                <p className="text-sm text-text-200 mt-1">
                  Create your first token to start using the API
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tokens?.length > 0 &&
                  tokens?.map((token) => (
                    <div
                      key={token.id}
                      className="border border-bg-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-text">
                            {token.name}
                          </h3>
                          <div className="flex items-center mt-1 space-x-4 text-sm text-text-200">
                            <span>
                              Created:{" "}
                              {new Date(token.createdAt).toLocaleDateString()}
                            </span>
                            {token.lastUsed && (
                              <span>
                                Last used:{" "}
                                {new Date(token.lastUsed).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {token.token && (
                            <div className="flex items-center mt-2">
                              <code className="text-sm font-mono bg-bg-100 px-2 py-1 rounded">
                                {visibleTokens.has(token.id)
                                  ? token.token
                                  : "••••••••••••••••"}
                              </code>
                              <button
                                onClick={() => toggleTokenVisibility(token.id)}
                                className="ml-2 p-1 hover:bg-bg-100 rounded"
                                title={
                                  visibleTokens.has(token.id)
                                    ? "Hide token"
                                    : "Show token"
                                }
                              >
                                {visibleTokens.has(token.id) ? (
                                  <IconEyeOff className="w-4 h-4" />
                                ) : (
                                  <IconEye className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => copyToClipboard(token.token!)}
                                className="ml-1 p-1 hover:bg-bg-100 rounded"
                                title="Copy to clipboard"
                              >
                                <IconCopy className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteToken(token.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete token"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* API Documentation */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-bg-200 p-6">
          <h2 className="text-xl font-semibold text-text mb-4">
            Using Your API Token
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-text mb-2">Authentication</h3>
              <p className="text-text-200 text-sm mb-2">
                Include your API token in the Authorization header:
              </p>
              <code className="block bg-bg-100 p-3 rounded text-sm font-mono">
                Authorization: Bearer YOUR_API_TOKEN
              </code>
            </div>

            <div>
              <h3 className="font-medium text-text mb-2">Example Request</h3>
              <code className="block bg-bg-100 p-3 rounded text-sm font-mono whitespace-pre">
                {`curl -X POST http://localhost:8001/api/scraper \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "enableAI": false
  }'`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
