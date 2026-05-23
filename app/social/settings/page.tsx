"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	AccountPreferences,
	getAccountPreferences,
	getSocialAccess,
	SocialAccessResponse,
	updateAccountPreferences,
	updateSocialSettings,
} from "@/utils/api/socialClient";
import { changePassword, updateProfile } from "@/utils/api/authClient";
import apiClient from "@/utils/api/apiClient";
import { IconShieldCheck, IconUser, IconLock, IconSettings, IconBuilding } from "@tabler/icons-react";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

interface ProfileData {
	email: string;
	firstName: string;
	lastName: string;
	companyAddress?: string;
	companyZipcode?: string;
	companyCity?: string;
	companyCountry?: string;
}

interface PasswordData {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
}

const HUMANIZER_LEVELS = [
	{
		value: "off",
		label: "Off",
		icon: "🔇",
		description: "No changes. Raw AI output.",
	},
	{
		value: "light",
		label: "Light",
		icon: "✨",
		description: "Strip corporate jargon & clichés only.",
	},
	{
		value: "medium",
		label: "Medium",
		icon: "🔥",
		description: "AI rewrite + anti-AI pattern check.",
	},
	{
		value: "heavy",
		label: "Heavy",
		icon: "💀",
		description: "Max founder voice. Short, punchy, raw.",
	},
] as const;

// -----------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------

