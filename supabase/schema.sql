-- ============================================
-- IGLESIA SAAS - ESQUEMA DE BASE DE DATOS
-- ============================================

-- 1. MIEMBROS DE LA IGLESIA
CREATE TABLE IF NOT EXISTS miembros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  fecha_nacimiento DATE,
  direccion TEXT,
  estado_civil TEXT CHECK (estado_civil IN ('soltero', 'casado', 'viudo', 'divorciado')),
  profesion TEXT,
  fecha_ingreso DATE DEFAULT CURRENT_DATE,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'suspenido')),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USUARIOS DEL SISTEMA (autenticación)
CREATE TABLE IF NOT EXISTS usuarios_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  miembro_id UUID REFERENCES miembros(id) ON DELETE SET NULL,
  nombre_display TEXT,
  rol TEXT DEFAULT 'portero' CHECK (rol IN ('admin', 'pastor', 'secretario', 'tesorero', 'portero', 'miembro')),
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  ultimo_acceso TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SERVICIOS / EVENTOS
CREATE TABLE IF NOT EXISTS servicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('dominical', 'estudio_biblico', 'jovenes', 'ninos', 'oracion', 'musica', 'otro')),
  dia_semana INTEGER, -- 0=Domingo, 1=Lunes, etc.
  fecha_hora TIMESTAMPTZ,
  duracion_minutos INTEGER DEFAULT 90,
  lugar TEXT,
  estado TEXT DEFAULT 'programado' CHECK (estado IN ('programado', 'en_curso', 'finalizado', 'cancelado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. REGISTROS DE ASISTENCIA
CREATE TABLE IF NOT EXISTS registros_asistencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id UUID REFERENCES servicios(id) ON DELETE SET NULL,
  adultos INTEGER DEFAULT 0,
  ninos INTEGER DEFAULT 0,
  amigos INTEGER DEFAULT 0, -- visitantes
  total INTEGER GENERATED ALWAYS AS (adultos + ninos + amigos) STORED,
  ofrenda DECIMAL(12,2) DEFAULT 0,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DIEZMOS Y OFRENDAS
CREATE TABLE IF NOT EXISTS diezmos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  miembro_id UUID REFERENCES miembros(id) ON DELETE SET NULL,
  monto DECIMAL(12,2) NOT NULL,
  tipo TEXT DEFAULT 'diezmo' CHECK (tipo IN ('diezmo', 'ofrenda', 'mision', 'construccion', 'otro')),
  metodo_pago TEXT DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo', 'transferencia', 'cheque', 'otro')),
  referencia TEXT,
  fecha DATE DEFAULT CURRENT_DATE,
  observaciones TEXT,
  registrado_por UUID REFERENCES usuarios_sistema(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. NOTIFICACIONES
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios_sistema(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensaje TEXT,
  tipo TEXT DEFAULT 'info' CHECK (tipo IN ('info', 'warning', 'success', 'error')),
  leida BOOLEAN DEFAULT FALSE,
  enlace TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar updated_at a tablas principales
CREATE TRIGGER tr_miembros_updated_at BEFORE UPDATE ON miembros
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_usuarios_sistema_updated_at BEFORE UPDATE ON usuarios_sistema
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_servicios_updated_at BEFORE UPDATE ON servicios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_registros_asistencia_updated_at BEFORE UPDATE ON registros_asistencia
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_diezmos_updated_at BEFORE UPDATE ON diezmos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE miembros ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_asistencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE diezmos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Política: todos los usuarios autenticados pueden ver miembros
CREATE POLICY "Ver miembros" ON miembros FOR SELECT
  TO authenticated
  USING (true);

-- Política: solo admins pueden modificar miembros
CREATE POLICY "Admin modifica miembros" ON miembros FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios_sistema
      WHERE user_id = auth.uid() AND rol = 'admin'
    )
  );

-- Políticas similares para otras tablas
CREATE POLICY "Ver servicios" ON servicios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin modifica servicios" ON servicios FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM usuarios_sistema WHERE user_id = auth.uid() AND rol IN ('admin', 'pastor', 'secretario')));

CREATE POLICY "Ver registros asistencia" ON registros_asistencia FOR SELECT TO authenticated USING (true);
CREATE POLICY "Registrar asistencia" ON registros_asistencia FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM usuarios_sistema WHERE user_id = auth.uid()));
CREATE POLICY "Admin modifica asistencia" ON registros_asistencia FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM usuarios_sistema WHERE user_id = auth.uid() AND rol IN ('admin', 'secretario')));

