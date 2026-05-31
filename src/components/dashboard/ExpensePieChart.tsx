"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#a1a1aa', '#52525b', '#27272a']; 

export function ExpensePieChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="h-72 w-full p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm transition-colors">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderRadius: '12px', color: 'var(--foreground)' }} 
            itemStyle={{ color: 'var(--foreground)' }} 
          />
          <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
