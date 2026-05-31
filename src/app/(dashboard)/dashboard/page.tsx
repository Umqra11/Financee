import { Suspense } from "react";
import { getMonthlyExpenseByCategory, checkBudgetLimit } from "@/lib/actions/finance";
import { ExpensePieChart } from "@/components/dashboard/ExpensePieChart";
import { BudgetProgressBar } from "@/components/dashboard/BudgetProgressBar";
import { DashboardDatePicker } from "@/components/dashboard/DashboardDatePicker";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string; year?: string }> }) {
  const params = await searchParams;
  const currentMonth = params.month ? parseInt(params.month) : new Date().getMonth() + 1;
  const currentYear = params.year ? parseInt(params.year) : new Date().getFullYear();

  // Harcamaları getir
  const expensesByCategory = await getMonthlyExpenseByCategory({ month: currentMonth, year: currentYear });

  // Her kategori için bütçe limitlerini kontrol et
  const categoriesWithBudgets = await Promise.all(
    expensesByCategory.map(async (exp) => {
      const budgetData = await checkBudgetLimit({
        categoryId: exp.categoryId,
        month: currentMonth,
        year: currentYear
      });
      return {
        ...exp,
        budget: budgetData
      };
    })
  );

  // Recharts için veri formatını ayarla
  const pieChartData = expensesByCategory.map(exp => ({
    name: exp.category?.name || 'Kategorisiz',
    value: exp.totalAmount
  }));

  const totalExpense = expensesByCategory.reduce((sum, item) => sum + item.totalAmount, 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Finansal Özet</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Aylık harcamalarınızı ve bütçe durumunuzu takip edin.</p>
        </div>
        <DashboardDatePicker initialMonth={currentMonth} initialYear={currentYear} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sol Kolon: Pasta Grafik */}
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col items-center justify-center">
            <h2 className="text-lg font-medium mb-2">Toplam Harcama</h2>
            <p className="text-3xl font-bold">₺{totalExpense.toLocaleString('tr-TR')}</p>
          </div>
          {pieChartData.length > 0 ? (
            <ExpensePieChart data={pieChartData} />
          ) : (
            <div className="h-72 w-full p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center justify-center text-zinc-500 text-sm">
              Bu ay için harcama verisi bulunamadı.
            </div>
          )}
        </div>

        {/* Sağ Kolon: Bütçe Durumu */}
        <div className="flex flex-col gap-4 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <h2 className="text-lg font-medium mb-4">Bütçe Durumu</h2>
          {categoriesWithBudgets.length > 0 ? (
            <div className="flex flex-col gap-6">
              {categoriesWithBudgets.map((item) => (
                <div key={item.categoryId} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {item.category?.icon && <span>{item.category.icon}</span>}
                    <span className="font-medium text-sm">{item.category?.name || 'Kategorisiz'}</span>
                  </div>
                  {item.budget.hasBudget ? (
                    <BudgetProgressBar 
                      spent={item.budget.expenseAmount} 
                      limit={item.budget.budgetAmount} 
                    />
                  ) : (
                    <div className="flex justify-between items-center text-sm text-zinc-500">
                      <span>Kullanılan: ₺{item.totalAmount}</span>
                      <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">Limit belirlenmedi</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
              Bu ay için bütçe verisi bulunamadı.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
