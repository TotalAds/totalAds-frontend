import type { SenderProvider } from "./senderProviderEducation";

export interface CampaignSenderRow {
	id: string;
	email: string;
	displayName?: string;
	domainId?: string | null;
	domainName?: string | null;
	provider?: SenderProvider | string;
	accountType?: string | null;
	status?: string;
	verificationStatus?: string;
}

export interface SenderGroup {
	key: string;
	label: string;
	provider: SenderProvider;
	tip: string;
	senders: CampaignSenderRow[];
}

const PROVIDER_ORDER: SenderProvider[] = ["ses", "gmail", "outlook", "zoho", "smtp"];

function resolveProvider(sender: CampaignSenderRow): SenderProvider {
	const p = sender.provider;
	if (p === "gmail" || p === "outlook" || p === "zoho" || p === "smtp" || p === "ses") return p;
	// Inbox senders have no SES domain; avoid mis-grouping as SES when provider is missing.
	return sender.domainId ? "ses" : "smtp";
}

function groupLabel(provider: SenderProvider, groupKey: string, senders: CampaignSenderRow[]): string {
	if (provider === "ses") {
		return groupKey;
	}
	if (provider === "gmail") return "Google accounts";
	if (provider === "outlook") return "Microsoft accounts";
	if (provider === "zoho") return "Zoho accounts";
	return "Custom SMTP";
}

export function groupCampaignSenders(
	senders: CampaignSenderRow[],
	domains: { id: string; domain: string }[],
): SenderGroup[] {
	const domainMap = new Map(domains.map((d) => [d.id, d.domain]));
	const buckets = new Map<string, CampaignSenderRow[]>();

	for (const sender of senders) {
		const provider = resolveProvider(sender);
		let key: string;
		if (provider === "ses") {
			const domainName =
				sender.domainName ||
				(sender.domainId ? domainMap.get(sender.domainId) : null) ||
				"SES domain";
			key = `ses:${domainName}`;
		} else {
			key = provider;
		}
		const list = buckets.get(key) ?? [];
		list.push(sender);
		buckets.set(key, list);
	}

	const groups: SenderGroup[] = [];

	for (const provider of PROVIDER_ORDER) {
		for (const [key, rows] of buckets.entries()) {
			if (resolveProvider(rows[0]) !== provider) continue;
			const displayKey = key.startsWith("ses:") ? key.slice(4) : key;
			groups.push({
				key,
				label: groupLabel(provider, displayKey, rows),
				provider,
				tip: "",
				senders: rows.sort((a, b) => a.email.localeCompare(b.email)),
			});
		}
	}

	return groups;
}
