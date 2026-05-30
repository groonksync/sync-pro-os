-- =========================================================================
-- SOVEREIGN STUDIO - FLUJO DE TRABAJO (FLOWWRITER PRO)
-- Ejecutar en Supabase Dashboard > SQL Editor
-- =========================================================================

-- 1. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS flujo_trabajo_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_hash TEXT UNIQUE NOT NULL,
    email_encrypted TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    rol TEXT DEFAULT 'miembro', -- 'creador_admin', 'miembro'
    estado TEXT DEFAULT 'activo', -- 'activo', 'suspendido'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabla de Carpetas
CREATE TABLE IF NOT EXISTS flujo_trabajo_carpetas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    owner_id UUID REFERENCES flujo_trabajo_usuarios(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES flujo_trabajo_carpetas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabla de Documentos
CREATE TABLE IF NOT EXISTS flujo_trabajo_documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT DEFAULT 'Sin Título',
    contenido TEXT DEFAULT '',
    owner_id UUID REFERENCES flujo_trabajo_usuarios(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES flujo_trabajo_carpetas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Tabla de Accesos Compartidos con Expiración
CREATE TABLE IF NOT EXISTS flujo_trabajo_compartidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    documento_id UUID REFERENCES flujo_trabajo_documentos(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES flujo_trabajo_usuarios(id) ON DELETE CASCADE,
    rol TEXT DEFAULT 'lector', -- 'lector', 'editor'
    expira_el TIMESTAMP WITH TIME ZONE, -- Fecha límite de acceso
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(documento_id, usuario_id)
);

-- 5. Tabla de Comentarios
CREATE TABLE IF NOT EXISTS flujo_trabajo_comentarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    documento_id UUID REFERENCES flujo_trabajo_documentos(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES flujo_trabajo_usuarios(id) ON DELETE CASCADE,
    email_decrypted TEXT NOT NULL, -- Email descifrado para mostrar el autor del comentario
    contenido TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Tabla de Versiones
CREATE TABLE IF NOT EXISTS flujo_trabajo_versiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    documento_id UUID REFERENCES flujo_trabajo_documentos(id) ON DELETE CASCADE,
    contenido TEXT NOT NULL,
    cambio_descripcion TEXT DEFAULT 'Guardado automático',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =========================================================================
-- ÍNDICES PARA OPTIMIZAR BÚSQUEDAS
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_workflow_user_email ON flujo_trabajo_usuarios(email_hash);
CREATE INDEX IF NOT EXISTS idx_workflow_folder_owner ON flujo_trabajo_carpetas(owner_id);
CREATE INDEX IF NOT EXISTS idx_workflow_doc_owner ON flujo_trabajo_documentos(owner_id);
CREATE INDEX IF NOT EXISTS idx_workflow_share_doc ON flujo_trabajo_compartidos(documento_id);
CREATE INDEX IF NOT EXISTS idx_workflow_share_user ON flujo_trabajo_compartidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_workflow_comment_doc ON flujo_trabajo_comentarios(documento_id);
CREATE INDEX IF NOT EXISTS idx_workflow_version_doc ON flujo_trabajo_versiones(documento_id);

-- =========================================================================
-- DESHABILITAR ROW LEVEL SECURITY (RLS)
-- De acuerdo a la política del sistema para un desarrollo local ágil.
-- =========================================================================
ALTER TABLE flujo_trabajo_usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE flujo_trabajo_carpetas DISABLE ROW LEVEL SECURITY;
ALTER TABLE flujo_trabajo_documentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE flujo_trabajo_compartidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE flujo_trabajo_comentarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE flujo_trabajo_versiones DISABLE ROW LEVEL SECURITY;
