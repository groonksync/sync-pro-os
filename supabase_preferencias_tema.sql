-- ==========================================
-- SCRIPT DE MIGRACIÓN: PREFERENCIAS DE USUARIO (TEMA/APARIENCIA)
-- ==========================================

-- 1. Crear la tabla de preferencias
CREATE TABLE IF NOT EXISTS public.usuario_preferencias (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'dark' NOT NULL,
    display_mode VARCHAR(20) DEFAULT 'auto' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Habilitar la seguridad a nivel de filas (RLS)
ALTER TABLE public.usuario_preferencias ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas de RLS
-- Permitir a los usuarios leer solo sus propias preferencias
CREATE POLICY "Permitir lectura individual"
    ON public.usuario_preferencias
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Permitir a los usuarios insertar sus propias preferencias
CREATE POLICY "Permitir inserción individual"
    ON public.usuario_preferencias
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Permitir a los usuarios actualizar sus propias preferencias
CREATE POLICY "Permitir actualización individual"
    ON public.usuario_preferencias
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Crear función y trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_usuario_preferencias_updated_at
    BEFORE UPDATE ON public.usuario_preferencias
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Opcional: Crear función para que cuando se cree un usuario en auth.users
-- se inserte automáticamente un registro con preferencias por defecto.
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuario_preferencias (user_id, theme, display_mode)
    VALUES (NEW.id, 'dark', 'auto')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_auto_crear_preferencias_nuevo_usuario
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_preferences();
