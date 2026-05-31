-- =========================================================================
-- SOVEREIGN OS - SCRIPT DE BLINDAJE DE SEGURIDAD (SUPABASE)
-- Ejecutar este script en: Supabase Dashboard > SQL Editor
-- Habilita Row-Level Security (RLS) y configura políticas de acceso restrictivo.
-- =========================================================================

-- 1. Crear función para validar la contraseña secreta en los encabezados HTTP.
--    IMPORTANTE: Reemplaza 'SovereignPass123_SecureAccess' con tu contraseña preferida.
--    Debes configurar esta misma contraseña en la sección de 'Ajustes' en tu aplicación.
CREATE OR REPLACE FUNCTION check_sovereign_pass()
RETURNS boolean AS $$
BEGIN
  RETURN COALESCE(
    (current_setting('request.headers', true)::json->>'x-sovereign-pass'),
    ''
  ) = 'SovereignPass123_SecureAccess';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Habilitar RLS en cada una de las tablas del sistema
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE egresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recibos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE boveda_pass ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes_editor ENABLE ROW LEVEL SECURITY;
ALTER TABLE reuniones ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes_agencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE estrategias_agencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordatorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE papelera ENABLE ROW LEVEL SECURITY;

-- Tablas del Flujo de Trabajo
ALTER TABLE flujo_trabajo_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE flujo_trabajo_carpetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE flujo_trabajo_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE flujo_trabajo_compartidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE flujo_trabajo_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE flujo_trabajo_versiones ENABLE ROW LEVEL SECURITY;


-- 3. Crear Políticas de Seguridad (Policies)
--    Eliminar políticas previas si existen para evitar duplicación.

-- Función auxiliar para limpiar y crear políticas
DO $$
DECLARE
  tablas TEXT[] := ARRAY[
    'proyectos', 'ventas', 'egresos', 'recibos', 'notas', 'boveda_pass', 
    'productos', 'clientes_editor', 'reuniones', 'clientes_agencia', 
    'estrategias_agencia', 'servicios', 'recordatorios', 'prestamos', 
    'prestamos_historial', 'papelera', 'flujo_trabajo_usuarios', 
    'flujo_trabajo_carpetas', 'flujo_trabajo_documentos', 
    'flujo_trabajo_compartidos', 'flujo_trabajo_comentarios', 
    'flujo_trabajo_versiones'
  ];
  tabla TEXT;
BEGIN
  FOREACH tabla IN ARRAY tablas LOOP
    -- Eliminar políticas de acceso anteriores
    EXECUTE format('DROP POLICY IF EXISTS "Sovereign Access Policy" ON %I', tabla);
    
    -- Crear nueva política restrictiva basada en el encabezado
    EXECUTE format('
      CREATE POLICY "Sovereign Access Policy" ON %I
      FOR ALL
      TO anon, authenticated
      USING (check_sovereign_pass())
      WITH CHECK (check_sovereign_pass())
    ', tabla);
  END LOOP;
END $$;
