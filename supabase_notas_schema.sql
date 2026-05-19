-- =========================================================================
-- SOVEREIGN STUDIO - NOTAS PRO v8
-- =========================================================================

-- OPCIÓN A: SI LA TABLA NO EXISTE (Instalación limpia)
CREATE TABLE IF NOT EXISTS notas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT DEFAULT 'Sin Título',
    icono TEXT DEFAULT 'file',
    contenido JSONB DEFAULT '[]'::jsonb,
    is_folder BOOLEAN DEFAULT false,
    parent_id UUID REFERENCES notas(id) ON DELETE CASCADE,
    favorito BOOLEAN DEFAULT false,
    fecha_evento DATE, -- Nuevo campo para carpetas
    color TEXT DEFAULT '#10b981', -- Nuevo campo para carpetas (Color de la etiqueta)
    estado TEXT DEFAULT 'pendiente', -- Nuevo campo para notas (pendiente, proceso, completado)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- OPCIÓN B: SI LA TABLA YA EXISTE (Actualización sin perder datos)
-- Descomenta y ejecuta estas líneas si ya tienes datos:
/*
ALTER TABLE notas ADD COLUMN IF NOT EXISTS fecha_evento DATE;
ALTER TABLE notas ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#10b981';
ALTER TABLE notas ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'pendiente';
*/

-- =========================================================================
-- ÍNDICES Y SEGURIDAD
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_notas_parent ON notas(parent_id);
CREATE INDEX IF NOT EXISTS idx_notas_titulo ON notas(titulo);

ALTER TABLE notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a usuarios autenticados" ON notas
    FOR ALL USING (true) WITH CHECK (true);
