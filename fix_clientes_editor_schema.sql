-- =========================================================
-- SOLUCIÓN COMPLETA PARA TABLA 'clientes_editor' EN SUPABASE
-- Ejecuta esto en: Supabase Dashboard > SQL Editor
-- =========================================================

ALTER TABLE clientes_editor ADD COLUMN IF NOT EXISTS status text DEFAULT 'Activo';
ALTER TABLE clientes_editor ADD COLUMN IF NOT EXISTS nacionalidad text;
ALTER TABLE clientes_editor ADD COLUMN IF NOT EXISTS telefono text;
ALTER TABLE clientes_editor ADD COLUMN IF NOT EXISTS foto_url text;
