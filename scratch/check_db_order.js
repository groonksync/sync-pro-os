import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    console.log('Running ordered select...');
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('DATABASE ERROR RETURNED BY SUPABASE:', error);
    } else {
      console.log('Success! Fetched products count:', data?.length);
    }
  } catch (e) {
    console.error('Unhandled catch:', e);
  }
}
run();
