const supabaseUrl = 'https://slronhfjiszsotnbuane.supabase.co';
const supabaseKey = 'sb_publishable_Rl4L5TrlK4MWdW_zTlsQCQ_NunIbuSE';

async function fetchSchema() {
  console.log('Fetching PostgREST OpenAPI schema...');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`);
    console.log('Response status:', response.status, response.statusText);
    const text = await response.text();
    console.log('Response content length:', text.length);
    console.log('First 500 chars:', text.substring(0, 500));
    
    const schema = JSON.parse(text);
    if (schema.definitions) {
      console.log('Tables found in schema:', Object.keys(schema.definitions));
      if (schema.definitions.subscriptions) {
        console.log('\n--- Subscriptions Table Definition ---');
        console.log(JSON.stringify(schema.definitions.subscriptions.properties, null, 2));
      }
    } else {
      console.log('Definitions object not found in the response.');
    }
  } catch (err) {
    console.error('Error fetching schema:', err);
  }
}

fetchSchema();
