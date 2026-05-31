'use server';

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/database';

// Tip tanımları
type Subscription = Database['public']['Tables']['subscriptions']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export interface SubscriptionWithCategory extends Subscription {
  categories: Category | null;
}

/**
 * Kullanıcının aboneliklerini kategori bilgisiyle birlikte getirir
 */
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
    console.error('Error fetching subscriptions:', error);
    throw new Error('Abonelikler getirilirken bir hata oluştu.');
  }

  return data as unknown as SubscriptionWithCategory[];
}

/**
 * Yeni bir abonelik ekler
 */
export async function addSubscription(
  data: Omit<Database['public']['Tables']['subscriptions']['Insert'], 'user_id' | 'id' | 'created_at' | 'last_processed'>
) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }

  const { data: inserted, error } = await supabase
    .from('subscriptions')
    .insert({ ...data, user_id: userData.user.id })
    .select()
    .single();

  if (error) {
    console.error('Error adding subscription:', error);
    throw new Error('Abonelik eklenirken bir hata oluştu.');
  }

  return inserted;
}

/**
 * Belirtilen ID'ye sahip aboneliği siler
 */
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
    throw new Error('Abonelik silinirken bir hata oluştu.');
  }

  return true;
}

/**
 * Günü gelmiş abonelikleri transactions tablosuna ekler ve next_billing_date / last_processed alanlarını günceller
 */
export async function processSubscriptions() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }

  // Bugünün tarihini YYYY-MM-DD formatında al
  const today = new Date().toISOString().split('T')[0];

  // Aktif ve günü gelmiş abonelikleri çek
  const { data: subscriptions, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('status', 'active')
    .lte('next_billing_date', today);

  if (subError) {
    console.error('Error fetching due subscriptions:', subError);
    throw new Error('Günü gelen abonelikler bulunamadı.');
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { processed: 0 };
  }

  let processedCount = 0;

  for (const sub of subscriptions) {
    let currentBillingDate = new Date(sub.next_billing_date);
    let isUpdated = false;

    // Abonelik geçmişte kalmışsa, her bir dönem için ayrı ayrı ödeme (transaction) oluşturuyoruz
    while (currentBillingDate.toISOString().split('T')[0] <= today) {
      const txDateStr = currentBillingDate.toISOString().split('T')[0];

      // 1. Transaction (İşlem) tablosuna ekle
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          amount: sub.amount,
          date: txDateStr,
          description: `${sub.name} Aboneliği`,
          category_id: sub.category_id,
          user_id: sub.user_id,
          type: 'expense'
        });

      if (txError) {
        console.error(`Error processing subscription ${sub.id} on ${txDateStr}:`, txError);
        break; // Hata alınırsa bu aboneliğin diğer dönemleri için devam etme
      }

      processedCount++;
      isUpdated = true;

      // 2. Bir sonraki fatura tarihini hesapla
      if (sub.billing_period === 'monthly') {
        currentBillingDate.setUTCMonth(currentBillingDate.getUTCMonth() + 1);
      } else if (sub.billing_period === 'yearly') {
        currentBillingDate.setUTCFullYear(currentBillingDate.getUTCFullYear() + 1);
      } else if (sub.billing_period === 'weekly') {
        currentBillingDate.setUTCDate(currentBillingDate.getUTCDate() + 7);
      } else {
        break; // Desteklenmeyen bir periyot gelirse döngüyü kır
      }
    }

    if (isUpdated) {
      const nextBillingStr = currentBillingDate.toISOString().split('T')[0];
      const nowStr = new Date().toISOString();

      // 3. Aboneliğin next_billing_date ve last_processed değerlerini güncelle
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          next_billing_date: nextBillingStr,
          last_processed: nowStr
        })
        .eq('id', sub.id);

      if (updateError) {
        console.error(`Error updating subscription ${sub.id}:`, updateError);
      }
    }
  }

  return { processed: processedCount };
}
