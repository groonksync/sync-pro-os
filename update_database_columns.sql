-- =========================================================================
-- INEFABLE — SQL MIGRATION FOR MISSING COLUMNS
-- Run this script in: Supabase Dashboard > SQL Editor
-- This fixes saving issues in Prestamos, Proyectos, and Servicios.
-- =========================================================================

-- 1. Table: prestamos
ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS tipo_prestamo TEXT DEFAULT 'otorgado';

-- 2. Table: proyectos
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'Sin Iniciar';
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS moneda TEXT DEFAULT 'BOB';

-- 3. Table: servicios (suscripciones)
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'Streaming';
