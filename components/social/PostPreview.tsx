"use client";

import { useAuthContext } from "@/context/AuthContext";
import { IconBrandLinkedin } from "@tabler/icons-react";

import { cn } from "@/utils/cn";

/**
 * A LinkedIn-flavoured preview of the post body. Rendered wherever the
 * operator might want to see the post as it will look once published.
 */
export function PostPreview({
	body,
	hashtags,
	className,
}: {
	body: string;
	hashtags?: string[] | null;
	className?: string;
}) {
	const { state } = useAuthContext();
	const name = state.user?.name || "You";
	const headline = "LinkedIn · Preview";

	return (
		<div
			className={cn(
				"rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
				className
			)}
		>
			<div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
					<IconBrandLinkedin className="h-5 w-5" />
				</div>
				<div className="flex-1">
					<p className="text-sm font-semibold text-slate-900">{name}</p>
					<p className="text-xs text-slate-500">{headline}</p>
					<p className="mt-0.5 text-[10px] text-slate-400">Now · Public</p>
				</div>
			</div>
			<div className="whitespace-pre-line px-5 py-4 text-[13.5px] leading-relaxed text-slate-800">
				{body}
				{hashtags && hashtags.length > 0 && (
					<p className="mt-4 text-xs text-blue-600">
						{hashtags.map((tag) => `#${tag}`).join(" ")}
					</p>
				)}
			</div>
			<div className="flex items-center justify-between border-t border-slate-100 px-5 py-2 text-xs text-slate-400">
				<span>Like · Comment · Repost · Send</span>
				<span>Draft preview</span>
			</div>
		</div>
	);
}
