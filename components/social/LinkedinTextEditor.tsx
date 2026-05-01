"use client";

import { ReactNode, useMemo, useRef, useState } from "react";

import {
	IconArrowBackUp,
	IconArrowForwardUp,
	IconBold,
	IconEraser,
	IconItalic,
	IconList,
	IconListNumbers,
	IconMoodSmile,
	IconPhoto,
	IconUnderline,
} from "@tabler/icons-react";

export function LinkedinTextEditor({
	value,
	onChange,
	rows = 12,
	placeholder = "Write here...",
	onUploadImage,
	onImageUploaded,
	insertUploadedImageUrl = true,
}: {
	value: string;
	onChange: (next: string) => void;
	rows?: number;
	placeholder?: string;
	onUploadImage?: (file: File) => Promise<string>;
	onImageUploaded?: (url: string) => void;
	insertUploadedImageUrl?: boolean;
}) {
	const ref = useRef<HTMLTextAreaElement | null>(null);
	const fileRef = useRef<HTMLInputElement | null>(null);
	const [emojiOpen, setEmojiOpen] = useState(false);
	const [uploading, setUploading] = useState(false);

	const replaceSelection = (updater: (selected: string) => string) => {
		const el = ref.current;
		if (!el) return;
		const start = el.selectionStart;
		const end = el.selectionEnd;
		const selected = value.slice(start, end);
		const nextSelected = updater(selected || "");
		const next = `${value.slice(0, start)}${nextSelected}${value.slice(end)}`;
		onChange(next);
		requestAnimationFrame(() => {
			el.focus();
			const cursor = start + nextSelected.length;
			el.setSelectionRange(cursor, cursor);
		});
	};

	const prefixLines = (prefixer: (line: string, idx: number) => string) => {
		const el = ref.current;
		if (!el) return;
		const start = el.selectionStart;
		const end = el.selectionEnd;
		const from = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
		const to = end < value.length ? value.indexOf("\n", end) : -1;
		const sectionEnd = to === -1 ? value.length : to;
		const section = value.slice(from, sectionEnd);
		const nextSection = section
			.split("\n")
			.map((line, idx) => prefixer(line, idx))
			.join("\n");
		onChange(`${value.slice(0, from)}${nextSection}${value.slice(sectionEnd)}`);
	};

	const insertAtCursor = (snippet: string) => {
		const el = ref.current;
		if (!el) return;
		const start = el.selectionStart;
		const end = el.selectionEnd;
		const next = `${value.slice(0, start)}${snippet}${value.slice(end)}`;
		onChange(next);
		requestAnimationFrame(() => {
			el.focus();
			const cursor = start + snippet.length;
			el.setSelectionRange(cursor, cursor);
		});
	};

	const emojiList = useMemo(
		() => ["😀", "😂", "😍", "🔥", "🚀", "💡", "🎯", "📈", "✅", "👏", "🙌", "🤝", "⭐", "💼", "📣", "📌", "🧠", "⚡", "🎉", "🙏"],
		[]
	);
	const insertEmoji = (emoji: string) => {
		insertAtCursor(emoji);
		setEmojiOpen(false);
	};
	const onPickImage = async (file?: File | null) => {
		if (!file) return;
		if (!file.type.startsWith("image/")) return;
		try {
			setUploading(true);
			let url = "";
			if (onUploadImage) {
				url = await onUploadImage(file);
			} else {
				url = URL.createObjectURL(file);
			}
			if (url) {
				onImageUploaded?.(url);
				if (insertUploadedImageUrl) {
					insertAtCursor(`\n${url}\n`);
				}
			}
		} finally {
			setUploading(false);
		}
	};

	return (
		<div className="overflow-hidden rounded-xl border border-slate-200">
			<div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-2">
				<ToolButton
					icon={<IconBold className="h-4 w-4" />}
					onClick={() => replaceSelection((text) => toggleUnicodeStyle(text, "bold"))}
				/>
				<ToolButton
					icon={<IconItalic className="h-4 w-4" />}
					onClick={() =>
						replaceSelection((text) => toggleUnicodeStyle(text, "italic"))
					}
				/>
				<ToolButton
					icon={<IconUnderline className="h-4 w-4" />}
					onClick={() => replaceSelection((text) => toggleCombining(text, "\u0332"))}
				/>

				<span className="mx-1 h-6 w-px bg-slate-200" />
				<ToolButton
					icon={<IconMoodSmile className="h-4 w-4" />}
					onClick={() => setEmojiOpen((v) => !v)}
				/>
				<ToolButton
					icon={<IconPhoto className="h-4 w-4" />}
					onClick={() => fileRef.current?.click()}
				/>
				<span className="mx-1 h-6 w-px bg-slate-200" />
				<ToolButton
					icon={<IconArrowBackUp className="h-4 w-4" />}
					onClick={() => document.execCommand("undo")}
				/>
				<ToolButton
					icon={<IconArrowForwardUp className="h-4 w-4" />}
					onClick={() => document.execCommand("redo")}
				/>
				<ToolButton
					icon={<IconEraser className="h-4 w-4" />}
					onClick={() =>
						replaceSelection((text) => removeUnicodeDecorations(text))
					}
				/>
				<ToolButton
					icon={<IconList className="h-4 w-4" />}
					onClick={() => prefixLines((line) => (line.startsWith("• ") ? line : `• ${line}`))}
				/>
				<ToolButton
					icon={<IconListNumbers className="h-4 w-4" />}
					onClick={() =>
						prefixLines((line, idx) =>
							/^\d+\.\s/.test(line) ? line : `${idx + 1}. ${line}`
						)
					}
				/>
			</div>
			{emojiOpen && (
				<div className="border-b border-slate-200 bg-white px-2 py-2">
					<div className="grid grid-cols-10 gap-1">
						{emojiList.map((emoji) => (
							<button
								key={emoji}
								type="button"
								onClick={() => insertEmoji(emoji)}
								className="rounded-md p-1 text-lg hover:bg-slate-100"
							>
								{emoji}
							</button>
						))}
					</div>
				</div>
			)}
			<textarea
				ref={ref}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				rows={rows}
				className="w-full resize-none px-3 py-2.5 text-sm leading-relaxed text-slate-800 outline-none"
			/>
			<input
				ref={fileRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={(event) => {
					const file = event.target.files?.[0];
					onPickImage(file);
					event.currentTarget.value = "";
				}}
			/>
			{uploading && (
				<div className="border-t border-slate-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
					Uploading image...
				</div>
			)}
		</div>
	);
}

function ToolButton({
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
			className="rounded-md border border-transparent p-2 text-slate-600 transition hover:border-slate-200 hover:bg-white"
		>
			{icon}
		</button>
	);
}

const PLAIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const BOLD = "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵";
const ITALIC = "𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻0123456789";

const makeMap = (from: string, to: string) => {
	const map = new Map<string, string>();
	const fromChars = Array.from(from);
	const toChars = Array.from(to);
	for (let i = 0; i < Math.min(fromChars.length, toChars.length); i++) {
		map.set(fromChars[i], toChars[i]);
	}
	return map;
};

const PLAIN_TO_BOLD = makeMap(PLAIN, BOLD);
const PLAIN_TO_ITALIC = makeMap(PLAIN, ITALIC);
const BOLD_TO_PLAIN = makeMap(BOLD, PLAIN);
const ITALIC_TO_PLAIN = makeMap(ITALIC, PLAIN);

const applyMap = (input: string, map: Map<string, string>) =>
	Array.from(input)
		.map((ch) => map.get(ch) || ch)
		.join("");

const normalizeUnicodeStyles = (input: string) =>
	applyMap(applyMap(input, BOLD_TO_PLAIN), ITALIC_TO_PLAIN);

const toggleUnicodeStyle = (input: string, style: "bold" | "italic") => {
	if (!input) return input;
	const normalized = normalizeUnicodeStyles(input);
	const styled = applyMap(
		normalized,
		style === "bold" ? PLAIN_TO_BOLD : PLAIN_TO_ITALIC
	);
	return styled === input ? normalized : styled;
};

const toggleCombining = (input: string, marker: string) => {
	if (!input) return input;
	const hasMarker = input.includes(marker);
	if (hasMarker) return input.split(marker).join("");
	return Array.from(input)
		.map((ch) => (/\s/.test(ch) ? ch : `${ch}${marker}`))
		.join("");
};

const removeUnicodeDecorations = (input: string) =>
	normalizeUnicodeStyles(input).replace(/\u0332|\u0336/g, "");
