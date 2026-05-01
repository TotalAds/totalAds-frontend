"use client";

import { useState } from "react";

import { useAuthContext } from "@/context/AuthContext";
import { IconBrandLinkedin } from "@tabler/icons-react";

import { cn } from "@/utils/cn";

/**
 * A LinkedIn-flavoured preview of the post body. Rendered wherever the
 * operator might want to see the post as it will look once published.
 */
export function PostPreview({
	body,
	html,
	hashtags,
	mediaUrls,
	mediaAssets,
	className,
}: {
	body: string;
	html?: string;
	hashtags?: string[] | null;
	mediaUrls?: string[] | null;
	mediaAssets?: Array<{
		assetType: string;
		publicUrl: string | null;
		status?: string;
	}> | null;
	className?: string;
}) {
	const { state } = useAuthContext();
	const name = state.user?.name || "You";
	const headline = "LinkedIn · Preview";
	const bodyTags = Array.from(body.matchAll(/(^|\s)#([\p{L}\p{N}_]+)/gu)).map(
		(match) => match[2]
	);
	const mergedHashtags = Array.from(
		new Set([...(hashtags || []), ...bodyTags].map((tag) => String(tag || "").trim().replace(/^#/, "")).filter(Boolean))
	);
	const bodyWithoutHashtags = body
		.split(/\r?\n/)
		.map((line) => line.replace(/(^|\s)#[\p{L}\p{N}_]+/gu, " ").replace(/\s{2,}/g, " ").trim())
		.join("\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
	const previewBody = bodyWithoutHashtags || body;
	const mergedMediaAssets = [
		...(mediaAssets || []),
		...(mediaUrls || []).map((url) => ({
			assetType: "single_image",
			publicUrl: url,
			status: "ready",
		})),
	].filter((asset) => !!asset.publicUrl);
	const imageAssets = mergedMediaAssets.filter(
		(asset) =>
			asset.assetType === "single_image" &&
			asset.publicUrl &&
			/\.(png|jpe?g|webp|gif)(\?|$)/i.test(asset.publicUrl)
	);
	const carouselAssets = mergedMediaAssets.filter(
		(asset) => asset.assetType === "carousel_pdf" && asset.publicUrl
	);
	const [carouselPages, setCarouselPages] = useState<Record<number, number>>({});

	const getCurrentPage = (index: number) => carouselPages[index] || 1;
	const setPage = (index: number, next: number) => {
		setCarouselPages((prev) => ({
			...prev,
			[index]: Math.max(1, next),
		}));
	};

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
			<div className="px-5 py-4 text-[13.5px] leading-relaxed text-slate-800">
				{html ? (
					<div
						className="[&_a]:text-blue-600 [&_a]:underline [&_img]:my-3 [&_img]:max-h-72 [&_img]:rounded-lg [&_img]:border [&_img]:border-slate-200 [&_img]:object-cover [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:whitespace-pre-wrap [&_ul]:list-disc [&_ul]:pl-5"
						dangerouslySetInnerHTML={{ __html: html }}
					/>
				) : (
					<div className="whitespace-pre-line">{previewBody}</div>
				)}
				{(imageAssets.length > 0 || carouselAssets.length > 0) && (
					<div className="mt-4 space-y-3">
						{imageAssets.map((asset, idx) => (
							<img
								key={`${asset.publicUrl}-${idx}`}
								src={asset.publicUrl || ""}
								alt={`Post media ${idx + 1}`}
								className="max-h-72 w-full rounded-lg border border-slate-200 object-cover"
							/>
						))}
						{carouselAssets.map((asset, idx) => (
							<div
								key={`${asset.publicUrl}-${idx}`}
								className="rounded-lg border border-slate-200 bg-slate-50 p-2"
							>
								<iframe
									title={`Carousel preview ${idx + 1}`}
									src={`${asset.publicUrl}#page=${getCurrentPage(idx)}&view=FitH`}
									className="h-[340px] w-full rounded-md border border-slate-200 bg-white"
								/>
								<div className="mt-2 flex items-center justify-between">
									<button
										type="button"
										onClick={() => setPage(idx, getCurrentPage(idx) - 1)}
										className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
									>
										←
									</button>
									<span className="text-xs font-medium text-slate-500">
										Carousel {carouselAssets.length > 1 ? `#${idx + 1}` : ""} ·
										Page {getCurrentPage(idx)}
									</span>
									<button
										type="button"
										onClick={() => setPage(idx, getCurrentPage(idx) + 1)}
										className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
									>
										→
									</button>
								</div>
							</div>
						))}
					</div>
				)}
				{mergedHashtags.length > 0 && (
					<p className="mt-4 text-xs">
						{mergedHashtags.map((tag, idx) => (
							<span key={tag + idx} className="mr-2 font-medium text-[#0a66c2]">
								#{tag}
							</span>
						))}
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
