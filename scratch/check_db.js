import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    const { data, error } = await supabase.from('productos').select('*').limit(3);
    if (error) throw error;
    console.log('Sample detailed rows:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}
run();
