export const dynamic = "force-dynamic";
import React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";
import { getTransactions, getTotalBalance, getOrCreateGeneralBudget } from "@/lib/actions/finance";
import { syncSubscriptionsToTransactions } from "@/lib/actions/sync";
import { PresetDateRangePicker } from "@/components/dashboard/preset-date-range-picker";
import { MonthYearDropdown } from "@/components/dashboard/month-year-dropdown";
import { DatePresets } from "@/components/dashboard/DatePresets";
import { ExpensePieChart } from "@/components/dashboard/ExpensePieChart";
import { TrendLineChart } from "@/components/dashboard/TrendLineChart";
import { ExportButton } from "@/components/subscriptions/ExportButton";
import { subMonths, startOfMonth, format } from "date-fns";
import { cn } from "@/lib/utils";

export default async function Home(props: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const resolvedParams = await props.searchParams;
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const strM = m < 10 ? `0${m}` : `${m}`;
  const strD = d < 10 ? `0${d}` : `${d}`;
  const todayStr = `${y}-${strM}-${strD}`;

  const defaultFrom = format(startOfMonth(now), "yyyy-MM-dd");
  const defaultTo = todayStr;

  const fromParam = resolvedParams?.from || defaultFrom;
  const toParam = resolvedParams?.to || defaultTo;

  // Tüm zamanlar bakiyesi (sabit)
  let totalBalanceData = { balance: 0, totalIncome: 0, totalExpense: 0 };
  try {
    totalBalanceData = await getTotalBalance();
  } catch (error) {
    console.error("Error fetching total balance:", error);
  }

  // Bu ay bütçesi
  let generalBudget = { hasBudget: false, budgetAmount: 0, totalSpent: 0, percentage: 0, isOverBudget: false, isNearLimit: false };
  try {
    generalBudget = await getOrCreateGeneralBudget({ month: m, year: y });
  } catch (error) {
    console.error("Error fetching general budget:", error);
  }

  let totalIncome = 0;
  let totalExpense = 0;

  let pieChartData: { name: string; value: number }[] = [];
  let trendChartData: { date: string; displayDate: string; amount: number }[] = [];

  let transactions: any[] = [];
  try {
    await syncSubscriptionsToTransactions();
    // İşlemleri tarihe göre getir
    transactions = await getTransactions({
      from: fromParam,
      to: toParam,
    });

    const categoryLabels: Record<string, string> = {
      salary: "Maaş",
      investment: "Yatırım",
      other_income: "Diğer (Gelir)",
      food: "Gıda",
      transport: "Ulaşım",
      utilities: "Faturalar",
      entertainment: "Eğlence",
      loan: "Kredi & Borç",
      other_expense: "Diğer (Gider)",
    };

    const categoryMap = new Map<string, { name: string; value: number }>();

    transactions.forEach((tx: any) => {
      const amount = Number(tx.amount);
      if (tx.type === "income") {
        totalIncome += amount;
      } else if (tx.type === "expense") {
        if (tx.payment_method !== "credit_card") {
          totalExpense += amount;
        }

        const rawCat = tx.categories?.name || 'Kategorisiz';
        const categoryName = categoryLabels[rawCat] || rawCat;

        const existing = categoryMap.get(categoryName);
        if (existing) {
          existing.value += amount;
        } else {
          categoryMap.set(categoryName, { name: categoryName, value: amount });
        }
      }
    });

    pieChartData = Array.from(categoryMap.values()).sort((a, b) => b.value - a.value);

    // Trend grafiği için veriyi hazırlama
    const start = new Date(fromParam);
    const end = new Date(toParam);
    const dateList: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dateList.push(`${y}-${m}-${day}`);
    }

    let cumulative = 0;
    trendChartData = dateList.map((dateStr) => {
      const dayTx = transactions.filter((tx: any) => tx.date.split('T')[0] === dateStr);
      let dayNet = 0;
      dayTx.forEach((tx: any) => {
        const amt = Number(tx.amount);
        if (tx.type === 'income') {
          dayNet += amt;
        } else if (tx.type === 'expense' && tx.payment_method !== 'credit_card') {
          dayNet -= amt;
        }
      });
      cumulative += dayNet;

      const d = new Date(dateStr);
      const displayDate = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
      const axisDate = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

      return {
        date: axisDate,
        displayDate,
        amount: cumulative,
      };
    });
  } catch (error) {
    console.error(error);
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("tr-TR", {
      style: "currency",
      currency: "TRY",
    });
  };

  const formatPlain = (amount: number) => {
    return "₺" + amount.toLocaleString("tr-TR");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Kontrol Paneli</h1>
            <ExportButton data={transactions} />
          </div>
          <p className="text-muted-foreground">Mevcut finansal durumunuzun özeti.</p>
        </div>
        <div className="flex flex-col gap-2 w-[260px] sm:w-[300px] items-end">
          <React.Suspense fallback={<div className="h-10 w-full bg-muted animate-pulse rounded-md" />}>
            <PresetDateRangePicker className="w-full" />
            <MonthYearDropdown className="w-full" />
            <DatePresets />
          </React.Suspense>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className={totalBalanceData.balance >= 0 ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-500"}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Hesap Bakiyesi</CardTitle>
            <Wallet className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalBalanceData.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(totalBalanceData.balance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Tüm zamanlar toplam gelir - gider
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <ArrowUpCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Toplam Gider (Nakit)</CardTitle>
            <ArrowDownCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">-{formatCurrency(totalExpense)}</div>
          </CardContent>
        </Card>

        {/* Aylık Bütçe Kutusu - renkli */}
        <Card className={cn(
          "border-l-4 transition-colors duration-300",
          !generalBudget.hasBudget
            ? "border-l-zinc-300 bg-zinc-50 dark:bg-zinc-900/50"
            : generalBudget.isOverBudget
              ? "border-l-red-500 bg-red-50 dark:bg-red-950/30"
              : generalBudget.isNearLimit
                ? "border-l-amber-500 bg-amber-50 dark:bg-amber-950/30"
                : generalBudget.percentage <= 60
                  ? "border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                  : "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/30"
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Aylık Bütçe</CardTitle>
            <span className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              !generalBudget.hasBudget
                ? "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                : generalBudget.isOverBudget
                  ? "bg-red-200 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                  : generalBudget.isNearLimit
                    ? "bg-amber-200 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                    : "bg-emerald-200 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
            )}>
              {!generalBudget.hasBudget
                ? "Bütçe Yok"
                : generalBudget.isOverBudget
                  ? "Aşıldı!"
                  : generalBudget.isNearLimit
                    ? "Dikkat"
                    : "%" + Math.round(generalBudget.percentage)}
            </span>
          </CardHeader>
          <CardContent>
            {!generalBudget.hasBudget ? (
              <div className="space-y-2">
                <div className="text-xl font-bold text-zinc-500">—</div>
                <p className="text-xs text-zinc-400">
                  <a href="/dashboard" className="underline hover:text-indigo-500">Dashboard'dan</a> aylık bütçe belirleyin
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-zinc-500">Harcanan</span>
                  <span className="text-sm font-semibold">{formatPlain(generalBudget.totalSpent)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-zinc-500">Bütçe</span>
                  <span className="text-sm font-semibold">{formatPlain(generalBudget.budgetAmount)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-1 border-t border-zinc-200 dark:border-zinc-700">
                  <span className="text-xs text-zinc-500">
                    {generalBudget.isOverBudget ? "Aşım" : "Kalan"}
                  </span>
                  <span className={cn(
                    "text-sm font-bold",
                    generalBudget.isOverBudget ? "text-red-600" : "text-emerald-600"
                  )}>
                    {generalBudget.isOverBudget ? "-" : ""}{formatPlain(Math.abs(generalBudget.budgetAmount - generalBudget.totalSpent))}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1">
        <Card className="rounded-2xl border shadow-sm bg-card/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Kategori Bazlı Harcamalar</CardTitle>
            <CardDescription>Seçili periyotta harcama dağılımınız</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center p-6 min-h-[320px]">
            {pieChartData.length > 0 ? (
              <ExpensePieChart data={pieChartData} />
            ) : (
              <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                Bu periyotta harcama verisi bulunmuyor.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm bg-card/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Finansal Trend</CardTitle>
            <CardDescription>Seçili periyotta net bakiye gidişatınız (Kümülatif)</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex items-center justify-center min-h-[320px]">
            <TrendLineChart data={trendChartData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
