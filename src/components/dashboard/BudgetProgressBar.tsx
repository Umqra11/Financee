"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertBudgetLimit } from "@/lib/actions/finance";

interface BudgetProgressBarProps {
  spent: number;
  initialLimit: number;
  categoryId: string;
  month: number;
  year: number;
}

export function BudgetProgressBar({
  spent,
  initialLimit,
  categoryId,
  month,
  year,
}: BudgetProgressBarProps) {
  const router = useRouter();
  const [limit, setLimit] = useState(initialLimit);
  const [isPending, startTransition] = useTransition();

  const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const actualPercentage = limit > 0 ? (spent / limit) * 100 : 0;

  const getProgressColor = (perc: number) => {
    if (perc < 70) return "bg-emerald-500";
    if (perc < 90) return "bg-amber-500";
    if (perc < 100) return "bg-orange-500";
    return "bg-rose-600";
  };

  const getTextColor = (perc: number) => {
    if (perc < 70) return "text-emerald-600 dark:text-emerald-400";
    if (perc < 90) return "text-amber-600 dark:text-amber-400";
    if (perc < 100) return "text-orange-600 dark:text-orange-400";
    return "text-rose-600 dark:text-rose-400";
  };

  const handleLimitSave = (newLimit: number) => {
    startTransition(async () => {
      try {
        await upsertBudgetLimit({
          categoryId,
          amount: newLimit,
          month,
          year,
        });
        router.refresh();
      } catch (error) {
        console.error("Bütçe güncellenemedi:", error);
      }
    });
  };

  // Sürgü için maksimum değer: spent veya limit değerlerinin 1.5 katı ya da en az 5000 ₺
  const maxSliderValue = Math.max(spent * 1.5, initialLimit * 1.5, 5000);

  return (
    <div className="flex flex-col gap-3 w-full bg-zinc-50/50 dark:bg-zinc-900/20 p-4 rounded-xl border border-zinc-100/80 dark:border-zinc-800/40">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          Kullanılan: <span className="font-semibold text-zinc-900 dark:text-white">₺{spent.toLocaleString("tr-TR")}</span>
        </span>
        <span className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
          Limit:{" "}
          <span className="font-bold text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 shadow-sm">
            ₺{limit.toLocaleString("tr-TR")}
          </span>
          {isPending && (
            <span className="text-[10px] text-zinc-400 animate-pulse font-normal">
              (Kaydediliyor...)
            </span>
          )}
        </span>
      </div>

      <div className="w-full bg-zinc-200/60 dark:bg-zinc-800/60 rounded-full h-2.5 overflow-hidden shadow-inner">
        <div
          className={`h-full transition-all duration-500 ease-out rounded-full ${getProgressColor(
            actualPercentage
          )}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Sürgülü Bütçe Limit Editörü */}
      <div className="flex flex-col gap-1 mt-1">
        <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500 px-0.5">
          <span>₺0</span>
          <span>Bütçeyi ayarlamak için sürükleyin</span>
          <span>₺{Math.round(maxSliderValue).toLocaleString("tr-TR")}</span>
        </div>
        <input
          type="range"
          min="0"
          max={maxSliderValue}
          step="50"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          onMouseUp={() => handleLimitSave(limit)}
          onTouchEnd={() => handleLimitSave(limit)}
          className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500 transition-all hover:accent-blue-700"
        />
      </div>

      {limit > 0 ? (
        <p className={`text-xs font-semibold flex items-center gap-1 ${getTextColor(actualPercentage)}`}>
          {actualPercentage >= 100 ? (
            <>
              <span>⚠️</span> Dikkat: Bütçe limitinizi aştınız! (Aşım: ₺
              {(spent - limit).toLocaleString("tr-TR")})
            </>
          ) : actualPercentage >= 90 ? (
            <>
              <span>⚠️</span> Bütçe limitinizin sınırındasınız (%{Math.round(actualPercentage)}).
            </>
          ) : actualPercentage >= 70 ? (
            <>
              <span>ℹ️</span> Bütçe limitinize yaklaşıyorsunuz (%{Math.round(actualPercentage)}).
            </>
          ) : (
            <>
              <span>✅</span> Bütçe durumunuz güvende (%{Math.round(actualPercentage)} kullanıldı).
            </>
          )}
        </p>
      ) : (
        <p className="text-xs text-zinc-500 font-medium">
          ℹ️ Bu kategori için henüz bütçe limiti belirlenmemiş.
        </p>
      )}
    </div>
  );
}
