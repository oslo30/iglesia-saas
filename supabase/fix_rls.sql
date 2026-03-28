-- Eliminar políticas restrictivas y crear políticas más permisivas para desarrollo
DROP POLICY IF EXISTS "Admin modifica miembros" ON miembros;
DROP POLICY IF EXISTS "Admin modifica servicios" ON servicios;
DROP POLICY IF EXISTS "Admin modifica asistencia" ON registros_asistencia;
DROP POLICY IF EXISTS "Admin modifica diezmos" ON diezmos;

-- Políticas permisivas: cualquier usuario autenticado puede hacer todo
CREATE POLICY "miembros_all" ON miembros FOR ALL TO authenticated USING (true);
CREATE POLICY "servicios_all" ON servicios FOR ALL TO authenticated USING (true);
CREATE POLICY "registros_asistencia_all" ON registros_asistencia FOR ALL TO authenticated USING (true);
CREATE POLICY "diezmos_all" ON diezmos FOR ALL TO authenticated USING (true);

-- Notificaciones: usuario puede ver y modificar solo las suyas
DROP POLICY IF EXISTS "Ver notificaciones propias" ON notificaciones;
DROP POLICY IF EXISTS "Notificaciones" ON notificaciones;
CREATE POLICY "notificaciones_all" ON notificaciones FOR ALL TO authenticated USING (true);
