import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    const { data, error } = await supabase.from('productos').select('*');
    if (error) throw error;
    
    let hasNaN = false;
    data.forEach((p, idx) => {
      const price = parseFloat(p.precio_venta || 0);
      const stock = parseInt(p.stock_actual || 0);
      const val = price * stock;
      if (isNaN(val)) {
        console.error(`Row ${idx} (ID: ${p.id}, Name: ${p.nombre}) produced NaN! price_venta: ${p.precio_venta}, stock_actual: ${p.stock_actual}`);
        hasNaN = true;
      }
    });
    
    if (!hasNaN) {
      console.log('All database rows successfully validated! No NaNs found.');
    }
  } catch (e) {
    console.error('Error:', e);
  }
}
run();
