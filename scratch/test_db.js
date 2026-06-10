import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el entorno.');
  console.error('Ejecuta: node --env-file=.env test_db.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  try {
    const { data, error } = await supabase.from('productos').select('*');
    if (error) {
      console.error('Error fetching products:', error);
    } else {
      console.log('Successfully fetched products. Count:', data.length);
      if (data.length > 0) {
        console.log('Sample product:', data[0]);
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

test();