export default function SocialSettingsPage() {
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("profile");

	// Data states
	const [access, setAccess] = useState<SocialAccessResponse | null>(null);
	const [prefs, setPrefs] = useState<AccountPreferences | null>(null);
	const [profile, setProfile] = useState<ProfileData>({
		email: "",
		firstName: "",
		lastName: "",
		companyAddress: "",
		companyZipcode: "",
		companyCity: "",
		companyCountry: "",
	});

	// Account settings state (local only, saved together)
	const [linkedinExternalUrl, setLinkedinExternalUrl] = useState("https://www.linkedin.com/feed/");
	const [commentsApprovalMode, setCommentsApprovalMode] = useState(false);

	// Password state
	const [passwordData, setPasswordData] = useState<PasswordData>({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	// Loading states for each section
	const [savingProfile, setSavingProfile] = useState(false);
	const [savingPrefs, setSavingPrefs] = useState(false);
	const [savingPassword, setSavingPassword] = useState(false);
	const [savingAccount, setSavingAccount] = useState(false);

	// Load all data on mount
	const load = async () => {
		try {
			setLoading(true);
			const [accessData, prefsData, profileRes] = await Promise.all([
				getSocialAccess(),
				getAccountPreferences().catch(() => null),
				apiClient.get("/settings/profile").catch(() => null),
			]);

			setAccess(accessData);
			setLinkedinExternalUrl(accessData.linkedinExternalUrl || "https://www.linkedin.com/feed/");
			setCommentsApprovalMode(!!accessData.commentsApprovalMode);

			if (prefsData) {
				setPrefs(prefsData);
			}

			if (profileRes?.data) {
				const data = profileRes.data?.payload?.data ?? profileRes.data?.data ?? profileRes.data;
				setProfile((prev) => ({
					...prev,
					...data,
					email: data.email || prev.email,
					firstName: data.firstName || "",
					lastName: data.lastName || "",
					companyAddress: data.companyAddress || "",
					companyZipcode: data.companyZipcode || "",
					companyCity: data.companyCity || "",
					companyCountry: data.companyCountry || "",
				}));
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to load settings");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	// -----------------------------------------------------------------------
	// Profile Handlers
	// -----------------------------------------------------------------------

	const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setProfile((prev) => ({ ...prev, [name]: value }));
	};

	const saveProfile = async () => {
		if (!profile.firstName?.trim() || !profile.lastName?.trim()) {
			toast.error("First name and last name are required");
			return;
		}

		try {
			setSavingProfile(true);
			const payload = {
				firstName: profile.firstName,
				lastName: profile.lastName,
				companyAddress: profile.companyAddress,
				companyZipcode: profile.companyZipcode,
				companyCity: profile.companyCity,
				companyCountry: profile.companyCountry,
			};
			await apiClient.put("/settings/profile", payload);
			toast.success("Profile saved successfully");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to save profile");
		} finally {
			setSavingProfile(false);
		}
	};

	// -----------------------------------------------------------------------
	// Preferences Handlers
	// -----------------------------------------------------------------------

	const updatePrefState = (patch: Partial<AccountPreferences>) => {
		setPrefs((prev) => (prev ? { ...prev, ...patch } : null))
	};

	const savePreferences = async () => {
		if (!prefs) return;

		try {
			setSavingPrefs(true);
			await updateAccountPreferences({
				approvalChannel: prefs.approvalChannel,
				autoMode: prefs.autoMode,
				autoConfidenceThreshold: prefs.autoConfidenceThreshold,
				humanizerLevel: prefs.humanizerLevel,
				agentEnabled: prefs.agentEnabled,
				dailyPostLimit: prefs.dailyPostLimit,
				postingWindowStart: prefs.postingWindowStart,
				postingWindowEnd: prefs.postingWindowEnd,
			});
			toast.success("Preferences saved successfully");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to save preferences");
		} finally {
			setSavingPrefs(false);
		}
	};

	// -----------------------------------------------------------------------
	// Password Handlers
	// -----------------------------------------------------------------------

	const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setPasswordData((prev) => ({ ...prev, [name]: value }));
	};

	const savePassword = async () => {
		if (passwordData.newPassword !== passwordData.confirmPassword) {
			toast.error("New passwords do not match");
			return;
		}

		if (passwordData.newPassword.length < 8) {
			toast.error("New password must be at least 8 characters");
			return;
		}

		try {
			setSavingPassword(true);
			await changePassword({
				currentPassword: passwordData.currentPassword,
				newPassword: passwordData.newPassword,
				confirmPassword: passwordData.confirmPassword,
			});
			toast.success("Password changed successfully");
			setPasswordData({
				currentPassword: "",
				newPassword: "",
				confirmPassword: "",
			});
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to change password");
		} finally {
			setSavingPassword(false);
		}
	};

	// -----------------------------------------------------------------------
	// Account Settings Handlers
	// -----------------------------------------------------------------------

	const saveAccountSettings = async () => {
		try {
			setSavingAccount(true);
			await updateSocialSettings({
				commentsApprovalMode,
				linkedinExternalUrl,
			});
			toast.success("Account settings saved");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to save account settings");
		} finally {
			setSavingAccount(false);
		}
	};

	// -----------------------------------------------------------------------
	// Render
	// -----------------------------------------------------------------------

	if (loading) {
		return (
			<PageShell>
				<PageHeader
					eyebrow="Settings"
					title="Manage your SocialSnipper settings"
					description="Configure your profile, preferences, and security settings."
				/>
				<LoadingCardGrid cards={3} />
			</PageShell>
		);
	}

	return (
		<PageShell>
			<PageHeader
				eyebrow="Settings"
				title="Manage your SocialSnipper settings"
				description="Configure your profile, preferences, and security settings. Changes are saved only when you click the Save button."
			/>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="mb-6">
					<TabsTrigger value="profile" className="gap-2">
						<IconUser className="h-4 w-4" />
						Profile
					</TabsTrigger>
					<TabsTrigger value="preferences" className="gap-2">
						<IconSettings className="h-4 w-4" />
						Preferences
					</TabsTrigger>
					<TabsTrigger value="security" className="gap-2">
						<IconLock className="h-4 w-4" />
						Security
					</TabsTrigger>
					<TabsTrigger value="account" className="gap-2">
						<IconBuilding className="h-4 w-4" />
						Account
					</TabsTrigger>
				</TabsList>

				{/* Profile Tab */}
				<TabsContent value="profile" className="space-y-6">
					<SurfaceCard>
						<SectionTitle
							title="Personal Information"
							description="Update your name and contact details."
						/>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<label className="block text-sm font-medium text-slate-700">
									First Name <span className="text-rose-500">*</span>
								</label>
								<Input
									type="text"
									name="firstName"
									value={profile.firstName}
									onChange={handleProfileChange}
									placeholder="First name"
								/>
							</div>
							<div className="space-y-2">
								<label className="block text-sm font-medium text-slate-700">
									Last Name <span className="text-rose-500">*</span>
								</label>
								<Input
									type="text"
									name="lastName"
									value={profile.lastName}
									onChange={handleProfileChange}
									placeholder="Last name"
								/>
							</div>
							<div className="md:col-span-2 space-y-2">
								<label className="block text-sm font-medium text-slate-700">
									Email Address
								</label>
								<Input
									type="email"
									value={profile.email}
									disabled
									placeholder="email@example.com"
									className="bg-slate-50"
								/>
								<p className="text-xs text-slate-500">
									Your email is read-only. Contact support to change it.
								</p>
							</div>
						</div>
					</SurfaceCard>

					<SurfaceCard>
						<SectionTitle
							title="Company Address"
							description="Your business address for billing and compliance."
						/>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="md:col-span-2 space-y-2">
								<label className="block text-sm font-medium text-slate-700">Address</label>
								<Input
									type="text"
									name="companyAddress"
									value={profile.companyAddress || ""}
									onChange={handleProfileChange}
									placeholder="Street, Area"
								/>
							</div>
							<div className="space-y-2">
								<label className="block text-sm font-medium text-slate-700">City</label>
								<Input
									type="text"
									name="companyCity"
									value={profile.companyCity || ""}
									onChange={handleProfileChange}
									placeholder="City"
								/>
							</div>
							<div className="space-y-2">
								<label className="block text-sm font-medium text-slate-700">Zip / Postal Code</label>
								<Input
									type="text"
									name="companyZipcode"
									value={profile.companyZipcode || ""}
									onChange={handleProfileChange}
									placeholder="Zip / Postal"
								/>
							</div>
							<div className="space-y-2">
								<label className="block text-sm font-medium text-slate-700">Country</label>
								<Input
									type="text"
									name="companyCountry"
									value={profile.companyCountry || ""}
									onChange={handleProfileChange}
									placeholder="Country"
								/>
							</div>
						</div>
					</SurfaceCard>

					<div className="flex justify-end">
						<PrimaryButton onClick={saveProfile} disabled={savingProfile}>
							{savingProfile ? "Saving..." : "Save Profile"}
						</PrimaryButton>
					</div>
				</TabsContent>

				{/* Preferences Tab */}
				<TabsContent value="preferences" className="space-y-6">
					{!access?.enabled ? (
						<InlineAlert
							tone="warning"
							title="SocialSnipper is disabled"
							description="Enable SocialSnipper in the Account tab to configure preferences."
						/>
					) : !prefs ? (
						<InlineAlert
							tone="warning"
							title="Preferences not available"
							description="Unable to load preferences. Please try again later."
						/>
					) : (
						<>
							<SurfaceCard>
								<SectionTitle
									title="Approval routing"
									description="Where drafts should land for human review."
								/>
								<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
									{(["telegram", "dashboard", "whatsapp"] as const).map((channel) => {
										const active = prefs.approvalChannel === channel;
										const linked =
											channel === "telegram"
												? prefs.telegramLinked
												: channel === "whatsapp"
													? prefs.whatsappLinked
													: true;
										return (
											<button
												key={channel}
												onClick={() => updatePrefState({ approvalChannel: channel })}
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
													{channel === "whatsapp" &&
														"Approve via WhatsApp messages."}
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
										title="Telegram isn't linked yet"
										description="Drafts will queue in the dashboard until you link Telegram."
										action={
											<Link href="/social/telegram">
												<PrimaryButton>Link Telegram</PrimaryButton>
											</Link>
										}
									/>
								)}
							</SurfaceCard>

							<SurfaceCard>
								<SectionTitle
									title="Auto-approval"
									description="Configure when drafts should skip human review."
								/>
								<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
									<ToggleCard
										title="Auto-approve high-confidence drafts"
										description="Drafts above the threshold skip human review and go straight to scheduled."
										checked={prefs.autoMode}
										onChange={(v) => updatePrefState({ autoMode: v })}
									/>
									<div className="rounded-xl border border-slate-200 p-4">
										<p className="text-sm font-semibold text-slate-900">
											Auto-approve confidence threshold
										</p>
										<p className="mt-1 text-xs text-slate-500">
											The LLM's self-reported confidence must be at or above
											this to auto-approve.
										</p>
										<div className="mt-3 flex items-center gap-3">
											<input
												type="range"
												min={50}
												max={99}
												value={prefs.autoConfidenceThreshold}
												onChange={(e) =>
													updatePrefState({
														autoConfidenceThreshold: Number(e.target.value),
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

							<SurfaceCard>
								<SectionTitle
									title="Humanizer intensity"
									description="Control how aggressively the AI strips corporate-sounding patterns from drafts."
								/>
								<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
									{HUMANIZER_LEVELS.map((level) => {
										const active = (prefs.humanizerLevel || "medium") === level.value;
										return (
											<button
												key={level.value}
												onClick={() =>
													updatePrefState({ humanizerLevel: level.value as any })
												}
												className={`rounded-xl border p-4 text-left transition ${
													active
														? "border-blue-500 bg-blue-50"
														: "border-slate-200 bg-white hover:border-blue-200"
												}`}
											>
												<div className="flex items-center gap-2">
													<span className="text-lg">{level.icon}</span>
													<p className="text-sm font-semibold capitalize text-slate-900">
														{level.label}
													</p>
												</div>
												<p className="mt-1.5 text-xs text-slate-500">
													{level.description}
												</p>
												{active && (
													<p className="mt-2 text-[11px] font-medium text-blue-600">
														Active
													</p>
												)}
											</button>
										);
									})}
								</div>
								<p className="mt-3 text-xs text-slate-400">
									Light = rule-based cleanup only. Medium = AI rewrite + anti-AI
									check. Heavy = strictest rewrite with shorter sentences.
								</p>
							</SurfaceCard>

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
										onChange={(v) => updatePrefState({ agentEnabled: v })}
									/>
									<div className="rounded-xl border border-slate-200 p-4">
										<p className="text-sm font-semibold text-slate-900">
											Daily post limit
										</p>
										<p className="mt-1 text-xs text-slate-500">
											Maximum posts/day. You can still post 0 or 1 by choice.
										</p>
										<input
											type="number"
											min={1}
											max={2}
											value={prefs.dailyPostLimit}
											onChange={(e) =>
												updatePrefState({
													dailyPostLimit: Math.max(
														1,
														Math.min(2, Number(e.target.value) || 1)
													),
												})
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
													updatePrefState({
														postingWindowStart: e.target.value,
													})
												}
												className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
											/>
											<span className="text-slate-400">→</span>
											<input
												type="time"
												value={prefs.postingWindowEnd}
												onChange={(e) =>
													updatePrefState({
														postingWindowEnd: e.target.value,
													})
												}
												className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
											/>
										</div>
									</div>
								</div>
							</SurfaceCard>

							<div className="flex justify-end">
								<PrimaryButton onClick={savePreferences} disabled={savingPrefs}>
									{savingPrefs ? "Saving..." : "Save Preferences"}
								</PrimaryButton>
							</div>
						</>
					)}
				</TabsContent>

				{/* Security Tab */}
				<TabsContent value="security" className="space-y-6">
					<SurfaceCard>
						<SectionTitle
							title="Change Password"
							description="Update your password to keep your account secure."
						/>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
							<div className="md:col-span-2 space-y-2">
								<label className="block text-sm font-medium text-slate-700">
									Current Password <span className="text-rose-500">*</span>
								</label>
								<Input
									type="password"
									name="currentPassword"
									value={passwordData.currentPassword}
									onChange={handlePasswordChange}
									placeholder="Enter your current password"
								/>
							</div>
							<div className="space-y-2">
								<label className="block text-sm font-medium text-slate-700">
									New Password <span className="text-rose-500">*</span>
								</label>
								<Input
									type="password"
									name="newPassword"
									value={passwordData.newPassword}
									onChange={handlePasswordChange}
									placeholder="Enter new password"
								/>
								<p className="text-xs text-slate-500">Must be at least 8 characters</p>
							</div>
							<div className="space-y-2">
								<label className="block text-sm font-medium text-slate-700">
									Confirm New Password <span className="text-rose-500">*</span>
								</label>
								<Input
									type="password"
									name="confirmPassword"
									value={passwordData.confirmPassword}
									onChange={handlePasswordChange}
									placeholder="Confirm new password"
								/>
							</div>
						</div>
						<div className="mt-6 flex justify-end">
							<PrimaryButton onClick={savePassword} disabled={savingPassword}>
								{savingPassword ? "Updating..." : "Update Password"}
							</PrimaryButton>
						</div>
					</SurfaceCard>

					<SurfaceCard>
						<SectionTitle
							title="Two-Factor Authentication"
							description="Add an extra layer of security to your account."
						/>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-slate-900">Email Verification</p>
								<p className="text-xs text-slate-500">
									Your email is verified. We recommend keeping your email up to date.
								</p>
							</div>
							<StatusPill tone="positive" label="Verified" />
						</div>
					</SurfaceCard>
				</TabsContent>

				{/* Account Tab */}
				<TabsContent value="account" className="space-y-6">
					<SurfaceCard>
						<SectionTitle
							title="SocialSnipper access"
							description="Only a TotalAds administrator can enable or disable SocialSnipper for your account."
							action={
								<StatusPill
									status={access?.enabled ? "connected" : "disconnected"}
									label={access?.enabled ? "Enabled" : "Disabled"}
								/>
							}
						/>
						{!access?.enabled ? (
							<InlineAlert
								tone="warning"
								title="No product access yet"
								description="Ask an admin to enable SocialSnipper for your user in Admin → Users & moderation. You can open the dashboard to see the same status."
							/>
						) : (
							<p className="text-xs text-slate-500">
								To revoke access, an administrator must disable it in the admin
								panel.
							</p>
						)}
					</SurfaceCard>

					{access?.enabled && (
						<SurfaceCard>
							<SectionTitle
								title="Other account settings"
								description="Legacy flags from earlier SocialSnipper builds."
							/>
							<div className="space-y-4">
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
										type="url"
										value={linkedinExternalUrl}
										onChange={(e) => setLinkedinExternalUrl(e.target.value)}
										placeholder="https://www.linkedin.com/feed/"
										className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
									/>
								</div>
								<div className="flex justify-end">
									<PrimaryButton onClick={saveAccountSettings} disabled={savingAccount}>
										{savingAccount ? "Saving..." : "Save Account Settings"}
									</PrimaryButton>
								</div>
							</div>
						</SurfaceCard>
					)}
				</TabsContent>
			</Tabs>
		</PageShell>
	);
}

// -----------------------------------------------------------------------
// Toggle Card Component
// -----------------------------------------------------------------------

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
