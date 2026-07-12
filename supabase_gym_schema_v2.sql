-- Migración / Actualización del Esquema para GymOS V2.0 (Precios en Bolivianos Bs., Fechas de Inicio, Cupones y Duración por Días)
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

-- Borrar políticas previas para evitar error de duplicados
DROP POLICY IF EXISTS "Permitir lectura completa a usuarios autenticados" ON public.gym_cupones;
DROP POLICY IF EXISTS "Permitir control total a usuarios autenticados" ON public.gym_cupones;

-- Crear políticas para usuarios autenticados
CREATE POLICY "Permitir lectura completa a usuarios autenticados" 
ON public.gym_cupones FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir control total a usuarios autenticados" 
ON public.gym_cupones FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Crear o actualizar Tabla de Planes de Membresía (usando duracion_dias en lugar de meses)
CREATE TABLE IF NOT EXISTS public.gym_planes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    precio NUMERIC(10, 2) NOT NULL,
    descripcion TEXT,
    duracion_dias INT NOT NULL DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Si la columna duracion_meses existe, migramos a duracion_dias o la creamos
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gym_planes' AND column_name='duracion_meses') THEN
        ALTER TABLE public.gym_planes ADD COLUMN IF NOT EXISTS duracion_dias INT DEFAULT 30 NOT NULL;
        UPDATE public.gym_planes SET duracion_dias = duracion_meses * 30;
        ALTER TABLE public.gym_planes DROP COLUMN IF EXISTS duracion_meses;
    END IF;
END $$;

-- 3. Crear o actualizar Tabla de Miembros (Agregar fecha_inicio y cupon_aplicado)
CREATE TABLE IF NOT EXISTS public.gym_miembros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(30),
    email VARCHAR(150),
    plan_id UUID REFERENCES public.gym_planes(id) ON DELETE SET NULL,
    grupo_familiar VARCHAR(100),
    notas_medicas TEXT,
    alertas_medicas BOOLEAN DEFAULT false NOT NULL,
    fecha_inicio DATE DEFAULT CURRENT_DATE NOT NULL,
    cupon_aplicado VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.gym_miembros ADD COLUMN IF NOT EXISTS fecha_inicio DATE DEFAULT CURRENT_DATE NOT NULL;
ALTER TABLE public.gym_miembros ADD COLUMN IF NOT EXISTS cupon_aplicado VARCHAR(50);

-- 4. Crear o actualizar Tabla de Pagos (Agregar fecha_inicio y cupon_id)
CREATE TABLE IF NOT EXISTS public.gym_pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    miembro_id UUID REFERENCES public.gym_miembros(id) ON DELETE CASCADE NOT NULL,
    monto NUMERIC(10, 2) NOT NULL,
    descuento NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    monto_final NUMERIC(10, 2) GENERATED ALWAYS AS (monto - descuento) STORED,
    fecha_pago DATE DEFAULT CURRENT_DATE NOT NULL,
    fecha_inicio DATE DEFAULT CURRENT_DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado VARCHAR(30) DEFAULT 'Pagado' NOT NULL CHECK (estado IN ('Pagado', 'Pendiente', 'Cancelado')),
    metodo_pago VARCHAR(50) DEFAULT 'Efectivo' NOT NULL,
    cupon_id UUID REFERENCES public.gym_cupones(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.gym_pagos ADD COLUMN IF NOT EXISTS fecha_inicio DATE DEFAULT CURRENT_DATE NOT NULL;
ALTER TABLE public.gym_pagos ADD COLUMN IF NOT EXISTS cupon_id UUID REFERENCES public.gym_cupones(id) ON DELETE SET NULL;

-- Habilitar RLS para todas las tablas
ALTER TABLE public.gym_planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_miembros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_pagos ENABLE ROW LEVEL SECURITY;

-- Re-crear políticas si no existen (limpieza previa)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Permitir lectura completa a usuarios autenticados" ON public.gym_planes;
    DROP POLICY IF EXISTS "Permitir control total a usuarios autenticados" ON public.gym_planes;
    DROP POLICY IF EXISTS "Permitir lectura completa a usuarios autenticados" ON public.gym_miembros;
    DROP POLICY IF EXISTS "Permitir control total a usuarios autenticados" ON public.gym_miembros;
    DROP POLICY IF EXISTS "Permitir lectura completa a usuarios autenticados" ON public.gym_pagos;
    DROP POLICY IF EXISTS "Permitir control total a usuarios autenticados" ON public.gym_pagos;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Permitir lectura completa a usuarios autenticados" ON public.gym_planes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir control total a usuarios autenticados" ON public.gym_planes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir lectura completa a usuarios autenticados" ON public.gym_miembros FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir control total a usuarios autenticados" ON public.gym_miembros FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir lectura completa a usuarios autenticados" ON public.gym_pagos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir control total a usuarios autenticados" ON public.gym_pagos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Cargar los Planes y Disciplinas Reales (Precios de Bolivia en Bs.)
-- Limpiar planes previos para evitar duplicidad y actualizar la estructura
TRUNCATE TABLE public.gym_planes CASCADE;

INSERT INTO public.gym_planes (nombre, precio, descripcion, duracion_dias)
VALUES 
-- Planes Generales (Aparatos + 1 Disciplina)
('Diario', 15.00, 'Pase de 1 día para 1 persona (Incluye aparatos y 1 disciplina).', 1),
('Semanal', 60.00, 'Pase de 7 días para 1 persona (Incluye aparatos y 1 disciplina).', 7),
('Quincenal', 90.00, 'Pase de 15 días para 1 persona (Incluye aparatos y 1 disciplina).', 15),
('Mensual', 180.00, 'Pase de 30 días para 1 persona (Incluye aparatos y 1 disciplina).', 30),
('Trimestral', 400.00, 'Pase de 90 días para 1 persona (Incluye aparatos y 1 disciplina).', 90),
('Semestral', 700.00, 'Pase de 180 días para 1 persona (Incluye aparatos y 1 disciplina).', 180),
('Anual', 1200.00, 'Pase de 365 días para 1 persona (Incluye aparatos y 1 disciplina).', 365),
('Plan Duo', 140.00, 'Plan mensual especial dúo para 1 persona (Incluye aparatos y 1 disciplina).', 30),
('Plan Amigos del Gym', 130.00, 'Plan mensual especial amigos para 1 persona (Incluye aparatos y 1 disciplina).', 30),
('Plan Estudiantil', 130.00, 'Plan mensual con descuento de estudiante (Incluye aparatos y 1 disciplina).', 30),

-- Disciplinas Individuales (Acceso a todas las clases del mes)
('Zumba (Disciplina)', 130.00, 'Acceso individual mensual a todas las clases de Zumba.', 30),
('Hit Funcional (Disciplina)', 150.00, 'Acceso individual mensual a todas las clases de Hit Funcional.', 30),
('Boxeo (Disciplina)', 90.00, 'Acceso individual mensual a todas las clases de Boxeo.', 30),
('Aeróbics (Disciplina)', 130.00, 'Acceso individual mensual a todas las clases de Aeróbics.', 30);

-- Insertar cupones por defecto
INSERT INTO public.gym_cupones (codigo, tipo_descuento, valor, activo)
VALUES 
('FAMILIA10', 'Porcentaje', 10.00, true),
('APERTURA20', 'Porcentaje', 20.00, true),
('BIENVENIDA50', 'Monto', 50.00, true)
ON CONFLICT (codigo) DO NOTHING;
