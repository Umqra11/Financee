const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://slronhfjiszsotnbuane.supabase.co';
const supabaseKey = 'sb_publishable_Rl4L5TrlK4MWdW_zTlsQCQ_NunIbuSE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- 1. Authenticating with Supabase ---');
  const email = `test_${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  
  // Try to sign up
  console.log(`Signing up new user: ${email}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });

  if (signUpError) {
    console.error('Sign up failed:', signUpError.message);
    return;
  }

  const user = signUpData.user;
  if (!user) {
    console.error('No user object returned from signUp.');
    return;
  }
  console.log('Sign up SUCCESS. User ID:', user.id);

  // Set the session explicitly if not set automatically
  if (signUpData.session) {
    console.log('Session acquired.');
  }

  // --- Test Category Insertion ---
  console.log('\n--- 2. Testing Category Insertion ---');
  const categoryData = {
    name: 'Test Category ' + Date.now(),
    type: 'expense',
    user_id: user.id
  };

  const { data: catData, error: catError } = await supabase
    .from('categories')
    .insert(categoryData)
    .select();

  if (catError) {
    console.error('FAILED: Category insert returned error:');
    console.error(JSON.stringify(catError, null, 2));
  } else {
    console.log('SUCCESS: Category inserted successfully!', catData);
  }

  const categoryId = catData && catData[0] ? catData[0].id : null;

  // --- Test Subscription Insertion with ISO-8601 Date ---
  console.log('\n--- 3. Testing Subscription Insertion with ISO-8601 Date ---');
  const isoDate = new Date().toISOString();
  console.log('Using next_billing_date:', isoDate);

  const subIsoData = {
    name: 'Test Sub ISO ' + Date.now(),
    amount: 99.99,
    frequency: 'monthly',
    next_billing_date: isoDate,
    user_id: user.id,
    payment_method: 'credit_card',
    category_id: categoryId
  };

  const { data: subIsoRes, error: subIsoError } = await supabase
    .from('subscriptions')
    .insert(subIsoData)
    .select();

  if (subIsoError) {
    console.error('FAILED: Subscription (ISO date) insert returned error:');
    console.error(JSON.stringify(subIsoError, null, 2));
  } else {
    console.log('SUCCESS: Subscription (ISO date) inserted successfully!', subIsoRes);
  }

  // --- Test Subscription Insertion with yyyy-MM-dd Date ---
  console.log('\n--- 4. Testing Subscription Insertion with yyyy-MM-dd Date ---');
  const ymdDate = new Date().toISOString().split('T')[0];
  console.log('Using next_billing_date:', ymdDate);

  const subYmdData = {
    name: 'Test Sub YMD ' + Date.now(),
    amount: 99.99,
    frequency: 'monthly',
    next_billing_date: ymdDate,
    user_id: user.id,
    payment_method: 'credit_card',
    category_id: categoryId
  };

  const { data: subYmdRes, error: subYmdError } = await supabase
    .from('subscriptions')
    .insert(subYmdData)
    .select();

  if (subYmdError) {
    console.error('FAILED: Subscription (YMD date) insert returned error:');
    console.error(JSON.stringify(subYmdError, null, 2));
  } else {
    console.log('SUCCESS: Subscription (YMD date) inserted successfully!', subYmdRes);
  }
}

run();
