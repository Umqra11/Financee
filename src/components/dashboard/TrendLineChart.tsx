"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TrendData {
  date: string;
  displayDate: string;
  amount: number;
}

interface TrendLineChartProps {
  data: TrendData[];
}

const formatCurrency = (amount: number) => {
  return amount.toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
  });
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-md p-4 shadow-xl animate-in fade-in duration-200">
        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mb-1">
          {data.displayDate}
        </p>
        <p className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {formatCurrency(data.amount)}
        </p>
      </div>
    );
  }
  return null;
};

export function TrendLineChart({ data }: TrendLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-muted-foreground bg-card/30 rounded-2xl border border-dashed">
        Veri bulunmuyor.
      </div>
    );
  }

  // Eksen etiketlerini sadeleştirelim (örneğin çok fazla gün varsa sadece bazılarını gösterelim)
  const interval = Math.ceil(data.length / 6);

  return (
    <div className="w-full h-64 md:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: -10,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--border)"
            opacity={0.4}
          />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            interval={interval}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={(value) => `₺${value}`}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#10B981", strokeWidth: 1, strokeDasharray: "4 4" }} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#10B981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorTrend)"
            dot={false}
            activeDot={{ r: 6, strokeWidth: 0, fill: "#10B981" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
