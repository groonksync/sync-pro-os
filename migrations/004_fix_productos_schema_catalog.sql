-- Migración 004: Corregir schema de productos para catálogo WhatsApp + Facebook
-- Ejecutar en Supabase SQL Editor (https://supabase.com/dashboard/project/wcewgxkizvsnffhbqqet/sql/new)

-- 1. Agregar columna imagen (la app usa 'imagen' no 'imagen_url')
ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen text;

-- 2. Agregar columna updated_at para control de modificaciones
ALTER TABLE productos ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Agregar columna estado para control de disponibilidad
ALTER TABLE productos ADD COLUMN IF NOT EXISTS estado text DEFAULT 'Stock';

-- 4. Agregar columna color para el feed de Meta
ALTER TABLE productos ADD COLUMN IF NOT EXISTS color text;

-- 5. Agregar columna condicion (nuevo/usado) para el feed de Meta
ALTER TABLE productos ADD COLUMN IF NOT EXISTS condicion text DEFAULT 'Nuevo';

-- 6. Actualizar updated_at automáticamente al modificar un registro
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_productos_updated_at ON productos;
CREATE TRIGGER update_productos_updated_at
    BEFORE UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Copiar datos existentes de imagen_url a imagen si existen
UPDATE productos SET imagen = imagen_url WHERE imagen IS NULL AND imagen_url IS NOT NULL;
