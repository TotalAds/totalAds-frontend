"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PageHeader, PageShell, SurfaceCard } from "@/components/social/SocialUi";
import { getSocialAccess } from "@/utils/api/socialClient";

export default function SocialArticlesPage() {
	const [allowed, setAllowed] = useState<boolean | null>(null);

	useEffect(() => {
		getSocialAccess()
			.then((access) => setAllowed(!!access.subscription?.includesArticles))
			.catch(() => setAllowed(false));
	}, []);

	if (allowed === null) {
		return (
			<PageShell>
				<p className="text-text-200">Loading…</p>
			</PageShell>
		);
	}

	if (!allowed) {
		return (
			<PageShell>
				<PageHeader
					title="LinkedIn Articles"
					description="Publish long-form articles with AI-generated covers."
				/>
				<SurfaceCard>
					<p className="text-text-200 mb-4">
						LinkedIn Articles are available on the Business plan.
					</p>
					<Link
						href="/social/pricing"
						className="inline-flex px-4 py-2 rounded-lg bg-brand-main text-white"
					>
						Upgrade to Business
					</Link>
				</SurfaceCard>
			</PageShell>
		);
	}

	return (
		<PageShell>
			<PageHeader
				title="LinkedIn Articles"
				description="Generate, host, and schedule LinkedIn articles from SocialSnipper."
			/>
			<SurfaceCard>
				<p className="text-text-200">
					Article builder uses the social-service API. Create articles from Post Studio
					or use the API endpoints under <code>/api/v1/articles</code>.
				</p>
			</SurfaceCard>
		</PageShell>
	);
}
