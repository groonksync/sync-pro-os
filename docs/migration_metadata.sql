-- MIGRACIÓN PARA PERSISTENCIA EXTENDIDA (SOVEREIGN EDITOR PRO)
-- Este script añade la columna metadata de tipo JSONB para guardar estados dinámicos.

ALTER TABLE reuniones 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Comentario para el registro
COMMENT ON COLUMN reuniones.metadata IS 'Contiene Pipeline, Deadlines, Hitos de Pago y Brand Kit del Editor Pro';
