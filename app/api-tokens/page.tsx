"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { useAuthContext } from "@/context/AuthContext";
import {
  ApiToken,
  createToken,
  deleteToken,
  listTokens,
} from "@/utils/api/tokenClient";
import { IconCopy, IconKey, IconPlus, IconTrash } from "@tabler/icons-react";

export default function ApiTokensPage() {
  const { state } = useAuthContext();
  const { isAuthenticated, isLoading } = state;
  const router = useRouter();

  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTokens();
    }
  }, [isAuthenticated]);

  const fetchTokens = async () => {
    try {
      const data = await listTokens();
      setTokens(data.data || []);
    } catch (error) {
      console.error("Failed to fetch tokens:", error);
      toast.error("Failed to load API tokens");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async () => {
    if (!newTokenName.trim()) {
      toast.error("Please enter a token name");
      return;
    }

    setCreating(true);
    try {
      const token = await createToken({ name: newTokenName });
      setNewToken(token.token || null);
      setNewTokenName("");
      setShowCreateForm(false);
      await fetchTokens();
      toast.success("API token created successfully!");
    } catch (error) {
      console.error("Failed to create token:", error);
      toast.error("Failed to create API token");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteToken = async (id: string) => {
    try {
      await deleteToken(id);
      await fetchTokens();
      toast.success("API token deleted");
    } catch (error) {
      console.error("Failed to delete token:", error);
      toast.error("Failed to delete API token");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-white mb-2">Loading...</h3>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">API Keys 🔑</h1>
          <p className="text-xl text-gray-300 mb-8">
            Manage your API access tokens
          </p>
        </div>

        {/* Create Token Button */}
        <div className="text-center mb-12">
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg transform hover:scale-105"
          >
            <IconPlus className="w-5 h-5 mr-2" />
            Create New Token
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">
              Create API Token
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">
                  Token Name
                </label>
                <input
                  type="text"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Production API"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleCreateToken}
                  disabled={creating}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Token"}
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Token Display */}
        {newToken && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-3xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-green-400 mb-4">
              Token Created! 🎉
            </h3>
            <p className="text-white mb-4">
              Copy this token now - you won't be able to see it again!
            </p>
            <div className="flex items-center gap-4 p-4 bg-black/20 rounded-xl">
              <code className="flex-1 text-green-400 font-mono text-sm break-all">
                {newToken}
              </code>
              <button
                onClick={() => copyToClipboard(newToken)}
                className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-all duration-200"
              >
                <IconCopy className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => setNewToken(null)}
              className="mt-4 px-6 py-3 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-all duration-200"
            >
              Got it!
            </button>
          </div>
        )}

        {/* Tokens List */}
        {tokens.length > 0 ? (
          <div className="space-y-4">
            {tokens.map((token) => (
              <div
                key={token.id}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 hover:bg-white/15 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                      <IconKey className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">
                        {token.name}
                      </h3>
                      <p className="text-gray-300 text-sm">
                        Created {new Date(token.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="text-xs text-gray-400 font-mono bg-black/20 px-2 py-1 rounded">
                          {token.token
                            ? `${token.token.substring(
                                0,
                                8
                              )}...${token.token.substring(
                                token.token.length - 8
                              )}`
                            : "••••••••••••"}
                        </code>
                        {token.token && (
                          <button
                            onClick={() => copyToClipboard(token.token!)}
                            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all duration-200"
                            title="Copy token"
                          >
                            <IconCopy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteToken(token.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                  >
                    <IconTrash className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <IconKey className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              No API tokens yet
            </h3>
            <p className="text-gray-300 mb-8">
              Create your first API token to get started
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg transform hover:scale-105"
            >
              <IconPlus className="w-5 h-5 mr-2" />
              Create First Token
            </button>
          </div>
        )}

        {/* Simple Usage Guide */}
        <div className="mt-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6">How to use 📖</h3>
          <div className="space-y-4 text-gray-300">
            <p>1. Create an API token above</p>
            <p>2. Include it in your requests:</p>
            <div className="bg-black/20 rounded-xl p-4 font-mono text-sm">
              <div className="text-green-400">
                curl -X POST https://api.leadsnipper.com/scrape \
              </div>
              <div className="text-blue-400">
                {" "}
                -H "Authorization: Bearer YOUR_TOKEN" \
              </div>
              <div className="text-purple-400">
                {" "}
                -H "Content-Type: application/json" \
              </div>
              <div className="text-yellow-400"> -d '{"{"}</div>
              <div className="text-yellow-400">
                {" "}
                "url": "https://example-company.com",
              </div>
              <div className="text-yellow-400"> "icpProfileId": 123</div>
              <div className="text-yellow-400"> {"}"}'</div>
            </div>
            <p>3. Start scraping websites programmatically!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
