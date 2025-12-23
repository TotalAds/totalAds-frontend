"use client";

import { LucideIcon } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  color?: "green" | "blue" | "purple" | "red" | "orange" | "yellow" | "pink" | "slate";
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  description?: string;
  compact?: boolean;
}

// Light theme card styles with proper contrast
const colorClasses = {
  green: "bg-emerald-50 border-emerald-200",
  blue: "bg-blue-50 border-blue-200",
  purple: "bg-purple-50 border-purple-200",
  red: "bg-red-50 border-red-200",
  orange: "bg-orange-50 border-orange-200",
  yellow: "bg-amber-50 border-amber-200",
  pink: "bg-pink-50 border-pink-200",
  slate: "bg-slate-50 border-slate-200",
};

// High contrast value colors for light theme
const valueColorClasses = {
  green: "text-emerald-700",
  blue: "text-blue-700",
  purple: "text-purple-700",
  red: "text-red-700",
  orange: "text-orange-700",
  yellow: "text-amber-700",
  pink: "text-pink-700",
  slate: "text-slate-700",
};

// Icon background colors
const iconBgClasses = {
  green: "bg-emerald-100 text-emerald-600",
  blue: "bg-blue-100 text-blue-600",
  purple: "bg-purple-100 text-purple-600",
  red: "bg-red-100 text-red-600",
  orange: "bg-orange-100 text-orange-600",
  yellow: "bg-amber-100 text-amber-600",
  pink: "bg-pink-100 text-pink-600",
  slate: "bg-slate-100 text-slate-600",
};

export default function KPICard({
  label,
  value,
  unit,
  icon: Icon,
  color = "blue",
  trend,
  description,
  compact = false,
}: KPICardProps) {
  if (compact) {
    return (
      <div
        className={`rounded-lg border p-3 ${colorClasses[color]}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {Icon && (
              <div className={`p-1 rounded flex-shrink-0 ${iconBgClasses[color]}`}>
                <Icon className="w-3 h-3" />
              </div>
            )}
            <p className="text-xs font-medium text-slate-600 truncate">{label}</p>
          </div>
        </div>
        <div className="flex items-baseline gap-1 mt-1.5">
          <p className={`text-xl font-bold ${valueColorClasses[color]}`}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {unit && <p className="text-slate-500 text-xs">{unit}</p>}
        </div>
        {description && (
          <p className="text-xs text-slate-400 mt-1 truncate">{description}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border p-6 transition-all hover:shadow-md ${colorClasses[color]}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`p-2 rounded-lg ${iconBgClasses[color]}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-slate-700">{label}</p>
          </div>
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
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {unit && <p className="text-slate-600 text-sm font-medium">{unit}</p>}
      </div>

      {description && (
        <p className="text-slate-500 text-sm mt-3">{description}</p>
      )}
    </div>
  );
}
