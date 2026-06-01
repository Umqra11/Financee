"use client";

import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

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

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="font-bold text-xs">
      {`%${(percent * 100).toFixed(0)}`}
    </text>
  );
};

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

  const renderLegend = () => {
    return (
      <ul className="flex flex-col gap-y-2.5 text-xs sm:text-sm">
        {data.map((entry, index) => {
          const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0";
          const color = COLORS[index % COLORS.length];
          return (
            <li
              key={`legend-item-${index}`}
              className="flex items-center gap-2 cursor-pointer transition-opacity duration-300"
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
                {entry.name} (%{percentage})
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 justify-between p-6 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm transition-colors w-full">
      <div className="w-[280px] h-[280px] shrink-0 flex items-center justify-center mx-auto sm:mx-0">
        <PieChart width={280} height={280}>
          <Pie 
            data={data} 
            innerRadius={0} 
            outerRadius={110} 
            dataKey="value" 
            stroke="none"
            labelLine={false}
            label={renderCustomizedLabel}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                style={{
                  opacity: activeIndex === null || activeIndex === index ? 1 : 0.4,
                  transition: "opacity 0.3s ease",
                  cursor: "pointer",
                  outline: 'none'
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </div>

      <div className="w-full sm:w-auto flex-1 flex flex-col justify-center pl-0 sm:pl-6">
        {renderLegend()}
      </div>
    </div>
  );
}
