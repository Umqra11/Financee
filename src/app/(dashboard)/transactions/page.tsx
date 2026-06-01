import React from "react";

export const dynamic = "force-dynamic";

import { TransactionList } from "@/components/transactions/TransactionList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PresetDateRangePicker } from "@/components/dashboard/preset-date-range-picker";
import { subMonths } from "date-fns";

export default function TransactionsPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const defaultFrom = subMonths(new Date(), 3).toISOString().split('T')[0];
  const defaultTo = new Date().toISOString().split('T')[0];

  const fromParam = searchParams?.from || defaultFrom;
  const toParam = searchParams?.to || defaultTo;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">İşlemler</h1>
          <p className="text-muted-foreground">Tüm gelir ve gider işlemleriniz.</p>
        </div>
        <React.Suspense fallback={<div className="h-10 w-64 bg-muted animate-pulse rounded-md" />}>
          <PresetDateRangePicker />
        </React.Suspense>
      </div>

      <Card>
        <CardContent className="pt-6">
          <TransactionList from={fromParam} to={toParam} />
        </CardContent>
      </Card>
    </div>
  );
}
