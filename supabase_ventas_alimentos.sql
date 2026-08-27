-- ============================================================
-- TABLA: ventas_alimentos_tickets
-- Sistema de Ventas de Alimentos y Preventa de Tickets
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ventas_alimentos_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    numero_ticket VARCHAR(50),
    cliente_nombre VARCHAR(255) NOT NULL,
    cliente_telefono VARCHAR(50),
    vendedor_nombre VARCHAR(255) NOT NULL,
    cantidad_unidades INT NOT NULL DEFAULT 1,
    paquetes_3 INT NOT NULL DEFAULT 0,
    unidades_sueltas INT NOT NULL DEFAULT 0,
    monto_subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    monto_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    metodo_pago VARCHAR(50) NOT NULL DEFAULT 'efectivo', -- 'efectivo', 'qr_transferencia', 'credito'
    es_credito BOOLEAN DEFAULT false,
    persona_fiada VARCHAR(255),
    hermano_autoriza VARCHAR(255),
    estado_credito VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'pagado'
    fecha_pago_credito DATE,
    tipo_entrega VARCHAR(50) NOT NULL DEFAULT 'recojo', -- 'recojo', 'delivery_pagado', 'delivery_gratuito'
    costo_delivery_cliente NUMERIC(12, 2) DEFAULT 0,
    costo_delivery_empresa NUMERIC(12, 2) DEFAULT 0,
    direccion_entrega TEXT,
    notas TEXT,
    estado VARCHAR(50) DEFAULT 'completado' -- 'completado', 'anulado'
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_ventas_alimentos_vendedor ON public.ventas_alimentos_tickets (vendedor_nombre);
CREATE INDEX IF NOT EXISTS idx_ventas_alimentos_fecha ON public.ventas_alimentos_tickets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_alimentos_credito ON public.ventas_alimentos_tickets (es_credito, estado_credito);

-- Habilitar RLS
ALTER TABLE public.ventas_alimentos_tickets ENABLE ROW LEVEL SECURITY;

-- Políticas de Acceso: Permitir inserción anónima para vendedores en campo con enlace
DROP POLICY IF EXISTS "Permitir insercion publica de ventas alimentos" ON public.ventas_alimentos_tickets;
CREATE POLICY "Permitir insercion publica de ventas alimentos"
ON public.ventas_alimentos_tickets
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Permitir lectura y modificación completa a usuarios autenticados (o consulta anónima de tickets)
DROP POLICY IF EXISTS "Permitir lectura ventas alimentos" ON public.ventas_alimentos_tickets;
CREATE POLICY "Permitir lectura ventas alimentos"
ON public.ventas_alimentos_tickets
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir actualizacion ventas alimentos autenticados" ON public.ventas_alimentos_tickets;
CREATE POLICY "Permitir actualizacion ventas alimentos autenticados"
ON public.ventas_alimentos_tickets
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir eliminacion ventas alimentos" ON public.ventas_alimentos_tickets;
CREATE POLICY "Permitir eliminacion ventas alimentos"
ON public.ventas_alimentos_tickets
FOR DELETE
TO anon, authenticated
USING (true);
