import React from "react";
import { format, differenceInMonths, isPast } from "date-fns";
import { tr } from "date-fns/locale";
import { Repeat, CalendarClock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

import { getSubscriptions } from "@/lib/actions/subscriptions";

const categoryLabels: Record<string, string> = {
  entertainment: "Eğlence",
  utilities: "Faturalar",
  loan: "Kredi & Borç",
  rent: "Kira",
  other_expense: "Diğer Düzenli Gider",
};

const frequencyLabels: Record<string, string> = {
  weekly: "Haftalık",
  monthly: "Aylık",
  yearly: "Yıllık",
};

// Client Component for the export button
import { ExportButton } from "./ExportButton";

export async function SubscriptionList() {
  let subscriptions = [];
  try {
    subscriptions = await getSubscriptions();
  } catch (error) {
    console.error(error);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Aktif Abonelikler & Taksitler</h2>
        {subscriptions.length > 0 && <ExportButton data={subscriptions} />}
      </div>
      
      <div className="hidden md:block border rounded-xl overflow-hidden bg-card">
        {/* PC: Table View */}
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">İsim</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 font-medium">Tutar</th>
              <th className="px-4 py-3 font-medium">Periyot</th>
              <th className="px-4 py-3 font-medium">Sıradaki Ödeme</th>
              <th className="px-4 py-3 font-medium">Durum / Bitiş</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {subscriptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Henüz kayıtlı bir düzenli ödemeniz yok.
                </td>
              </tr>
            ) : (
              subscriptions.map((sub: any) => {
                const rawCategoryName = sub.categories?.name || sub.category_id || "Kategori Yok";
                const displayCategoryName = categoryLabels[rawCategoryName] || rawCategoryName;
                const isEnded = sub.end_date && isPast(new Date(sub.end_date));
                const monthsLeft = sub.end_date ? differenceInMonths(new Date(sub.end_date), new Date()) : null;

                return (
                  <tr key={sub.id} className={`hover:bg-muted/50 transition-colors ${isEnded ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-medium">{sub.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{displayCategoryName}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">
                      -{Number(sub.amount).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                    </td>
                    <td className="px-4 py-3">{frequencyLabels[sub.frequency]}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="w-4 h-4 text-muted-foreground" />
                        {format(new Date(sub.next_payment_date), "dd MMM yyyy", { locale: tr })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {isEnded ? (
                        <span className="text-emerald-600 font-medium">Bitti</span>
                      ) : sub.end_date ? (
                        <span>{monthsLeft} ay kaldı</span>
                      ) : (
                        <span>Süresiz</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: Card View */}
      <div className="md:hidden space-y-3">
        {subscriptions.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground border rounded-xl bg-card">
            Henüz kayıtlı bir düzenli ödemeniz yok.
          </div>
        ) : (
          subscriptions.map((sub: any) => {
            const rawCategoryName = sub.categories?.name || sub.category_id || "Kategori Yok";
            const displayCategoryName = categoryLabels[rawCategoryName] || rawCategoryName;
            const isEnded = sub.end_date && isPast(new Date(sub.end_date));
            const monthsLeft = sub.end_date ? differenceInMonths(new Date(sub.end_date), new Date()) : null;

            return (
              <div
                key={sub.id}
                className={`flex flex-col gap-2 p-4 rounded-xl border bg-card text-card-foreground shadow-sm ${isEnded ? 'opacity-50' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{sub.name}</h3>
                    <p className="text-sm text-muted-foreground">{displayCategoryName}</p>
                  </div>
                  <div className="font-semibold text-red-600">
                    -{Number(sub.amount).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Repeat className="w-4 h-4" />
                    <span>{frequencyLabels[sub.frequency]}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <CalendarClock className="w-4 h-4 text-primary/70" />
                    <span>{format(new Date(sub.next_payment_date), "dd MMM", { locale: tr })}</span>
                  </div>
                </div>

                {sub.end_date && (
                  <div className="text-xs text-center mt-2 text-muted-foreground bg-muted/50 rounded-md py-1">
                    {isEnded ? "Bu ödeme planı tamamlandı 🎉" : `Bitiş: ${format(new Date(sub.end_date), "MMM yyyy", { locale: tr })} (${monthsLeft} ay kaldı)`}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
