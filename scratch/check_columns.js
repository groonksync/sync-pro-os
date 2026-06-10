import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el entorno.');
  console.error('Ejecuta: node --env-file=.env check_columns.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data } = await supabase.from('productos').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Columnas disponibles:', Object.keys(data[0]));
  } else {
    console.log('No se encontraron productos o error al consultar.');
  }
}

check();