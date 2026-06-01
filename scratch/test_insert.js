const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://slronhfjiszsotnbuane.supabase.co';
const supabaseKey = 'sb_publishable_Rl4L5TrlK4MWdW_zTlsQCQ_NunIbuSE';

const supabase = createClient(supabaseUrl, supabaseKey);

const dummyUserId = '3cf781a7-1ad5-4a6c-94d3-7d7b420afc3f';
const dummyCategoryId = '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d'; // format UUID

async function testCategoryInsert() {
  console.log('\n--- 1. Testing Category Insertion ---');
  
  const categoryData = {
    name: 'Test Category ' + Date.now(),
    type: 'expense',
    user_id: dummyUserId
  };

  const { data, error } = await supabase
    .from('categories')
    .insert(categoryData)
    .select();

  if (error) {
    console.error('FAILED: Category insert returned error:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
    console.error('Hint:', error.hint);
  } else {
    console.log('SUCCESS: Category inserted successfully!', data);
  }
}

async function testSubscriptionInsertWithIsoDate() {
  console.log('\n--- 2. Testing Subscription Insertion with ISO-8601 Date ---');
  
  const isoDate = new Date().toISOString(); // e.g. "2026-06-01T19:53:00.000Z"
  console.log('Using next_billing_date:', isoDate);

  const subscriptionData = {
    name: 'Test Sub ISO ' + Date.now(),
    amount: 99.99,
    billing_period: 'monthly',
    next_billing_date: isoDate,
    user_id: dummyUserId,
    payment_method: 'credit_card'
  };

  const { data, error } = await supabase
    .from('subscriptions')
    .insert(subscriptionData)
    .select();

  if (error) {
    console.error('FAILED: Subscription (ISO date) insert returned error:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
    console.error('Hint:', error.hint);
  } else {
    console.log('SUCCESS: Subscription (ISO date) inserted successfully!', data);
  }
}

async function testSubscriptionInsertWithYmdDate() {
  console.log('\n--- 3. Testing Subscription Insertion with yyyy-MM-dd Date ---');
  
  const ymdDate = new Date().toISOString().split('T')[0]; // e.g. "2026-06-01"
  console.log('Using next_billing_date:', ymdDate);

  const subscriptionData = {
    name: 'Test Sub YMD ' + Date.now(),
    amount: 99.99,
    billing_period: 'monthly',
    next_billing_date: ymdDate,
    user_id: dummyUserId,
    payment_method: 'credit_card'
  };

  const { data, error } = await supabase
    .from('subscriptions')
    .insert(subscriptionData)
    .select();

  if (error) {
    console.error('FAILED: Subscription (YMD date) insert returned error:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
    console.error('Hint:', error.hint);
  } else {
    console.log('SUCCESS: Subscription (YMD date) inserted successfully!', data);
  }
}

async function runTests() {
  try {
    await testCategoryInsert();
    await testSubscriptionInsertWithIsoDate();
    await testSubscriptionInsertWithYmdDate();
  } catch (err) {
    console.error('Unexpected test execution error:', err);
  }
}

runTests();
