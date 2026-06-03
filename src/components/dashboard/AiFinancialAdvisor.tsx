"use client";

import { useState, useTransition } from "react";
import { getFinancialAdvice } from "@/lib/actions/ai-advisor";

interface SavingTip {
  title: string;
  impact: "Düşük" | "Orta" | "Yüksek";
  description: string;
}

interface AiFinancialAdvisorProps {
  month: number;
  year: number;
}

export function AiFinancialAdvisor({ month, year }: AiFinancialAdvisorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [advice, setAdvice] = useState<SavingTip[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const fetchAdvice = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await getFinancialAdvice({ month, year });
        if (result.success && result.advice) {
          setAdvice(result.advice);
        } else {
          setError("Finansal tavsiyeler alınamadı.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Tavsiyeler yüklenirken bir hata oluştu.");
      }
    });
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (advice.length === 0) {
      fetchAdvice();
    }
  };

  const getImpactBadgeColor = (impact: "Düşük" | "Orta" | "Yüksek") => {
    switch (impact) {
      case "Yüksek":
        return "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30";
      case "Orta":
        return "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30";
      case "Düşük":
        return "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30";
      default:
        return "bg-zinc-50 dark:bg-zinc-950/30 text-zinc-600 dark:text-zinc-400 border-zinc-100 dark:border-zinc-900/30";
    }
  };

  return (
    <>
      {/* Işıltılı Premium AI Butonu */}
      <button
        onClick={handleOpen}
        className="group relative flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white font-medium text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-300"></span>
        </span>
        <span className="relative flex items-center gap-1.5 font-semibold tracking-wide">
          ✨ Yapay Zeka Finansal Tavsiyeleri
        </span>
      </button>

      {/* Pürüzsüz Kayarak Açılan Çekmece (Sheet) */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-all duration-500 ${
          isOpen ? "visible" : "invisible pointer-events-none"
        }`}
      >
        {/* Arka Plan Karartması (Overlay) */}
        <div
          className={`absolute inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity duration-500 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsOpen(false)}
        />

        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div
            className={`w-screen max-w-md bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col transition-transform duration-500 ease-out transform ${
              isOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Çekmece Başlığı */}
            <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-900/60 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                  <span>✨</span> AI Finansal Danışman
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Yapay zeka bu ayki finansal durumunuzu sizin için analiz etti.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Çekmece İçeriği */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {isPending ? (
                // Skeleton Yüklenme Durumu
                <div className="space-y-6 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="p-5 rounded-2xl border border-zinc-100 dark:border-zinc-900 space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded-md w-3/5" />
                        <div className="h-5 bg-zinc-100 dark:bg-zinc-900 rounded-md w-16" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-md w-full" />
                        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-md w-11/12" />
                        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-md w-4/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-10 space-y-4">
                  <div className="text-3xl text-zinc-400">⚠️</div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{error}</p>
                  <button
                    onClick={fetchAdvice}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    Tekrar Dene
                  </button>
                </div>
              ) : advice.length > 0 ? (
                <div className="space-y-6">
                  {advice.map((item, index) => (
                    <div
                      key={index}
                      className="group relative p-5 rounded-2xl border border-zinc-100/80 dark:border-zinc-800/40 bg-zinc-50/30 dark:bg-zinc-900/10 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/20 transition-all duration-300"
                    >
                      {/* Premium Sol Kenar Çizgisi */}
                      <div className="absolute left-0 top-6 bottom-6 w-1 rounded-r-md bg-gradient-to-b from-violet-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="font-bold text-zinc-900 dark:text-white leading-snug">
                          {item.title}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${getImpactBadgeColor(
                            item.impact
                          )}`}
                        >
                          {item.impact} Tasarruf
                        </span>
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2.5 leading-relaxed font-medium">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-zinc-500 text-sm">
                  Tavsiyeler yükleniyor...
                </div>
              )}
            </div>

            {/* Çekmece Alt Bölümü */}
            <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-900/60 bg-zinc-50/50 dark:bg-zinc-900/20 flex gap-3">
              <button
                onClick={fetchAdvice}
                disabled={isPending}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-50 transition-colors"
              >
                <span>🔄</span> Yenile
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
