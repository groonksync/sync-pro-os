-- =========================================================================
-- INEFABLE — SCRIPT DE CREACIÓN DE TABLA DE NOTAS DE PRESTAMISTAS
-- Ejecutar este script en: Supabase Dashboard > SQL Editor
-- =========================================================================

-- Crear tabla para apuntes o notas a nivel de cliente/prestamista
create table if not exists prestamistas_notas (
  id uuid primary key default gen_random_uuid(),
  nombre_cliente text unique not null,
  contenido text default '',
  updated_at timestamptz default now()
);

-- Deshabilitar Row Level Security (RLS) para guardar de forma directa en entorno local/personal
alter table prestamistas_notas disable row level security;
