"use client";

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: string;
  color?: "green" | "blue" | "purple" | "red" | "orange" | "yellow" | "pink";
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  description?: string;
}

// Light theme card styles with proper contrast
const colorClasses = {
  green: "bg-emerald-50 border-emerald-200 shadow-sm",
  blue: "bg-blue-50 border-blue-200 shadow-sm",
  purple: "bg-purple-50 border-purple-200 shadow-sm",
  red: "bg-red-50 border-red-200 shadow-sm",
  orange: "bg-orange-50 border-orange-200 shadow-sm",
  yellow: "bg-amber-50 border-amber-200 shadow-sm",
  pink: "bg-pink-50 border-pink-200 shadow-sm",
};

// High contrast value colors for light theme
const valueColorClasses = {
  green: "text-emerald-600",
  blue: "text-blue-600",
  purple: "text-purple-600",
  red: "text-red-600",
  orange: "text-orange-600",
  yellow: "text-amber-600",
  pink: "text-pink-600",
};

// Label colors for each theme
const labelColorClasses = {
  green: "text-emerald-700",
  blue: "text-blue-700",
  purple: "text-purple-700",
  red: "text-red-700",
  orange: "text-orange-700",
  yellow: "text-amber-700",
  pink: "text-pink-700",
};

export default function KPICard({
  label,
  value,
  unit,
  icon,
  color = "blue",
  trend,
  description,
}: KPICardProps) {
  return (
    <div
      className={`rounded-xl border p-6 transition-all hover:shadow-md ${colorClasses[color]}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p
            className={`text-sm uppercase tracking-wide font-semibold ${labelColorClasses[color]}`}
          >
            {icon && <span className="mr-2">{icon}</span>}
            {label}
          </p>
        </div>
        {trend && (
          <div
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              trend.direction === "up"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {trend.direction === "up" ? "↑" : "↓"} {trend.value}%
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <p className={`text-4xl font-bold ${valueColorClasses[color]}`}>
          {value}
        </p>
        {unit && <p className="text-slate-600 text-sm font-medium">{unit}</p>}
      </div>

      {description && (
        <p className="text-slate-500 text-sm mt-3">{description}</p>
      )}
    </div>
  );
}
