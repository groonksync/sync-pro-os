
import { createClient } from '@supabase/supabase-client';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkColumns() {
  const { data, error } = await supabase.from('reuniones').select('*').limit(1);
  if (error) {
    console.error('Error fetching reuniones:', error);
  } else {
    console.log('Columns in reuniones:', Object.keys(data[0] || {}));
  }
}

checkColumns();
