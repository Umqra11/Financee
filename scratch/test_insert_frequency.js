const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://slronhfjiszsotnbuane.supabase.co';
const supabaseKey = 'sb_publishable_Rl4L5TrlK4MWdW_zTlsQCQ_NunIbuSE';
const supabase = createClient(supabaseUrl, supabaseKey);

const dummyUserId = '3cf781a7-1ad5-4a6c-94d3-7d7b420afc3f';

async function testSubscriptionWithFrequencyAndIsoDate() {
  console.log('\n--- Testing Subscription with frequency & ISO Date ---');
  const isoDate = new Date().toISOString();
  console.log('Using next_billing_date:', isoDate);

  const subscriptionData = {
    name: 'Test Frequency ISO ' + Date.now(),
    amount: 120.00,
    frequency: 'monthly',
    next_billing_date: isoDate,
    user_id: dummyUserId,
    payment_method: 'credit_card'
  };

  const { data, error } = await supabase
    .from('subscriptions')
    .insert(subscriptionData)
    .select();

  if (error) {
    console.error('FAILED: insert returned error:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
    console.error('Hint:', error.hint);
  } else {
    console.log('SUCCESS: Subscription inserted successfully!', data);
  }
}

async function testSubscriptionWithFrequencyAndYmdDate() {
  console.log('\n--- Testing Subscription with frequency & yyyy-MM-dd Date ---');
  const ymdDate = new Date().toISOString().split('T')[0];
  console.log('Using next_billing_date:', ymdDate);

  const subscriptionData = {
    name: 'Test Frequency YMD ' + Date.now(),
    amount: 120.00,
    frequency: 'monthly',
    next_billing_date: ymdDate,
    user_id: dummyUserId,
    payment_method: 'credit_card'
  };

  const { data, error } = await supabase
    .from('subscriptions')
    .insert(subscriptionData)
    .select();

  if (error) {
    console.error('FAILED: insert returned error:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
    console.error('Hint:', error.hint);
  } else {
    console.log('SUCCESS: Subscription inserted successfully!', data);
  }
}

async function run() {
  await testSubscriptionWithFrequencyAndIsoDate();
  await testSubscriptionWithFrequencyAndYmdDate();
}

run();
