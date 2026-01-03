-- ============================================
-- VERIFICACIÓN DE ESTADO ACTUAL
-- ============================================
-- Ejecutar ANTES de cualquier cambio
-- Propósito: Documentar estado actual de la BD

-- 1. Verificar estructura de sessions
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'sessions'
ORDER BY ordinal_position;

-- 2. Contar sessions actuales
SELECT COUNT(*) as total_sessions FROM sessions;

-- 3. Tipos de sessions actuales
SELECT session_type, COUNT(*) as count 
FROM sessions 
GROUP BY session_type;

-- 4. Sample de sessions
SELECT id, name, session_type, start_time, end_time
FROM sessions
ORDER BY start_time
LIMIT 10;

-- 5. Verificar booths
SELECT COUNT(*) as total_booths FROM booths;

-- 6. Verificar scan_records
SELECT COUNT(*) as total_scans FROM scan_records;

-- 7. Verificar planes existentes
SELECT id, name, description FROM plans;

-- 8. Verificar features existentes
SELECT COUNT(*) as total_features FROM features;

-- 9. Verificar plan_features
SELECT COUNT(*) as total_plan_features FROM plan_features;

-- 10. State summary
SELECT 
  (SELECT COUNT(*) FROM sessions) as sessions,
  (SELECT COUNT(*) FROM booths) as booths,
  (SELECT COUNT(*) FROM attendees) as attendees,
  (SELECT COUNT(*) FROM scan_records) as scans,
  (SELECT COUNT(*) FROM plans) as plans,
  (SELECT COUNT(*) FROM features) as features;

-- ============================================
-- GUARDAR RESULTADOS
-- ============================================
-- Copiar output de estos queries a un archivo
-- para tener registro del estado PRE-cambios
