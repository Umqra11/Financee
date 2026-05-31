"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { MonthYearPicker } from "@/components/ui/month-year-picker";

export function DashboardDatePicker({ initialMonth, initialYear }: { initialMonth: number; initialYear: number }) {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(new Date(initialYear, initialMonth - 1));
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    if (date) {
      const m = date.getMonth() + 1;
      const y = date.getFullYear();
      router.push(`/dashboard?month=${m}&year=${y}`);
    }
  }, [date, router]);

  return <MonthYearPicker date={date} setDate={setDate} />;
}
