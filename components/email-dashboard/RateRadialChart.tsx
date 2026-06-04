"use client";

import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";

interface RateRadialChartProps {
  openRate: number;
  clickRate: number;
  bounceRate: number;
  height?: number;
}

export function RateRadialChart({
  openRate,
  clickRate,
  bounceRate,
  height = 200,
}: RateRadialChartProps) {
  const data = [
    { name: "Open", value: Math.min(100, openRate), fill: "#22c55e" },
    { name: "Click", value: Math.min(100, clickRate), fill: "#8b5cf6" },
    {
      name: "Bounce",
      value: Math.min(100, bounceRate),
      fill: bounceRate >= 5 ? "#ef4444" : "#f59e0b",
    },
  ];

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={height}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="20%"
          outerRadius="90%"
          barSize={12}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            background={{ fill: "#f1f5f9" }}
            dataKey="value"
            cornerRadius={6}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-3 gap-2 text-center">
        {data.map((d) => (
          <div key={d.name}>
            <p className="text-lg font-bold text-slate-900">{d.value.toFixed(1)}%</p>
            <p className="text-[11px] font-medium text-slate-500">{d.name} rate</p>
          </div>
        ))}
      </div>
    </div>
  );
}
