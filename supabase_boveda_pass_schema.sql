-- =========================================================================
-- SYNC PRO OS - BÓVEDA PASS SCHEMA
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =========================================================================

CREATE TABLE IF NOT EXISTS boveda_pass (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sitio_web TEXT NOT NULL,
    url TEXT,
    usuario TEXT NOT NULL,
    contrasena TEXT NOT NULL, -- Guardada encriptada con AES-256 (CryptoJS) en cliente
    categoria TEXT DEFAULT 'General',
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Índices rápidos
CREATE INDEX IF NOT EXISTS idx_boveda_sitio ON boveda_pass(sitio_web);
CREATE INDEX IF NOT EXISTS idx_boveda_categoria ON boveda_pass(categoria);

-- RLS (Row Level Security) — Deshabilitar para uso local y evitar problemas de políticas de acceso
ALTER TABLE boveda_pass DISABLE ROW LEVEL SECURITY;
