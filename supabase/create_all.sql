-- Crear función update_updated_at si no existe
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear tabla diezmos
CREATE TABLE IF NOT EXISTS diezmos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  miembro_id UUID REFERENCES miembros(id) ON DELETE SET NULL,
  monto DECIMAL(12,2) NOT NULL,
  tipo TEXT DEFAULT 'diezmo' CHECK (tipo IN ('diezmo', 'ofrenda', 'mision', 'construccion', 'otro')),
  metodo_pago TEXT DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo', 'transferencia', 'cheque', 'otro')),
  referencia TEXT,
  fecha DATE DEFAULT CURRENT_DATE,
  observaciones TEXT,
  registrado_por UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear trigger para updated_at
DROP TRIGGER IF EXISTS tr_diezmos_updated_at ON diezmos;
CREATE TRIGGER tr_diezmos_updated_at BEFORE UPDATE ON diezmos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Verificar tablas
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
