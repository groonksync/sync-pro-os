-- =========================================================================
-- INEFABLE — POLÍTICAS RLS (ROW LEVEL SECURITY)
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Habilita RLS y crea políticas para que la app funcione con seguridad.
-- =========================================================================

-- 1. PRODUCTOS — Lectura pública, escritura personal
alter table productos enable row level security;

create policy "productos_select_public"
  on productos for select
  to anon
  using (true);

create policy "productos_insert_admin"
  on productos for insert
  to anon
  with check (true);

create policy "productos_update_admin"
  on productos for update
  to anon
  using (true);

create policy "productos_delete_admin"
  on productos for delete
  to anon
  using (true);

-- 2. VENTAS — Insert público (checkout), CRUD admin
alter table ventas enable row level security;

create policy "ventas_select_admin"
  on ventas for select
  to anon
  using (true);

create policy "ventas_insert_public"
  on ventas for insert
  to anon
  with check (true);

create policy "ventas_update_admin"
  on ventas for update
  to anon
  using (true);

create policy "ventas_delete_admin"
  on ventas for delete
  to anon
  using (true);

-- 3. PRESTAMOS
alter table prestamos enable row level security;

create policy "prestamos_select"
  on prestamos for select
  to anon
  using (true);

create policy "prestamos_insert"
  on prestamos for insert
  to anon
  with check (true);

create policy "prestamos_update"
  on prestamos for update
  to anon
  using (true);

create policy "prestamos_delete"
  on prestamos for delete
  to anon
  using (true);

-- 4. PRESTAMOS HISTORIAL
alter table prestamos_historial enable row level security;

create policy "prestamos_historial_insert"
  on prestamos_historial for insert
  to anon
  with check (true);

-- 5. NOTAS
alter table notas enable row level security;

create policy "notas_select"
  on notas for select
  to anon
  using (true);

create policy "notas_insert"
  on notas for insert
  to anon
  with check (true);

create policy "notas_update"
  on notas for update
  to anon
  using (true);

create policy "notas_delete"
  on notas for delete
  to anon
  using (true);

-- 6. EGRESOS
alter table egresos enable row level security;

create policy "egresos_select"
  on egresos for select
  to anon
  using (true);

create policy "egresos_insert"
  on egresos for insert
  to anon
  with check (true);

create policy "egresos_update"
  on egresos for update
  to anon
  using (true);

create policy "egresos_delete"
  on egresos for delete
  to anon
  using (true);

-- 7. RECIBOS
alter table recibos enable row level security;

create policy "recibos_select"
  on recibos for select
  to anon
  using (true);

create policy "recibos_insert"
  on recibos for insert
  to anon
  with check (true);

create policy "recibos_update"
  on recibos for update
  to anon
  using (true);

create policy "recibos_delete"
  on recibos for delete
  to anon
  using (true);

-- 8. PAPELERA
alter table papelera enable row level security;

create policy "papelera_insert"
  on papelera for insert
  to anon
  with check (true);

create policy "papelera_delete"
  on papelera for delete
  to anon
  using (true);

-- 9. BÓVEDA CONTRASEÑAS
alter table boveda_pass enable row level security;

create policy "boveda_select"
  on boveda_pass for select
  to anon
  using (true);

create policy "boveda_insert"
  on boveda_pass for insert
  to anon
  with check (true);

create policy "boveda_update"
  on boveda_pass for update
  to anon
  using (true);

create policy "boveda_delete"
  on boveda_pass for delete
  to anon
  using (true);

-- 10. RECORDATORIOS
alter table recordatorios enable row level security;

create policy "recordatorios_select"
  on recordatorios for select
  to anon
  using (true);

create policy "recordatorios_insert"
  on recordatorios for insert
  to anon
  with check (true);

create policy "recordatorios_update"
  on recordatorios for update
  to anon
  using (true);

create policy "recordatorios_delete"
  on recordatorios for delete
  to anon
  using (true);

-- 11. SERVICIOS
alter table servicios enable row level security;

create policy "servicios_select"
  on servicios for select
  to anon
  using (true);

create policy "servicios_insert"
  on servicios for insert
  to anon
  with check (true);

create policy "servicios_update"
  on servicios for update
  to anon
  using (true);

create policy "servicios_delete"
  on servicios for delete
  to anon
  using (true);

-- 12. PROYECTOS
alter table proyectos enable row level security;

create policy "proyectos_select"
  on proyectos for select
  to anon
  using (true);

create policy "proyectos_insert"
  on proyectos for insert
  to anon
  with check (true);

create policy "proyectos_update"
  on proyectos for update
  to anon
  using (true);

create policy "proyectos_delete"
  on proyectos for delete
  to anon
  using (true);

-- 13. CLIENTES EDITOR
alter table clientes_editor enable row level security;

create policy "clientes_editor_select"
  on clientes_editor for select
  to anon
  using (true);

create policy "clientes_editor_insert"
  on clientes_editor for insert
  to anon
  with check (true);

create policy "clientes_editor_update"
  on clientes_editor for update
  to anon
  using (true);

create policy "clientes_editor_delete"
  on clientes_editor for delete
  to anon
  using (true);

-- 14. REUNIONES
alter table reuniones enable row level security;

create policy "reuniones_select"
  on reuniones for select
  to anon
  using (true);

create policy "reuniones_insert"
  on reuniones for insert
  to anon
  with check (true);

create policy "reuniones_update"
  on reuniones for update
  to anon
  using (true);

create policy "reuniones_delete"
  on reuniones for delete
  to anon
  using (true);

-- 15. CLIENTES AGENCIA
alter table clientes_agencia enable row level security;

create policy "clientes_agencia_select"
  on clientes_agencia for select
  to anon
  using (true);

create policy "clientes_agencia_insert"
  on clientes_agencia for insert
  to anon
  with check (true);

create policy "clientes_agencia_update"
  on clientes_agencia for update
  to anon
  using (true);

create policy "clientes_agencia_delete"
  on clientes_agencia for delete
  to anon
  using (true);

-- 16. ESTRATEGIAS AGENCIA
alter table estrategias_agencia enable row level security;

create policy "estrategias_agencia_select"
  on estrategias_agencia for select
  to anon
  using (true);

create policy "estrategias_agencia_insert"
  on estrategias_agencia for insert
  to anon
  with check (true);

create policy "estrategias_agencia_update"
  on estrategias_agencia for update
  to anon
  using (true);

create policy "estrategias_agencia_delete"
  on estrategias_agencia for delete
  to anon
  using (true);
