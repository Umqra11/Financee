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
  from?: string;
  to?: string;
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

  if (params?.from && params?.to) {
    query = query.gte('date', params.from).lte('date', params.to);
  } else if (params?.month && params?.year) {
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
  }, {} as Record<string, { categoryId: string; category: Category | null; totalAmount: number }>);

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

export async function addTransaction(params: {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  note?: string;
  payment_method?: 'cash' | 'credit_card';
}) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }

  const { data: catData } = await supabase
    .from('categories')
    .select('id')
    .eq('name', params.category)
    .single();

  let category_id = catData?.id || null;

  if (!category_id) {
    const { data: newCat } = await supabase
      .from('categories')
      .insert({
        name: params.category,
        type: params.type,
        user_id: userData.user.id
      })
      .select()
      .single();
    if (newCat) category_id = newCat.id;
  }

  const { error } = await supabase
    .from('transactions')
    .insert({
      amount: params.amount,
      type: params.type,
      category_id: category_id,
      date: params.date,
      description: params.note || null,
      payment_method: params.payment_method || 'cash',
      user_id: userData.user.id
    });

  if (error) {
    console.error('Error adding transaction:', error);
    throw new Error('İşlem eklenirken hata oluştu.');
  }

  return { success: true };
}

/**
 * Genel aylık bütçeyi (category_id = null) getirir, yoksa kayıt oluşturur.
 * Kullanıcı dashboard'da toplam bütçe bar'ı için kullanılır.
 */
export async function getOrCreateGeneralBudget(params: {
  month: number;
  year: number;
}) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }

  const { startStr, endStr } = getMonthDateRange(params.year, params.month);

  // Mevcut genel bütçeyi ara (category_id IS NULL)
  const { data: budgets, error: budgetError } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userData.user.id)
    .is('category_id', null)
    .eq('period', 'monthly')
    .lt('start_date', endStr)
    .gte('end_date', startStr)
    .limit(1);

  if (budgetError) {
    console.error('Error fetching general budget:', budgetError);
    throw new Error('Genel bütçe getirilirken hata oluştu.');
  }

  const budget = budgets?.[0];

  // Aynı ayın toplam harcamalarını getir
  const { data: expenses, error: expenseError } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', userData.user.id)
    .eq('type', 'expense')
    .gte('date', startStr)
    .lt('date', endStr);

  if (expenseError) {
    console.error('Error fetching expenses for general budget:', expenseError);
    // Hata durumunda boş array ile devam et, sayfa çökmesin
    const totalSpent = 0;
    const budgetAmount = budget ? Number(budget.amount) : 0;
    return {
      hasBudget: !!budget,
      budgetId: budget?.id || null,
      budgetAmount,
      totalSpent,
      percentage: 0,
      isOverBudget: false,
      isNearLimit: false,
    };
  }

  const totalSpent = (expenses || []).reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const budgetAmount = budget ? Number(budget.amount) : 0;
  const percentage = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;

  return {
    hasBudget: !!budget,
    budgetId: budget?.id || null,
    budgetAmount,
    totalSpent,
    percentage: Math.min(Math.round(percentage * 100) / 100, 100),
    isOverBudget: percentage >= 100,
    isNearLimit: percentage >= 80 && percentage < 100,
  };
}

/**
 * Genel aylık bütçeyi ekler veya günceller (category_id = null)
 */
export async function upsertGeneralBudget(params: {
  amount: number;
  month: number;
  year: number;
}) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }

  const { startStr, endStr } = getMonthDateRange(params.year, params.month);

  // Mevcut bütçeyi ara
  const { data: existingBudgets, error: fetchError } = await supabase
    .from('budgets')
    .select('id')
    .eq('user_id', userData.user.id)
    .is('category_id', null)
    .eq('period', 'monthly')
    .lt('start_date', endStr)
    .gte('end_date', startStr)
    .limit(1);

  if (fetchError) {
    console.error('Error fetching existing general budget:', fetchError);
    throw new Error('Bütçe kontrol edilirken hata oluştu.');
  }

  const existingBudget = existingBudgets?.[0];

  if (existingBudget) {
    const { error: updateError } = await supabase
      .from('budgets')
      .update({
        amount: params.amount,
        start_date: startStr,
        end_date: endStr,
      })
      .eq('id', existingBudget.id);

    if (updateError) {
      console.error('Error updating general budget:', updateError);
      throw new Error('Bütçe güncellenirken hata oluştu.');
    }
  } else {
    const { error: insertError } = await supabase
      .from('budgets')
      .insert({
        user_id: userData.user.id,
        category_id: null,
        amount: params.amount,
        period: 'monthly',
        start_date: startStr,
        end_date: endStr,
      });

    if (insertError) {
      console.error('Error inserting general budget:', insertError);
      throw new Error('Bütçe oluşturulurken hata oluştu.');
    }
  }

  return { success: true };
}

