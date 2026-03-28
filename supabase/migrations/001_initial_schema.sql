-- ============================================================
-- IGLESIA SAAS - Esquema inicial
-- ============================================================

-- Tabla de miembros
create table if not exists miembros (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellido text not null,
  tipo text not null default 'miembro',
  estado text not null default 'activo',
  telefono text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table miembros enable row level security;
create policy "Usuarios autenticados pueden leer miembros" on miembros for select using (auth.role() = 'authenticated');
create policy "Usuarios autenticados pueden insertar miembros" on miembros for insert with check (auth.role() = 'authenticated');
create policy "Usuarios autenticados pueden actualizar miembros" on miembros for update using (auth.role() = 'authenticated');

-- Tabla de usuarios del sistema
create table if not exists usuarios_sistema (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre_display text,
  rol text not null default 'portero',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table usuarios_sistema enable row level security;
create policy "Usuarios pueden leer su propio registro" on usuarios_sistema for select using (auth.uid() = user_id);
create policy "Usuarios pueden insertar su registro" on usuarios_sistema for insert with check (auth.uid() = user_id);
create policy "Usuarios pueden actualizar su registro" on usuarios_sistema for update using (auth.uid() = user_id);

-- Tabla de servicios/eventos
create table if not exists servicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null default 'domingo',
  estado text not null default 'programado',
  fecha_hora timestamptz not null,
  caracter text,
  responsable_id uuid references miembros(id),
  registro_creado_por uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table servicios enable row level security;
create policy "Usuarios autenticados pueden leer servicios" on servicios for select using (auth.role() = 'authenticated');
create policy "Usuarios autenticados pueden crear servicios" on servicios for insert with check (auth.role() = 'authenticated');
create policy "Usuarios autenticados pueden actualizar servicios" on servicios for update using (auth.role() = 'authenticated');
create policy "Usuarios autenticados pueden eliminar servicios" on servicios for delete using (auth.role() = 'authenticated');

-- Tabla de registros de asistencia
create table if not exists registros_asistencia (
  id uuid primary key default gen_random_uuid(),
  servicio_id uuid not null references servicios(id) on delete cascade,
  adultos integer not null default 0,
  ninos integer not null default 0,
  amigos integer not null default 0,
  total integer generated always as (adultos + ninos + amigos) stored,
  notas text,
  registrado_por uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(servicio_id)
);
alter table registros_asistencia enable row level security;
create policy "Usuarios autenticados pueden leer asistencia" on registros_asistencia for select using (auth.role() = 'authenticated');
create policy "Usuarios autenticados pueden insertar asistencia" on registros_asistencia for insert with check (auth.role() = 'authenticated');
create policy "Usuarios autenticados pueden actualizar asistencia" on registros_asistencia for update using (auth.role() = 'authenticated');

-- Tabla de diezmos
create table if not exists diezmos (
  id uuid primary key default gen_random_uuid(),
  miembro_id uuid references miembros(id),
  monto integer not null,
  mes text not null,
  ano integer not null,
  creado_por uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table diezmos enable row level security;
create policy "Usuarios autenticados pueden leer diezmos" on diezmos for select using (auth.role() = 'authenticated');
create policy "Usuarios autenticados pueden insertar diezmos" on diezmos for insert with check (auth.role() = 'authenticated');
create policy "Usuarios autenticados pueden actualizar diezmos" on diezmos for update using (auth.role() = 'authenticated');

-- Tabla de ofrendas
create table if not exists ofrendas (
  id uuid primary key default gen_random_uuid(),
  servicio_id uuid references servicios(id),
  monto integer not null,
  descripcion text,
  creado_por uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table ofrendas enable row level security;
create policy "Usuarios autenticados pueden leer ofrendas" on ofrendas for select using (auth.role() = 'authenticated');
create policy "Usuarios autenticados pueden insertar ofrendas" on ofrendas for insert with check (auth.role() = 'authenticated');
create policy "Usuarios autenticados pueden actualizar ofrendas" on ofrendas for update using (auth.role() = 'authenticated');

-- Tabla de donaciones especiales
create table if not exists donaciones_especiales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null default 'especial',
  monto integer not null,
  metodo text not null default 'efectivo',
  estado text not null default 'completado',
  telefono text,
  email text,
  notas text,
  creado_por uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table donaciones_especiales enable row level security;
create policy "Usuarios autenticados pueden leer donaciones" on donaciones_especiales for select using (auth.role() = 'authenticated');
create policy "Usuarios autenticados pueden insertar donaciones" on donaciones_especiales for insert with check (auth.role() = 'authenticated');
create policy "Usuarios autenticados pueden actualizar donaciones" on donaciones_especiales for update using (auth.role() = 'authenticated');

-- Trigger para updated_at automático
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger miembros_updated_at before update on miembros for each row execute function update_updated_at();
create trigger usuarios_sistema_updated_at before update on usuarios_sistema for each row execute function update_updated_at();
create trigger servicios_updated_at before update on servicios for each row execute function update_updated_at();
create trigger registros_asistencia_updated_at before update on registros_asistencia for each row execute function update_updated_at();
