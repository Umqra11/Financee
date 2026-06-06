export const dynamic = "force-dynamic";

import React from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { MonthYearDropdown } from "@/components/dashboard/month-year-dropdown";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    getOrCreateGeneralBudget,
    getTransactions,
} from "@/lib/actions/finance";
import { ArrowDownCircle, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { syncSubscriptionsToTransactions } from "@/lib/actions/sync";

export default async function BudgetPage(props: {
    searchParams: Promise<{ month?: string; year?: string }>;
}) {
    const resolvedParams = await props.searchParams;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const month = resolvedParams?.month
        ? parseInt(resolvedParams.month, 10)
        : currentMonth;
    const year = resolvedParams?.year
        ? parseInt(resolvedParams.year, 10)
        : currentYear;

    // Zamanı gelmiş düzenli ödemeleri senkronize et
    await syncSubscriptionsToTransactions();

    // Bütçe bilgisini getir
    const budgetResult = await getOrCreateGeneralBudget({
        month,
        year,
    }).catch(() => ({
        hasBudget: false,
        budgetAmount: 0,
        totalSpent: 0,
        percentage: 0,
        isOverBudget: false,
        isNearLimit: false,
    }));

    // O aya ait tüm işlemleri getir
    const allTransactions = await getTransactions({
        month,
        year,
    }).catch(() => []);

    // Bütçe hesabına dahil edilen harcamalar: expense, kredi/kredi_kartı_ödemesi hariç
    const budgetExpenses = allTransactions.filter((tx: any) => {
        if (tx.type !== "expense") return false;
        const catName = tx.categories?.name || "";
        if (catName === "kredi" || catName === "kredi_kartı_ödemesi" || catName === "yatırım" || catName === "sağlık") return false;
        return true;
    });

    // Tüm gelirler (display için)
    const incomes = allTransactions.filter((tx: any) => tx.type === "income");

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString("tr-TR", {
            style: "currency",
            currency: "TRY",
        });
    };

    const clampPercentage = Math.min(Math.max(budgetResult.percentage, 0), 100);
    const displayPercentage = Math.round(budgetResult.percentage);

    const barColor = !budgetResult.hasBudget
        ? "bg-zinc-200 dark:bg-zinc-700"
        : budgetResult.isOverBudget
            ? "bg-red-500"
            : budgetResult.isNearLimit
                ? "bg-amber-500"
                : displayPercentage <= 60
                    ? "bg-emerald-500"
                    : "bg-yellow-500";

    const monthName = format(new Date(year, month - 1, 1), "MMMM yyyy", {
        locale: tr,
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Bütçe Detayı</h1>
                    <p className="text-muted-foreground">
                        {monthName} dönemi bütçe durumu ve harcamalarınız.
                    </p>
                </div>
                <div className="flex flex-col gap-1 w-[220px] items-end">
                    <MonthYearDropdown
                        className="w-full"
                        basePath="/budget"
                        initialMonth={month - 1}
                        initialYear={year}
                    />
                </div>
            </div>

            {/* Bütçe Özet Kartı */}
            <Card className="border-l-4 border-l-emerald-500">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div
                                className={cn(
                                    "p-1.5 rounded-lg",
                                    !budgetResult.hasBudget
                                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                        : budgetResult.isOverBudget
                                            ? "bg-red-100 dark:bg-red-900/30 text-red-600"
                                            : budgetResult.isNearLimit
                                                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                                                : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                                )}
                            >
                                {budgetResult.isOverBudget ? (
                                    <TrendingUp className="w-5 h-5" />
                                ) : (
                                    <TrendingDown className="w-5 h-5" />
                                )}
                            </div>
                            <div>
                                <CardTitle className="text-lg">Aylık Bütçe</CardTitle>
                                <CardDescription>{monthName}</CardDescription>
                            </div>
                        </div>
                        {budgetResult.hasBudget && (
                            <span
                                className={cn(
                                    "text-xs font-bold px-2.5 py-1 rounded-full",
                                    budgetResult.isOverBudget
                                        ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                                        : budgetResult.isNearLimit
                                            ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                                            : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                                )}
                            >
                                {budgetResult.isOverBudget
                                    ? "Aşıldı!"
                                    : budgetResult.isNearLimit
                                        ? "Dikkat"
                                        : `%${displayPercentage}`}
                            </span>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    <div className="relative w-full">
                        <div className="w-full h-3 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-700 ease-out",
                                    barColor
                                )}
                                style={{ width: `${Math.min(clampPercentage, 100)}%` }}
                            />
                        </div>
                        <div
                            className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent dark:from-white/10 pointer-events-none"
                            aria-hidden="true"
                        />
                    </div>

                    {/* Harcanan / Bütçe / Kalan */}
                    {budgetResult.hasBudget ? (
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-3 rounded-xl bg-red-50 dark:bg-red-900/10">
                                <p className="text-xs text-red-600 font-semibold uppercase tracking-wide">
                                    Harcanan
                                </p>
                                <p className="text-lg font-bold text-red-600 mt-1">
                                    {formatCurrency(budgetResult.totalSpent)}
                                </p>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                                <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide">
                                    Bütçe
                                </p>
                                <p className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mt-1">
                                    {formatCurrency(budgetResult.budgetAmount)}
                                </p>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10">
                                <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">
                                    {budgetResult.isOverBudget ? "Aşım" : "Kalan"}
                                </p>
                                <p
                                    className={cn(
                                        "text-lg font-bold mt-1",
                                        budgetResult.isOverBudget
                                            ? "text-red-600"
                                            : "text-emerald-600"
                                    )}
                                >
                                    {budgetResult.isOverBudget
                                        ? `-${formatCurrency(
                                            Math.abs(
                                                budgetResult.budgetAmount - budgetResult.totalSpent
                                            )
                                        )}`
                                        : formatCurrency(
                                            budgetResult.budgetAmount - budgetResult.totalSpent
                                        )}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-sm text-zinc-400 py-4">
                            Bu ay için bütçe belirlenmemiş. Ana sayfadan bütçe belirleyebilirsiniz.
                        </p>
                    )}

                    {/* Gelir / Gider özeti */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                        <span>
                            Toplam Gelir:{" "}
                            <span className="font-semibold text-green-600">
                                +{formatCurrency(
                                    incomes.reduce((s: number, tx: any) => s + Number(tx.amount), 0)
                                )}
                            </span>
                        </span>
                        <span>
                            Toplam Gider:{" "}
                            <span className="font-semibold text-red-600">
                                -{formatCurrency(
                                    budgetExpenses.reduce(
                                        (s: number, tx: any) => s + Number(tx.amount),
                                        0
                                    )
                                )}
                            </span>
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Harcama Listesi Başlığı */}
            <div>
                <h2 className="text-xl font-semibold tracking-tight mb-4">
                    Bütçeye Dahil Harcamalar
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({budgetExpenses.length} işlem)
                    </span>
                </h2>

                {/* Desktop: Tablo */}
                <div className="hidden md:block border rounded-xl overflow-x-auto bg-card">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">Tarih</th>
                                <th className="px-4 py-3 font-medium">Açıklama</th>
                                <th className="px-4 py-3 font-medium">Kategori</th>
                                <th className="px-4 py-3 font-medium text-right">Tutar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {budgetExpenses.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        Bu ay bütçeye dahil harcama bulunmuyor.
                                    </td>
                                </tr>
                            ) : (
                                budgetExpenses.map((tx: any) => (
                                    <tr
                                        key={tx.id}
                                        className="hover:bg-muted/50 transition-colors"
                                    >
                                        <td className="px-4 py-3">
                                            {format(new Date(tx.date), "dd MMM yyyy", {
                                                locale: tr,
                                            })}
                                        </td>
                                        <td className="px-4 py-3 font-medium">
                                            {tx.description || (
                                                <span className="text-muted-foreground italic">
                                                    Açıklama yok
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {tx.categories?.name || "Kategorisiz"}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-red-600">
                                            -{formatCurrency(Number(tx.amount))}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile: Card View */}
                <div className="md:hidden space-y-2">
                    {budgetExpenses.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground border rounded-xl bg-card">
                            Bu ay bütçeye dahil harcama bulunmuyor.
                        </div>
                    ) : (
                        budgetExpenses.map((tx: any) => (
                            <div
                                key={tx.id}
                                className="flex items-center justify-between p-4 rounded-xl border bg-card text-card-foreground shadow-sm"
                            >
                                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                    <p className="font-semibold truncate">
                                        {tx.description || (
                                            <span className="text-muted-foreground italic font-normal">
                                                Açıklama yok
                                            </span>
                                        )}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>
                                            {format(new Date(tx.date), "dd MMM", { locale: tr })}
                                        </span>
                                        <span>·</span>
                                        <span>{tx.categories?.name || "Kategorisiz"}</span>
                                    </div>
                                </div>
                                <div className="font-semibold text-red-600 ml-3 shrink-0">
                                    -{formatCurrency(Number(tx.amount))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}