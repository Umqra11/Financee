"use client";

import React, { useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
];

export function ExpensePieChart({ data }: { data: { name: string; value: number }[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : "0";
      return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-lg">
          <p className="font-semibold text-sm mb-1">{data.name}</p>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Tutar: <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatCurrency(data.value)}</span>
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Oran: <span className="font-medium text-zinc-900 dark:text-zinc-100">%{percentage}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    if (!payload) return null;
    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 text-xs">
        {payload.map((entry: any, index: number) => {
          const percentage = total > 0 ? ((entry.payload.value / total) * 100).toFixed(1) : "0";
          const color = entry.color;
          return (
            <li
              key={`legend-item-${index}`}
              className="flex items-center gap-1.5 cursor-pointer transition-opacity duration-300"
              style={{ opacity: activeIndex === null || activeIndex === index ? 1 : 0.4 }}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <span
                className="w-3 h-3 rounded-sm shrink-0 transition-opacity duration-300"
                style={{
                  backgroundColor: color,
                }}
              />
              <span className="text-zinc-600 dark:text-zinc-300 font-medium transition-opacity duration-300">
                {entry.value} (%{percentage})
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="h-80 w-full p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm transition-colors">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie 
            data={data} 
            innerRadius={70} 
            outerRadius={90} 
            paddingAngle={5} 
            dataKey="value" 
            stroke="none"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                style={{
                  opacity: activeIndex === null || activeIndex === index ? 1 : 0.3,
                  transition: "opacity 0.3s ease",
                  cursor: "pointer",
                  outline: 'none'
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
