import React from "react";

export const dynamic = "force-dynamic";

import { TransactionList } from "@/components/transactions/TransactionList";
import { syncSubscriptionsToTransactions } from "@/lib/actions/sync";
import { Card, CardContent } from "@/components/ui/card";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { MonthYearDropdown } from "@/components/dashboard/month-year-dropdown";
import { DatePresets } from "@/components/dashboard/DatePresets";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; month?: string; year?: string };
}) {
  // Zamanı gelmiş düzenli ödemeleri transactions tablosuna senkronize et
  await syncSubscriptionsToTransactions();

  const now = new Date();

  // from/to varsa onları kullan, yoksa bu ayın başı ve sonunu kullan
  let fromParam: string;
  let toParam: string;

  if (searchParams?.from && searchParams?.to) {
    fromParam = searchParams.from;
    toParam = searchParams.to;
  } else {
    const defaultFrom = format(startOfMonth(now), "yyyy-MM-dd");
    const defaultTo = format(endOfMonth(now), "yyyy-MM-dd");
    fromParam = defaultFrom;
    toParam = defaultTo;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">İşlemler</h1>
          <p className="text-muted-foreground">Tüm gelir ve gider işlemleriniz.</p>
        </div>

        {/* Dashboard stili filtreleme - MonthYearDropdown + DatePresets */}
        <div className="flex flex-col items-start sm:items-end gap-1 min-w-[220px]">
          <React.Suspense fallback={<div className="h-10 w-full bg-muted animate-pulse rounded-xl" />}>
            <MonthYearDropdown basePath="/transactions" />
          </React.Suspense>
          <React.Suspense fallback={<div className="h-7 w-full bg-muted animate-pulse rounded-full" />}>
            <DatePresets basePath="/transactions" />
          </React.Suspense>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <TransactionList from={fromParam} to={toParam} />
        </CardContent>
      </Card>
    </div>
  );
}
