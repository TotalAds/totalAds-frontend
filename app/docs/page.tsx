/* eslint-disable react/no-unescaped-entities */
"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

import { useAuthContext } from "@/context/AuthContext";
import { IconBook, IconCode, IconRocket } from "@tabler/icons-react";

export default function ApiDocs() {
  const { state } = useAuthContext();
  const { isAuthenticated, isLoading } = state;
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
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
          <h1 className="text-5xl font-bold text-white mb-4">API Docs 📖</h1>
          <p className="text-xl text-gray-300 mb-8">Learn how to use our API</p>
        </div>

        {/* Quick Start */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <IconRocket className="w-8 h-8 text-purple-400" />
            <h2 className="text-3xl font-bold text-white">Quick Start</h2>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-3">
                1. Get your API token
              </h3>
              <p className="text-gray-300">
                Go to API Keys page and create a new token
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-3">
                2. Make your first request
              </h3>
              <div className="bg-black/20 rounded-xl p-4 font-mono text-sm">
                <div className="text-green-400">
                  curl -H "Authorization: Bearer YOUR_TOKEN"
                </div>
                <div className="text-blue-400">
                  {" "}
                  https://api.leadsnipper.com/scrape
                </div>
                <div className="text-yellow-400">
                  {" "}
                  -d {'{"url": "https://example.com"}'}
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-3">
                3. Get results
              </h3>
              <p className="text-gray-300">
                Receive structured company data in JSON format
              </p>
            </div>
          </div>
        </div>

        {/* API Reference */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <IconCode className="w-8 h-8 text-blue-400" />
            <h2 className="text-3xl font-bold text-white">API Reference</h2>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-3">
                POST /scrape
              </h3>
              <p className="text-gray-300 mb-4">
                Extract company data from any website
              </p>
              <div className="bg-black/20 rounded-xl p-4">
                <h4 className="text-white font-medium mb-2">Request Body:</h4>
                <div className="font-mono text-sm text-gray-300">
                  <div>{"{"}</div>
                  <div className="ml-4">"url": "https://company.com",</div>
                  <div className="ml-4">"icpProfileId": 123 // optional</div>
                  <div>{"}"}</div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Response:</h4>
              <div className="bg-black/20 rounded-xl p-4 font-mono text-sm text-gray-300">
                <div>{"{"}</div>
                <div className="ml-4">"success": true,</div>
                <div className="ml-4">"data": {"{"}</div>
                <div className="ml-8">"company": "Example Corp",</div>
                <div className="ml-8">"industry": "Technology",</div>
                <div className="ml-8">"employees": "50-100",</div>
                <div className="ml-8">"email": "contact@example.com"</div>
                <div className="ml-4">{"}"}</div>
                <div>{"}"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <IconBook className="w-8 h-8 text-green-400" />
            <h2 className="text-3xl font-bold text-white">Need Help?</h2>
          </div>
          <div className="space-y-4 text-gray-300">
            <p>• Check your API token is correct</p>
            <p>• Make sure the URL is accessible</p>
            <p>• Contact support if you need assistance</p>
          </div>
        </div>
      </div>
    </div>
  );
}