CREATE POLICY "Ver diezmos" ON diezmos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin modifica diezmos" ON diezmos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM usuarios_sistema WHERE user_id = auth.uid() AND rol IN ('admin', 'tesorero')));

CREATE POLICY "Ver notificaciones propias" ON notificaciones FOR SELECT TO authenticated
  USING (usuario_id IN (SELECT id FROM usuarios_sistema WHERE user_id = auth.uid()));
CREATE POLICY "Notificaciones" ON notificaciones FOR ALL TO authenticated
  USING (usuario_id IN (SELECT id FROM usuarios_sistema WHERE user_id = auth.uid()));

-- ============================================
-- DATOS DE EJEMPLO
-- ============================================

-- Insertar miembros de ejemplo
INSERT INTO miembros (nombre, apellido, telefono, email, fecha_nacimiento, estado_civil, profesion, fecha_ingreso) VALUES
  ('Carlos', 'Rodriguez', '3001234567', 'carlos.r@email.com', '1985-03-15', 'casado', 'Ingeniero', '2020-01-15'),
  ('Maria', 'Santos', '3002345678', 'maria.s@email.com', '1990-07-22', 'soltero', 'Enfermera', '2021-06-01'),
  ('Juan', 'Torres', '3003456789', 'juan.t@email.com', '1978-11-30', 'casado', 'Abogado', '2019-03-20'),
  ('Ana', 'Gomez', '3004567890', 'ana.g@email.com', '1995-01-10', 'soltero', 'Contadora', '2022-09-15'),
  ('Pedro', 'Martinez', '3005678901', 'pedro.m@email.com', '1982-05-25', 'casado', 'Profesor', '2018-07-08');

-- Insertar servicios de ejemplo
INSERT INTO servicios (nombre, descripcion, tipo, dia_semana, fecha_hora, lugar, estado) VALUES
  ('Servicio Dominical', 'Servicio principal de adoración', 'dominical', 0, '2026-03-29 10:00:00', 'Sanctuario principal', 'programado'),
  ('Estudio Bíblico', 'Estudio profundizado de la palabra', 'estudio_biblico', 2, '2026-03-31 19:00:00', 'Sala 1', 'programado'),
  ('Reunión de Jóvenes', 'Encuentro juvenil', 'jovenes', 4, '2026-04-03 18:30:00', 'Salón juvenil', 'programado'),
  ('Escuela Dominical', 'Clases para niños', 'ninos', 0, '2026-03-29 09:00:00', 'Aulas infantiles', 'programado');

-- Insertar registros de asistencia
INSERT INTO registros_asistencia (servicio_id, adultos, ninos, amigos, ofrenda, created_at)
SELECT
  s.id,
  (random() * 30 + 40)::int,
  (random() * 15 + 5)::int,
  (random() * 10)::int,
  (random() * 500 + 100)::decimal,
  NOW() - (interval '1 day' * (random() * 30)::int)
FROM servicios s
WHERE s.tipo = 'dominical';

-- Insertar algunos diezmos de ejemplo
INSERT INTO diezmos (miembro_id, monto, tipo, metodo_pago, fecha) VALUES
  ((SELECT id FROM miembros LIMIT 1), 100.00, 'diezmo', 'efectivo', '2026-03-01'),
  ((SELECT id FROM miembros LIMIT 2), 150.00, 'diezmo', 'transferencia', '2026-03-01'),
  ((SELECT id FROM miembros LIMIT 1), 50.00, 'ofrenda', 'efectivo', '2026-03-15'),
  ((SELECT id FROM miembros LIMIT 3), 200.00, 'diezmo', 'transferencia', '2026-02-15');

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de asistencia por servicio
CREATE OR REPLACE VIEW vista_asistencia_servicios AS
SELECT
  s.nombre as servicio,
  s.tipo,
  s.fecha_hora,
  r.adultos,
  r.ninos,
  r.amigos,
  r.total,
  r.ofrenda
FROM servicios s
LEFT JOIN registros_asistencia r ON r.servicio_id = s.id
ORDER BY s.fecha_hora DESC;

-- Vista de miembros con sus diezmos
CREATE OR REPLACE VIEW vista_diezmos_miembros AS
SELECT
  m.nombre,
  m.apellido,
  COUNT(d.id) as num_diezmos,
  COALESCE(SUM(d.monto), 0) as total_diezmos
FROM miembros m
LEFT JOIN diezmos d ON d.miembro_id = m.id AND d.tipo = 'diezmo'
GROUP BY m.id, m.nombre, m.apellido
ORDER BY total_diezmos DESC;
