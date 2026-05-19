-- =========================================================
-- SYNCHRONIZE PRODUCTOS TABLE SCHEMA
-- Run this in Supabase SQL Editor to fix "Missing Column" errors
-- =========================================================

-- 1. Ensure primary columns exist
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
