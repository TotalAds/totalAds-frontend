"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

import {
	IconBold,
	IconBraces,
	IconChevronDown,
	IconCode,
	IconItalic,
	IconLink,
	IconList,
	IconListNumbers,
	IconMinus,
	IconPhoto,
	IconQuote,
} from "@tabler/icons-react";

type BlockStyle = "p" | "h1" | "h2" | "blockquote";

const BLOCK_LABELS: Record<BlockStyle, string> = {
	p: "Normal",
	h1: "Heading 1",
	h2: "Heading 2",
	blockquote: "Quote",
};

export function LinkedinArticleEditor({
	title,
	onTitleChange,
	bodyHtml,
	onBodyHtmlChange,
	onUploadInlineImage,
	placeholder = "Write here. You can also include @mentions.",
}: {
	title: string;
	onTitleChange: (value: string) => void;
	bodyHtml: string;
	onBodyHtmlChange: (html: string) => void;
	onUploadInlineImage?: (file: File) => Promise<string>;
	placeholder?: string;
}) {
	const editorRef = useRef<HTMLDivElement | null>(null);
	const fileRef = useRef<HTMLInputElement | null>(null);
	const [blockStyle, setBlockStyle] = useState<BlockStyle>("p");
	const [styleOpen, setStyleOpen] = useState(false);
	const [uploading, setUploading] = useState(false);

	useEffect(() => {
		const el = editorRef.current;
		if (!el) return;
		if (el.innerHTML !== bodyHtml) {
			el.innerHTML = bodyHtml || "";
		}
	}, [bodyHtml]);

	const syncHtml = () => {
		const el = editorRef.current;
		if (!el) return;
		onBodyHtmlChange(el.innerHTML);
	};

	const exec = (command: string, value?: string) => {
		document.execCommand(command, false, value);
		editorRef.current?.focus();
		syncHtml();
	};

	const applyBlock = (tag: BlockStyle) => {
		setBlockStyle(tag);
		setStyleOpen(false);
		const value = tag === "p" ? "p" : tag;
		exec("formatBlock", value);
	};

	const insertLink = () => {
		const url = window.prompt("Enter URL");
		if (url) exec("createLink", url);
	};

	const onPickImage = async (file?: File | null) => {
		if (!file || !file.type.startsWith("image/")) return;
		try {
			setUploading(true);
			let url = "";
			if (onUploadInlineImage) {
				url = await onUploadInlineImage(file);
			} else {
				url = URL.createObjectURL(file);
			}
			if (url) {
				exec("insertImage", url);
			}
		} finally {
			setUploading(false);
		}
	};

	return (
		<div className="mx-auto w-full max-w-3xl">
			<div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
				<div className="flex flex-wrap items-center justify-center gap-1 px-2 py-2">
					<div className="relative">
						<button
							type="button"
							onClick={() => setStyleOpen((v) => !v)}
							className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-white"
						>
							{BLOCK_LABELS[blockStyle]}
							<IconChevronDown className="h-3.5 w-3.5" />
						</button>
						{styleOpen && (
							<div className="absolute left-0 top-full z-30 mt-1 min-w-[140px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
								{(Object.keys(BLOCK_LABELS) as BlockStyle[]).map((key) => (
									<button
										key={key}
										type="button"
										onClick={() => applyBlock(key)}
										className="block w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50"
									>
										{BLOCK_LABELS[key]}
									</button>
								))}
							</div>
						)}
					</div>
					<ToolbarDivider />
					<ToolBtn icon={<IconBold className="h-4 w-4" />} onClick={() => exec("bold")} />
					<ToolBtn icon={<IconItalic className="h-4 w-4" />} onClick={() => exec("italic")} />
					<ToolbarDivider />
					<ToolBtn icon={<IconList className="h-4 w-4" />} onClick={() => exec("insertUnorderedList")} />
					<ToolBtn icon={<IconListNumbers className="h-4 w-4" />} onClick={() => exec("insertOrderedList")} />
					<ToolBtn icon={<IconQuote className="h-4 w-4" />} onClick={() => applyBlock("blockquote")} />
					<ToolBtn icon={<IconCode className="h-4 w-4" />} onClick={() => exec("formatBlock", "pre")} />
					<ToolBtn icon={<IconMinus className="h-4 w-4" />} onClick={() => exec("insertHorizontalRule")} />
					<ToolbarDivider />
					<ToolBtn icon={<IconLink className="h-4 w-4" />} onClick={insertLink} />
					<ToolBtn icon={<IconBraces className="h-4 w-4" />} onClick={() => exec("insertHTML", "<code>code</code>")} />
					<ToolBtn icon={<IconPhoto className="h-4 w-4" />} onClick={() => fileRef.current?.click()} />
				</div>
			</div>

			<input
				value={title}
				onChange={(e) => onTitleChange(e.target.value)}
				placeholder="Title"
				className="mt-6 w-full border-0 bg-transparent px-1 text-3xl font-semibold text-slate-900 outline-none placeholder:text-slate-400"
			/>

			<div
				ref={editorRef}
				contentEditable
				suppressContentEditableWarning
				onInput={syncHtml}
				onBlur={syncHtml}
				data-placeholder={placeholder}
				className="linkedin-article-body mt-4 min-h-[320px] px-1 pb-16 text-base leading-relaxed text-slate-800 outline-none empty:before:pointer-events-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]"
			/>

			<input
				ref={fileRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={(e) => {
					onPickImage(e.target.files?.[0]);
					e.currentTarget.value = "";
				}}
			/>

			{uploading && (
				<p className="px-1 text-xs text-blue-600">Uploading image…</p>
			)}

			<style jsx global>{`
				.linkedin-article-body h1 {
					font-size: 1.75rem;
					font-weight: 600;
					margin: 1rem 0 0.5rem;
				}
				.linkedin-article-body h2 {
					font-size: 1.35rem;
					font-weight: 600;
					margin: 0.85rem 0 0.4rem;
				}
				.linkedin-article-body p {
					margin: 0.5rem 0;
				}
				.linkedin-article-body blockquote {
					border-left: 3px solid #cbd5e1;
					margin: 0.75rem 0;
					padding-left: 1rem;
					color: #475569;
				}
				.linkedin-article-body ul,
				.linkedin-article-body ol {
					margin: 0.5rem 0 0.5rem 1.25rem;
				}
				.linkedin-article-body img {
					max-width: 100%;
					border-radius: 0.5rem;
					margin: 0.75rem 0;
				}
				.linkedin-article-body pre {
					background: #f1f5f9;
					border-radius: 0.5rem;
					padding: 0.75rem 1rem;
					overflow-x: auto;
					font-size: 0.875rem;
				}
				.linkedin-article-body hr {
					border: none;
					border-top: 1px solid #e2e8f0;
					margin: 1.25rem 0;
				}
			`}</style>
		</div>
	);
}

function ToolBtn({
	icon,
	onClick,
}: {
	icon: ReactNode;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="rounded-md p-2 text-slate-600 transition hover:bg-slate-100"
		>
			{icon}
		</button>
	);
}

function ToolbarDivider() {
	return <span className="mx-0.5 h-6 w-px bg-slate-200" />;
}
