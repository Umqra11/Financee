const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://slronhfjiszsotnbuane.supabase.co';
const supabaseKey = 'sb_publishable_Rl4L5TrlK4MWdW_zTlsQCQ_NunIbuSE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  console.log('Testing Supabase subscriptions query...');
  
  // select * from subscriptions
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .limit(1);

  if (error) {
    console.error('FAILED: subscriptions query returned error:', JSON.stringify(error, null, 2));
  } else {
    console.log('SUCCESS: subscriptions query succeeded! Data:', data);
  }
}

testQuery();
