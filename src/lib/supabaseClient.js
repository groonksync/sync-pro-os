import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL detectada:', supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: Faltan las variables de entorno de Supabase');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')
