"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, Mail, Workflow } from "lucide-react";

import SinglePageCampaignBuilder from "@/components/campaign-builder/SinglePageCampaignBuilder";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function CampaignBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDomainId = searchParams.get("domainId") || "";
  const existingCampaignId = searchParams.get("id") || undefined;
  const mode = searchParams.get("mode");

  const handleCancel = () => {
    router.push("/email/campaigns");
  };

  const handleSuccess = () => {
    router.push("/email/campaigns");
  };

  if (mode === "single") {
    return (
      <SinglePageCampaignBuilder
        onCancel={handleCancel}
        onSuccess={handleSuccess}
        initialDomainId={initialDomainId}
        campaignId={existingCampaignId}
      />
    );
  }

  if (mode === "sequence") {
    return (
      <SinglePageCampaignBuilder
        campaignMode="sequence"
        onCancel={handleCancel}
        onSuccess={handleSuccess}
        initialDomainId={initialDomainId}
        campaignId={existingCampaignId}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.08),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.06),_transparent_45%)] bg-bg-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.5)]">
          <p className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700">
            Campaign setup
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-text-100">Create Campaign</h1>
          <p className="mt-1 max-w-3xl text-sm text-text-200">
            Choose the right campaign type based on your goal. Send one-time announcements or run structured follow-ups that keep working until prospects respond.
          </p>
          <div className="mt-4 grid gap-2 text-xs text-text-200 md:grid-cols-3">
            <p className="rounded-lg bg-slate-50 px-3 py-2">Template editor with HTML + variable support</p>
            <p className="rounded-lg bg-slate-50 px-3 py-2">AI-assisted copy with spintax personalization</p>
            <p className="rounded-lg bg-slate-50 px-3 py-2">Send controls, pacing, and sender rotation</p>
          </div>
        </div>

        <div className="grid min-h-[420px] gap-5 md:grid-cols-2">
          <Link
            href={`/email/campaigns/builder?mode=single${initialDomainId ? `&domainId=${initialDomainId}` : ""}${existingCampaignId ? `&id=${existingCampaignId}` : ""}`}
            className="group flex h-full min-h-[300px] flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_22px_50px_-30px_rgba(59,130,246,0.35)]"
          >
            <div className="mb-4 inline-flex w-fit rounded-xl border border-blue-200 bg-blue-50 p-2 text-blue-700">
              <Mail className="h-4 w-4" />
            </div>
            <h2 className="text-xl font-semibold text-text-100">One-time Email</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-200">
              Send one focused message to a selected segment. Perfect for product updates, launches, event invites, or timely offers.
            </p>
            <div className="mt-4 space-y-2 text-xs text-text-200">
              <p>- Faster setup with minimal steps</p>
              <p>- Best when timing matters more than follow-up cadence</p>
              <p>- Ideal for announcements and newsletters</p>
            </div>
            <div className="mt-auto pt-6 text-xs font-medium text-blue-700 group-hover:text-blue-800">
              Choose this when you need one clear touchpoint
            </div>
          </Link>

          <Link
            href={`/email/campaigns/builder?mode=sequence${initialDomainId ? `&domainId=${initialDomainId}` : ""}${existingCampaignId ? `&id=${existingCampaignId}` : ""}`}
            className="group flex h-full min-h-[300px] flex-col rounded-3xl border border-blue-300 bg-gradient-to-b from-blue-50 to-white p-6 shadow-[0_20px_48px_-30px_rgba(59,130,246,0.45)] transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-[0_26px_56px_-30px_rgba(59,130,246,0.55)]"
          >
            <div className="mb-2 inline-flex w-fit rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
              Recommended
            </div>
            <div className="mb-4 inline-flex w-fit rounded-xl border border-blue-200 bg-white p-2 text-blue-700">
              <Workflow className="h-4 w-4" />
            </div>
            <h2 className="text-xl font-semibold text-text-100">Automated Follow-ups</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-200">
              Build a smart multi-step sequence that keeps nurturing prospects automatically until they reply or reach the end of your flow.
            </p>
            <div className="mt-4 space-y-2 text-xs text-text-200">
              <p>- Increases reply rates through consistent follow-up</p>
              <p>- Supports step timing, conditions, and message variations</p>
              <p>- Best for outbound, lead generation, and demos</p>
            </div>
            <div className="mt-auto pt-6 text-xs font-medium text-blue-700 group-hover:text-blue-800">
              Choose this to maximize replies from the same audience
            </div>
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-text-200">
            Not sure? Start with <span className="font-semibold text-text-100">Automated Follow-ups</span> and adjust to single-send later.
          </p>
          <Button asChild className="h-11 px-6">
            <Link
              href={`/email/campaigns/builder?mode=sequence${initialDomainId ? `&domainId=${initialDomainId}` : ""}${existingCampaignId ? `&id=${existingCampaignId}` : ""}`}
            >
              Continue with recommended
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CampaignBuilderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-main"></div>
      </div>
    }>
      <CampaignBuilderContent />
    </Suspense>
  );
}
