export function formatPriceInr(paise: number): string {
	if (paise === 0) return "Free";
	return `₹${(paise / 100).toFixed(0)}`;
}
