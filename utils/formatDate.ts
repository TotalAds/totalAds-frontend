import { format, isValid, parseISO } from "date-fns";

export function parseApiDate(value: unknown): Date | null {
	if (value == null || value === "") return null;
	if (value instanceof Date) return isValid(value) ? value : null;
	if (typeof value === "object") return null;

	const str = String(value);
	if (!str || str === "[object Object]") return null;

	const iso = parseISO(str);
	if (isValid(iso)) return iso;

	const fallback = new Date(str);
	return isValid(fallback) ? fallback : null;
}

export function formatApiDate(
	value: unknown,
	pattern = "MMM d, yyyy",
	fallback = "—"
): string {
	const date = parseApiDate(value);
	if (!date) return fallback;
	return format(date, pattern);
}
