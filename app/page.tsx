"use client";

import Link from "next/link";

import QuickStart from "@/components/common/QuickStart";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 text-white">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Welcome</h1>
        <p className="text-gray-300">
          Paste a URL and go. Advanced options are optional.
        </p>

        <QuickStart />

        <div className="flex gap-3">
          <Link
            href="/scraper"
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20"
          >
            Open Scraper
          </Link>
          <Link
            href="/landing-json"
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20"
          >
            View Landing JSON
          </Link>
        </div>
      </div>
    </div>
  );
}
