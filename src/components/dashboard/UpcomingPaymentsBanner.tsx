"use client";

import { useState } from "react";

interface Category {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
}

interface Subscription {
  id: string;
  name: string;
  amount: number;
  next_billing_date: string;
  billing_period: "weekly" | "monthly" | "yearly";
  categories: Category | null;
}

interface UpcomingPaymentsBannerProps {
  subscriptions: Subscription[];
}

export function UpcomingPaymentsBanner({ subscriptions }: UpcomingPaymentsBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible || !subscriptions || subscriptions.length === 0) {
    return null;
  }

  const getRelativeDayText = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const billingDate = new Date(dateStr);
    billingDate.setHours(0, 0, 0, 0);

    const diffTime = billingDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Bugün";
    if (diffDays === 1) return "Yarın";
    if (diffDays === 2) return "2 gün sonra";
    if (diffDays === 3) return "3 gün sonra";
    return `${diffDays} gün sonra`;
  };

  return (
    <div className="w-full bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
      <span className="text-xl shrink-0 mt-0.5 animate-bounce">⚠️</span>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-400">
          Yaklaşan Abonelik Ödemeleri
        </h4>
        <div className="mt-1.5 space-y-1.5">
          {subscriptions.map((sub) => (
            <p key={sub.id} className="text-xs text-amber-700 dark:text-amber-300/90 font-medium">
              • <span className="font-bold">{sub.name}</span> ödemesi{" "}
              <span className="underline decoration-amber-400/50 underline-offset-2">
                {getRelativeDayText(sub.next_billing_date)}
              </span>{" "}
              (<span className="font-semibold">₺{sub.amount.toLocaleString("tr-TR")}</span>)
            </p>
          ))}
        </div>
      </div>

      <button
        onClick={() => setIsVisible(false)}
        className="rounded-lg p-1 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:text-amber-700 dark:hover:text-amber-300 transition-colors shrink-0"
        aria-label="Kapat"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
