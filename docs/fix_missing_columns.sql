-- =========================================================
-- Sync Pro OS — SQL FIX: Missing Column Correction
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =========================================================

-- 1. Añadir la columna session_title si no existe
ALTER TABLE reuniones 
ADD COLUMN IF NOT EXISTS session_title TEXT DEFAULT 'Sesión de Edición';

-- 2. Asegurarse de que la columna metadata exista (para el blindaje de datos)
ALTER TABLE reuniones 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Comentario descriptivo
COMMENT ON COLUMN reuniones.session_title IS 'Título descriptivo de la sesión de trabajo';
COMMENT ON COLUMN reuniones.metadata IS 'Datos extendidos: Pipeline, Moodboard, Brand Kit, etc.';

-- 4. Verificar clientes_editor (opcional pero recomendado)
ALTER TABLE clientes_editor 
ADD COLUMN IF NOT EXISTS plan_agencia TEXT DEFAULT 'Básico';

ALTER TABLE clientes_editor 
ADD COLUMN IF NOT EXISTS empresa TEXT;
