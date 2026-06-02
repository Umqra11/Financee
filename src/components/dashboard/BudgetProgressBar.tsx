"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, Pencil, Check, X } from "lucide-react";
import { upsertGeneralBudget } from "@/lib/actions/finance";
import { toast } from "sonner";

interface BudgetProgressBarProps {
    hasBudget: boolean;
    budgetAmount: number;
    totalSpent: number;
    percentage: number;
    isOverBudget: boolean;
    isNearLimit: boolean;
    month: number;
    year: number;
}

export function BudgetProgressBar({
    hasBudget,
    budgetAmount,
    totalSpent,
    percentage,
    isOverBudget,
    isNearLimit,
    month,
    year,
}: BudgetProgressBarProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(budgetAmount > 0 ? budgetAmount.toString() : "");
    const [isPending, startTransition] = useTransition();

    const formatPlain = (amount: number) => {
        return "₺" + amount.toLocaleString("tr-TR");
    };

    const clampPercentage = Math.min(Math.max(percentage, 0), 100);
    const displayPercentage = Math.round(percentage);

    const barColor = !hasBudget
        ? "bg-zinc-200 dark:bg-zinc-700"
        : isOverBudget
            ? "bg-red-500"
            : isNearLimit
                ? "bg-amber-500"
                : displayPercentage <= 60
                    ? "bg-emerald-500"
                    : "bg-yellow-500";

    const trackColor = !hasBudget
        ? "bg-zinc-100 dark:bg-zinc-800"
        : "bg-zinc-200 dark:bg-zinc-700";

    const pulseAnimation = isOverBudget ? "animate-pulse" : "";

    const handleStartEdit = () => {
        setEditValue(budgetAmount > 0 ? budgetAmount.toString() : "");
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleSaveEdit = () => {
        const amount = Number(editValue);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Geçerli bir bütçe tutarı giriniz.");
            return;
        }
        startTransition(async () => {
            try {
                await upsertGeneralBudget({
                    amount,
                    month,
                    year,
                });
                setIsEditing(false);
                toast.success("Bütçe güncellendi.");
            } catch (error) {
                toast.error("Bütçe güncellenirken hata oluştu.");
            }
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSaveEdit();
        } else if (e.key === "Escape") {
            handleCancelEdit();
        }
    };

    return (
        <div className="w-full space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div
                        className={cn(
                            "p-1.5 rounded-lg",
                            !hasBudget
                                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                : isOverBudget
                                    ? "bg-red-100 dark:bg-red-900/30 text-red-600"
                                    : isNearLimit
                                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                                        : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                        )}
                    >
                        {isOverBudget ? (
                            <TrendingUp className="w-4 h-4" />
                        ) : (
                            <TrendingDown className="w-4 h-4" />
                        )}
                    </div>
                    <Link
                        href={`/budget?month=${month}&year=${year}`}
                        className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                    >
                        Aylık Bütçe
                    </Link>
                </div>

                {isEditing ? (
                    <div className="flex items-center gap-1.5">
                        <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                                ₺
                            </span>
                            <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isPending}
                                className="w-28 h-8 pl-6 pr-2 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 focus:ring-1 focus:ring-violet-400"
                                autoFocus
                                min="0"
                                step="100"
                            />
                        </div>
                        <button
                            onClick={handleSaveEdit}
                            disabled={isPending}
                            className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                        >
                            <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={handleCancelEdit}
                            disabled={isPending}
                            className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        {!hasBudget ? (
                            <span className="text-xs text-zinc-400 font-medium">
                                Bütçe belirlenmedi
                            </span>
                        ) : (
                            <span
                                className={cn(
                                    "text-xs font-bold px-2 py-0.5 rounded-full",
                                    isOverBudget
                                        ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                                        : isNearLimit
                                            ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                                            : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                                )}
                            >
                                {isOverBudget ? "Aşıldı!" : isNearLimit ? "Dikkat" : `%${displayPercentage}`}
                            </span>
                        )}
                        <button
                            onClick={handleStartEdit}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                            title="Bütçeyi düzenle"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            <div className="relative w-full">
                <div className={cn("w-full h-3 rounded-full overflow-hidden", trackColor)}>
                    <div
                        className={cn(
                            "h-full rounded-full transition-all duration-700 ease-out",
                            barColor,
                            pulseAnimation
                        )}
                        style={{ width: `${Math.min(clampPercentage, 100)}%` }}
                    />
                </div>
                <div
                    className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent dark:from-white/10 pointer-events-none"
                    aria-hidden="true"
                />
            </div>

            {/* Alt bilgi: harcanan / bütçe */}
            <div className="flex items-center justify-between text-xs">
                {!hasBudget ? (
                    <span className="text-zinc-400">
                        Bütçeyi yandaki ✏️ simgesine tıklayarak belirleyin.
                    </span>
                ) : (
                    <>
                        <span className="text-zinc-500 dark:text-zinc-400">
                            {formatPlain(totalSpent)}{" "}
                            <span className="text-zinc-400">/ {formatPlain(budgetAmount)}</span>
                        </span>
                        <span
                            className={cn(
                                "font-semibold",
                                isOverBudget
                                    ? "text-red-600"
                                    : "text-emerald-600"
                            )}
                        >
                            {isOverBudget
                                ? `-${formatPlain(Math.abs(budgetAmount - totalSpent))} aşım`
                                : `${formatPlain(budgetAmount - totalSpent)} kaldı`}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}