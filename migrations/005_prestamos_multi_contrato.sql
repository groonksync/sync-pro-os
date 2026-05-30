-- Migración: Soporte para Multi-contratos en Préstamos
-- Esta migración agrega columnas a la tabla 'prestamos' para agrupar múltiples contratos bajo un mismo prestamista.

ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS prestamista_id UUID DEFAULT NULL;
ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS contrato_numero INTEGER DEFAULT 1;
ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS contrato_etiqueta TEXT DEFAULT 'Contrato Original';

-- Índice para acelerar búsquedas y agrupaciones por prestamista
CREATE INDEX IF NOT EXISTS idx_prestamos_prestamista ON prestamos(prestamista_id);
