-- =========================================================
-- SOLUCIÓN AL ERROR DE COLUMNA 'nacionalidad' EN SUPABASE
-- Ejecutar esta consulta en: Supabase Dashboard > SQL Editor
-- =========================================================

ALTER TABLE clientes_editor ADD COLUMN IF NOT EXISTS nacionalidad text;
