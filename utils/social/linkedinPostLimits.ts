/** Mirrors totalads-social-service SOCIAL_LIMITS / LINKEDIN_COMMENTARY_MAX. */
export const LINKEDIN_POST_MAX_CHARS = 3000;
export const LINKEDIN_POST_SWEET_SPOT_MIN = 900;
export const LINKEDIN_POST_SWEET_SPOT_MAX = 1300;

export const getLinkedinPostLengthError = (length: number): string | null => {
	if (length <= LINKEDIN_POST_MAX_CHARS) return null;
	const overBy = length - LINKEDIN_POST_MAX_CHARS;
	return `LinkedIn posts can be at most ${LINKEDIN_POST_MAX_CHARS.toLocaleString()} characters. Trim ${overBy.toLocaleString()} character${overBy === 1 ? "" : "s"} before saving or publishing.`;
};

export const getLinkedinPostCharCountColor = (
	charCount: number,
	max = LINKEDIN_POST_MAX_CHARS
): string => {
	if (charCount > max) return "text-red-600";
	if (charCount > max * 0.9) return "text-amber-600";
	return "text-slate-500";
};

export const isLinkedinPostOverLimit = (body: string): boolean =>
	body.trim().length > LINKEDIN_POST_MAX_CHARS;
