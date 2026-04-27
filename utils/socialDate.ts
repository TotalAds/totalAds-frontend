export const formatSocialDateTime = (value?: string | Date | null) => {
	if (!value) return "Not set";
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return "Invalid date";
	return new Intl.DateTimeFormat(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	}).format(date);
};

export const formatSocialDate = (value?: string | Date | null) => {
	if (!value) return "Not set";
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return "Invalid date";
	return new Intl.DateTimeFormat(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(date);
};

export const formatSocialTime = (value?: string | Date | null) => {
	if (!value) return "Not set";
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return "Invalid date";
	return new Intl.DateTimeFormat(undefined, {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	}).format(date);
};
