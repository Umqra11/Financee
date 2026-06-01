"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upsertGeneralBudget } from "@/lib/actions/finance";
import { Pencil, Save, TrendingDown, TrendingUp, Wallet } from "lucide-react";

interface GeneralBudgetBarProps {
    totalSpent: number;
    budgetAmount: number;
    hasBudget: boolean;
    percentage: number;
    isOverBudget: boolean;
    isNearLimit: boolean;
    month: number;
    year: number;
}

export function GeneralBudgetBar({
    totalSpent,
    budgetAmount,
    hasBudget,
    percentage,
    isOverBudget,
    isNearLimit,
    month,
    year,
}: GeneralBudgetBarProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isEditing, setIsEditing] = useState(false);
    const [newAmount, setNewAmount] = useState(budgetAmount || 5000);

    // Mavi → Kırmızı renk skalası
    const getGradientColor = (perc: number) => {
        if (perc <= 40) return "from-blue-500 to-cyan-400";
        if (perc <= 60) return "from-green-500 to-emerald-400";
        if (perc <= 80) return "from-yellow-500 to-amber-400";
        if (perc <= 95) return "from-orange-500 to-amber-500";
        return "from-red-500 to-rose-600";
    };

    const getBarColor = (perc: number) => {
        if (perc <= 40) return "bg-gradient-to-r from-blue-500 to-cyan-400";
        if (perc <= 60) return "bg-gradient-to-r from-green-500 to-emerald-400";
        if (perc <= 80) return "bg-gradient-to-r from-yellow-500 to-amber-400";
        if (perc <= 95) return "bg-gradient-to-r from-orange-500 to-amber-500";
        return "bg-gradient-to-r from-red-500 to-rose-600";
    };

    const getStatusText = () => {
        if (!hasBudget) return null;
        if (isOverBudget) return { text: "Bütçe Aşıldı!", icon: TrendingUp, class: "text-rose-600 dark:text-rose-400" };
        if (isNearLimit) return { text: "Sınıra Yaklaştınız", icon: TrendingUp, class: "text-amber-600 dark:text-amber-400" };
        return { text: "Bütçe Güvende", icon: TrendingDown, class: "text-emerald-600 dark:text-emerald-400" };
    };

    const status = getStatusText();
    const barColor = getBarColor(percentage);
    const remaining = budgetAmount - totalSpent;

    const handleSave = () => {
        if (newAmount <= 0) {
            toast.error("Lütfen geçerli bir bütçe tutarı girin");
            return;
        }
        startTransition(async () => {
            try {
                await upsertGeneralBudget({
                    amount: newAmount,
                    month,
                    year,
                });
                toast.success("Aylık bütçe kaydedildi!");
                setIsEditing(false);
                router.refresh();
            } catch (error) {
                toast.error("Bütçe kaydedilemedi");
                console.error(error);
            }
        });
    };

    const percentageDisplay = Math.min(Math.round(percentage), 100);

    return (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm p-5">
            {/* Başlık */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${!hasBudget ? "bg-zinc-100 dark:bg-zinc-800" :
                            isOverBudget ? "bg-rose-100 dark:bg-rose-900/30" :
                                isNearLimit ? "bg-amber-100 dark:bg-amber-900/30" :
                                    "bg-emerald-100 dark:bg-emerald-900/30"
                        }`}>
                        <Wallet size={18} className={
                            !hasBudget ? "text-zinc-500" :
                                isOverBudget ? "text-rose-600" :
                                    isNearLimit ? "text-amber-600" :
                                        "text-emerald-600"
                        } />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                            Aylık Bütçe
                        </h3>
                        {status && (
                            <p className={`text-xs font-medium flex items-center gap-1 ${status.class}`}>
                                <status.icon size={13} />
                                {status.text}
                            </p>
                        )}
                    </div>
                </div>

                {!isEditing && hasBudget && (
                    <button
                        onClick={() => {
                            setNewAmount(budgetAmount);
                            setIsEditing(true);
                        }}
                        className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                        <Pencil size={13} />
                        Düzenle
                    </button>
                )}
            </div>

            {/* Bütçe düzenleme veya gösterim */}
            {isEditing || !hasBudget ? (
                <div className="flex flex-col gap-3">
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                            {!hasBudget ? "Aylık bütçe limiti belirleyin" : "Yeni bütçe limiti"}
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-medium text-sm">₺</span>
                                <input
                                    type="number"
                                    value={newAmount}
                                    onChange={(e) => setNewAmount(Number(e.target.value))}
                                    className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="5000"
                                    min={0}
                                    step={100}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSave();
                                        if (e.key === "Escape") setIsEditing(false);
                                    }}
                                />
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={isPending}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                {isPending ? (
                                    <span className="animate-pulse">Kaydediliyor...</span>
                                ) : (
                                    <>
                                        <Save size={15} />
                                        Kaydet
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Progress Bar */}
                    <div className="relative w-full h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                        <div
                            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${barColor}`}
                            style={{ width: `${percentageDisplay}%` }}
                        />
                        {/* Parlama efekti */}
                        {percentageDisplay > 0 && (
                            <div
                                className="absolute inset-y-0 left-0 rounded-full opacity-30 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                style={{ width: `${percentageDisplay}%` }}
                            />
                        )}
                    </div>

                    {/* Bilgi satırı */}
                    <div className="flex justify-between items-center mt-3">
                        <div className="flex flex-col">
                            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Harcanan</span>
                            <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                ₺{totalSpent.toLocaleString("tr-TR")}
                            </span>
                        </div>

                        <div className="flex flex-col items-center">
                            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Bütçe</span>
                            <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                ₺{budgetAmount.toLocaleString("tr-TR")}
                            </span>
                        </div>

                        <div className="flex flex-col items-end">
                            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                                {isOverBudget ? "Aşım" : "Kalan"}
                            </span>
                            <span className={`text-sm font-bold ${isOverBudget ? "text-rose-600" : remaining > 0 ? "text-emerald-600" : "text-zinc-400"
                                }`}>
                                {isOverBudget ? "-" : ""}₺{Math.abs(remaining).toLocaleString("tr-TR")}
                            </span>
                        </div>
                    </div>

                    {/* Yüzde göstergesi */}
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Kullanım</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isOverBudget ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600" :
                                isNearLimit ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" :
                                    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                            }`}>
                            %{percentageDisplay}
                        </span>
                    </div>
                </>
            )}
        </div>
    );
}