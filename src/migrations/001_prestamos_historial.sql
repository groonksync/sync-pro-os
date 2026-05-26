-- ============================================================
-- MIGRACIÓN 001: Tabla de Auditoría para Préstamos
-- ============================================================
-- Crea la tabla prestamos_historial para registrar todas las
-- acciones sobre préstamos: CREACIÓN, ACTUALIZACIÓN, ELIMINACIÓN
-- ============================================================

CREATE TABLE IF NOT EXISTS prestamos_historial (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  prestamo_id UUID NOT NULL,
  accion TEXT NOT NULL CHECK (accion IN ('CREADO', 'ACTUALIZADO', 'ELIMINADO', 'RESTAURADO', 'REFINANCIADO')),
  detalle TEXT,
  datos_previos JSONB,
  datos_nuevos JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_prestamos_historial_prestamo_id ON prestamos_historial(prestamo_id);
CREATE INDEX IF NOT EXISTS idx_prestamos_historial_accion ON prestamos_historial(accion);
CREATE INDEX IF NOT EXISTS idx_prestamos_historial_created_at ON prestamos_historial(created_at DESC);

-- Trigger automático: cuando se actualiza un préstamo, registrar en historial
CREATE OR REPLACE FUNCTION fn_auditar_prestamo_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO prestamos_historial (prestamo_id, accion, detalle, datos_previos, datos_nuevos)
  VALUES (
    OLD.id,
    'ACTUALIZADO',
    'Préstamo actualizado automáticamente',
    row_to_json(OLD)::jsonb,
    row_to_json(NEW)::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger automático: cuando se elimina un préstamo, registrar en historial
CREATE OR REPLACE FUNCTION fn_auditar_prestamo_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO prestamos_historial (prestamo_id, accion, detalle, datos_previos)
  VALUES (
    OLD.id,
    'ELIMINADO',
    'Préstamo eliminado: ' || COALESCE(OLD.nombre, 'Sin nombre'),
    row_to_json(OLD)::jsonb
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar triggers si existen (para poder re-ejecutar la migración)
DROP TRIGGER IF EXISTS trg_prestamos_auditar_update ON prestamos;
DROP TRIGGER IF EXISTS trg_prestamos_auditar_delete ON prestamos;

-- Crear los triggers
CREATE TRIGGER trg_prestamos_auditar_update
  AFTER UPDATE ON prestamos
  FOR EACH ROW
  EXECUTE FUNCTION fn_auditar_prestamo_update();

CREATE TRIGGER trg_prestamos_auditar_delete
  BEFORE DELETE ON prestamos
  FOR EACH ROW
  EXECUTE FUNCTION fn_auditar_prestamo_delete();

-- ============================================================
-- NUEVOS CAMPOS para la tabla prestamos (formulario mejorado)
-- ============================================================
-- Estos campos son opcionales, se agregaron en el FormularioPrestamo
-- pero la aplicación funciona sin ellos (backward compatible)

ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS direccion TEXT DEFAULT '';
ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS referencias TEXT DEFAULT '';
ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS ocupacion TEXT DEFAULT '';
ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS tipoGarantia TEXT DEFAULT '';
ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS notas TEXT DEFAULT '';

-- ============================================================
-- FIN MIGRACIÓN
-- ============================================================
