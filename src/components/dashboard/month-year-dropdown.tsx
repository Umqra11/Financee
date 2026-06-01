"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

export function MonthYearDropdown({ className, basePath = "/" }: React.HTMLAttributes<HTMLDivElement> & { basePath?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [month, setMonth] = React.useState<string>(new Date().getMonth().toString());
  const [year, setYear] = React.useState<string>(new Date().getFullYear().toString());

  // Initialize from searchParams if available
  React.useEffect(() => {
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    if (fromParam && toParam) {
      // Avoid timezone issues by splitting the string YYYY-MM-DD
      const fromParts = fromParam.split("-");
      const toParts = toParam.split("-");
      if (fromParts.length === 3 && toParts.length === 3) {
        const fromMonth = parseInt(fromParts[1], 10) - 1;
        const fromYear = parseInt(fromParts[0], 10);
        const fromDay = parseInt(fromParts[2], 10);

        const toMonth = parseInt(toParts[1], 10) - 1;
        const toYear = parseInt(toParts[0], 10);
        // We consider it a month-view if it starts on day 1, and month/year matches
        if (fromDay === 1 && fromMonth === toMonth && fromYear === toYear) {
          setMonth(fromMonth.toString());
          setYear(fromYear.toString());
        }
      }
    }
  }, [searchParams]);

  const handleUpdate = (newMonth: string, newYear: string) => {
    setMonth(newMonth);
    setYear(newYear);

    // Format local dates manually to avoid timezone shift to previous day
    const m = parseInt(newMonth) + 1;
    const strMonth = m < 10 ? `0${m}` : `${m}`;
    const fromStr = `${newYear}-${strMonth}-01`;

    // get last day
    const lastDay = new Date(parseInt(newYear), m, 0).getDate();
    const toStr = `${newYear}-${strMonth}-${lastDay}`;

    const params = new URLSearchParams(searchParams.toString());
    params.set("from", fromStr);
    params.set("to", toStr);

    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <div className={cn("flex items-center gap-2 w-full", className)}>
      <Select value={month} onValueChange={(val) => { if (val) handleUpdate(val, year); }}>
        <SelectTrigger className="flex-1 rounded-xl bg-white border-neutral-200">
          <SelectValue placeholder="Ay">{MONTHS[parseInt(month)]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((m, i) => (
            <SelectItem key={i} value={i.toString()}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={year} onValueChange={(val) => { if (val) handleUpdate(month, val); }}>
        <SelectTrigger className="flex-1 rounded-xl bg-white border-neutral-200">
          <SelectValue placeholder="Yıl">{year}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {YEARS.map((y) => (
            <SelectItem key={y} value={y.toString()}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
