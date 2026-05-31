import React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

import { cn } from "@/lib/utils";

// This is a mockup type. The backend developer will provide the actual type.
type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: Date;
  note?: string;
};

const DUMMY_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    type: "expense",
    amount: 125.5,
    category: "Gıda",
    date: new Date(2026, 4, 30),
    note: "Market alışverişi",
  },
  {
    id: "2",
    type: "income",
    amount: 5000,
    category: "Maaş",
    date: new Date(2026, 4, 25),
    note: "Aylık maaş",
  },
  {
    id: "3",
    type: "expense",
    amount: 45.0,
    category: "Ulaşım",
    date: new Date(2026, 4, 24),
    note: "Taksi",
  },
  {
    id: "4",
    type: "expense",
    amount: 320.0,
    category: "Faturalar",
    date: new Date(2026, 4, 20),
    note: "Elektrik faturası",
  },
];

export function TransactionList() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Son İşlemler</h2>
      <div className="space-y-3">
        {DUMMY_TRANSACTIONS.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between p-4 rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "p-3 rounded-full flex items-center justify-center",
                  tx.type === "income"
                    ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500"
                    : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500"
                )}
              >
                {tx.type === "income" ? (
                  <ArrowUpRight className="w-5 h-5" />
                ) : (
                  <ArrowDownRight className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="font-medium">{tx.category}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{format(tx.date, "dd MMM yyyy", { locale: tr })}</span>
                  {tx.note && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-[120px] sm:max-w-[200px]">
                        {tx.note}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div
              className={cn(
                "font-semibold",
                tx.type === "income" ? "text-green-600 dark:text-green-500" : ""
              )}
            >
              {tx.type === "income" ? "+" : "-"}
              {tx.amount.toLocaleString("tr-TR", {
                style: "currency",
                currency: "TRY",
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
