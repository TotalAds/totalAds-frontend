"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { useAuthContext } from "@/context/AuthContext";
import {
  IconBook,
  IconCheck,
  IconCode,
  IconCopy,
  IconExternalLink,
  IconKey,
  IconRocket,
} from "@tabler/icons-react";

export default function ApiDocs() {
  const { state } = useAuthContext();
  const { isAuthenticated, isLoading } = state;
  const router = useRouter();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    curl: `curl -X POST https://api.leadsnipper.com/api/scraper \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "enableAI": false
  }'`,
    javascript: `const response = await fetch('https://api.leadsnipper.com/api/scraper', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://example.com',
    enableAI: false
  })
});

const data = await response.json();
console.log(data);`,
    python: `import requests

url = "https://api.leadsnipper.com/api/scraper"
headers = {
    "Authorization": "Bearer YOUR_API_TOKEN",
    "Content-Type": "application/json"
}
data = {
    "url": "https://example.com",
    "enableAI": False
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(result)`,
    node: `const axios = require('axios');

const scrapeWebsite = async () => {
  try {
    const response = await axios.post('https://api.leadsnipper.com/api/scraper', {
      url: 'https://example.com',
      enableAI: false
    }, {
      headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
      }
    });

    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

scrapeWebsite();`,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
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
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            API Documentation
          </h1>
          <p className="text-gray-300 text-lg">
            Learn how to integrate Leadsnipper scraping API into your
            applications.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl sticky top-8">
              <h3 className="text-xl font-semibold text-white mb-4">
                Quick Links
              </h3>
              <div className="space-y-3">
                <a
                  href="#getting-started"
                  className="flex items-center p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
                >
                  <IconRocket className="w-5 h-5 mr-3" />
                  Getting Started
                </a>
                <a
                  href="#authentication"
                  className="flex items-center p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
                >
                  <IconKey className="w-5 h-5 mr-3" />
                  Authentication
                </a>
                <a
                  href="#endpoints"
                  className="flex items-center p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
                >
                  <IconCode className="w-5 h-5 mr-3" />
                  API Endpoints
                </a>
                <a
                  href="#examples"
                  className="flex items-center p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
                >
                  <IconBook className="w-5 h-5 mr-3" />
                  Code Examples
                </a>
                <a
                  href={`${
                    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
                  }/api-docs`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-colors text-white"
                >
                  <IconExternalLink className="w-5 h-5 mr-3" />
                  Interactive Docs
                </a>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Getting Started */}
            <section
              id="getting-started"
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-semibold text-white mb-6">
                Getting Started
              </h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  The Leadsnipper API allows you to scrape websites
                  programmatically. Our API provides both basic scraping and
                  AI-enhanced data extraction.
                </p>
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <h4 className="text-white font-semibold mb-2">Base URL</h4>
                  <code className="text-purple-300">
                    {process.env.NEXT_PUBLIC_API_URL ||
                      "https://api.leadsnipper.com"}
                  </code>
                </div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <h4 className="text-white font-semibold mb-2">Pricing</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Free tier: 10 API calls per month</li>
                    <li>Pro tier: $0.05 per API call after free tier</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Authentication */}
            <section
              id="authentication"
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-semibold text-white mb-6">
                Authentication
              </h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  All API requests require authentication using an API token.
                  Include your token in the Authorization header as a Bearer
                  token.
                </p>
                <div className="bg-slate-800 rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold">
                      Authorization Header
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          "Authorization: Bearer YOUR_API_TOKEN",
                          "auth-header"
                        )
                      }
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      {copiedCode === "auth-header" ? (
                        <IconCheck className="w-4 h-4 text-green-400" />
                      ) : (
                        <IconCopy className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>
                  <code className="text-purple-300">
                    Authorization: Bearer YOUR_API_TOKEN
                  </code>
                </div>
                <p>
                  You can create and manage your API tokens in the{" "}
                  <a
                    href="/api-tokens"
                    className="text-purple-300 hover:text-purple-200"
                  >
                    API Tokens
                  </a>{" "}
                  section.
                </p>
              </div>
            </section>

            {/* API Endpoints */}
            <section
              id="endpoints"
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-semibold text-white mb-6">
                API Endpoints
              </h2>
              <div className="space-y-6">
                <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                  <div className="flex items-center mb-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-semibold mr-3">
                      POST
                    </span>
                    <code className="text-purple-300">/api/scraper</code>
                  </div>
                  <p className="text-gray-300 mb-4">
                    Scrape a website and extract data.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-white font-semibold mb-2">
                        Request Body
                      </h5>
                      <div className="bg-slate-800 rounded-lg p-3">
                        <pre className="text-sm text-gray-300">
                          {`{
  "url": "https://example.com",
  "enableAI": false
}`}
                        </pre>
                      </div>
                    </div>
                    <div>
                      <h5 className="text-white font-semibold mb-2">
                        Parameters
                      </h5>
                      <ul className="text-gray-300 space-y-1">
                        <li>
                          <code className="text-purple-300">url</code> (string,
                          required): The URL to scrape
                        </li>
                        <li>
                          <code className="text-purple-300">enableAI</code>{" "}
                          (boolean, optional): Enable AI-enhanced extraction
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                  <div className="flex items-center mb-4">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-semibold mr-3">
                      GET
                    </span>
                    <code className="text-purple-300">/api/scraper/health</code>
                  </div>
                  <p className="text-gray-300">
                    Check the health status of the scraper service.
                  </p>
                </div>

                <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                  <div className="flex items-center mb-4">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-semibold mr-3">
                      GET
                    </span>
                    <code className="text-purple-300">/api/scraper/usage</code>
                  </div>
                  <p className="text-gray-300">
                    Get your API usage statistics.
                  </p>
                </div>
              </div>
            </section>

            {/* Code Examples */}
            <section
              id="examples"
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-semibold text-white mb-6">
                Code Examples
              </h2>
              <div className="space-y-6">
                {Object.entries(codeExamples).map(([language, code]) => (
                  <div
                    key={language}
                    className="bg-slate-800 rounded-xl border border-white/20"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-white/20">
                      <span className="text-white font-semibold capitalize">
                        {language === "curl" ? "cURL" : language}
                      </span>
                      <button
                        onClick={() => copyToClipboard(code, language)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        {copiedCode === language ? (
                          <IconCheck className="w-4 h-4 text-green-400" />
                        ) : (
                          <IconCopy className="w-4 h-4 text-white" />
                        )}
                      </button>
                    </div>
                    <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
                      <code>{code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
