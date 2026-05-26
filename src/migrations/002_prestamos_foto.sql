-- Migration 002: Añadir columna foto a la tabla prestamos
-- Para almacenar URL de la foto del prestatario

ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS foto TEXT DEFAULT '';

-- Crear bucket de storage para fotos de prestatarios
-- Ejecutar manualmente en Supabase Dashboard > Storage > Create bucket
-- Nombre: prestatario-fotos
-- Política: público (SELECT para todos, INSERT/UPDATE para usuarios autenticados)
