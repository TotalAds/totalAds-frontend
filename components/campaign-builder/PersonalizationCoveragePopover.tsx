"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import {
  getCoverageStatus,
  lookupTokenCoverage,
  type CoverageStatus,
  type PersonalizationTokenCoverage,
} from "@/components/campaign-builder/htmlPreviewUtils";
import { cn } from "@/lib/utils";

export type CoveragePopoverPayload = {
  field: string;
  sample?: string | null;
  coverage?: PersonalizationTokenCoverage | null;
  /** When false/undefined and no coverage map, show sample-only card. */
  hasCoverageData?: boolean;
};

type AnchorRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
};

function statusMeta(status: CoverageStatus): {
  label: string;
  badgeClass: string;
  barClass: string;
} {
  if (status === "missing") {
    return {
      label: "Missing",
      badgeClass: "border-red-200 bg-red-50 text-red-700",
      barClass: "bg-red-500",
    };
  }
  if (status === "warning") {
    return {
      label: "Low coverage",
      badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
      barClass: "bg-amber-500",
    };
  }
  return {
    label: "Ready",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
    barClass: "bg-blue-500",
  };
}

export function PersonalizationCoverageCard({
  field,
  sample,
  coverage,
  hasCoverageData,
}: CoveragePopoverPayload) {
  const status: CoverageStatus = hasCoverageData
    ? getCoverageStatus(coverage)
    : "ok";
  const meta = statusMeta(status);
  const displayField = field.replace(/[_-]+/g, " ");

  return (
    <div className="w-[min(18.5rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 bg-slate-50/90 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold capitalize text-slate-800">
            {displayField}
          </p>
          <p className="mt-0.5 truncate font-mono text-[10px] text-slate-500">
            {`{{${field}}}`}
          </p>
        </div>
        {hasCoverageData ? (
          <span
            className={cn(
              "shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
              meta.badgeClass
            )}
          >
            {meta.label}
          </span>
        ) : null}
      </div>

      <div className="space-y-2.5 px-3 py-2.5">
        {hasCoverageData && coverage && coverage.total > 0 ? (
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="rounded-md border border-emerald-100 bg-emerald-50/70 px-2 py-1.5">
                <p className="text-[9px] font-medium uppercase tracking-wide text-emerald-700/80">
                  Have value
                </p>
                <p className="text-sm font-bold tabular-nums text-emerald-800">
                  {coverage.withValue.toLocaleString()}
                </p>
              </div>
              <div className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1.5">
                <p className="text-[9px] font-medium uppercase tracking-wide text-slate-500">
                  Missing
                </p>
                <p className="text-sm font-bold tabular-nums text-slate-700">
                  {coverage.withoutValue.toLocaleString()}
                </p>
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
                <span>
                  {coverage.withValue.toLocaleString()} of{" "}
                  {coverage.total.toLocaleString()} leads
                </span>
                <span className="font-semibold tabular-nums text-slate-700">
                  {coverage.coveragePct}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-full rounded-full transition-all", meta.barClass)}
                  style={{
                    width: `${Math.max(0, Math.min(100, coverage.coveragePct))}%`,
                  }}
                />
              </div>
            </div>
            {status === "missing" ? (
              <p className="text-[10px] leading-snug text-red-600">
                This variable does not exist on your selected leads. Emails will
                leave it blank.
              </p>
            ) : status === "warning" ? (
              <p className="text-[10px] leading-snug text-amber-700">
                Warning only — some leads are missing this value. Sending is
                still allowed.
              </p>
            ) : (
              <p className="text-[10px] leading-snug text-slate-500">
                All selected leads have a value for this field.
              </p>
            )}
          </div>
        ) : hasCoverageData ? (
          <p className="text-[10px] leading-snug text-red-600">
            Not found on any campaign leads.
          </p>
        ) : null}

        {sample ? (
          <div className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1.5">
            <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
              Sample value
            </p>
            <p className="mt-0.5 line-clamp-4 text-[11px] leading-snug text-slate-700">
              {sample}
            </p>
          </div>
        ) : hasCoverageData ? null : (
          <p className="text-[10px] leading-snug text-slate-500">
            No sample value for this lead.
          </p>
        )}

        {hasCoverageData ? (
          <p className="text-[9px] text-slate-400">
            Coverage is a warning only — not required to send.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function FloatingCoveragePopover({
  open,
  anchor,
  payload,
}: {
  open: boolean;
  anchor: AnchorRect | null;
  payload: CoveragePopoverPayload | null;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !open || !anchor || !payload) return null;

  const gap = 8;
  const popoverWidth = 296;
  const left = Math.min(
    Math.max(8, anchor.left + anchor.width / 2 - popoverWidth / 2),
    (typeof window !== "undefined" ? window.innerWidth : 800) - popoverWidth - 8
  );
  const preferAbove = anchor.top > 220;
  const style: CSSProperties = preferAbove
    ? {
        position: "fixed",
        left,
        bottom:
          (typeof window !== "undefined" ? window.innerHeight : 800) -
          anchor.top +
          gap,
        zIndex: 10050,
        width: popoverWidth,
      }
    : {
        position: "fixed",
        left,
        top: anchor.bottom + gap,
        zIndex: 10050,
        width: popoverWidth,
      };

  return createPortal(
    <div
      style={style}
      className="pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150"
      role="tooltip"
    >
      <PersonalizationCoverageCard {...payload} />
    </div>,
    document.body
  );
}

/** Wrap any trigger (pill, button, chip) with a hover coverage popover above it. */
export function PersonalizationHoverTrigger({
  field,
  sample,
  coverage,
  hasCoverageData,
  tokenCoverage,
  children,
  className,
  asChild,
}: CoveragePopoverPayload & {
  children: ReactNode;
  className?: string;
  asChild?: boolean;
  tokenCoverage?: Record<string, PersonalizationTokenCoverage>;
}) {
  const resolvedCoverage =
    coverage ??
    (tokenCoverage ? lookupTokenCoverage(tokenCoverage, field) : null);
  const resolvedHasData =
    hasCoverageData ?? Boolean(tokenCoverage && Object.keys(tokenCoverage).length > 0);

  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tipId = useId();

  const clearClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const show = () => {
    clearClose();
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAnchor({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
      bottom: r.bottom,
      right: r.right,
    });
    setOpen(true);
  };

  const hide = () => {
    clearClose();
    closeTimer.current = setTimeout(() => setOpen(false), 80);
  };

  useEffect(() => () => clearClose(), []);

  return (
    <>
      <span
        ref={triggerRef}
        className={cn("inline-flex max-w-full", className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={open ? tipId : undefined}
      >
        {asChild ? children : children}
      </span>
      <FloatingCoveragePopover
        open={open}
        anchor={anchor}
        payload={{
          field,
          sample,
          coverage: resolvedCoverage,
          hasCoverageData: resolvedHasData,
        }}
      />
    </>
  );
}

/** Imperative / DOM-anchored hover popover (Design editor chips, iframe preview). */
export function useAnchoredCoveragePopover() {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);
  const [payload, setPayload] = useState<CoveragePopoverPayload | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const showAt = useCallback(
    (rect: DOMRect | AnchorRect, next: CoveragePopoverPayload) => {
      clearClose();
      setAnchor({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
      });
      setPayload(next);
      setOpen(true);
    },
    [clearClose]
  );

  const hide = useCallback(() => {
    clearClose();
    closeTimer.current = setTimeout(() => setOpen(false), 100);
  }, [clearClose]);

  const hideNow = useCallback(() => {
    clearClose();
    setOpen(false);
  }, [clearClose]);

  useEffect(() => () => clearClose(), [clearClose]);

  const portal = (
    <FloatingCoveragePopover open={open} anchor={anchor} payload={payload} />
  );

  return { showAt, hide, hideNow, portal, open };
}

export function lookupSampleValue(
  tokenSampleValues: Record<string, string> | undefined,
  field: string
): string | undefined {
  if (!tokenSampleValues) return undefined;
  return (
    tokenSampleValues[field] ||
    tokenSampleValues[field.toLowerCase()] ||
    Object.entries(tokenSampleValues).find(
      ([k]) =>
        k.toLowerCase().replace(/[\s_-]+/g, "") ===
        field.toLowerCase().replace(/[\s_-]+/g, "")
    )?.[1]
  );
}

export function fieldFromMergeToken(token: string): string {
  return token
    .replace(/^\{\{\s*/, "")
    .replace(/\s*\}\}$/, "")
    .split("|")[0]
    .trim();
}
