import { Plus, CreditCard, CalendarDays, Tv, Music, Dumbbell, Smartphone, Laptop } from "lucide-react";
import Link from "next/link";

export default function SubscriptionsPage() {
  const subscriptions = [
    { id: 1, name: "Netflix", price: 149.99, icon: <Tv className="w-5 h-5" />, color: "bg-red-500", date: "Ayın 15'i" },
    { id: 2, name: "Spotify", price: 39.99, icon: <Music className="w-5 h-5" />, color: "bg-green-500", date: "Ayın 3'ü" },
    { id: 3, name: "Spor Salonu", price: 450.00, icon: <Dumbbell className="w-5 h-5" />, color: "bg-blue-500", date: "Ayın 28'i" },
  ];

  const installments = [
    { id: 1, name: "iPhone 15 Pro", monthlyAmount: 4500, totalAmount: 54000, currentInstallment: 4, totalInstallments: 12, icon: <Smartphone className="w-5 h-5" />, color: "bg-zinc-800" },
    { id: 2, name: "MacBook Air", monthlyAmount: 3200, totalAmount: 28800, currentInstallment: 7, totalInstallments: 9, icon: <Laptop className="w-5 h-5" />, color: "bg-zinc-500" },
  ];

  return (
    <div className="flex flex-col gap-8 p-6 max-w-4xl mx-auto w-full pb-24">
      {/* Başlık Alanı */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Abonelikler ve Taksitler</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Düzenli ödemelerinizi tek bir yerden takip edin.</p>
        </div>
      </div>

      {/* Abonelikler Bölümü */}
      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium tracking-tight">Abonelikler</h2>
          <button className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-500 hover:text-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Ekle</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col gap-4 transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${sub.color}`}>
                  {sub.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{sub.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <CalendarDays className="w-3 h-3" />
                    <span>{sub.date}</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-end">
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Aylık Ücret</span>
                <span className="text-lg font-semibold">₺{sub.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Taksitler Bölümü */}
      <section className="flex flex-col gap-4 mt-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium tracking-tight">Aktif Taksitler</h2>
          <button className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-500 hover:text-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Ekle</span>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {installments.map((item) => {
            const progress = (item.currentInstallment / item.totalInstallments) * 100;
            
            return (
              <div key={item.id} className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col gap-4 transition-all hover:shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${item.color}`}>
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{item.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-zinc-500 mt-0.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Aylık ₺{item.monthlyAmount.toLocaleString('tr-TR')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:items-end gap-1">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {item.currentInstallment} / {item.totalInstallments} Taksit
                    </span>
                    <span className="text-xs text-zinc-500">
                      Kalan: ₺{((item.totalInstallments - item.currentInstallment) * item.monthlyAmount).toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
