const CARDS = [
  {
    key: "critical" as const,
    label: "Critical",
    number: "text-rose-600",
    card: "border-rose-200",
  },
  {
    key: "recommended" as const,
    label: "Recommended",
    number: "text-amber-600",
    card: "border-amber-200",
  },
  {
    key: "building_history" as const,
    label: "Building history",
    number: "text-slate-900",
    card: "border-slate-200",
  },
];

export function SummaryCards({
  summary,
}: {
  summary: { critical: number; recommended: number; building_history: number };
}) {
  const cards = CARDS.filter((item) => summary[item.key] > 0);
  if (!cards.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cards.map((item) => (
        <div key={item.key} className={`rounded-2xl border bg-white px-5 py-4 ${item.card}`}>
          <p className={`text-3xl font-semibold tracking-tight ${item.number}`}>{summary[item.key]}</p>
          <p className="mt-1 text-sm text-slate-600">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
