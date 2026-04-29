-- =========================================================
-- Sync Pro OS — Script de creación de tablas nuevas
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =========================================================

-- 1. PROYECTOS
create table if not exists proyectos (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  cliente       text,
  tipo          text default 'Edición',
  estado        text default 'Sin Iniciar',
  fecha_inicio  date,
  fecha_entrega date,
  drive         text,
  presupuesto   numeric(10,2) default 0,
  notas         text,
  created_at    timestamptz default now()
);

-- 2. VENTAS DIGITALES
create table if not exists ventas (
  id          uuid primary key default gen_random_uuid(),
  fecha       date not null,
  producto    text not null,
  categoria   text default 'Preset',
  plataforma  text default 'Gumroad',
  monto       numeric(10,2) not null,
  notas       text,
  created_at  timestamptz default now()
);

-- 3. EGRESOS
create table if not exists egresos (
  id           uuid primary key default gen_random_uuid(),
  fecha        date not null,
  descripcion  text not null,
  categoria    text default 'Suscripción',
  monto        numeric(10,2) not null,
  notas        text,
  created_at   timestamptz default now()
);

-- 4. RECIBOS
create table if not exists recibos (
  id         uuid primary key default gen_random_uuid(),
  numero     text,
  cliente    text not null,
  concepto   text not null,
  monto      numeric(10,2) not null,
  fecha      date not null,
  estado     text default 'Pendiente',
  notas      text,
  created_at timestamptz default now()
);

-- =========================================================
-- RLS (Row Level Security) — Deshabilitar para uso personal
-- =========================================================
alter table proyectos disable row level security;
alter table ventas     disable row level security;
alter table egresos    disable row level security;
alter table recibos    disable row level security;
