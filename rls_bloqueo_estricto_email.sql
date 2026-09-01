-- =========================================================================
-- INEFABLE — BLOQUEO ESTRICTO POR EMAIL (SUPABASE RLS)
-- Solo tu correo ('carlosjoelsb@gmail.com') puede leer y modificar tus datos.
-- =========================================================================

-- 1. PRODUCTOS: Catálogo público legible por cualquiera (anon), modificación solo por carlosjoelsb@gmail.com
drop policy if exists "productos_select_public" on productos;
drop policy if exists "productos_all_auth" on productos;
drop policy if exists "productos_strict_owner" on productos;

create policy "productos_select_public" on productos
  for select using (true);

create policy "productos_strict_owner" on productos
  for all to authenticated
  using (lower(auth.jwt() ->> 'email') = 'carlosjoelsb@gmail.com')
  with check (lower(auth.jwt() ->> 'email') = 'carlosjoelsb@gmail.com');

-- 2. TODAS LAS DEMÁS TABLAS PRIVADAS: solo accesibles por tu correo
do $$ declare tbl text; begin
  for tbl in select unnest(array[
    'ventas',
    'prestamos',
    'notas',
    'egresos',
    'recibos',
    'papelera',
    'boveda_pass',
    'recordatorios',
    'servicios',
    'proyectos',
    'clientes_editor',
    'reuniones',
    'clientes_agencia',
    'estrategias_agencia',
    'digicorp_catalogo',
    'digicorp_sync_log'
  ])
  loop
    -- Habilitar RLS por si alguna tabla no lo tiene
    execute format('alter table if exists %I enable row level security;', tbl);
    
    -- Eliminar políticas viejas
    execute format('drop policy if exists todo_anon on %I;', tbl);
    execute format('drop policy if exists %I_all_auth on %I;', tbl, tbl);
    execute format('drop policy if exists %I_strict_owner on %I;', tbl, tbl);
    
    -- Crear política estricta por email
    execute format('create policy %I_strict_owner on %I for all to authenticated using (lower(auth.jwt() ->> ''email'') = ''carlosjoelsb@gmail.com'') with check (lower(auth.jwt() ->> ''email'') = ''carlosjoelsb@gmail.com'');', tbl, tbl);
  end loop;
end $$;
