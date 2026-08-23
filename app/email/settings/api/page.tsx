"use client";

import DeveloperApiKeysCard from "@/components/developer/DeveloperApiKeysCard";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

export default function ApiSettingsPage() {
  return (
    <div className="min-h-screen bg-bg-100 p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/email/settings?tab=integrations"
          className="inline-flex items-center gap-1 text-sm text-text-400 hover:text-text-200"
        >
          <IconArrowLeft className="w-4 h-4" />
          Back to integrations
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-100">Developer API</h1>
          <p className="text-text-300 mt-1 leading-relaxed">
            Create and revoke REST API keys. Full documentation with request/response schemas is in{" "}
            <Link href="/email/docs" className="text-brand-main underline">
              API docs
            </Link>
            .
          </p>
        </div>
        <DeveloperApiKeysCard />
      </div>
    </div>
  );
}
