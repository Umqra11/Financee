'use server';

import { createClient } from '@/lib/supabase/server';

export async function getSubscriptions() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, categories(*)')
    .eq('user_id', userData.user.id)
    .order('next_billing_date', { ascending: true });

  if (error) {
    console.error('Error fetching subscriptions:', JSON.stringify(error, null, 2));
    throw new Error('Abonelikler getirilirken bir hata oluştu.');
  }

  return data;
}

export async function addSubscription(params: {
  name: string;
  amount: number;
  frequency: string;
  category: string;
  next_payment_date: string;
  payment_method?: 'cash' | 'credit_card';
  end_date?: string | null;
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
        type: 'expense',
        user_id: userData.user.id
      })
      .select()
      .single();
    if (newCat) category_id = newCat.id;
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      name: params.name,
      amount: params.amount,
      frequency: params.frequency as "monthly" | "yearly" | "weekly",
      category_id: category_id,
      next_billing_date: params.next_payment_date,
      payment_method: params.payment_method || 'cash',
      end_date: params.end_date || null,
      user_id: userData.user.id
    });

  if (error) {
    console.error('Error adding subscription:', error);
    throw new Error('Abonelik eklenirken hata oluştu.');
  }

  return { success: true };
}

export async function deleteSubscription(id: string) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('subscriptions')
    .delete()
    .eq('id', id)
    .eq('user_id', userData.user.id);

  if (error) {
    console.error('Error deleting subscription:', error);
    throw new Error('Abonelik silinirken hata oluştu.');
  }

  return { success: true };
}

export async function updateSubscription(params: {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  category: string;
  next_billing_date: string;
  payment_method?: 'cash' | 'credit_card';
  end_date?: string | null;
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
        type: 'expense',
        user_id: userData.user.id
      })
      .select()
      .single();
    if (newCat) category_id = newCat.id;
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({
      name: params.name,
      amount: params.amount,
      frequency: params.frequency as "monthly" | "yearly" | "weekly",
      category_id: category_id,
      next_billing_date: params.next_billing_date,
      payment_method: params.payment_method || 'cash',
      end_date: params.end_date || null,
    })
    .eq('id', params.id)
    .eq('user_id', userData.user.id);

  if (error) {
    console.error('Error updating subscription:', error);
    throw new Error('Abonelik güncellenirken hata oluştu.');
  }

  return { success: true };
}

/**
 * Önümüzdeki 3 gün içinde günü gelecek aktif abonelikleri getirir
 */
export async function getUpcomingSubscriptions() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const threeDaysLaterStr = threeDaysLater.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, categories(*)')
    .eq('user_id', userData.user.id)
    .eq('status', 'active')
    .gte('next_billing_date', todayStr)
    .lte('next_billing_date', threeDaysLaterStr)
    .order('next_billing_date', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming subscriptions:', error);
    throw new Error('Yaklaşan abonelikler getirilirken bir hata oluştu.');
  }

  return data;
}

