"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
	DangerButton,
	InlineAlert,
	LoadingCardGrid,
	MetaRow,
	PageHeader,
	PageShell,
	PrimaryButton,
	SecondaryButton,
	SectionTitle,
	StatusPill,
	SurfaceCard,
} from "@/components/social/SocialUi";
import {
	getTelegramStatus,
	linkTelegramBot,
	unlinkTelegramBot,
} from "@/utils/api/socialClient";
import { IconBrandTelegram } from "@tabler/icons-react";

export default function TelegramSetupPage() {
	const [loading, setLoading] = useState(true);
	const [telegram, setTelegram] = useState<{
		linked: boolean;
		chatId: string | null;
		linkedAt: string | null;
	} | null>(null);
	const [botToken, setBotToken] = useState("");
	const [chatIdInput, setChatIdInput] = useState("");
	const [busy, setBusy] = useState(false);

	const load = async () => {
		try {
			setLoading(true);
			const status = await getTelegramStatus();
			setTelegram(status);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to load");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	const onLink = async () => {
		if (!botToken.trim()) {
			toast.error("Paste a bot token from @BotFather");
			return;
		}
		try {
			setBusy(true);
			const result = await linkTelegramBot({
				botToken: botToken.trim(),
				chatId: chatIdInput.trim() || undefined,
			});
			toast.success(
				`Linked to @${result.bot || "bot"} — chat ${result.chatId}`
			);
			setBotToken("");
			setChatIdInput("");
			await load();
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message ||
					(err instanceof Error ? err.message : "Link failed")
			);
		} finally {
			setBusy(false);
		}
	};

	const onUnlink = async () => {
		try {
			setBusy(true);
			await unlinkTelegramBot();
			toast.success("Telegram unlinked");
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Unlink failed");
		} finally {
			setBusy(false);
		}
	};

	return (
		<PageShell>
			<PageHeader
				eyebrow="Telegram"
				title="Approve drafts from your phone"
				description="Use your own bot + your own chat. We never proxy through a shared account, so your LinkedIn stays fully owned by you."
			/>

			{loading ? (
				<LoadingCardGrid cards={3} />
			) : (
				<>
					<SurfaceCard>
						<SectionTitle
							title="Status"
							action={
								<StatusPill
									status={telegram?.linked ? "connected" : "disconnected"}
								/>
							}
						/>
						{telegram?.linked ? (
							<MetaRow
								items={[
									{ label: "Chat ID", value: telegram.chatId },
									{
										label: "Linked at",
										value: telegram.linkedAt
											? new Date(telegram.linkedAt).toLocaleString()
											: "—",
									},
								]}
							/>
						) : (
							<p className="text-sm text-slate-500">
								Follow the three steps below to wire up Telegram approval.
							</p>
						)}
						{telegram?.linked && (
							<div className="mt-4 flex flex-wrap gap-2">
								<DangerButton onClick={onUnlink} disabled={busy}>
									Unlink Telegram
								</DangerButton>
							</div>
						)}
					</SurfaceCard>

					<SurfaceCard>
						<SectionTitle
							title="Step 1 · Create a Telegram bot"
							description="Chat @BotFather on Telegram, run /newbot, name it whatever you want."
						/>
						<ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-600">
							<li>
								Open a chat with{" "}
								<a
									className="text-blue-600 hover:text-blue-700"
									href="https://t.me/BotFather"
									target="_blank"
									rel="noreferrer"
								>
									@BotFather
								</a>{" "}
								on Telegram.
							</li>
							<li>
								Send <code className="rounded bg-slate-100 px-1">/newbot</code>, pick
								a display name, pick a username ending in <code>bot</code>.
							</li>
							<li>
								BotFather will reply with an HTTP API token that looks like{" "}
								<code className="rounded bg-slate-100 px-1">
									123456:ABC-DEF…
								</code>
								. Copy it.
							</li>
							<li>
								Open your bot in Telegram and send it{" "}
								<code className="rounded bg-slate-100 px-1">/start</code> so we can
								auto-detect your chat id.
							</li>
						</ol>
					</SurfaceCard>

					<SurfaceCard>
						<SectionTitle
							title="Step 2 · Link the bot"
							description="Paste the bot token. If you already sent /start, you can leave chat id blank — we&apos;ll discover it. Webhook is auto-configured by the backend."
						/>
						<div className="space-y-3">
							<Field
								label="Bot token"
								value={botToken}
								onChange={setBotToken}
								placeholder="123456:ABC-DEF-ghIjkl…"
								required
							/>
							<Field
								label="Chat ID (optional)"
								value={chatIdInput}
								onChange={setChatIdInput}
								placeholder="Auto-detected after you /start the bot"
							/>
							<div>
								<PrimaryButton onClick={onLink} disabled={busy}>
									<IconBrandTelegram className="h-4 w-4" />
									{telegram?.linked ? "Relink Telegram" : "Link Telegram"}
								</PrimaryButton>
							</div>
						</div>
					</SurfaceCard>

					{telegram?.linked && (
						<InlineAlert
							tone="success"
							title="You&apos;re wired up"
							description="Every new draft lands in Telegram with Approve / Reject / Post now buttons. You can also chat naturally: 'I want to post', 'status of yesterday post', or 'engagement of last 7 days'."
						/>
					)}
				</>
			)}
		</PageShell>
	);
}

function Field({
	label,
	value,
	onChange,
	placeholder,
	required,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	required?: boolean;
}) {
	return (
		<label className="block">
			<span className="mb-1.5 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-600">
				<span>{label}</span>
				{required && <span className="text-rose-500">Required</span>}
			</span>
			<input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
			/>
		</label>
	);
}
