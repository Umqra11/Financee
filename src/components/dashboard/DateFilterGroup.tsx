"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";
import { cn } from "@/lib/utils";
import { PresetDateRangePicker } from "./preset-date-range-picker";
import { MonthYearDropdown } from "./month-year-dropdown";
import { DatePresets } from "./DatePresets";

const formatLocalDate = (d: Date) => {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${y}-${m < 10 ? "0" + m : m}-${day < 10 ? "0" + day : day}`;
};

type ActiveFilter = "presets" | "month-year" | "custom";

export function DateFilterGroup() {
    const searchParams = useSearchParams();
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const getActiveFilter = (): ActiveFilter => {
        if (!fromParam || !toParam) return "presets";

        const today = new Date();
        const todayStr = formatLocalDate(today);
        const startM = formatLocalDate(startOfMonth(today));
        const endM = formatLocalDate(endOfMonth(today));
        const start3M = formatLocalDate(subMonths(today, 3));
        const start6M = formatLocalDate(subMonths(today, 6));
        const startY = formatLocalDate(startOfYear(today));

        // MonthYearDropdown: from ayın 1'i, to ayın son günü
        if (/-\d{2}-01$/.test(fromParam) && toParam === formatLocalDate(endOfMonth(new Date(fromParam)))) {
            return "month-year";
        }

        // DatePresets kalıpları
        if (
            (fromParam === todayStr && toParam === todayStr) ||
            (fromParam === startM && toParam === endM) ||
            (fromParam === start3M && toParam === todayStr) ||
            (fromParam === start6M && toParam === todayStr) ||
            (fromParam === startY && toParam === todayStr)
        ) {
            return "presets";
        }

        return "custom";
    };

    const active = getActiveFilter();

    return (
        <div className="flex flex-col gap-2 w-[260px] sm:w-[300px] items-end">
            <div className={cn("w-full transition-opacity duration-300", active === "custom" ? "opacity-100" : "opacity-50 hover:opacity-80")}>
                <PresetDateRangePicker className="w-full" />
            </div>
            <div className={cn("w-full transition-opacity duration-300", active === "month-year" ? "opacity-100" : "opacity-50 hover:opacity-80")}>
                <MonthYearDropdown className="w-full" />
            </div>
            <div className={cn("w-full transition-opacity duration-300", active === "presets" ? "opacity-100" : "opacity-50 hover:opacity-80")}>
                <DatePresets />
            </div>
        </div>
    );
}