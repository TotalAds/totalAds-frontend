"use client";

import DeveloperApiKeysCard from "@/components/developer/DeveloperApiKeysCard";

export default function ApiSettingsPage() {
  return (
    <div className="min-h-screen bg-bg-100 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-100">Developer API</h1>
          <p className="text-text-300 mt-1">
            Manage REST API keys, scopes, and integration access for LeadSnipper.
          </p>
        </div>
        <DeveloperApiKeysCard />
      </div>
    </div>
  );
}
