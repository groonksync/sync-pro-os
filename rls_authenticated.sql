-- =========================================================================
-- INEFABLE — POLÍTICAS RLS CON AUTENTICACIÓN
-- Ejecutar DESPUÉS de configurar Google Auth en Supabase
-- =========================================================================

-- 1. PRODUCTOS: SELECT público, TODO lo demás solo autenticado
drop policy if exists todo_anon on productos;
create policy "productos_select_public" on productos for select to anon using (true);
create policy "productos_all_auth" on productos for all to authenticated using (true) with check (true);

-- 2-16. DEMÁS TABLAS: solo usuarios autenticados
do $$ declare tbl text; begin
  for tbl in select unnest(array['ventas','prestamos','notas','egresos','recibos','papelera','boveda_pass','recordatorios','servicios','proyectos','clientes_editor','reuniones','clientes_agencia','estrategias_agencia'])
  loop
    execute format('drop policy if exists todo_anon on %I;', tbl);
    execute format('create policy %I_all_auth on %I for all to authenticated using (true) with check (true);', tbl, tbl);
  end loop;
end $$;
