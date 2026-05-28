-- =========================================================================
-- SYNC PRO OS — SCRIPT CONSOLIDADO DE BASE DE DATOS (SUPABASE)
-- Ejecutar este script en: Supabase Dashboard > SQL Editor
-- Asegura la creación y actualización de todas las tablas con RLS deshabilitado.
-- =========================================================================

-- Habilitar extensión uuid-ossp si no está activa
create extension if not exists "uuid-ossp";

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

-- 2. VENTAS
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
  notes        text, -- compatible con notas/notes
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

-- 5. NOTAS
create table if not exists notas (
  id           uuid primary key default gen_random_uuid(),
  titulo       text default 'Sin Título',
  icono        text default 'file',
  contenido    jsonb default '[]'::jsonb,
  is_folder    boolean default false,
  parent_id    uuid references notas(id) on delete cascade,
  favorito     boolean default false,
  fecha_evento date,
  color        text default '#10b981',
  estado       text default 'pendiente',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index if not exists idx_notas_parent on notas(parent_id);

-- 6. BÓVEDA CONTRASENAS
create table if not exists boveda_pass (
  id          uuid primary key default gen_random_uuid(),
  sitio_web   text not null,
  url         text,
  usuario     text not null,
  contrasena  text not null,
  categoria   text default 'General',
  notas       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists idx_boveda_sitio on boveda_pass(sitio_web);

-- 7. PRODUCTOS (CATÁLOGO / INVENTARIO)
create table if not exists productos (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  descripcion   text,
  precio        numeric(10,2) default 0,
  stock         integer default 0,
  sku           text,
  imagen_url    text,
  created_at    timestamptz default now(),
  distribuidor  text,
  ubicacion     text,
  serial        text,
  tipo_envio    text default 'Envío Gratuito',
  imagenes      text[] default '{}',
  metadata      jsonb default '{}',
  precio_costo  numeric(10,2) default 0,
  precio_venta  numeric(10,2) default 0,
  precio_antes  numeric(10,2) default 0,
  stock_actual  integer default 0,
  stock_minimo  integer default 5,
  stock_vendido integer default 0,
  ficha_tecnica text,
  garantia      text,
  codigo        text,
  marca         text,
  categoria     text
);

-- Asegurar columnas para tabla productos en caso de que ya exista
alter table productos add column if not exists distribuidor text;
alter table productos add column if not exists ubicacion text;
alter table productos add column if not exists serial text;
alter table productos add column if not exists tipo_envio text default 'Envío Gratuito';
alter table productos add column if not exists imagenes text[] default '{}';
alter table productos add column if not exists metadata jsonb default '{}';
alter table productos add column if not exists precio_costo numeric(10,2) default 0;
alter table productos add column if not exists precio_venta numeric(10,2) default 0;
alter table productos add column if not exists precio_antes numeric(10,2) default 0;
alter table productos add column if not exists stock_actual integer default 0;
alter table productos add column if not exists stock_minimo integer default 5;
alter table productos add column if not exists stock_vendido integer default 0;
alter table productos add column if not exists ficha_tecnica text;
alter table productos add column if not exists garantia text;
alter table productos add column if not exists codigo text;
alter table productos add column if not exists marca text;
alter table productos add column if not exists categoria text;

-- 8. CLIENTES EDITOR
create table if not exists clientes_editor (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  email         text,
  empresa       text,
  status        text default 'Activo',
  telefono      text,
  nacionalidad  text,
  foto_url      text,
  created_at    timestamptz default now()
);

-- 9. REUNIONES
create table if not exists reuniones (
  id            uuid primary key default gen_random_uuid(),
  cliente_id    uuid references clientes_editor(id) on delete cascade,
  cliente       text,
  fecha         date not null,
  session_title text not null,
  contenido     text,
  total_time    integer default 0,
  created_at    timestamptz default now()
);
create index if not exists idx_reuniones_cliente on reuniones(cliente_id);

-- 10. CLIENTES AGENCIA
create table if not exists clientes_agencia (
  id             uuid primary key default gen_random_uuid(),
  nombre_empresa text not null,
  dueño          text,
  email          text,
  telefono       text,
  plan           text default 'Básico',
  metadata       jsonb default '{}',
  created_at     timestamptz default now()
);

-- 11. ESTRATEGIAS AGENCIA
create table if not exists estrategias_agencia (
  id                  uuid primary key default gen_random_uuid(),
  cliente_agencia_id  uuid references clientes_agencia(id) on delete cascade,
  titulo_estrategia   text not null,
  contenido           text,
  total_time          integer default 0,
  created_at          timestamptz default now()
);
create index if not exists idx_estrategias_agencia on estrategias_agencia(cliente_agencia_id);

-- 12. SERVICIOS (SUSCRIPCIONES)
create table if not exists servicios (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  monto       numeric(10,2) not null default 0,
  fecha_pago  date not null,
  metodo      text default 'Tarjeta',
  contacto    text,
  notas       text,
  tipo        text default 'Mensual',
  created_at  timestamptz default now()
);

-- 13. RECORDATORIOS
create table if not exists recordatorios (
  id              uuid primary key default gen_random_uuid(),
  titulo          text not null,
  descripcion     text,
  fecha           date,
  fecha_fin       date,
  prioridad       text default 'Media',
  categoria       text default 'Tarea',
  estado          text default 'Pendiente',
  monto           numeric(10,2) default 0,
  nombre_contacto text,
  recurrencia     text default 'Ninguna',
  subtareas       jsonb default '[]'::jsonb,
  created_at      timestamptz default now()
);

-- 14. PRESTAMOS
create table if not exists prestamos (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null,
  ci             text not null,
  telefono       text not null,
  email          text,
  direccion      text,
  referencias    text,
  ocupacion      text,
  foto           text,
  capital        numeric(10,2) not null,
  interes        numeric(10,2) not null,
  moneda         text default 'BOB',
  inicio         date not null,
  fin            date not null,
  estado         text default 'Activo',
  tipoGarantia   text, -- compatible con frontend
  garantia       text,
  drive_contrato text,
  drive_fotos    text,
  notas          text,
  pagos          jsonb default '[]'::jsonb,
  created_at     timestamptz default now()
);

-- 15. PRESTAMOS HISTORIAL
create table if not exists prestamos_historial (
  id            uuid primary key default gen_random_uuid(),
  prestamo_id   uuid references prestamos(id) on delete cascade,
  accion        text not null,
  detalle       text,
  datos_previos jsonb,
  created_at    timestamptz default now()
);
create index if not exists idx_historial_prestamo on prestamos_historial(prestamo_id);

-- 16. PAPELERA
create table if not exists papelera (
  id               uuid primary key default gen_random_uuid(),
  nombre_item      text not null,
  tipo_dato        text not null,
  datos_originales jsonb not null,
  expira_el        timestamptz not null,
  created_at       timestamptz default now()
);

-- =========================================================================
-- DESHABILITAR ROW LEVEL SECURITY (RLS)
-- Asegura el guardado directo sin bloqueos en un entorno de desarrollo personal.
-- =========================================================================
alter table proyectos disable row level security;
alter table ventas disable row level security;
alter table egresos disable row level security;
alter table recibos disable row level security;
alter table notas disable row level security;
alter table boveda_pass disable row level security;
alter table productos disable row level security;
alter table clientes_editor disable row level security;
alter table reuniones disable row level security;
alter table clientes_agencia disable row level security;
alter table estrategias_agencia disable row level security;
alter table servicios disable row level security;
alter table recordatorios disable row level security;
alter table prestamos disable row level security;
alter table prestamos_historial disable row level security;
alter table papelera disable row level security;
