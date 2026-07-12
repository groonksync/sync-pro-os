-- Schema de Base de Datos para GymOS (Sistema de Gimnasio)
-- Inefable Web App - 2026

-- 1. Tabla de Planes de Membresía
CREATE TABLE IF NOT EXISTS public.gym_planes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    precio NUMERIC(10, 2) NOT NULL,
    descripcion TEXT,
    duracion_meses INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Miembros
CREATE TABLE IF NOT EXISTS public.gym_miembros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(30),
    email VARCHAR(150),
    plan_id UUID REFERENCES public.gym_planes(id) ON DELETE SET NULL,
    grupo_familiar VARCHAR(100),
    notas_medicas TEXT,
    alertas_medicas BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla de Registro de Pagos e Historial de Membresías
CREATE TABLE IF NOT EXISTS public.gym_pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    miembro_id UUID REFERENCES public.gym_miembros(id) ON DELETE CASCADE NOT NULL,
    monto NUMERIC(10, 2) NOT NULL,
    descuento NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    monto_final NUMERIC(10, 2) GENERATED ALWAYS AS (monto - descuento) STORED,
    fecha_pago DATE DEFAULT CURRENT_DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado VARCHAR(30) DEFAULT 'Pagado' NOT NULL CHECK (estado IN ('Pagado', 'Pendiente', 'Cancelado')),
    metodo_pago VARCHAR(50) DEFAULT 'Efectivo' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS) para proteger los datos
ALTER TABLE public.gym_planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_miembros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_pagos ENABLE ROW LEVEL SECURITY;

-- Crear políticas de acceso para usuarios autenticados
-- Acceso de lectura para todo usuario autenticado
CREATE POLICY "Permitir lectura completa a usuarios autenticados" 
ON public.gym_planes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir lectura completa a usuarios autenticados" 
ON public.gym_miembros FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir lectura completa a usuarios autenticados" 
ON public.gym_pagos FOR SELECT TO authenticated USING (true);

-- Acceso de escritura/modificación para todo usuario autenticado
CREATE POLICY "Permitir control total a usuarios autenticados" 
ON public.gym_planes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir control total a usuarios autenticados" 
ON public.gym_miembros FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir control total a usuarios autenticados" 
ON public.gym_pagos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insertar algunos planes por defecto iniciales
INSERT INTO public.gym_planes (nombre, precio, descripcion, duracion_meses)
VALUES 
('Mensual Estándar', 40.00, 'Acceso completo a sala de pesas y cardio de lunes a sábado.', 1),
('Pase Trimestral', 100.00, 'Acceso por 3 meses a todas las instalaciones.', 3),
('Pase VIP Anual', 360.00, 'Acceso completo por 12 meses + 1 evaluación corporal gratis al mes.', 12),
('Pase Diario', 5.00, 'Acceso único de un día.', 1)
ON CONFLICT DO NOTHING;
