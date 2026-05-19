"use client";

import { useState } from "react";

import { useAuthContext } from "@/context/AuthContext";
import { IconBrandLinkedin } from "@tabler/icons-react";

import { cn } from "@/utils/cn";
import { resolveSocialMediaDisplayUrl } from "@/utils/social/mediaUrl";

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
	const bodyTags = body
		.split(/\s+/)
		.filter((token) => token.startsWith("#") && token.length > 1)
		.map((token) => token.slice(1).trim().replace(/[^A-Za-z0-9_]/g, ""))
		.filter(Boolean);
	const mergedHashtags = Array.from(
		new Set([...(hashtags || []), ...bodyTags].map((tag) => String(tag || "").trim().replace(/^#/, "")).filter(Boolean))
	);
	const bodyWithoutHashtags = body
		.split(/\r?\n/)
		.map((line) =>
			line
				.replace(/(^|\s)#[A-Za-z0-9_]+/g, " ")
				.replace(/\s{2,}/g, " ")
				.trim()
		)
		.join("\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
	const previewBody = bodyWithoutHashtags || body;
	const mergedMediaAssets = Array.from(
		new Map(
			[
				...(mediaAssets || []),
				...(mediaUrls || []).map((url) => ({
					assetType: inferAssetType(url),
					publicUrl: url,
					status: "ready",
				})),
			]
				.filter((asset) => !!asset.publicUrl)
				.map((asset) => [`${asset.assetType}::${asset.publicUrl}`, asset])
		).values()
	);
	const imageAssets = mergedMediaAssets.filter(
		(asset) =>
			asset.assetType === "single_image" &&
			asset.publicUrl &&
			/\.(png|jpe?g|webp|gif)(\?|$)/i.test(asset.publicUrl)
	);
	const carouselAssets = mergedMediaAssets.filter(
		(asset) => asset.assetType === "carousel_pdf" && asset.publicUrl
	);
	const videoAssets = mergedMediaAssets.filter(
		(asset) =>
			asset.assetType === "single_video" && asset.publicUrl
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
				"min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
				className
			)}
		>
			<div className="flex min-w-0 items-center gap-3 border-b border-slate-100 px-4 py-3 md:px-5">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
					<IconBrandLinkedin className="h-5 w-5" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold text-slate-900">{name}</p>
					<p className="text-xs text-slate-500">{headline}</p>
					<p className="mt-0.5 text-[10px] text-slate-400">Now · Public</p>
				</div>
			</div>
			<div className="min-w-0 px-4 py-4 text-[13.5px] leading-relaxed text-slate-800 md:px-5">
				{html ? (
					<div
						className="[&_a]:text-blue-600 [&_a]:underline [&_img]:my-3 [&_img]:max-h-72 [&_img]:rounded-lg [&_img]:border [&_img]:border-slate-200 [&_img]:object-cover [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:whitespace-pre-wrap [&_ul]:list-disc [&_ul]:pl-5"
						dangerouslySetInnerHTML={{ __html: html }}
					/>
				) : (
					<div className="whitespace-pre-line">{previewBody}</div>
				)}
				{(imageAssets.length > 0 ||
					carouselAssets.length > 0 ||
					videoAssets.length > 0) && (
					<div className="mt-4 space-y-3">
						{imageAssets.map((asset, idx) => (
							<img
								key={`${asset.publicUrl}-${idx}`}
								src={resolveSocialMediaDisplayUrl(asset.publicUrl)}
								alt={`Post media ${idx + 1}`}
								className="max-h-72 w-full rounded-lg border border-slate-200 object-cover"
							/>
						))}
						{videoAssets.map((asset, idx) => (
							<video
								key={`${asset.publicUrl}-${idx}`}
								src={resolveSocialMediaDisplayUrl(asset.publicUrl)}
								className="max-h-80 w-full rounded-lg border border-slate-200 bg-black"
								controls
								preload="metadata"
							/>
						))}
						{carouselAssets.map((asset, idx) => (
							<div
								key={`${asset.publicUrl}-${idx}`}
								className="rounded-lg border border-slate-200 bg-slate-50 p-2"
							>
								<iframe
									title={`Carousel preview ${idx + 1}`}
									src={`${resolveSocialMediaDisplayUrl(asset.publicUrl)}#page=${getCurrentPage(idx)}&view=FitH`}
									className="h-[min(340px,55vh)] w-full rounded-md border border-slate-200 bg-white md:h-[340px]"
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
					<p className="mt-4 text-xs flex flex-wrap ">
						{mergedHashtags.map((tag, idx) => (
							<span key={tag + idx} className="mr-2 font-medium text-[#0a66c2]">
								#{tag}
							</span>
						))}
					</p>
				)}
			</div>
			<div className="flex min-w-0 flex-col gap-1 border-t border-slate-100 px-4 py-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between md:px-5">
				<span className="min-w-0 truncate">Like · Comment · Repost · Send</span>
				<span className="shrink-0">Draft preview</span>
			</div>
		</div>
	);
}

function inferAssetType(url: string): string {
	const cleanUrl = String(url || "").split("?")[0].toLowerCase();
	if (/\.(pdf)$/.test(cleanUrl)) return "carousel_pdf";
	if (/\.(mp4|mov|webm|m4v)$/.test(cleanUrl)) return "single_video";
	return "single_image";
}
