"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
	DangerButton,
	InlineAlert,
	LoadingCardGrid,
	PageHeader,
	PageShell,
	PrimaryButton,
	SecondaryButton,
	SectionTitle,
	StatusPill,
	SurfaceCard,
} from "@/components/social/SocialUi";
import {
	AccountPreferences,
	disableSocialAccess,
	enableSocialAccess,
	getAccountPreferences,
	getSocialAccess,
	rotateSocialAccessKey,
	SocialAccessResponse,
	updateAccountPreferences,
	updateSocialSettings,
} from "@/utils/api/socialClient";
import {
	IconCopy,
	IconKey,
	IconShieldCheck,
} from "@tabler/icons-react";

export default function SocialSettingsPage() {
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState(false);
	const [access, setAccess] = useState<SocialAccessResponse | null>(null);
	const [prefs, setPrefs] = useState<AccountPreferences | null>(null);
	const [linkedinExternalUrl, setLinkedinExternalUrl] = useState(
		"https://www.linkedin.com/feed/"
	);
	const [commentsApprovalMode, setCommentsApprovalMode] = useState(false);
	const [desktopAgentEnabled, setDesktopAgentEnabled] = useState(false);

	const load = async () => {
		try {
			setLoading(true);
			const [accessData, prefsData] = await Promise.all([
				getSocialAccess(),
				getAccountPreferences().catch(() => null),
			]);
			setAccess(accessData);
			setLinkedinExternalUrl(
				accessData.linkedinExternalUrl || "https://www.linkedin.com/feed/"
			);
			setCommentsApprovalMode(!!accessData.commentsApprovalMode);
			setDesktopAgentEnabled(!!accessData.desktopAgentEnabled);
			if (prefsData) setPrefs(prefsData);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to load");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	const saveAccountSettings = async () => {
		try {
			setBusy(true);
			await updateSocialSettings({
				desktopAgentEnabled,
				commentsApprovalMode,
				linkedinExternalUrl,
			});
			toast.success("Account settings saved");
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Save failed");
		} finally {
			setBusy(false);
		}
	};

	const savePrefs = async (patch: Partial<AccountPreferences>) => {
		try {
			setBusy(true);
			await updateAccountPreferences(patch);
			toast.success("Preferences saved");
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Save failed");
		} finally {
			setBusy(false);
		}
	};

	const rotate = async () => {
		try {
			setBusy(true);
			const data = await rotateSocialAccessKey();
			toast.success("Access key rotated");
			setAccess((prev) =>
				prev ? { ...prev, accessKey: data.accessKey } : prev
			);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Rotate failed");
		} finally {
			setBusy(false);
		}
	};

	const toggleAccess = async () => {
		try {
			setBusy(true);
			if (access?.enabled) {
				await disableSocialAccess();
				toast.success("Social service disabled");
			} else {
				await enableSocialAccess(desktopAgentEnabled);
				toast.success("Social service enabled");
			}
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Toggle failed");
		} finally {
			setBusy(false);
		}
	};

	const copyKey = () => {
		if (!access?.accessKey) return;
		try {
			navigator.clipboard.writeText(access.accessKey);
			toast.success("Copied access key");
		} catch {
			toast.error("Copy failed");
		}
	};

	return (
		<PageShell>
			<PageHeader
				eyebrow="Settings"
				title="Agent + approval preferences"
				description="Control how drafts are approved, how aggressively the agent ships, and which account owns access."
			/>

			{loading ? (
				<LoadingCardGrid cards={3} />
			) : (
				<>
					<SurfaceCard>
						<SectionTitle
							title="Social service status"
							description="Turn the whole SocialSniper subsystem on/off for this account."
							action={
								<StatusPill
									status={access?.enabled ? "connected" : "disconnected"}
									label={access?.enabled ? "Enabled" : "Disabled"}
								/>
							}
						/>
						<div className="flex flex-wrap items-center gap-2">
							{access?.enabled ? (
								<DangerButton onClick={toggleAccess} disabled={busy}>
									Disable SocialSniper
								</DangerButton>
							) : (
								<PrimaryButton onClick={toggleAccess} disabled={busy}>
									Enable SocialSniper
								</PrimaryButton>
							)}
						</div>
					</SurfaceCard>

					{prefs && (
						<SurfaceCard>
							<SectionTitle
								title="Approval routing"
								description="Where drafts should land for human review."
							/>
							<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
								{(["telegram", "dashboard"] as const).map((channel) => {
									const active = prefs.approvalChannel === channel;
									const linked =
										channel === "telegram"
											? prefs.telegramLinked
											: true;
									return (
										<button
											key={channel}
											onClick={() =>
												savePrefs({ approvalChannel: channel })
											}
											disabled={busy}
											className={`rounded-xl border p-4 text-left transition ${
												active
													? "border-blue-500 bg-blue-50"
													: "border-slate-200 bg-white hover:border-blue-200"
											}`}
										>
											<div className="flex items-center justify-between">
												<p className="text-sm font-semibold capitalize text-slate-900">
													{channel}
												</p>
												{active && (
													<IconShieldCheck className="h-4 w-4 text-blue-600" />
												)}
											</div>
											<p className="mt-1 text-xs text-slate-500">
												{channel === "telegram" &&
													"Approve from your phone. Recommended."}
												{channel === "dashboard" &&
													"Approve only from this dashboard."}
											</p>
											<div className="mt-2">
												<StatusPill
													tone={linked ? "positive" : "warning"}
													label={linked ? "Ready" : "Not linked"}
												/>
											</div>
										</button>
									);
								})}
							</div>
							{prefs.approvalChannel === "telegram" && !prefs.telegramLinked && (
								<InlineAlert
									tone="warning"
									title="Telegram isn&apos;t linked yet"
									description="Drafts will queue in the dashboard until you link Telegram."
									action={
										<Link href="/social/telegram">
											<PrimaryButton>Link Telegram</PrimaryButton>
										</Link>
									}
								/>
							)}

							<div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
								<ToggleCard
									title="Auto-approve high-confidence drafts"
									description="Drafts above the threshold skip human review and go straight to scheduled."
									checked={prefs.autoMode}
									onChange={(v) => savePrefs({ autoMode: v })}
								/>
								<div className="rounded-xl border border-slate-200 p-4">
									<p className="text-sm font-semibold text-slate-900">
										Auto-approve confidence threshold
									</p>
									<p className="mt-1 text-xs text-slate-500">
										The LLM&apos;s self-reported confidence must be at or above
										this to auto-approve.
									</p>
									<div className="mt-3 flex items-center gap-3">
										<input
											type="range"
											min={50}
											max={99}
											value={prefs.autoConfidenceThreshold}
											onChange={(e) =>
												setPrefs({
													...prefs,
													autoConfidenceThreshold: Number(e.target.value),
												})
											}
											onMouseUp={() =>
												savePrefs({
													autoConfidenceThreshold:
														prefs.autoConfidenceThreshold,
												})
											}
											className="flex-1"
										/>
										<span className="w-10 text-right text-sm font-semibold text-slate-800">
											{prefs.autoConfidenceThreshold}%
										</span>
									</div>
								</div>
							</div>
						</SurfaceCard>
					)}

					{prefs && (
						<SurfaceCard>
							<SectionTitle
								title="Agent posting window"
								description="When the agent is allowed to actually publish. Drafts still generate any time."
							/>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
								<ToggleCard
									title="Agent enabled"
									description="Turn the autonomous run loops on/off without disabling the whole service."
									checked={prefs.agentEnabled}
									onChange={(v) => savePrefs({ agentEnabled: v })}
								/>
								<div className="rounded-xl border border-slate-200 p-4">
									<p className="text-sm font-semibold text-slate-900">
										Daily post limit
									</p>
									<p className="mt-1 text-xs text-slate-500">
										Maximum number of posts the agent may publish per day.
									</p>
									<input
										type="number"
										min={1}
										max={10}
										value={prefs.dailyPostLimit}
										onChange={(e) =>
											setPrefs({
												...prefs,
												dailyPostLimit: Number(e.target.value),
											})
										}
										onBlur={() =>
											savePrefs({ dailyPostLimit: prefs.dailyPostLimit })
										}
										className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
									/>
								</div>
								<div className="rounded-xl border border-slate-200 p-4">
									<p className="text-sm font-semibold text-slate-900">
										Publish window
									</p>
									<p className="mt-1 text-xs text-slate-500">
										Posts with no explicit schedule publish within this window.
									</p>
									<div className="mt-3 flex items-center gap-2">
										<input
											type="time"
											value={prefs.postingWindowStart}
											onChange={(e) =>
												setPrefs({
													...prefs,
													postingWindowStart: e.target.value,
												})
											}
											onBlur={() =>
												savePrefs({
													postingWindowStart: prefs.postingWindowStart,
												})
											}
											className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
										/>
										<span className="text-slate-400">→</span>
										<input
											type="time"
											value={prefs.postingWindowEnd}
											onChange={(e) =>
												setPrefs({
													...prefs,
													postingWindowEnd: e.target.value,
												})
											}
											onBlur={() =>
												savePrefs({
													postingWindowEnd: prefs.postingWindowEnd,
												})
											}
											className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
										/>
									</div>
								</div>
							</div>
						</SurfaceCard>
					)}

					<SurfaceCard>
						<SectionTitle
							title="Other account settings"
							description="Legacy flags from earlier SocialSniper builds."
						/>
						<div className="space-y-4">
							<ToggleCard
								title="Desktop agent access"
								description="Allow the SocialSniper desktop companion to call the service using this account&apos;s access key."
								checked={desktopAgentEnabled}
								onChange={setDesktopAgentEnabled}
							/>
							<ToggleCard
								title="Comments approval mode"
								description="When on, outbound comments also route through approvals (Telegram or dashboard)."
								checked={commentsApprovalMode}
								onChange={setCommentsApprovalMode}
							/>
							<div className="rounded-xl border border-slate-200 p-4">
								<p className="text-sm font-semibold text-slate-900">
									LinkedIn external URL
								</p>
								<p className="mt-1 text-xs text-slate-500">
									Where the sidebar &quot;Open LinkedIn&quot; link points. Default is
									your feed.
								</p>
								<input
									value={linkedinExternalUrl}
									onChange={(e) => setLinkedinExternalUrl(e.target.value)}
									placeholder="https://www.linkedin.com/feed/"
									className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
								/>
							</div>
							<div>
								<PrimaryButton
									onClick={saveAccountSettings}
									disabled={busy}
								>
									Save account settings
								</PrimaryButton>
							</div>
						</div>
					</SurfaceCard>

					<SurfaceCard>
						<SectionTitle
							title="Service access key"
							description="Used by the background services and desktop agent to call this account&apos;s social endpoints."
							action={
								<div className="flex gap-2">
									<SecondaryButton onClick={copyKey}>
										<IconCopy className="h-4 w-4" />
										Copy
									</SecondaryButton>
									<DangerButton onClick={rotate} disabled={busy}>
										<IconKey className="h-4 w-4" />
										Rotate
									</DangerButton>
								</div>
							}
						/>
						<code className="block break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
							{access?.accessKey || "Not generated yet"}
						</code>
						<InlineAlert
							tone="warning"
							title="Treat this like a password"
							description="Rotating invalidates any tool that was calling the service with the old key."
						/>
					</SurfaceCard>
				</>
			)}
		</PageShell>
	);
}

function ToggleCard({
	title,
	description,
	checked,
	onChange,
}: {
	title: string;
	description: string;
	checked: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<button
			onClick={() => onChange(!checked)}
			className={`w-full rounded-xl border p-4 text-left transition ${
				checked
					? "border-blue-500 bg-blue-50"
					: "border-slate-200 bg-white hover:border-blue-200"
			}`}
		>
			<div className="flex items-center justify-between">
				<p className="text-sm font-semibold text-slate-900">{title}</p>
				<div
					className={`flex h-5 w-9 items-center rounded-full transition ${
						checked ? "bg-blue-600" : "bg-slate-300"
					}`}
				>
					<div
						className={`h-4 w-4 transform rounded-full bg-white shadow transition ${
							checked ? "translate-x-4" : "translate-x-0.5"
						}`}
					/>
				</div>
			</div>
			<p className="mt-1 text-xs text-slate-500">{description}</p>
		</button>
	);
}
