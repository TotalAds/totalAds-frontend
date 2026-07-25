"use client";

import GetLogo from "@/components/common/getLogo";

type LeadSnipperBrandLockupProps = {
  className?: string;
  /** Icon diameter in px. */
  size?: number;
};

/**
 * Website-style LeadSnipper lockup: circular blue mark + Lead(dark)Snipper(blue) wordmark.
 * No pill background.
 */
export function LeadSnipperBrandLockup({
  className = "",
  size = 36,
}: LeadSnipperBrandLockupProps) {
  const iconInner = Math.round(size * 0.58);

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className="flex shrink-0 items-center justify-center rounded-full bg-[#3B82F6]"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <GetLogo
          className="block"
          width={String(iconInner)}
          height={String(iconInner)}
          color="#FFFFFF"
        />
      </div>
      <span
        className="font-semibold tracking-tight text-[#131b2e]"
        style={{ fontSize: Math.max(15, Math.round(size * 0.42)) }}
      >
        Lead<span className="text-[#0058be]">Snipper</span>
      </span>
    </div>
  );
}

export default LeadSnipperBrandLockup;
