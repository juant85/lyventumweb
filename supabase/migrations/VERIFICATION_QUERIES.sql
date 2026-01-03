-- ============================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ============================================
-- Ejecuta este bloque DESPUÉS de aplicar ambas migraciones

-- 1. Verifica columna config
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sessions' AND column_name = 'config';
-- Esperado: config | jsonb

-- 2. Verifica sessions migradas
SELECT id, name, session_type, config 
FROM sessions 
LIMIT 5;
-- Esperado: Todas las sessions tienen config poblado

-- 3. Verifica tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('feature_packages', 'plan_packages');
-- Esperado: 2 filas

-- 4. Cuenta packages
SELECT COUNT(*) as total_packages FROM feature_packages;
-- Esperado: 9

-- 5. Lista packages
SELECT key, name, array_length(features, 1) as feature_count
FROM feature_packages
ORDER BY name;
-- Esperado: 9 filas con nombres de packages

-- 6. Verifica funciones
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name LIKE '%package%';
-- Esperado: 3 funciones

-- ✅ Si todos los queries devuelven lo esperado, migraciones exitosas
