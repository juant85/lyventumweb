# 🎯 LyVentum Client Tutorials

**Para**: Organizadores de eventos  
**Objetivo**: Guías prácticas por tipo de evento

---

## 📚 Índice de Tutoriales

- [Tutorial 1: Vendor Meetings](#vendor-meetings)
- [Tutorial 2: Conference](#conference)
- [Tutorial 3: Trade Show](#trade-show)
- [FAQ General](#faq)

---

# Tutorial 1: Vendor Meetings (B2B Matchmaking) {#vendor-meetings}

## 🤝 ¿Qué es Vendor Meetings?

**Ideal para**: Eventos de networking B2B, speed dating empresarial, ferias de proveedores

**Características**:
- Pre-asignación de reuniones booth por booth
- Tracking de asistencia
- Detección de walk-ins inesperados
- Analytics de rendimiento por booth

---

## 📋 Setup Paso a Paso

### Paso 1: Crear el Evento
1. Login a LyVentum
2. "Create New Event"
3. Nombre: "Mi Evento B2B 2025"
4. Fechas del evento
5. **Tipo**: Seleccionar "🤝 Vendor Meetings"
6. Guardar

✅ **Resultado**: Badge azul "Vendor Meetings" en dashboard

### Paso 2: Configurar Booths
1. Ir a "Booths" en menú
2. "Add Booth" para cada exhibidor:
   - Company Name
   - Physical ID (ej: "B-01")
   - Contact info
3. Repetir para todos los booths

💡 **Tip**: Crear booths ANTES de sessions

### Paso 3: Crear Attendee List
1. Ir a "Attendees"
2. "Add Attendee" o "Import CSV"
3. Datos necesarios:
   - Name
   - Email
   - Organization

### Paso 4: Crear Session con Asignaciones
1. Ir a "Sessions"
2. "Create New Session"
3. Name: "Morning Meetings"
4. Time slot
5. **Session Type**: "Meeting" ← Importante
6. **Booth Assignments**:
   - Por cada booth, seleccionar attendees asignados
   - Capacity = cuántos por booth
7. Guardar

✅ **Resultado**: Attendees pre-asignados a booths específicos

### Paso 5: Escanear QR Codes
1. Abrir Scanner
2. Ver hint: "💼 Vendor Meetings Mode"
3. Escanear attendees cuando lleguen
4. Sistema detecta:
   - ✅ **EXPECTED**: Attendee en booth correcto
   - ⚠️ **WRONG_BOOTH**: Attendee en booth equivocado
   - 🚶 **WALK_IN**: Attendee no pre-asignado

### Paso 6: Ver Analytics en Vivo
**Dashboard muestra**:
- Walk-in capture stats
- Top performing booths
- Meeting completion rate

### Paso 7: Exportar Resultados
1. Ir a "Reports"
2. Select booth
3. "Export Leads to CSV"
4. Descargar lista con todos los contactos

---

## ✅ Checklist Vendor Meetings

Antes del evento:
- [ ] Booths creados
- [ ] Attendees importados
- [ ] Sessions con booth assignments
- [ ] QR codes impresos

Durante evento:
- [ ] Scanner funcionando
- [ ] Dashboard monitoreando
- [ ] Walk-ins siendo capturados

Después:
- [ ] CSV exportado
- [ ] Follow-up con exhibidores

---

# Tutorial 2: Conference (Charlas y Presentaciones) {#conference}

## 🎤 ¿Qué es Conference?

**Ideal para**: Conferencias, congresos, charlas técnicas, summits

**Características**:
- Sin asignación de booths
- Tracking de asistencia por sesión
- Detección de no-shows
- Walk-ins bienvenidos

---

## 📋 Setup Paso a Paso

### Paso 1: Crear el Evento
1. "Create New Event"
2. Nombre: "Tech Summit 2025"
3. **Tipo**: "🎤 Conference"
4. Guardar

### Paso 2: Crear Attendee List
1. Importar lista de registrados
2. No necesitas asignar a booths
3. Solo nombre + email

### Paso 3: Crear Sessions (Charlas)
1. "Create New Session"
2. Name: "Keynote: Future of AI"
3. Time: 10:00 - 11:00
4. **Session Type**: "Presentation" ← Importante
5. **NO verás booth assignments** ✅ Correcto

💡 Session type "Presentation" oculta booths automáticamente

### Paso 4: Generar Access Codes
1. En session settings
2. "Generate Access Codes"
3. Enviar a registrados

### Paso 5: Escanear Asistencia
1. Al inicio de sesión, abrir Scanner
2. Hint: "🎤 Conference Mode - Track attendance"
3. Escanear attendees que lleguen
4. Sistema registra:
   - ✅ Pre-registrados
   - 🚶 Walk-ins

### Paso 6: Ver Analytics
**Dashboard muestra**:
- Expected vs Attended
- % Attendance rate (progress bar)
- Walk-ins count
- No-show list

### Paso 7: Seguimiento
1. Revisar no-shows
2. Enviar follow-up
3. Preparar para próxima sesión

---

## ✅ Checklist Conference

Antes:
- [ ] Sessions (charlas) creadas
- [ ] Access codes generados
- [ ] Emails enviados

Durante:
- [ ] Attendance tracking activo
- [ ] Walk-ins siendo aceptados

Después:
- [ ] Attendance rate revisado
- [ ] No-shows contactados

---

# Tutorial 3: Trade Show (Captura de Leads) {#trade-show}

## 🏢 ¿Qué es Trade Show?

**Ideal para**: Ferias comerciales, exposiciones, product launches

**Características**:
- Captura masiva de leads
- Sin pre-asignación
- Export de lista completa
- Return visitor tracking

---

## 📋 Setup Paso a Paso

### Paso 1: Crear el Evento
1. "Create New Event"
2. Nombre: "Feria Industrial 2025"
3. **Tipo**: "🏢 Trade Show"
4. Guardar

### Paso 2: Setup Simplificado
1. Crear 1 session: "All Day"
2. Time: Todo el día del evento
3. **Session Type**: "Networking"
4. **NO crear booth assignments** ✅ Correcto

💡 Trade shows NO necesitan planning complejo

### Paso 3: Imprimir QR Code
1. Cada visitante tiene su QR
2. O usar generic QR + captura manual

### Paso 4: Capturar Leads
1. Abrir Scanner
2. Hint: "🏢 Trade Show Mode - Open lead capture"
3. Escanear TODOS los visitantes
4. Sistema captura automáticamente

### Paso 5: Ver Leads en Tiempo Real
**Dashboard muestra**:
- 📊 **Unique leads**: Número grande
- 🕐 **Peak hour**: Cuándo más tráfico
- 💜 **Return rate**: % que volvieron

**Lista de Leads**:
- Todos los contactos capturados
- Badge "X× return" para revisitas

### Paso 6: Exportar Lista
1. Ir a "Reports"
2. Card: "📊 Trade Show Lead Export"
3. "Export Lead List (CSV)"
4. Descargar

**CSV incluye**:
- ID, Name, Email, Organization
- First Contact (timestamp)
- Total Scans
- Return Visitor (Yes/No)

### Paso 7: Follow-Up
1. Abrir CSV
2. Importar a CRM
3. Contactar leads
4. Priorizar "Return Visitors"

---

## ✅ Checklist Trade Show

Antes:
- [ ] Evento creado tipo Trade Show
- [ ] Session "All Day" lista
- [ ] Scanner configurado

Durante:
- [ ] Escaneando todos los visitantes
- [ ] Monitoring peak hours

Después:
- [ ] CSV exportado
- [ ] Leads en CRM
- [ ] Follow-up iniciado

---

# FAQ General {#faq}

## ¿Puedo cambiar el tipo de evento después?

Sí, contacta a soporte. Cambiar el tipo adapta la UI pero no borra datos.

## ¿Qué pasa con eventos viejos?

Funcionan como Vendor Meetings (default). Sin cambios.

## ¿Puedo mezclar tipos en un evento?

Sí, usa tipo "Hybrid" y varía el Session Type:
- Session 1: Presentation (charla)
- Session 2: Meeting (booths)
- Session 3: Networking (open)

## ¿Cómo sé qué scans son walk-ins?

En Reports, columna "ScanStatus":
- WALK_IN = No pre-asignado
- EXPECTED = Pre-asignado correcto

## ¿Puedo exportar datos de cualquier tipo?

- **Vendor Meetings**: Export por booth
- **Conference**: No specific export (usar reports generales)
- **Trade Show**: Export completo de leads único

---

**¿Necesitas ayuda?** Contacta: support@lyventum.com

**Última actualización**: Diciembre 2025
