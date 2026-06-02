export const dynamic = "force-dynamic";
import React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";
import { getTransactions, getTotalBalance, getOrCreateGeneralBudget } from "@/lib/actions/finance";
import { syncSubscriptionsToTransactions } from "@/lib/actions/sync";
import { DateFilterGroup } from "@/components/dashboard/DateFilterGroup";
import { ExpensePieChart } from "@/components/dashboard/ExpensePieChart";
import { TrendLineChart } from "@/components/dashboard/TrendLineChart";
import { BudgetProgressBar } from "@/components/dashboard/BudgetProgressBar";
import { AiChatPanel } from "@/components/dashboard/AiChatPanel";
import { ExportButton } from "@/components/subscriptions/ExportButton";
import { startOfMonth, format } from "date-fns";

export default async function Home(props: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const resolvedParams = await props.searchParams;
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const strM = m < 10 ? `0${m}` : `${m}`;
  const todayStr = `${y}-${strM}-${String(now.getDate()).padStart(2, '0')}`;

  const defaultFrom = format(startOfMonth(now), "yyyy-MM-dd");
  const defaultTo = todayStr;

  const fromParam = resolvedParams?.from || defaultFrom;
  const toParam = resolvedParams?.to || defaultTo;

  // Paralel fetch: bakiye ve bütçe aynı anda
  const [balanceResult, budgetResult] = await Promise.all([
    getTotalBalance().catch((error) => {
      console.error("Error fetching total balance:", error);
      return { balance: 0, totalIncome: 0, totalExpense: 0 };
    }),
    getOrCreateGeneralBudget({ month: m, year: y }).catch((error) => {
      console.error("Error fetching general budget:", error);
      return { hasBudget: false, budgetAmount: 0, totalSpent: 0, percentage: 0, isOverBudget: false, isNearLimit: false };
    }),
  ]);

  let totalIncome = 0;
  let totalExpense = 0;

  let pieChartData: { name: string; value: number }[] = [];
  let trendChartData: { date: string; displayDate: string; amount: number }[] = [];

  let transactions: any[] = [];
  try {
    await syncSubscriptionsToTransactions();
    transactions = await getTransactions({
      from: fromParam,
      to: toParam,
    });

    const categoryLabels: Record<string, string> = {
      maaş: "Maaş",
      diğer_gelir: "Diğer Gelir",
      gıda: "Gıda",
      ulaşım: "Ulaşım",
      faturalar: "Faturalar",
      eğlence: "Eğlence",
      kredi: "Kredi & Borç",
      diğer_gider: "Diğer Gider",
      yatırım: "Yatırım",
      kredi_kartı_ödemesi: "Kredi Kartı Ödemesi",
      market: "Market",
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
        if (rawCat === 'kredi' || rawCat === 'kredi_kartı_ödemesi') return;

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
            <DateFilterGroup />
          </React.Suspense>
        </div>
      </div>

      {/* Aylık Bütçe Progress Bar */}
      <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-5">
        <BudgetProgressBar
          hasBudget={budgetResult.hasBudget}
          budgetAmount={budgetResult.budgetAmount}
          totalSpent={budgetResult.totalSpent}
          percentage={budgetResult.percentage}
          isOverBudget={budgetResult.isOverBudget}
          isNearLimit={budgetResult.isNearLimit}
          month={m}
          year={y}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className={balanceResult.balance >= 0 ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-500"}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Hesap Bakiyesi</CardTitle>
            <Wallet className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balanceResult.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(balanceResult.balance)}
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

      {/* AI Chat Danışman - Floating Button + Chat Panel */}
      <AiChatPanel />
    </div>
  );
}