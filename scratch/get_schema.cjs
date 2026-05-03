const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wcewgxkizvsnffhbqqet.supabase.co';
const supabaseAnonKey = 'sb_publishable_MjJ0dptOwRrSzyxFY2nApA_rf_Fr_6C';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.from('productos').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
    return;
  }
  if (data && data.length > 0) {
    console.log('Columnas detectadas:', Object.keys(data[0]));
  } else {
    console.log('No hay productos en la tabla para inspeccionar.');
  }
}

check();
