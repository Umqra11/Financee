const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://slronhfjiszsotnbuane.supabase.co';
const supabaseKey = 'sb_publishable_Rl4L5TrlK4MWdW_zTlsQCQ_NunIbuSE';
const supabase = createClient(supabaseUrl, supabaseKey);

const candidates = [
  'billing_period',
  'frequency',
  'period',
  'billing_cycle',
  'interval',
  'cycle',
  'type',
  'status',
  'category_id',
  'user_id',
  'payment_method',
  'end_date',
  'last_processed',
  'next_billing_date',
  'next_payment_date',
  'amount',
  'name',
  'id',
  'created_at'
];

async function testColumns() {
  console.log('Testing column existence by selecting them...');
  
  for (const col of candidates) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(col)
      .limit(1);
      
    if (error) {
      if (error.message && error.message.includes('Could not find')) {
        console.log(`❌ Column [${col}] DOES NOT EXIST`);
      } else {
        console.log(`❓ Column [${col}] returned other error:`, error.message);
      }
    } else {
      console.log(`✅ Column [${col}] EXISTS!`);
    }
  }
}

testColumns();
