"use server"

import { createClient } from '@/lib/supabase/server'
import { format, addMonths, addYears, addWeeks } from 'date-fns'

export async function syncSubscriptionsToTransactions() {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    return { success: false, error: 'User not authenticated' }
  }

  // Yerel tarih karşılaştırmalarının gün bazında doğru yapılması ve saat dilimi karmaşasını önlemek için
  // bugünün tarihini 'Europe/Istanbul' (Türkiye) saat dilimine göre yyyy-MM-dd formatında alıyoruz.
  const todayStr = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
  
  // Tarihleri güvenli bir şekilde sayı olarak karşılaştırmak için
  const todayStringNumber = parseInt(todayStr.replace(/-/g, ''))

  // Aktif olan ve next_billing_date'i bugüne eşit veya daha önce olan abonelikleri bul
  const { data: subscriptions, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'active')
    .lte('next_billing_date', todayStr)

  if (fetchError) {
    console.error('Error fetching subscriptions:', JSON.stringify(fetchError, null, 2))
    return { success: false, error: fetchError.message }
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { success: true, message: 'No subscriptions to sync' }
  }

  const transactionsToInsert = []
  const subscriptionsToUpdate = []

  for (const sub of subscriptions) {
    // Saat dilimi kaymalarını önlemek için tarihi parsela
    const [year, month, day] = sub.next_billing_date.split('-').map(Number)
    let currentBillingDate = new Date(year, month - 1, day)
    let addedCount = 0

    // Eğer kullanıcı uzun süre girmedimişse, kaçırdığı tüm periyotlar için işlem yap
    while (true) {
      const currentBillingStr = format(currentBillingDate, 'yyyy-MM-dd')
      const currentStringNumber = parseInt(currentBillingStr.replace(/-/g, ''))
      
      if (currentStringNumber > todayStringNumber) {
        break
      }

      transactionsToInsert.push({
        amount: sub.amount,
        date: currentBillingStr,
        description: `${sub.name} (Abonelik)`,
        category_id: sub.category_id,
        user_id: sub.user_id,
        type: 'expense' as const,
        payment_method: sub.payment_method || 'cash',
      })

      // 2. Bir sonraki fatura tarihini hesapla
      switch (sub.frequency) {
        case 'monthly':
          currentBillingDate = addMonths(currentBillingDate, 1)
          break
        case 'yearly':
          currentBillingDate = addYears(currentBillingDate, 1)
          break
        case 'weekly':
          currentBillingDate = addWeeks(currentBillingDate, 1)
          break
        default:
          currentBillingDate = addMonths(currentBillingDate, 1)
      }
      
      addedCount++
      // Sonsuz döngüyü önlemek için koruma
      if (addedCount > 50) break;
    }

    subscriptionsToUpdate.push({
      id: sub.id,
      next_billing_date: format(currentBillingDate, 'yyyy-MM-dd'),
      last_processed: todayStr,
    })
  }

  // Transaction'ları ekle
  if (transactionsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('transactions')
      .insert(transactionsToInsert)

    if (insertError) {
      console.error('Error inserting transactions:', insertError)
      return { success: false, error: insertError.message }
    }
  }

  // Abonelikleri güncelle
  for (const update of subscriptionsToUpdate) {
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        next_billing_date: update.next_billing_date,
        last_processed: update.last_processed,
      })
      .eq('id', update.id)
      
    if (updateError) {
      console.error(`Error updating subscription ${update.id}:`, updateError)
    }
  }

  return { success: true, message: `Synced ${transactionsToInsert.length} payments from ${subscriptions.length} subscriptions` }
}
