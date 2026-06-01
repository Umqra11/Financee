"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, subDays, subMonths, startOfYear, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

const formatLocalDate = (d: Date) => {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
};

export function DatePresets() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  // Aktif kestirmeyi tespit et
  const getActivePreset = () => {
    if (!fromParam || !toParam) return "today"; // Varsayılan olarak Bugün

    const todayStr = formatLocalDate(new Date());
    
    // Bugün
    if (fromParam === todayStr && toParam === todayStr) return "today";

    // Bu Ay
    const startM = formatLocalDate(startOfMonth(new Date()));
    const endM = formatLocalDate(endOfMonth(new Date()));
    if (fromParam === startM && toParam === endM) return "month";

    // Son 3 Ay
    const start3M = formatLocalDate(subMonths(new Date(), 3));
    if (fromParam === start3M && toParam === todayStr) return "3months";

    // Son 6 Ay
    const start6M = formatLocalDate(subMonths(new Date(), 6));
    if (fromParam === start6M && toParam === todayStr) return "6months";

    // Bu Yıl
    const startY = formatLocalDate(startOfYear(new Date()));
    if (fromParam === startY && toParam === todayStr) return "year";

    return null;
  };

  const activePreset = getActivePreset();

  const handlePresetClick = (preset: string) => {
    const today = new Date();
    let fromDate = today;
    let toDate = today;

    switch (preset) {
      case "today":
        fromDate = today;
        toDate = today;
        break;
      case "month":
        fromDate = startOfMonth(today);
        toDate = endOfMonth(today);
        break;
      case "3months":
        fromDate = subMonths(today, 3);
        toDate = today;
        break;
      case "6months":
        fromDate = subMonths(today, 6);
        toDate = today;
        break;
      case "year":
        fromDate = startOfYear(today);
        toDate = today;
        break;
      default:
        break;
    }

    const fromStr = formatLocalDate(fromDate);
    const toStr = formatLocalDate(toDate);

    const params = new URLSearchParams(searchParams.toString());
    params.set("from", fromStr);
    params.set("to", toStr);

    router.push(`/?${params.toString()}`);
  };

  const presets = [
    { id: "today", label: "Bugün" },
    { id: "month", label: "Bu Ay" },
    { id: "3months", label: "3 Ay" },
    { id: "6months", label: "6 Ay" },
    { id: "year", label: "Bu Yıl" },
  ];

  return (
    <div className="flex flex-row items-center gap-1 sm:gap-1.5 mt-2 justify-start sm:justify-end w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-1">
      {presets.map((preset) => {
        const isActive = activePreset === preset.id;
        return (
          <button
            key={preset.id}
            onClick={() => handlePresetClick(preset.id)}
            className={cn(
              "px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all duration-200 cursor-pointer select-none active:scale-95 shadow-sm shrink-0",
              isActive
                ? "opacity-100 bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-500/10 shadow-emerald-500/20"
                : "opacity-50 hover:opacity-80 bg-white dark:bg-zinc-900 border-neutral-200 dark:border-zinc-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-zinc-800/60"
            )}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
