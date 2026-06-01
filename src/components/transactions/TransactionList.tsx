import React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { getTransactions } from "@/lib/actions/finance";
import { DeleteTransactionButton } from "./DeleteTransactionButton";
import { EditTransactionModal } from "./EditTransactionModal";

const categoryLabels: Record<string, string> = {
  salary: "Maaş",
  investment: "Yatırım",
  other_income: "Diğer (Gelir)",
  food: "Gıda",
  transport: "Ulaşım",
  utilities: "Faturalar",
  entertainment: "Eğlence",
  other_expense: "Diğer (Gider)",
};

export async function TransactionList({ from, to }: { from?: string; to?: string } = {}) {
  let transactions: any[] = [];
  try {
    transactions = await getTransactions({ from, to });
  } catch (error) {
    // User might not be logged in or error occurred
    console.error(error);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Son İşlemler</h2>
      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground border rounded-xl bg-card">
            Henüz bir işlem bulunmuyor.
          </div>
        ) : (
          transactions.map((tx: any) => {
            const rawCategoryName = tx.categories?.name || tx.category_id || "Kategori Yok";
            const displayCategoryName = categoryLabels[rawCategoryName] || rawCategoryName;

            return (
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
                    <p className="font-medium">{displayCategoryName}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{format(new Date(tx.date), "dd MMM yyyy", { locale: tr })}</span>
                      {tx.description && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[120px] sm:max-w-[200px]">
                            {tx.description}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "font-semibold",
                      tx.type === "income" ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
                    )}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {Number(tx.amount).toLocaleString("tr-TR", {
                      style: "currency",
                      currency: "TRY",
                    })}
                  </div>
                  <div className="flex items-center gap-1">
                    <EditTransactionModal transaction={tx} />
                    <DeleteTransactionButton id={tx.id} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
