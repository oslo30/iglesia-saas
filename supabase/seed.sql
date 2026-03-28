-- ============================================================
-- SEED - Datos de prueba para iglesia-saas
-- Ejecutar después de 001_initial_schema.sql
-- ============================================================

-- Insertar miembros de prueba
insert into miembros (nombre, apellido, tipo, estado, telefono, email) values
  ('Carlos Alberto', 'García López', 'miembro', 'activo', '3001234567', 'carlos.garcia@email.com'),
  ('María Cristina', 'Hernández Santos', 'miembro', 'activo', '3012345678', 'maria.hernandez@email.com'),
  ('Roberto Carlos', 'Rodríguez Pérez', 'pastor', 'activo', '3023456789', 'pastorrodriguez@email.com'),
  ('Ana Patricia', 'Martínez Torres', 'miembro', 'activo', '3034567890', 'ana.martinez@email.com'),
  ('Juan Manuel', 'López Rivera', 'visitante', 'activo', '3045678901', 'juan.lopez@email.com'),
  ('Sofía Elena', 'González Díaz', 'miembro', 'activo', '3056789012', 'sofia.gonzalez@email.com'),
  ('Pedro Antonio', 'Fernández Cole', 'servidor laico', 'activo', '3067890123', 'pedro.fernandez@email.com'),
  ('Lucía María', 'Ramírez Silva', 'miembro', 'activo', '3078901234', 'lucia.ramirez@email.com'),
  ('Miguel Ángel', 'Torres Ruiz', 'visitante', 'activo', '3089012345', 'miguel.torres@email.com'),
  ('Laura Beatriz', 'Vargas Morales', 'miembro', 'inactivo', '3090123456', 'laura.vargas@email.com');

-- Servicios de prueba (domingos recientes)
insert into servicios (nombre, tipo, estado, fecha_hora, caracter) values
  ('Culto Dominical 8:00 AM', 'domingo', 'finalizado', now() - interval '14 days', 'Evangelístico'),
  ('Culto Dominical 10:30 AM', 'domingo', 'finalizado', now() - interval '14 days', 'Evangelístico'),
  ('Culto Dominical 8:00 AM', 'domingo', 'finalizado', now() - interval '7 days', 'Evangelístico'),
  ('Culto Dominical 10:30 AM', 'domingo', 'finalizado', now() - interval '7 days', 'Evangelístico'),
  ('Culto Dominical 8:00 AM', 'domingo', 'en_curso', now()::date + time '08:00', 'Evangelístico'),
  ('Culto Dominical 10:30 AM', 'domingo', 'programado', now()::date + time '10:30', 'Evangelístico'),
  ('Estudio Bíblico Martes', 'estudio', 'programado', now()::date + interval '1 day' + time '19:00', 'Enseñanza'),
  ('Culto de Oración Jueves', 'comunitario', 'programado', now()::date + interval '3 days' + time '19:00', 'Oración');

-- Asistencia correspondiente
insert into registros_asistencia (servicio_id, adultos, ninos, amigos, notas)
select s.id,
  (random() * 80 + 100)::int as adultos,
  (random() * 30 + 15)::int as ninos,
  (random() * 20 + 5)::int as amigos,
  case when random() > 0.5 then 'Buena asistencia' else null end
from servicios s where s.estado = 'finalizado';

-- Diezmos de prueba
insert into diezmos (miembro_id, monto, mes, ano)
select
  (select id from miembros where tipo = 'miembro' order by random() limit 1),
  (random() * 900000 + 100000)::int,
  to_char(dt, 'FMMonth'),
  extract(year from dt)::int
from generate_series(now() - interval '6 months', now(), interval '1 month') as dt;

-- Ofrendas de prueba
insert into ofrendas (servicio_id, monto, descripcion)
select
  s.id,
  (random() * 500000 + 200000)::int,
  'Ofrenda domingo ' || to_char(s.fecha_hora, 'DD/MM/YYYY')
from servicios s where s.estado = 'finalizado' and s.tipo = 'domingo';

-- Donaciones especiales
insert into donaciones_especiales (nombre, tipo, monto, metodo, estado) values
  ('Fondo de Construcción', 'especial', 5000000, 'transferencia', 'completado'),
  ('Fondo de Adoración', 'especial', 1500000, 'transferencia', 'completado'),
  ('Ayuda Social Marzo', 'especial', 2000000, 'efectivo', 'completado'),
  ('Fondo de Misiones', 'especial', 3000000, 'transferencia', 'pendiente');
