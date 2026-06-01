const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://slronhfjiszsotnbuane.supabase.co';
const supabaseKey = 'sb_publishable_Rl4L5TrlK4MWdW_zTlsQCQ_NunIbuSE';

async function runSharingDiagnostic() {
  console.log('--- STARTING CATEGORY SHARING DIAGNOSTIC ---');

  // Create clean client instances
  const clientB = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  
  const clientA = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const uniqueSuffix = Date.now();
  const emailB = `user_b_${uniqueSuffix}@example.com`;
  const emailA = `user_a_${uniqueSuffix}@example.com`;
  const password = 'TestPassword123!';

  console.log(`\n--- 1. Registering & Authenticating User B (${emailB}) ---`);
  const { data: authB, error: authBError } = await clientB.auth.signUp({
    email: emailB,
    password
  });

  if (authBError) {
    console.error('User B registration failed:', authBError.message);
    return;
  }
  const userB = authB.user;
  console.log('User B registered. ID:', userB.id);

  console.log(`\n--- 2. User B Inserting "Shared Category X" ---`);
  const categoryName = `Shared Category X ${uniqueSuffix}`;
  const { data: catBRes, error: catBError } = await clientB
    .from('categories')
    .insert({
      name: categoryName,
      type: 'expense',
      user_id: userB.id
    })
    .select()
    .single();

  if (catBError) {
    console.error('User B category insertion failed:', catBError);
    return;
  }
  console.log('User B Category successfully inserted:', catBRes);
  const sharedCategoryId = catBRes.id;

  console.log(`\n--- 3. Registering & Authenticating User A (${emailA}) ---`);
  const { data: authA, error: authAError } = await clientA.auth.signUp({
    email: emailA,
    password
  });

  if (authAError) {
    console.error('User A registration failed:', authAError.message);
    return;
  }
  const userA = authA.user;
  console.log('User A registered. ID:', userA.id);

  console.log(`\n--- 4. User A attempting to query User B's category by name: "${categoryName}" ---`);
  console.log('Query: supabase.from("categories").select("id").eq("name", categoryName).single()');
  
  const { data: lookupA, error: lookupAError } = await clientA
    .from('categories')
    .select('id')
    .eq('name', categoryName)
    .single();

  if (lookupAError) {
    console.log('User A lookup failed / Category not found. Error detail:');
    console.log('Code:', lookupAError.code);
    console.log('Message:', lookupAError.message);
    console.log('Details:', lookupAError.details);
    console.log('Hint:', lookupAError.hint);
  } else {
    console.log('⚠️ SECURITY ALERT: User A successfully found User B\'s category ID:', lookupA);
    
    console.log(`\n--- 5. User A attempting to insert a subscription referencing User B's category ID ---`);
    console.log(`Inserting subscription under User A with category_id: ${sharedCategoryId}`);
    
    const { data: subA, error: subAError } = await clientA
      .from('subscriptions')
      .insert({
        name: 'Exploit Subscription',
        amount: 50.00,
        frequency: 'monthly',
        next_billing_date: new Date().toISOString().split('T')[0],
        category_id: sharedCategoryId,
        user_id: userA.id,
        payment_method: 'cash'
      })
      .select();

    if (subAError) {
      console.log('❌ Subscription insertion failed. Error detail:');
      console.log('Code:', subAError.code);
      console.log('Message:', subAError.message);
      console.log('Details:', subAError.details);
      console.log('Hint:', subAError.hint);
    } else {
      console.log('⚠️ VULNERABILITY CONFIRMED: User A successfully inserted subscription referencing User B\'s category!', subA);
    }
  }

  console.log('\n--- CATEGORY SHARING DIAGNOSTIC FINISHED ---');
}

runSharingDiagnostic();
