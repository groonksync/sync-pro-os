-- =========================================================================
-- SOVEREIGN OS / INEFABLE - MIGRACIÓN DE CONSTRICCIONES Y CONFIGURACIÓN SQL
-- Ejecuta este script en el editor SQL de tu consola de Supabase.
-- =========================================================================

-- 1. Actualizar la relación de prestamos_historial para eliminar en cascada
-- Esto previene bloqueos al intentar eliminar préstamos/prestatarios.
ALTER TABLE prestamos_historial 
DROP CONSTRAINT IF EXISTS prestamos_historial_prestamo_id_fkey;

ALTER TABLE prestamos_historial 
ADD CONSTRAINT prestamos_historial_prestamo_id_fkey 
FOREIGN KEY (prestamo_id) REFERENCES prestamos(id) ON DELETE CASCADE;

-- 2. Deshabilitar RLS (Row Level Security) en las tablas operativas críticas
-- para evitar errores de autenticación o guardado en el entorno personal de escritorio y web.
ALTER TABLE prestamos DISABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos_historial DISABLE ROW LEVEL SECURITY;
ALTER TABLE papelera DISABLE ROW LEVEL SECURITY;
ALTER TABLE egresos DISABLE ROW LEVEL SECURITY;
ALTER TABLE servicios DISABLE ROW LEVEL SECURITY;

-- 3. Crear índices de rendimiento si no existen
CREATE INDEX IF NOT EXISTS idx_prestamos_cliente ON prestamos(nombre);
CREATE INDEX IF NOT EXISTS idx_egresos_fecha ON egresos(fecha);
CREATE INDEX IF NOT EXISTS idx_servicios_fecha_pago ON servicios(fecha_pago);
