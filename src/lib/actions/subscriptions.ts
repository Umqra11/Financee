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
    .order('next_payment_date', { ascending: true });

  if (error) {
    console.error('Error fetching subscriptions:', error);
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
      frequency: params.frequency,
      category_id: category_id,
      next_payment_date: params.next_payment_date,
      end_date: params.end_date || null,
      user_id: userData.user.id
    });

  if (error) {
    console.error('Error adding subscription:', error);
    throw new Error('Abonelik eklenirken hata oluştu.');
  }

  return { success: true };
}
