"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
	DangerButton,
	PageHeader,
	PageShell,
	PrimaryButton,
	SectionTitle,
	SurfaceCard,
} from "@/components/social/SocialUi";
import {
	getWhatsappStatus,
	linkWhatsapp,
	unlinkWhatsapp,
} from "@/utils/api/socialClient";

export default function WhatsappSetupPage() {
	const [busy, setBusy] = useState(false);
	const [status, setStatus] = useState<{
		linked: boolean;
		phone: string | null;
		linkedAt: string | null;
	} | null>(null);
	const [phone, setPhone] = useState("");

	const load = async () => {
		try {
			const data = await getWhatsappStatus();
			setStatus(data);
		} catch (error) {
			toast.error("Failed to load WhatsApp status");
		}
	};

	useEffect(() => {
		load();
	}, []);

	const onLink = async () => {
		if (!phone.trim()) {
			toast.error("Enter your WhatsApp phone number");
			return;
		}
		try {
			setBusy(true);
			await linkWhatsapp({ phone: phone.trim() });
			toast.success("WhatsApp linked");
			setPhone("");
			await load();
		} catch (error: any) {
			toast.error(error?.response?.data?.message || "Link failed");
		} finally {
			setBusy(false);
		}
	};

	const onUnlink = async () => {
		try {
			setBusy(true);
			await unlinkWhatsapp();
			toast.success("WhatsApp unlinked");
			await load();
		} catch {
			toast.error("Unlink failed");
		} finally {
			setBusy(false);
		}
	};

	return (
		<PageShell>
			<PageHeader
				eyebrow="WhatsApp"
				title="Approve drafts from WhatsApp"
				description="Link your WhatsApp number to receive actionable approval messages."
			/>
			<SurfaceCard>
				<SectionTitle title="Connection" />
				<p className="mb-3 text-sm text-slate-600">
					{status?.linked
						? `Connected as ${status.phone}`
						: "Not connected yet. Link your number to enable approvals."}
				</p>
				<div className="space-y-3">
					<input
						value={phone}
						onChange={(e) => setPhone(e.target.value)}
						placeholder="+919999999999"
						className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
					/>
					<div className="flex gap-2">
						<PrimaryButton onClick={onLink} disabled={busy}>
							Link WhatsApp
						</PrimaryButton>
						{status?.linked && (
							<DangerButton onClick={onUnlink} disabled={busy}>
								Unlink
							</DangerButton>
						)}
					</div>
				</div>
			</SurfaceCard>
		</PageShell>
	);
}
