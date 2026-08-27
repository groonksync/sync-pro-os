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

-- ============================================================
-- TABLA: alimentos_config_catalogo
-- Configuración de Platos y Paquetes Dinámicos
-- ============================================================

CREATE TABLE IF NOT EXISTS public.alimentos_config_catalogo (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    updated_at TIMESTAMPTZ DEFAULT now(),
    productos JSONB DEFAULT '[]'::jsonb,
    paquetes JSONB DEFAULT '[]'::jsonb
);

-- Habilitar RLS
ALTER TABLE public.ventas_alimentos_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alimentos_config_catalogo ENABLE ROW LEVEL SECURITY;

-- Políticas de Acceso: Permitir inserción y lectura anónima/autenticada
DROP POLICY IF EXISTS "Permitir insercion publica de ventas alimentos" ON public.ventas_alimentos_tickets;
CREATE POLICY "Permitir insercion publica de ventas alimentos"
ON public.ventas_alimentos_tickets FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acceso publico catalogo alimentos" ON public.alimentos_config_catalogo;
CREATE POLICY "Permitir acceso publico catalogo alimentos"
ON public.alimentos_config_catalogo FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);
