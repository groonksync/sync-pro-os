import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    console.log('Testing query on notas table...');
    const { data, error } = await supabase
      .from('notas')
      .select('id, titulo, created_at')
      .eq('eliminada', false)
      .order('updated_at', { ascending: false })
      .limit(1);
    if (error) {
      console.error('NOTAS QUERY ERROR:', error);
    } else {
      console.log('Success! Notes fetched:', data);
    }
  } catch (e) {
    console.error('Unhandled catch:', e);
  }
}
run();
