export function normalizePhone(input: string): string {
  return String(input || "").replace(/\D/g, "");
}

export function dedupePhones(phones: Array<string | number> | undefined, max: number = 3): string[] {
  if (!phones || phones.length === 0) return [];
  const map = new Map<string, string>();
  for (const p of phones) {
    if (p == null) continue;
    const raw = String(p);
    const key = normalizePhone(raw).slice(-10);
    if (!key) continue;
    if (!map.has(key)) map.set(key, raw);
  }
  return Array.from(map.values()).slice(0, max);
}

