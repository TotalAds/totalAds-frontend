"use client";

import Link from "next/link";
import { ReactNode } from "react";

import { cn } from "@/utils/cn";

// -----------------------------------------------------------------------
// PageShell: consistent outer padding, max-width, stacked vertical rhythm
// -----------------------------------------------------------------------

export function PageShell({
	children,
	maxWidth = "6xl",
}: {
	children: ReactNode;
	maxWidth?: "5xl" | "6xl" | "7xl";
}) {
	const max =
		maxWidth === "5xl"
			? "max-w-5xl"
			: maxWidth === "7xl"
				? "max-w-7xl"
				: "max-w-6xl";
	return (
		<div className="min-h-screen bg-slate-50 p-6 md:p-8">
			<div className={cn("mx-auto w-full space-y-6", max)}>{children}</div>
		</div>
	);
}

// -----------------------------------------------------------------------
// PageHeader: title, eyebrow, description, optional action slot
// -----------------------------------------------------------------------

export function PageHeader({
	eyebrow,
	title,
	description,
	actions,
	breadcrumb,
}: {
	eyebrow?: string;
	title: string;
	description?: string;
	actions?: ReactNode;
	breadcrumb?: Array<{ label: string; href?: string }>;
}) {
	return (
		<div className="space-y-2">
			{breadcrumb && breadcrumb.length > 0 && (
				<nav className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
					{breadcrumb.map((crumb, idx) => (
						<span key={`${crumb.label}-${idx}`} className="flex items-center gap-1.5">
							{crumb.href ? (
								<Link
									href={crumb.href}
									className="text-slate-500 hover:text-slate-700"
								>
									{crumb.label}
								</Link>
							) : (
								<span className="text-slate-700">{crumb.label}</span>
							)}
							{idx < breadcrumb.length - 1 && (
								<span className="text-slate-300">/</span>
							)}
						</span>
					))}
				</nav>
			)}
			<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
				<div>
					{eyebrow && (
						<p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
							{eyebrow}
						</p>
					)}
					<h1 className="mt-1 text-2xl font-semibold leading-tight text-slate-900 md:text-[28px]">
						{title}
					</h1>
					{description && (
						<p className="mt-1.5 max-w-2xl text-sm text-slate-500">
							{description}
						</p>
					)}
				</div>
				{actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
			</div>
		</div>
	);
}

// -----------------------------------------------------------------------
// Card: soft white surface
// -----------------------------------------------------------------------

export function SurfaceCard({
	children,
	className,
	padded = true,
}: {
	children: ReactNode;
	className?: string;
	padded?: boolean;
}) {
	return (
		<div
			className={cn(
				"rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
				padded ? "p-5 md:p-6" : "",
				className
			)}
		>
			{children}
		</div>
	);
}

// -----------------------------------------------------------------------
// StatCard: icon + value + trend
// -----------------------------------------------------------------------

export function StatCard({
	label,
	value,
	hint,
	tone = "neutral",
	icon,
}: {
	label: string;
	value: string | number;
	hint?: string;
	tone?: "neutral" | "positive" | "warning" | "danger";
	icon?: ReactNode;
}) {
	const toneClass =
		tone === "positive"
			? "text-emerald-600"
			: tone === "warning"
				? "text-amber-600"
				: tone === "danger"
					? "text-rose-600"
					: "text-slate-900";
	return (
		<SurfaceCard>
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
						{label}
					</p>
					<p className={cn("mt-2 text-2xl font-semibold", toneClass)}>{value}</p>
					{hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
				</div>
				{icon && (
					<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
						{icon}
					</div>
				)}
			</div>
		</SurfaceCard>
	);
}

// -----------------------------------------------------------------------
// Status pill: maps post/memory/connection statuses to a coloured badge
// -----------------------------------------------------------------------

export type StatusPillTone =
	| "neutral"
	| "info"
	| "positive"
	| "warning"
	| "danger"
	| "muted";

const STATUS_TONE_MAP: Record<string, StatusPillTone> = {
	draft: "neutral",
	in_review: "info",
	approved: "info",
	scheduled: "info",
	publishing: "info",
	published: "positive",
	failed: "danger",
	rejected: "danger",
	cancelled: "muted",
	active: "positive",
	deprecated: "muted",
	contradicted: "warning",
	archived: "muted",
	connected: "positive",
	connected_healthy: "positive",
	healthy: "positive",
	needs_refresh: "warning",
	expired: "danger",
	disconnected: "danger",
	open: "info",
	closed: "muted",
};

const TONE_CLASSES: Record<StatusPillTone, string> = {
	neutral: "bg-slate-100 text-slate-700 ring-slate-200",
	info: "bg-blue-50 text-blue-700 ring-blue-200",
	positive: "bg-emerald-50 text-emerald-700 ring-emerald-200",
	warning: "bg-amber-50 text-amber-700 ring-amber-200",
	danger: "bg-rose-50 text-rose-700 ring-rose-200",
	muted: "bg-slate-50 text-slate-500 ring-slate-200",
};

export function StatusPill({
	status,
	tone,
	label,
	className,
}: {
	status?: string;
	tone?: StatusPillTone;
	label?: string;
	className?: string;
}) {
	const resolvedTone: StatusPillTone =
		tone || (status ? STATUS_TONE_MAP[status.toLowerCase()] ?? "neutral" : "neutral");
	const text = label || (status ? humanize(status) : "");
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
				TONE_CLASSES[resolvedTone],
				className
			)}
		>
			<span
				className={cn("h-1.5 w-1.5 rounded-full", {
					"bg-slate-400": resolvedTone === "neutral" || resolvedTone === "muted",
					"bg-blue-500": resolvedTone === "info",
					"bg-emerald-500": resolvedTone === "positive",
					"bg-amber-500": resolvedTone === "warning",
					"bg-rose-500": resolvedTone === "danger",
				})}
			/>
			{text}
		</span>
	);
}

