-- Migración / Actualización del Esquema para GymOS V2.0 (Precios en Bolivianos Bs., Fechas de Inicio y Cupones)
-- Inefable Web App - 2026

-- 1. Crear Tabla de Cupones si no existe
CREATE TABLE IF NOT EXISTS public.gym_cupones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    tipo_descuento VARCHAR(20) NOT NULL CHECK (tipo_descuento IN ('Porcentaje', 'Monto')),
    valor NUMERIC(10, 2) NOT NULL,
    activo BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para la tabla de cupones
ALTER TABLE public.gym_cupones ENABLE ROW LEVEL SECURITY;

-- Crear políticas para usuarios autenticados
CREATE POLICY "Permitir lectura completa a usuarios autenticados" 
ON public.gym_cupones FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir control total a usuarios autenticados" 
ON public.gym_cupones FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Actualizar Tabla de Miembros (Agregar fecha_inicio y cupon_aplicado)
ALTER TABLE public.gym_miembros 
ADD COLUMN IF NOT EXISTS fecha_inicio DATE DEFAULT CURRENT_DATE NOT NULL,
ADD COLUMN IF NOT EXISTS cupon_aplicado VARCHAR(50);

-- 3. Actualizar Tabla de Pagos (Agregar fecha_inicio y cupon_id)
ALTER TABLE public.gym_pagos 
ADD COLUMN IF NOT EXISTS fecha_inicio DATE DEFAULT CURRENT_DATE NOT NULL,
ADD COLUMN IF NOT EXISTS cupon_id UUID REFERENCES public.gym_cupones(id) ON DELETE SET NULL;

-- 4. Re-configurar Planes de Membresía en Bolivianos (Bs.)
-- Eliminar planes previos para evitar duplicación y conflictos de moneda
TRUNCATE TABLE public.gym_planes CASCADE;

INSERT INTO public.gym_planes (nombre, precio, descripcion, duracion_meses)
VALUES 
('Pase Diario', 35.00, 'Acceso único para entrenar un día.', 1),
('Mensual Estándar', 280.00, 'Acceso completo a sala de pesas y cardio de lunes a sábado.', 1),
('Bimestral Estándar', 500.00, 'Acceso completo a instalaciones por 2 meses.', 2),
('Pase Trimestral', 720.00, 'Acceso completo a instalaciones por 3 meses.', 3),
('Pase Semestral', 1400.00, 'Acceso completo a instalaciones por 6 meses.', 6),
('Anual VIP', 2600.00, 'Acceso completo por 12 meses + 1 evaluación corporal gratis al mes.', 12);

-- Insertar cupones de prueba iniciales
INSERT INTO public.gym_cupones (codigo, tipo_descuento, valor, activo)
VALUES 
('FAMILIA10', 'Porcentaje', 10.00, true),
('APERTURA20', 'Porcentaje', 20.00, true),
('BIENVENIDA50', 'Monto', 50.00, true)
ON CONFLICT (codigo) DO NOTHING;
