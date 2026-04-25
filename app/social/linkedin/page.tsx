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
	disconnectLinkedin,
	getLinkedinConfigCheck,
	getLinkedinLoginUrl,
	getLinkedinStatus,
	LinkedinStatus,
	refreshLinkedinSession,
} from "@/utils/api/socialClient";
import { IconBrandLinkedin, IconRefresh } from "@tabler/icons-react";

export default function LinkedinConnectionPage() {
	const [loading, setLoading] = useState(true);
	const [status, setStatus] = useState<LinkedinStatus | null>(null);
	const [config, setConfig] = useState<{
		hasClientId: boolean;
		hasClientSecret: boolean;
		hasRedirectUri: boolean;
		redirectUri: string;
	} | null>(null);
	const [busy, setBusy] = useState(false);

	const load = async () => {
		try {
			setLoading(true);
			const [s, c] = await Promise.all([
				getLinkedinStatus(),
				getLinkedinConfigCheck(),
			]);
			setStatus(s);
			setConfig(c);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to load");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	const onConnect = async () => {
		try {
			setBusy(true);
			const { authUrl } = await getLinkedinLoginUrl(
				`${window.location.origin}/social/linkedin/callback`
			);
			if (!authUrl) throw new Error("Unable to generate LinkedIn auth URL");
			window.location.href = authUrl;
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Connect failed");
			setBusy(false);
		}
	};

	const onRefresh = async () => {
		try {
			setBusy(true);
			const result = await refreshLinkedinSession();
			toast.success(
				`Session refreshed — expires ${new Date(result.expiresAt).toLocaleString()}`
			);
			await load();
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: "Refresh failed — you may need to reconnect LinkedIn manually."
			);
		} finally {
			setBusy(false);
		}
	};

	const onDisconnect = async () => {
		try {
			setBusy(true);
			await disconnectLinkedin();
			toast.success("Disconnected from LinkedIn");
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Disconnect failed");
		} finally {
			setBusy(false);
		}
	};

	const connection = status?.connection;
	const sessionTone =
		connection?.sessionStatus === "healthy"
			? "positive"
			: connection?.sessionStatus === "needs_refresh"
				? "warning"
				: connection?.sessionStatus === "expired"
					? "danger"
					: connection?.sessionStatus === "needs_reconnect"
						? "danger"
						: "muted";

	return (
		<PageShell>
			<PageHeader
				eyebrow="LinkedIn"
				title="Connection + session health"
				description="Publishing goes straight to LinkedIn&apos;s API using OAuth 2.0 and w_member_social scope."
				actions={<SecondaryButton onClick={load}>Refresh</SecondaryButton>}
			/>

			{loading ? (
				<LoadingCardGrid cards={2} />
			) : (
				<>
					{config && (!config.hasClientId || !config.hasClientSecret) && (
						<InlineAlert
							tone="danger"
							title="LinkedIn OAuth is not fully configured"
							description="Set LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET and LINKEDIN_REDIRECT_URI in the social service env."
						/>
					)}

					<SurfaceCard>
						<SectionTitle
							title="Account status"
							description="The identity the agent will publish under."
							action={
								<StatusPill
									status={status?.connected ? "connected" : "disconnected"}
								/>
							}
						/>

						{status?.connected && connection ? (
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div>
									<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
										Name
									</p>
									<p className="mt-1 text-sm text-slate-900">
										{connection.linkedinName || "—"}
									</p>
								</div>
								<div>
									<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
										Email
									</p>
									<p className="mt-1 text-sm text-slate-900">
										{connection.linkedinEmail || "—"}
									</p>
								</div>
								<div>
									<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
										Member URN
									</p>
									<p className="mt-1 break-all text-xs text-slate-600">
										{connection.linkedinMemberUrn || "—"}
									</p>
								</div>
								<div>
									<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
										Session health
									</p>
									<StatusPill
										tone={sessionTone}
										label={connection.sessionStatus || "unknown"}
									/>
								</div>
								<div>
									<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
										Access token expires
									</p>
									<p className="mt-1 text-sm text-slate-900">
										{connection.tokenExpiresAt
											? new Date(connection.tokenExpiresAt).toLocaleString()
											: "—"}
									</p>
								</div>
								<div>
									<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
										Last refreshed
									</p>
									<p className="mt-1 text-sm text-slate-900">
										{connection.lastRefreshedAt
											? new Date(connection.lastRefreshedAt).toLocaleString()
											: "—"}
									</p>
								</div>
							</div>
						) : (
							<p className="text-sm text-slate-500">
								Not connected. Click Connect LinkedIn to start the OAuth flow.
							</p>
						)}

						<div className="mt-5 flex flex-wrap items-center gap-2">
							{!status?.connected ? (
								<PrimaryButton onClick={onConnect} disabled={busy}>
									<IconBrandLinkedin className="h-4 w-4" />
									Connect LinkedIn
								</PrimaryButton>
							) : (
								<>
									<SecondaryButton onClick={onRefresh} disabled={busy}>
										<IconRefresh className="h-4 w-4" />
										Refresh session
									</SecondaryButton>
									<SecondaryButton onClick={onConnect} disabled={busy}>
										Reconnect
									</SecondaryButton>
									<DangerButton onClick={onDisconnect} disabled={busy}>
										Disconnect
									</DangerButton>
								</>
							)}
						</div>

						{connection?.sessionStatus === "needs_refresh" && (
							<InlineAlert
								tone="warning"
								title="Session will expire soon"
								description="Refresh now — once expired you&apos;ll need to reconnect from scratch."
							/>
						)}
					</SurfaceCard>

					<SurfaceCard>
						<SectionTitle
							title="OAuth configuration"
							description="Make sure these match your LinkedIn developer app exactly."
						/>
						{config ? (
							<MetaRow
								items={[
									{
										label: "Client ID",
										value: config.hasClientId ? "Set ✓" : "Missing",
									},
									{
										label: "Client secret",
										value: config.hasClientSecret ? "Set ✓" : "Missing",
									},
									{
										label: "Redirect URI",
										value: config.redirectUri || "Missing",
									},
								]}
							/>
						) : (
							<p className="text-sm text-slate-500">
								Unable to check configuration.
							</p>
						)}
					</SurfaceCard>

					<SurfaceCard>
						<SectionTitle
							title="What this connection does"
							description="Only the minimum scopes needed to post + read basic profile."
						/>
						<ul className="space-y-2 text-sm text-slate-600">
							<li>
								<span className="font-semibold text-slate-800">openid, profile, email</span>{" "}
								— we read your name + email once, to identify the agent speaker.
							</li>
							<li>
								<span className="font-semibold text-slate-800">w_member_social</span>{" "}
								— the only write scope. Used to create + delete text posts on your
								behalf.
							</li>
						</ul>
					</SurfaceCard>
				</>
			)}
		</PageShell>
	);
}
