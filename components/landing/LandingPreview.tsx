"use client";

import React from "react";
import { LandingPageData } from "@/utils/scraper/landingPageMapper";
import Link from "next/link";

interface Props {
  data: LandingPageData;
}

const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex justify-between py-1 text-sm">
    <span className="text-gray-400">{label}</span>
    <span className="text-white font-medium text-right max-w-[65%]">
      {value || "—"}
    </span>
  </div>
);

export default function LandingPreview({ data }: Props) {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-white/10 rounded-2xl p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          {data.companyName}
        </h1>
        <p className="text-gray-200 max-w-3xl">{data.description}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {data.industry && (
            <span className="px-3 py-1 bg-white/10 rounded-full border border-white/20 text-gray-100">
              {data.industry}
            </span>
          )}
          {data.companySize && (
            <span className="px-3 py-1 bg-white/10 rounded-full border border-white/20 text-gray-100">
              {data.companySize}
            </span>
          )}
          {data.businessModel && (
            <span className="px-3 py-1 bg-white/10 rounded-full border border-white/20 text-gray-100">
              {data.businessModel}
            </span>
          )}
          {data.targetMarket && (
            <span className="px-3 py-1 bg-white/10 rounded-full border border-white/20 text-gray-100">
              {data.targetMarket}
            </span>
          )}
        </div>
        <div className="mt-5 flex gap-3">
          {data.website && (
            <Link
              href={data.website}
              target="_blank"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white"
            >
              Visit Website
            </Link>
          )}
        </div>
      </section>

      {/* Services */}
      {data.services && data.services.length > 0 && (
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Key Services</h2>
          <div className="flex flex-wrap gap-2">
            {data.services.map((s, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-white/10 rounded-full border border-white/20 text-gray-100"
              >
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Contact + Social */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Contact</h3>
          <InfoRow label="Email" value={data.email} />
          <InfoRow label="Phone" value={data.phone} />
          <InfoRow label="Location" value={data.location} />
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Social</h3>
          <div className="flex flex-wrap gap-2 text-sm">
            {data.socialMedia.linkedin && (
              <Link href={data.socialMedia.linkedin} target="_blank" className="px-3 py-1 bg-white/10 rounded-full border border-white/20 text-gray-100">LinkedIn</Link>
            )}
            {data.socialMedia.facebook && (
              <Link href={data.socialMedia.facebook} target="_blank" className="px-3 py-1 bg-white/10 rounded-full border border-white/20 text-gray-100">Facebook</Link>
            )}
            {data.socialMedia.instagram && (
              <Link href={data.socialMedia.instagram} target="_blank" className="px-3 py-1 bg-white/10 rounded-full border border-white/20 text-gray-100">Instagram</Link>
            )}
            {data.socialMedia.twitter && (
              <Link href={data.socialMedia.twitter} target="_blank" className="px-3 py-1 bg-white/10 rounded-full border border-white/20 text-gray-100">Twitter/X</Link>
            )}
          </div>
        </div>
      </section>

      {/* Competitive Advantages */}
      {data.competitiveAdvantages && data.competitiveAdvantages.length > 0 && (
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Why Choose Them</h3>
          <ul className="list-disc pl-5 space-y-1 text-gray-200">
            {data.competitiveAdvantages.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </section>
      )}

      {/* ICP info (optional) */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-3">Scoring</h3>
        <InfoRow label="ICP Score" value={String(data.icpScore)} />
        <InfoRow label="Match Level" value={data.icpMatchLevel} />
      </section>
    </div>
  );
}

