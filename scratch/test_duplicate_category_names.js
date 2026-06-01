const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://slronhfjiszsotnbuane.supabase.co';
const supabaseKey = 'sb_publishable_Rl4L5TrlK4MWdW_zTlsQCQ_NunIbuSE';

async function runDuplicateCategoryDiagnostic() {
  console.log('--- STARTING DUPLICATE CATEGORY DIAGNOSTIC ---');

  const clientB = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  
  const clientA = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const uniqueSuffix = Date.now();
  const emailB = `user_b_dup_${uniqueSuffix}@example.com`;
  const emailA = `user_a_dup_${uniqueSuffix}@example.com`;
  const password = 'TestPassword123!';

  console.log('\n1. Registering User B...');
  const { data: authB } = await clientB.auth.signUp({ email: emailB, password });
  const userB = authB.user;

  console.log('2. User B inserting category "Market"...');
  const { data: catB, error: catBError } = await clientB
    .from('categories')
    .insert({ name: 'Market', type: 'expense', user_id: userB.id })
    .select()
    .single();

  if (catBError) {
    console.error('User B category insert failed:', catBError);
    return;
  }
  console.log('User B category inserted:', catB);

  console.log('\n3. Registering User A...');
  const { data: authA } = await clientA.auth.signUp({ email: emailA, password });
  const userA = authA.user;

  console.log('4. User A inserting category "Market" (same name)...');
  const { data: catA, error: catAError } = await clientA
    .from('categories')
    .insert({ name: 'Market', type: 'expense', user_id: userA.id })
    .select()
    .single();

  if (catAError) {
    console.error('❌ User A category insert failed (potential unique constraint issue!):', catAError);
  } else {
    console.log('✅ User A category successfully inserted with same name:', catA);
  }

  console.log('\n--- DUPLICATE CATEGORY DIAGNOSTIC FINISHED ---');
}

runDuplicateCategoryDiagnostic();
