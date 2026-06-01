const supabaseUrl = 'https://slronhfjiszsotnbuane.supabase.co';
const supabaseKey = 'sb_publishable_Rl4L5TrlK4MWdW_zTlsQCQ_NunIbuSE';

async function testOptions() {
  console.log('Sending OPTIONS request to /rest/v1/subscriptions...');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
      method: 'OPTIONS',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    console.log('Status:', response.status, response.statusText);
    const body = await response.text();
    console.log('Headers:', JSON.stringify([...response.headers.entries()], null, 2));
    console.log('Body:', body.substring(0, 2000));
  } catch (err) {
    console.error('Error in OPTIONS request:', err);
  }
}

testOptions();