function humanize(value: string) {
	return value
		.replace(/_/g, " ")
		.replace(/\b\w/g, (ch) => ch.toUpperCase());
}

// -----------------------------------------------------------------------
// EmptyState
// -----------------------------------------------------------------------

export function EmptyState({
	icon,
	title,
	description,
	action,
}: {
	icon?: ReactNode;
	title: string;
	description?: string;
	action?: ReactNode;
}) {
	return (
		<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
			{icon && (
				<div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-500">
					{icon}
				</div>
			)}
			<h3 className="text-sm font-semibold text-slate-800">{title}</h3>
			{description && (
				<p className="mt-1.5 max-w-md text-sm text-slate-500">{description}</p>
			)}
			{action && <div className="mt-4">{action}</div>}
		</div>
	);
}

// -----------------------------------------------------------------------
// Loader skeletons
// -----------------------------------------------------------------------

export function SkeletonBlock({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"animate-pulse rounded-lg bg-slate-100",
				className ?? "h-16 w-full"
			)}
		/>
	);
}

export function LoadingCardGrid({ cards = 3 }: { cards?: number }) {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
			{Array.from({ length: cards }).map((_, i) => (
				<SurfaceCard key={i}>
					<SkeletonBlock className="h-3 w-20" />
					<SkeletonBlock className="mt-3 h-8 w-24" />
				</SurfaceCard>
			))}
		</div>
	);
}

// -----------------------------------------------------------------------
// InlineAlert
// -----------------------------------------------------------------------

export function InlineAlert({
	tone = "info",
	title,
	description,
	action,
}: {
	tone?: "info" | "warning" | "danger" | "success";
	title: string;
	description?: string;
	action?: ReactNode;
}) {
	const toneClass =
		tone === "warning"
			? "bg-amber-50 border-amber-200 text-amber-800"
			: tone === "danger"
				? "bg-rose-50 border-rose-200 text-rose-800"
				: tone === "success"
					? "bg-emerald-50 border-emerald-200 text-emerald-800"
					: "bg-blue-50 border-blue-200 text-blue-800";
	return (
		<div className={cn("flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-start sm:justify-between", toneClass)}>
			<div className="flex-1">
				<p className="text-sm font-semibold leading-tight">{title}</p>
				{description && <p className="mt-1 text-sm opacity-90">{description}</p>}
			</div>
			{action && <div className="shrink-0">{action}</div>}
		</div>
	);
}

// -----------------------------------------------------------------------
// Button primitives tuned for SocialSniper
// -----------------------------------------------------------------------

export function PrimaryButton({
	children,
	onClick,
	disabled,
	type = "button",
	className,
}: {
	children: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	type?: "button" | "submit";
	className?: string;
}) {
	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
			className={cn(
				"inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60",
				className
			)}
		>
			{children}
		</button>
	);
}

export function SecondaryButton({
	children,
	onClick,
	disabled,
	type = "button",
	className,
}: {
	children: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	type?: "button" | "submit";
	className?: string;
}) {
	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
			className={cn(
				"inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60",
				className
			)}
		>
			{children}
		</button>
	);
}

export function DangerButton({
	children,
	onClick,
	disabled,
	type = "button",
	className,
}: {
	children: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	type?: "button" | "submit";
	className?: string;
}) {
	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
			className={cn(
				"inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60",
				className
			)}
		>
			{children}
		</button>
	);
}

// -----------------------------------------------------------------------
// Meta row: little "label: value" chips for post metadata
// -----------------------------------------------------------------------

export function MetaRow({
	items,
}: {
	items: Array<{ label: string; value: ReactNode }>;
}) {
	return (
		<div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
			{items.map((item, idx) => (
				<div key={idx} className="flex items-center gap-1.5">
					<span className="font-medium uppercase tracking-wide text-slate-400">
						{item.label}
					</span>
					<span className="text-slate-700">{item.value}</span>
				</div>
			))}
		</div>
	);
}

// -----------------------------------------------------------------------
// Section title — used inside cards
// -----------------------------------------------------------------------

export function SectionTitle({
	title,
	description,
	action,
}: {
	title: string;
	description?: string;
	action?: ReactNode;
}) {
	return (
		<div className="mb-4 flex items-start justify-between gap-3">
			<div>
				<h3 className="text-sm font-semibold text-slate-900">{title}</h3>
				{description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
			</div>
			{action}
		</div>
	);
}
