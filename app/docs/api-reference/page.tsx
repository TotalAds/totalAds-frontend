"use client";

import React, { useState } from "react";
import { toast } from "react-hot-toast";

import {
  IconApi,
  IconBolt,
  IconBook,
  IconCheck,
  IconCode,
  IconCopy,
  IconExternalLink,
  IconTarget,
} from "@tabler/icons-react";

export default function APIReference() {
  const [activeTab, setActiveTab] = useState("extract");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const endpoints = {
    extract: {
      method: "POST",
      path: "/api/scraper",
      description:
        "Extract comprehensive lead intelligence from any website with AI-powered analysis",
      requestBody: {
        url: "string (required) - The website URL to analyze",
        enableAI:
          "boolean (optional, default: true) - Enable AI-powered analysis",
        icpProfile: "string (optional) - ICP profile ID for custom scoring",
      },
      response: {
        success: "boolean",
        data: {
          url: "string",
          companyData: {
            name: "string",
            industry: "string[]",
            size: "string",
            businessModel: "string",
            description: "string",
          },
          contactInfo: {
            emails: "string[]",
            phones: "string[]",
            addresses: "string[]",
            socialMedia: "object[]",
          },
          leadScore: {
            overall: "number (0-100)",
            quality: "hot | warm | cold",
            breakdown: {
              companySize: "number",
              industry: "number",
              technology: "number",
              businessSignals: "number",
              decisionMakers: "number",
              contactInfo: "number",
            },
          },
          decisionMakers: "object[]",
          businessSignals: "object",
          painPoints: "string[]",
          buyingSignals: "string[]",
          competitorAnalysis: "object",
          confidence: "number (0-100)",
          processingTime: "number",
          aiEnhanced: "boolean",
        },
        meta: {
          requestId: "string",
          timestamp: "string",
          processingTime: "number",
          apiVersion: "string",
          rateLimit: "object",
          usage: "object",
        },
      },
    },
    bulk: {
      method: "POST",
      path: "/api/v1/extract/bulk",
      description: "Extract lead intelligence from multiple websites",
      requestBody: {
        urls: "string[] (required, max 10) - Array of website URLs",
        enableAI: "boolean (optional, default: true)",
        icpProfile: "string (optional)",
        options: {
          includeContactInfo: "boolean (optional, default: true)",
          includeBusinessSignals: "boolean (optional, default: true)",
          includeLeadScoring: "boolean (optional, default: true)",
          maxProcessingTime: "number (optional, default: 30000)",
          concurrency: "number (optional, default: 3, max: 5)",
        },
      },
    },
    usage: {
      method: "GET",
      path: "/api/v1/usage",
      description: "Get API usage statistics and remaining credits",
    },
    history: {
      method: "GET",
      path: "/api/v1/history",
      description: "Get extraction history with pagination",
    },
  };

  const codeExamples = {
    curl: `curl -X POST https://api.leadsnipper.com/api/scraper \\
  -H "Authorization: Bearer ls_your_api_token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example-company.com",
    "enableAI": true
  }'`,
    javascript: `const response = await fetch('https://api.leadsnipper.com/api/v1/extract', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ls_your_api_token',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://example-company.com',
    enableAI: true,
    options: {
      includeLeadScoring: true,
      includeBusinessSignals: true,
      maxProcessingTime: 15000
    }
  })
});

const result = await response.json();

if (result.success) {
  console.log('Lead Score:', result.data.leadScore.overall);
  console.log('Quality:', result.data.leadScore.quality);
  console.log('Decision Makers:', result.data.decisionMakers.length);
  console.log('Business Signals:', result.data.businessSignals);
} else {
  console.error('Error:', result.error);
}`,
    python: `import requests

url = "https://api.leadsnipper.com/api/v1/extract"
headers = {
    "Authorization": "Bearer ls_your_api_token",
    "Content-Type": "application/json"
}
data = {
    "url": "https://example-company.com",
    "enableAI": True,
    "options": {
        "includeLeadScoring": True,
        "includeBusinessSignals": True,
        "maxProcessingTime": 15000
    }
}

response = requests.post(url, headers=headers, json=data)
result = response.json()

if result['success']:
    lead_data = result['data']
    print(f"Company: {lead_data['companyData']['name']}")
    print(f"Lead Score: {lead_data['leadScore']['overall']}/100")
    print(f"Quality: {lead_data['leadScore']['quality']}")
    print(f"Decision Makers: {len(lead_data['decisionMakers'])}")
else:
    print(f"Error: {result['error']['message']}")`,
    node: `const axios = require('axios');

const extractLeadIntelligence = async (url) => {
  try {
    const response = await axios.post('https://api.leadsnipper.com/api/v1/extract', {
      url: url,
      enableAI: true,
      options: {
        includeLeadScoring: true,
        includeBusinessSignals: true,
        maxProcessingTime: 15000
      }
    }, {
      headers: {
        'Authorization': 'Bearer ls_your_api_token',
        'Content-Type': 'application/json'
      }
    });

    const { data, meta } = response.data;
    
    return {
      company: data.companyData.name,
      leadScore: data.leadScore.overall,
      quality: data.leadScore.quality,
      decisionMakers: data.decisionMakers,
      businessSignals: data.businessSignals,
      processingTime: meta.processingTime,
      creditsUsed: meta.usage.creditsUsed
    };
    
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || error.message);
  }
};

// Usage
extractLeadIntelligence('https://example-company.com')
  .then(result => console.log(result))
  .catch(error => console.error('Error:', error.message));`,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            LeadSnipper API Reference 📚
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Complete API documentation for the LeadSnipper lead intelligence
            platform. Transform any website into actionable business
            intelligence.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 text-center">
            <IconApi className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">4</div>
            <div className="text-sm text-gray-300">API Endpoints</div>
          </div>
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 text-center">
            <IconBolt className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">&lt;3s</div>
            <div className="text-sm text-gray-300">Avg Response</div>
          </div>
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 text-center">
            <IconTarget className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">99.9%</div>
            <div className="text-sm text-gray-300">Uptime</div>
          </div>
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 text-center">
            <IconCheck className="w-8 h-8 text-orange-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">REST</div>
            <div className="text-sm text-gray-300">API Standard</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-white mb-4">
                Endpoints
              </h3>
              <div className="space-y-2">
                {Object.entries(endpoints).map(([key, endpoint]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`w-full text-left p-3 rounded-xl transition-colors ${
                      activeTab === key
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        : "text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          endpoint.method === "POST"
                            ? "bg-green-500"
                            : "bg-blue-500"
                        } text-white`}
                      >
                        {endpoint.method}
                      </span>
                      <span className="text-sm">{endpoint.path}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Endpoint Details */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <span
                  className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                    endpoints[activeTab as keyof typeof endpoints].method ===
                    "POST"
                      ? "bg-green-500"
                      : "bg-blue-500"
                  } text-white`}
                >
                  {endpoints[activeTab as keyof typeof endpoints].method}
                </span>
                <code className="text-purple-300 text-lg">
                  {endpoints[activeTab as keyof typeof endpoints].path}
                </code>
              </div>

              <p className="text-gray-300 mb-6">
                {endpoints[activeTab as keyof typeof endpoints].description}
              </p>

              {/* Request/Response Details */}
              {activeTab === "extract" && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-white font-semibold mb-3">
                      Request Body
                    </h4>
                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                      <pre className="text-sm text-gray-300 overflow-x-auto">
                        {`{
  "url": "https://example-company.com",
  "enableAI": true,
  "icpProfile": "optional-icp-id",
  "options": {
    "includeContactInfo": true,
    "includeBusinessSignals": true,
    "includeLeadScoring": true,
    "maxProcessingTime": 15000
  }
}`}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold mb-3">
                      Response Format
                    </h4>
                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                      <pre className="text-sm text-gray-300 overflow-x-auto">
                        {`{
  "success": true,
  "data": {
    "url": "https://example-company.com",
    "companyData": {
      "name": "Example Company",
      "industry": ["Technology", "SaaS"],
      "size": "medium",
      "businessModel": "SaaS",
      "description": "..."
    },
    "leadScore": {
      "overall": 85,
      "quality": "hot",
      "breakdown": {
        "companySize": 90,
        "industry": 95,
        "technology": 80,
        "businessSignals": 85,
        "decisionMakers": 75,
        "contactInfo": 70
      }
    },
    "decisionMakers": [
      {
        "name": "John Doe",
        "role": "CEO",
        "department": "Executive",
        "seniority": "C-level",
        "contactInfo": {
          "email": "john@example.com",
          "linkedin": "..."
        }
      }
    ],
    "businessSignals": {
      "hiring": true,
      "expansion": false,
      "funding": true,
      "newProducts": false,
      "partnerships": true,
      "techUpgrades": false
    },
    "confidence": 92,
    "processingTime": 2500,
    "aiEnhanced": true
  },
  "meta": {
    "requestId": "ls_...",
    "timestamp": "2024-01-15T10:30:00Z",
    "processingTime": 2500,
    "apiVersion": "1.0.0",
    "rateLimit": {
      "remaining": 49,
      "resetTime": "2024-01-15T11:00:00Z",
      "limit": 50
    },
    "usage": {
      "creditsUsed": 1,
      "creditsRemaining": 49
    }
  }
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Code Examples */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-white mb-6">
                Code Examples
              </h3>

              <div className="space-y-6">
                {Object.entries(codeExamples).map(([lang, code]) => (
                  <div
                    key={lang}
                    className="bg-gray-900/50 rounded-xl border border-gray-700"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-gray-700">
                      <h4 className="text-white font-medium capitalize">
                        {lang}
                      </h4>
                      <button
                        onClick={() => copyToClipboard(code)}
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <IconCopy className="w-4 h-4" />
                        Copy
                      </button>
                    </div>
                    <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
                      <code>{code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
