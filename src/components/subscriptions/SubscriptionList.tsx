import React from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Repeat, CalendarClock } from "lucide-react";
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

import { DeleteSubscriptionButton } from "./DeleteSubscriptionButton";
import { EditSubscriptionModal } from "./EditSubscriptionModal";

type SubscriptionType = {
  id: string;
  name: string;
  amount: number;
  frequency: "weekly" | "monthly" | "yearly";
  next_billing_date: string;
  category_id?: string;
  categories?: { name: string };
  payment_method?: "cash" | "credit_card";
};

export async function SubscriptionList() {
  let subscriptions: any[] = [];
  try {
    subscriptions = await getSubscriptions();
  } catch (error) {
    console.error(error);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Aktif Abonelikler & Taksitler</h2>
      </div>

      <div className="hidden md:block border rounded-xl overflow-x-auto bg-card">
        {/* PC: Table View */}
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">İsim</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 font-medium">Tutar</th>
              <th className="px-4 py-3 font-medium">Ödeme Yöntemi</th>
              <th className="px-4 py-3 font-medium">Periyot</th>
              <th className="px-4 py-3 font-medium">Sıradaki Ödeme</th>
              <th className="px-4 py-3 font-medium text-right w-[100px] min-w-[100px] sticky right-0 bg-muted/50 z-10">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {subscriptions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Henüz kayıtlı bir düzenli ödemeniz yok.
                </td>
              </tr>
            ) : (
              subscriptions.map((sub: SubscriptionType) => {
                const rawCategoryName = sub.categories?.name || sub.category_id || "Kategori Yok";
                const displayCategoryName = categoryLabels[rawCategoryName] || rawCategoryName;

                return (
                  <tr key={sub.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{sub.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{displayCategoryName}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">
                      -{Number(sub.amount).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs font-medium">
                      {sub.payment_method === 'credit_card' ? '💳 Kredi Kartı' : '💵 Nakit / Banka'}
                    </td>
                    <td className="px-4 py-3">{frequencyLabels[sub.frequency]}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="w-4 h-4 text-muted-foreground" />
                        {format(new Date(sub.next_billing_date), "dd MMM yyyy", { locale: tr })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap w-[100px] min-w-[100px] sticky right-0 bg-card z-10">
                      <div className="flex items-center justify-end gap-2">
                        <EditSubscriptionModal subscription={sub} />
                        <DeleteSubscriptionButton id={sub.id} />
                      </div>
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
          subscriptions.map((sub: SubscriptionType) => {
            const rawCategoryName = sub.categories?.name || sub.category_id || "Kategori Yok";
            const displayCategoryName = categoryLabels[rawCategoryName] || rawCategoryName;

            return (
              <div
                key={sub.id}
                className="flex flex-col gap-2 p-4 rounded-xl border bg-card text-card-foreground shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{sub.name}</h3>
                    <p className="text-sm text-muted-foreground">{displayCategoryName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-red-600">
                      -{Number(sub.amount).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                    </div>
                    <EditSubscriptionModal subscription={sub} />
                    <DeleteSubscriptionButton id={sub.id} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Repeat className="w-4 h-4" />
                    <span>
                      {frequencyLabels[sub.frequency]} ({sub.payment_method === 'credit_card' ? 'Kredi Kartı' : 'Nakit'})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <CalendarClock className="w-4 h-4 text-primary/70" />
                    <span>{format(new Date(sub.next_billing_date), "dd MMM", { locale: tr })}</span>
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
