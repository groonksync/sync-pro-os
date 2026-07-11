-- =========================================================================
-- INEFABLE — AGREGAR SOPORTE PARA CONTRIBUCIONES (CO-PAGADORES) EN SERVICIOS
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =========================================================================

-- Agregar la columna contribuciones de tipo JSONB a la tabla servicios
alter table servicios add column if not exists contribuciones jsonb default '[]'::jsonb;
