-- Fix: agregar columna ofrenda si no existe
ALTER TABLE registros_asistencia ADD COLUMN IF NOT EXISTS ofrenda DECIMAL(12,2) DEFAULT 0;

-- Verificar estructura
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'registros_asistencia';
