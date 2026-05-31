'use server';

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/database';

// Tip tanımları
type Transaction = Database['public']['Tables']['transactions']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface TransactionWithCategory extends Transaction {
  categories: Category | null;
}

// Utils for date range
function getMonthDateRange(year: number, month: number) {
  // month is 1-indexed (1 = January)
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1)); // first day of next month
  
  // Format as YYYY-MM-DD
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];
  return { startStr, endStr };
}

/**
 * İşlemleri ay, yıl ve kategoriye göre filtreler
 */
export async function getTransactions(params?: {
  month?: number;
  year?: number;
  categoryId?: string;
}) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }

  let query = supabase
    .from('transactions')
    .select('*, categories(*)')
    .eq('user_id', userData.user.id)
    .order('date', { ascending: false });

  if (params?.month && params?.year) {
    const { startStr, endStr } = getMonthDateRange(params.year, params.month);
    query = query.gte('date', startStr).lt('date', endStr);
  }

  if (params?.categoryId) {
    query = query.eq('category_id', params.categoryId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching transactions:', error);
    throw new Error('İşlemler getirilirken bir hata oluştu.');
  }

  return data as unknown as TransactionWithCategory[];
}

/**
 * Belirli bir ay için tüm harcamaları kategori bazında gruplayıp toplam tutarları döndürür
 */
export async function getMonthlyExpenseByCategory(params: {
  month: number;
  year: number;
}) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }

  const { startStr, endStr } = getMonthDateRange(params.year, params.month);

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, category_id, categories(id, name, color, icon)')
    .eq('user_id', userData.user.id)
    .eq('type', 'expense')
    .gte('date', startStr)
    .lt('date', endStr);

  if (error) {
    console.error('Error fetching expenses:', error);
    throw new Error('Aylık harcamalar getirilirken bir hata oluştu.');
  }

  // Gruplama işlemi
  const grouped = data.reduce((acc, curr) => {
    const catId = curr.category_id || 'uncategorized';
    if (!acc[catId]) {
      // categories field may be returned as single object or array depending on relation, usually object for many-to-one
      const categoryData = Array.isArray(curr.categories) 
        ? curr.categories[0] 
        : curr.categories;

      acc[catId] = {
        categoryId: catId,
        category: categoryData || null,
        totalAmount: 0,
      };
    }
    acc[catId].totalAmount += Number(curr.amount);
    return acc;
  }, {} as Record<string, { categoryId: string; category: any; totalAmount: number }>);

  // Array olarak döndürüp, çoktan aza göre sıralıyoruz
  return Object.values(grouped).sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * İlgili kategorideki harcamaları, kullanıcının belirlediği limitle karşılaştırır
 */
export async function checkBudgetLimit(params: {
  categoryId: string;
  month: number;
  year: number;
}) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }

  const { startStr, endStr } = getMonthDateRange(params.year, params.month);

  // 1. İlgili kategori için aylık bütçeyi getir
  // start_date < endStr ve end_date >= startStr koşulu ile çakışan bütçeyi buluyoruz
  const { data: budgets, error: budgetError } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('category_id', params.categoryId)
    .eq('period', 'monthly')
    .lt('start_date', endStr)
    .gte('end_date', startStr)
    .limit(1);

  if (budgetError) {
    console.error('Error fetching budget:', budgetError);
    throw new Error('Bütçe bilgisi getirilirken hata oluştu.');
  }

  const budget = budgets?.[0];
  if (!budget) {
    return {
      hasBudget: false,
      budgetAmount: 0,
      expenseAmount: 0,
      percentage: 0,
      isWarning: false,
      isDanger: false,
    };
  }

  // 2. İlgili ay ve kategorideki harcamaları getir
  const { data: expenses, error: expenseError } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', userData.user.id)
    .eq('type', 'expense')
    .eq('category_id', params.categoryId)
    .gte('date', startStr)
    .lt('date', endStr);

  if (expenseError) {
    console.error('Error fetching expenses for budget:', expenseError);
    throw new Error('Bütçe hesaplaması için harcamalar getirilemedi.');
  }

  const expenseAmount = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
  const budgetAmount = Number(budget.amount);
  
  const percentage = budgetAmount > 0 
    ? (expenseAmount / budgetAmount) * 100 
    : 0;

  // Uyarı flag'leri (%80 uyarı, %100 tehlike)
  const isWarning = percentage >= 80 && percentage < 100;
  const isDanger = percentage >= 100;

  return {
    hasBudget: true,
    budgetAmount,
    expenseAmount,
    percentage: Math.round(percentage * 100) / 100, // virgülden sonra 2 hane
    isWarning,
    isDanger,
  };
}
