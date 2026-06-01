'use server';

export async function getSubscriptions() {
  return [
    { id: '1', name: 'Netflix', amount: 200, billing_period: 'monthly', next_billing_date: '2026-06-15', status: 'active', categories: { name: 'Eğlence', color: '#ff00ff', icon: 'Tv' } },
    { id: '2', name: 'Spotify', amount: 50, billing_period: 'monthly', next_billing_date: '2026-06-10', status: 'active', categories: { name: 'Eğlence', color: '#ff00ff', icon: 'Music' } }
  ];
}
export async function addSubscription(data: any) { return data; }
export async function deleteSubscription(id: string) { return true; }
export async function processSubscriptions() { return { processed: 0 }; }