/**
 * Tüm zamanlar için toplam gelir ve gideri getirir (tarih filtresiz)
 * Hesap bakiyesi için kullanılır
 */
export async function getTotalBalance() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, type, payment_method')
    .eq('user_id', userData.user.id);

  if (error) {
    console.error('Error fetching total balance:', error);
    return { totalIncome: 0, totalExpense: 0, balance: 0 };
  }

  let totalIncome = 0;
  let totalExpense = 0;

  (data || []).forEach((tx) => {
    const amount = Number(tx.amount || 0);
    if (tx.type === 'income') {
      totalIncome += amount;
    } else if (tx.type === 'expense' && tx.payment_method !== 'credit_card') {
      totalExpense += amount;
    }
  });

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userData.user.id);

  if (error) {
    console.error('Error deleting transaction:', error);
    throw new Error('İşlem silinirken hata oluştu.');
  }

  return { success: true };
}

export async function editTransaction(id: string, params: {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  note?: string;
  payment_method?: 'cash' | 'credit_card';
}) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }

  const { data: catData } = await supabase
    .from('categories')
    .select('id')
    .eq('name', params.category)
    .single();

  let category_id = catData?.id || null;

  if (!category_id) {
    const { data: newCat } = await supabase
      .from('categories')
      .insert({
        name: params.category,
        type: params.type,
        user_id: userData.user.id
      })
      .select()
      .single();
    if (newCat) category_id = newCat.id;
  }

  const { error } = await supabase
    .from('transactions')
    .update({
      amount: params.amount,
      type: params.type,
      category_id: category_id,
      date: params.date,
      description: params.note || null,
      payment_method: params.payment_method || 'cash',
    })
    .eq('id', id)
    .eq('user_id', userData.user.id);

  if (error) {
    console.error('Error updating transaction:', error);
    throw new Error('İşlem güncellenirken hata oluştu.');
  }

  return { success: true };
}

/**
 * Belirli bir kategori için aylık bütçe limitini ekler veya günceller
 */
export async function upsertBudgetLimit(params: {
  categoryId: string;
  amount: number;
  month: number;
  year: number;
}) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }

  const { startStr, endStr } = getMonthDateRange(params.year, params.month);

  // Bu kategori ve dönem için mevcut bütçeyi bul
  const { data: existingBudgets, error: fetchError } = await supabase
    .from('budgets')
    .select('id')
    .eq('user_id', userData.user.id)
    .eq('category_id', params.categoryId)
    .eq('period', 'monthly')
    .lt('start_date', endStr)
    .gte('end_date', startStr)
    .limit(1);

  if (fetchError) {
    console.error('Error fetching existing budget:', fetchError);
    throw new Error('Mevcut bütçe kontrol edilirken hata oluştu.');
  }

  const existingBudget = existingBudgets?.[0];

  if (existingBudget) {
    // Güncelle
    const { error: updateError } = await supabase
      .from('budgets')
      .update({
        amount: params.amount,
        start_date: startStr,
        end_date: endStr,
      })
      .eq('id', existingBudget.id);

    if (updateError) {
      console.error('Error updating budget:', updateError);
      throw new Error('Bütçe güncellenirken hata oluştu.');
    }
  } else {
    // Ekle
    const { error: insertError } = await supabase
      .from('budgets')
      .insert({
        user_id: userData.user.id,
        category_id: params.categoryId,
        amount: params.amount,
        period: 'monthly',
        start_date: startStr,
        end_date: endStr,
      });

    if (insertError) {
      console.error('Error inserting budget:', insertError);
      throw new Error('Bütçe oluşturulurken hata oluştu.');
    }
  }

  return { success: true };
}

