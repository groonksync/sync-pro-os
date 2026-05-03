const { createClient } = require('@supabase/supabase-client');

// Intentaremos obtener un producto para ver sus columnas
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pivunmwnvntfkslyvcln.supabase.co'; // Extraído del contexto si fuera posible, pero usaré el cliente del proyecto
// Nota: Como no puedo leer el .env directamente de forma segura para ejecución, 
// voy a intentar leer el archivo src/lib/supabaseClient.js para ver la config.
