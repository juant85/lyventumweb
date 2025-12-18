# 🔧 Super Admin Guide - LyVentum Event Types

**Para**: Administradores de la plataforma  
**Versión**: 1.0  
**Última actualización**: Diciembre 2025

---

## 📋 Tabla de Contenidos

1. [¿Qué son los Event Types?](#event-types)
2. [Configuración Inicial](#setup)
3. [Crear Eventos por Tipo](#crear-eventos)
4. [Administración Avanzada](#admin-avanzado)
5. [Troubleshooting](#troubleshooting)

---

## 🎯 ¿Qué son los Event Types? {#event-types}

LyVentum ahora soporta **4 tipos de eventos** con UI y analytics específicas:

| Tipo | Icono | Uso Principal | Features Clave |
|------|-------|---------------|----------------|
| **Vendor Meetings** | 🤝 | B2B matchmaking | Booth assignments, walk-in tracking |
| **Conference** | 🎤 | Charlas/presentations | Session attendance, no-shows |
| **Trade Show** | 🏢 | Exhibiciones/ferias | Lead capture, export list |
| **Hybrid** | 🔄 | Mix de todos | Todas las features |

---

## ⚙️ Configuración Inicial {#setup}

### 1. Verificar Migration

**En Supabase Dashboard**:
1. Table Editor → `events`
2. Verificar columna `event_type` existe
3. Si no existe, aplicar: `supabase/migrations/20251216_add_event_type_field.sql`

### 2. Defaults por Tipo

El sistema usa estos defaults automáticamente:

**Vendor Meetings**:
- Booth assignments: ✅ Enabled
- Walk-in analytics: ✅ Enabled
- Lead capture metrics: ❌ Disabled

**Conference**:
- Booth assignments: ❌ Disabled
- Session analytics: ✅ Enabled
- No-show tracking: ✅ Enabled

**Trade Show**:
- Booth assignments: ❌ Disabled
- Lead capture: ✅ Enabled
- CSV export: ✅ Enabled

**Hybrid**:
- Todo: ✅ Enabled

---

## 🎨 Crear Eventos por Tipo {#crear-eventos}

### Paso a Paso

1. **Login** como SuperAdmin
2. **Events Page** → "Create New Event"
3. **Completar**:
   - Event Name
   - Start/End Dates
   - Company Name
   - **Event Type** ← Selector nuevo
4. **Seleccionar Tipo**:
   - 🤝 Vendor Meetings
   - 🎤 Conference
   - 🏢 Trade Show
   - 🔄 Hybrid
5. **Save**

### ¿Qué sucede después?

**Dashboard mostrará**:
- Badge visual del tipo (azul/morado/verde/índigo)
- Analytics específicas del tipo
- Opciones de export apropiadas

**Session Settings adaptará**:
- Vendor/Hybrid: Muestra booth assignments
- Conference/Trade Show: Oculta booth assignments

**Scanner mostrará**:
- Hints contextuales según tipo

---

## 🔧 Administración Avanzada {#admin-avanzado}

### Cambiar Tipo de Evento Existente

**⚠️ CUIDADO**: Cambiar el tipo afecta la UI

**Método Manual (Supabase)**:
1. Table Editor → `events`
2. Buscar evento
3. Editar `event_type` column
4. Cambiar a: `vendor_meetings`, `conference`, `trade_show`, `hybrid`
5. Save
6. Refresh app

**Efecto**:
- Dashboard cambia inmediatamente
- Analytics se adaptan
- Export options cambian

### Mixing Session Types (Avanzado)

**Hybrid events** pueden tener sessions variadas:

**Ejemplo**:
```
Event: "Tech Summit 2025" (hybrid)
├─ Session 1: Keynote (presentation) → Sin booths
├─ Session 2: Booth Meetings (meeting) → Con booths
└─ Session 3: Networking (networking) → Open
```

**Cómo**:
1. Crear evento tipo "Hybrid"
2. En Session Settings:
   - Crear session
   - En "Session Type" dropdown:
     - `meeting` = Booth-based
     - `presentation` = Charla
     - `networking` = Open/walk-ins
     - `break` = Pausa

---

## 🐛 Troubleshooting {#troubleshooting}

### Problema: Badge no aparece

**Causa**: Event type NULL o inválido  
**Solución**:
1. Supabase → `events` table
2. Verificar `event_type` = uno de los 4 valores válidos
3. Si NULL, set a `vendor_meetings` (default)

### Problema: Booth assignments no aparecen (Vendor Meetings)

**Causa**: Session type incorrecta  
**Solución**:
1. Session Settings
2. Verificar `sessionType` = `'meeting'`
3. NO usar `presentation` o `networking`

### Problema: Trade Show export no aparece

**Causa**: Event type no es trade_show  
**Solución**:
1. Verificar event_type en database
2. Debe ser exactamente `'trade_show'`
3. Refresh app

### Problema: Analytics incorrectas

**Causa**: Tipo de evento y expectativas no coinciden  
**Checklist**:
- [ ] Tipo correcto en database?
- [ ] Sessions tienen tipo apropiado?
- [ ] Hay datos (scans) para mostrar?
- [ ] Badge visual correcto en dashboard?

---

## 📊 Mejores Prácticas

### Para Vendor Meetings
- ✅ Crear booths ANTES de sessions
- ✅ Asignar attendees a booths
- ✅ Usar sessionType = 'meeting'

### Para Conferences
- ✅ Crear múltiples sessions (charlas)
- ✅ Usar sessionType = 'presentation'
- ✅ Pre-registrar attendees

### Para Trade Shows
- ✅ Crear 1 session "All Day"
- ✅ Usar sessionType = 'networking'
- ✅ Scanear todos como walk-ins
- ✅ Exportar leads al final

### Para Hybrid
- ✅ Planear estructura primero
- ✅ Usar diferentes sessionTypes
- ✅ Explicar a organizador el mix

---

## 🔐 Permisos y Seguridad

**Event Type NO afecta**:
- RLS policies
- User permissions
- Data access

**Solo afecta**:
- UI display
- Analytics shown
- Export options

---

## 📞 Soporte

**Issues comunes**: Ver [Troubleshooting](#troubleshooting)  
**Feature requests**: Documentar y priorizar  
**Bugs**: Reportar con tipo de evento y pasos

---

**Última revisión**: Diciembre 16, 2025
