# Optimización Sistema de Escaneo - Tareas

## Objetivo
Preparar el sistema para manejar 120 asistentes con 20 escaneadores simultáneos.

## Sesiones de Trabajo

### Sesión 1: Índices de Base de Datos
- [/] Listar proyectos Supabase
- [ ] Aplicar migración de índices
- [ ] Verificar índices creados
- [ ] Commit cambios

### Sesión 2: Función RPC Backend
- [ ] Crear función `process_scan_optimized`
- [ ] Aplicar migración
- [ ] Testear manualmente
- [ ] Commit

### Sesión 3: Integración Frontend
- [ ] Agregar feature flag
- [ ] Crear `_performScanUploadViaRPC`
- [ ] Testing con flag activado
- [ ] Commit

### Sesión 4: Logging
- [ ] Crear `performanceLogger.ts`
- [ ] Integrar en ScanContext
- [ ] Commit

### Sesión 5: Testing & Docs
- [ ] Script de load test
- [ ] Documentación pre-evento
- [ ] Commit
