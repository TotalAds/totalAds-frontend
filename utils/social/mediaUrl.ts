/** Same-origin display URL for social assets (avoids ORB on cross-origin JSON error responses). */
export const resolveSocialMediaDisplayUrl = (
	url: string | null | undefined
): string => {
	if (!url) return "";
	if (url.startsWith("/api/social-media/")) return url;

	const proxyMatch = url.match(/\/api\/v1\/media\/public\/(socialsnipper\/.+)$/);
	if (proxyMatch) {
		return `/api/social-media/${proxyMatch[1]}`;
	}

	const s3Match = url.match(/(socialsnipper\/[0-9]+\/(?:images|videos|carousels|articles|logos)\/.+)$/);
	if (s3Match) {
		return `/api/social-media/${s3Match[1]}`;
	}

	return url;
};
