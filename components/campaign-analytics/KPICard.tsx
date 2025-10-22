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

const colorClasses = {
  green: "bg-green-500/10 border-green-500/30 text-green-300",
  blue: "bg-blue-500/10 border-blue-500/30 text-blue-300",
  purple: "bg-purple-500/10 border-purple-500/30 text-purple-300",
  red: "bg-red-500/10 border-red-500/30 text-red-300",
  orange: "bg-orange-500/10 border-orange-500/30 text-orange-300",
  yellow: "bg-yellow-500/10 border-yellow-500/30 text-yellow-300",
  pink: "bg-pink-500/10 border-pink-500/30 text-pink-300",
};

const valueColorClasses = {
  green: "text-green-400",
  blue: "text-blue-400",
  purple: "text-purple-400",
  red: "text-red-400",
  orange: "text-orange-400",
  yellow: "text-yellow-400",
  pink: "text-pink-400",
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
      className={`backdrop-blur-xl rounded-lg border p-6 transition-all hover:shadow-lg ${colorClasses[color]}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-white/60 text-sm uppercase tracking-wide font-medium">
            {icon && <span className="mr-2">{icon}</span>}
            {label}
          </p>
        </div>
        {trend && (
          <div
            className={`text-xs font-semibold ${
              trend.direction === "up" ? "text-green-400" : "text-red-400"
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
        {unit && <p className="text-white/60 text-sm">{unit}</p>}
      </div>

      {description && (
        <p className="text-white/50 text-xs mt-3">{description}</p>
      )}
    </div>
  );
}

