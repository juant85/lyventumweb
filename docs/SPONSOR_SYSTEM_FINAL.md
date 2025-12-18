# Sistema de Sponsors - Documento Definitivo

**Fecha:** Diciembre 2, 2025  
**Estado:** Especificación Final  
**Principio:** Simple, Profesional, 100% Funcional

---

## 📦 LO QUE OFRECEMOS A SPONSORS

### Paquetes de Sponsorship:

| Tier | Precio | Dónde Aparece | Control |
|------|--------|---------------|---------|
| **💎 Platinum** | $5K-$10K | • Portal Header (todas las páginas)<br>• Magic Link Emails | UI Completa |
| **🥇 Gold** | $1.5K-$3K | • Attendee Badge Digital | UI Completa |
| **🥈 Silver** | $500-$1K | • Portal Footer Grid | UI Completa |

**Límites:**
- Platinum: **1 por evento** (validado en sistema)
- Gold: **Ilimitados**
- Silver: **Ilimitados**

---

## 🎯 ESTADO ACTUAL DEL SISTEMA

### ✅ YA FUNCIONA (100%):

**1. Portal Web - Sponsor Display:**
- ✅ Platinum logo en header
- ✅ Gold logo en badges
- ✅ Silver grid en footer
- ✅ Database configurada
- ✅ Storage para logos
- ✅ UI para marcar sponsors

**2. Gestión de Sponsors:**
- ✅ Página: `/admin/booth-setup`
- ✅ Edit booth → Sponsor Settings
- ✅ Upload logo con preview
- ✅ Tier selector
- ✅ Validación Platinum único

### ❌ FALTA (Simple - 1 día):

**1. Magic Link Emails:**
- ❌ Template de Supabase con sponsor
- ❌ UI de preview/control

**Total por implementar:** ~6 horas

---

## 🗺️ MAPA COMPLETO DEL SISTEMA

### Para Organizers (Administradores):

```
┌─────────────────────────────────────────────────┐
│ 1. MARCAR BOOTH COMO SPONSOR                    │
│    Página: /admin/booth-setup                   │
│    Acción: Edit booth → Sponsor Settings        │
│                                                  │
│    ┌──────────────────────────────────────┐     │
│    │ ☑ Mark as Sponsor                    │     │
│    │ Tier: [💎 Platinum ▼]                │     │
│    │ Logo: [📁 Upload] → [Preview]        │     │
│    │ Website: [https://...]               │     │
│    │ [Save]                                │     │
│    └──────────────────────────────────────┘     │
│                                                  │
│    Resultado:                                   │
│    • Logo guardado en database                  │
│    • Aparece AUTOMÁTICAMENTE en portal          │
│    • Aparece en magic links (después de config) │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 2. CONFIGURAR EMAILS (NUEVO)                    │
│    Página: /admin/email-settings                │
│    Acción: Ver preview y gestionar visibility   │
│                                                  │
│    ┌──────────────────────────────────────┐     │
│    │ 📨 Magic Link Email Preview          │     │
│    │ ┌────────────────────────────┐       │     │
│    │ │ SPONSORED BY               │       │     │
│    │ │ [LOGO PREVIEW]             │       │     │
│    │ │─────────────────────────── │       │     │
│    │ │ Welcome! Click to access → │       │     │
│    │ └────────────────────────────┘       │     │
│    │                                       │     │
│    │ Platinum: [Acme Corp ▼]              │     │
│    │ ☑ Show in magic link emails          │     │
│    │                                       │     │
│    │ [Update Template in Supabase]        │     │
│    └──────────────────────────────────────┘     │
│                                                  │
│    Resultado:                                   │
│    • Ves exactamente cómo se ve el email        │
│    • Control de enable/disable                 │
│    • Link directo para actualizar template     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 3. VENDER A SPONSORS                             │
│    Página: /admin/email-settings                │
│    Sección: Revenue Dashboard                   │
│                                                  │
│    ┌──────────────────────────────────────┐     │
│    │ 💰 Your Sponsor Offerings            │     │
│    │                                       │     │
│    │ 💎 Platinum: $8,000                  │     │
│    │    • Portal Header (all pages)       │     │
│    │    • Magic Link Emails              │     │
│    │                                       │     │
│    │ 🥇 Gold (3 active): $6,000          │     │
│    │    • Attendee Digital Badges        │     │
│    │                                       │     │
│    │ 🥈 Silver (10 active): $7,500       │     │
│    │    • Portal Footer Grid             │     │
│    │                                       │     │
│    │ TOTAL REVENUE: $21,500              │     │
│    └──────────────────────────────────────┘     │
│                                                  │
│    Resultado:                                   │
│    • Visión clara para pitch a sponsors         │
│    • Revenue tracking en tiempo real            │
└─────────────────────────────────────────────────┘
```

---

## 🎨 DISEÑO DE INTERFACES (UX 100% Clara)

### Interfaz 1: Booth Setup (YA EXISTE)

**Ubicación:** `/admin/booth-setup`

```
┌────────────────────────────────────────────┐
│ Edit Booth: Acme Corporation               │
├────────────────────────────────────────────┤
│                                             │
│ Company Name: [Acme Corporation_______]    │
│ Physical ID:  [B-101__]                    │
│                                             │
│ ▼ 📢 Sponsor Settings                      │
│ ┌─────────────────────────────────────────┐│
││ ☑ Mark as Sponsor                        ││
││                                           ││
││ Sponsorship Tier:                         ││
││ ○ 💎 Platinum (Main Sponsor) - 1 per event││
││   Benefits: Portal header + Magic links   ││
││ ○ 🥇 Gold - Multiple allowed             ││
││   Benefits: Attendee badges               ││
││ ○ 🥈 Silver - Unlimited                  ││
││   Benefits: Portal footer grid            ││
││                                           ││
││ Sponsor Logo:                             ││
││ [Current: acme-logo.png]                  ││
││ ┌─────────┐                               ││
│││ [PREVIEW]│                               ││
││└─────────┘                                ││
││ [📁 Choose File]                          ││
││                                           ││
││ Website URL: [https://acme.com______]     ││
││                                           ││
││ Description (optional):                   ││
││ [Leading provider of enterprise...]      ││
│└─────────────────────────────────────────┘│
│                                             │
│ [Cancel]                    [Save Changes] │
└────────────────────────────────────────────┘
```

**Flujo:**
1. Admin click "Edit" en un booth
2. Scroll a "Sponsor Settings"
3. Check "Mark as Sponsor"
4. Select tier
5. Upload logo (preview aparece instantly)
6. Add website URL
7. Save
8. **Sistema automáticamente muestra en portal**

**Validaciones:**
- ✅ Solo 1 Platinum por evento (error si intentas 2do)
- ✅ Logo preview antes de guardar
- ✅ URL validation

---

### Interfaz 2: Email Settings (NUEVA - Por Implementar)

**Ubicación:** `/admin/email-settings`

```
┌─────────────────────────────────────────────────────────┐
│ Email & Sponsor Visibility                    [Save ✓] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌──────────────────────────────────────────────────────┐│
││ 📨 Magic Link Emails                                  ││
││ These are sent automatically when attendees log in    ││
││                                                        ││
││ ┌─── Live Preview ───────────────────────────────┐    ││
│││                                                  │    ││
│││  ┌────────────────────────────────────────┐     │    ││
││││  SPONSORED BY                             │     │    ││
││││  ┌──────────┐                             │     │    ││
││││  │ [LOGO]   │  Acme Corporation           │     │    ││
││││  └──────────┘                             │     │    ││
││││──────────────────────────────────────────│     │    ││
││││                                           │     │    ││
││││  ✨ Welcome to TechConf 2025!            │     │    ││
││││                                           │     │    ││
││││  Click the button below to access your   │     │    ││
││││  personalized event portal:              │     │    ││
││││                                           │     │    ││
││││  ┌──────────────────────────┐            │     │    ││
││││  │ ACCESS EVENT PORTAL →    │            │     │    ││
││││  └──────────────────────────┘            │     │    ││
││││                                           │     │    ││
││││  This link expires in 24 hours.          │     │    ││
││││                                           │     │    ││
││││──────────────────────────────────────────│     │    ││
││││  Learn more about Acme Corp →            │     │    ││
│││└────────────────────────────────────────┘     │    ││
││└────────────────────────────────────────────────┘    ││
││                                                        ││
││ Current Platinum Sponsor:                             ││
││ [Acme Corporation                            ▼]       ││
││                                                        ││
││ ☑ Show Platinum sponsor in magic link emails          ││
││                                                        ││
││ [📝 Update Template in Supabase]                      ││
││                                                        ││
││ ⓘ When you change sponsors, click "Update Template"   ││
││   to get the new HTML. Takes 2 minutes.               ││
│└──────────────────────────────────────────────────────┘│
│                                                          │
│ ┌──────────────────────────────────────────────────────┐│
││ 💎 Current Sponsor Setup                              ││
││                                                        ││
││ Platinum (1): ┌──────────┐                            ││
││               │ [LOGO]   │ Acme Corp                  ││
││               └──────────┘                            ││
││               Visibility: ✓ Portal  ✓ Emails         ││
││                                                        ││
││ Gold (3):     [Logo] [Logo] [Logo]                    ││
││               Visibility: ✓ Badges                    ││
││                                                        ││
││ Silver (8):   [Grid of 8 logos...]                    ││
││               Visibility: ✓ Footer                    ││
│└──────────────────────────────────────────────────────┘│
│                                                          │
│ ┌──────────────────────────────────────────────────────┐│
││ 💰 Revenue Summary                                    ││
││                                                        ││
││ Platinum:  1 × $8,000  = $8,000                       ││
││ Gold:      3 × $2,000  = $6,000                       ││
││ Silver:    8 × $750    = $6,000                       ││
││ ─────────────────────────────────                     ││
││ TOTAL:                   $20,000                      ││
│└──────────────────────────────────────────────────────┘│
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Flujo:**
1. Admin navega a `/admin/email-settings`
2. Ve preview exacto del email con logo actual
3. Si necesita cambiar sponsor:
   - Selecciona nuevo sponsor del dropdown
   - Preview se actualiza instantly
   - Click "Update Template in Supabase"
   - Sistema abre Supabase con instrucciones
   - Copy-paste HTML
   - Done (2 min)
4. Toggle para enable/disable sponsor visibility
5. Ve summary de todos los sponsors y revenue

**Features Clave:**
- ✅ Preview en tiempo real
- ✅ Dropdown con sponsors disponibles
- ✅ Link directo a Supabase
- ✅ Revenue calculator automático
- ✅ Grid visual de todos los sponsors

---

## 🔧 EDICIÓN DE CONTENIDO

### Para Platinum/Gold/Silver (Portal):

**Método:** UI en Booth Setup  
**Qué se edita:**
- Logo (upload + preview)
- Website URL
- Description

**Cambios se ven:** Inmediatamente en portal  
**Control:** 100% desde UI

---

### Para Magic Link Emails:

**Método:** Supabase Template + UI de preview

**Paso 1: Configuración Inicial (Una vez)**
```
1. Admin navega a Email Settings
2. Ve preview del email
3. Click "Update Template in Supabase"
4. Sistema muestra:
   ┌──────────────────────────────────────┐
   │ Update Email Template                │
   ├──────────────────────────────────────┤
   │ 1. Open Supabase Dashboard           │
   │    [Open in New Tab →]               │
   │                                       │
   │ 2. Navigate to:                      │
   │    Authentication → Email Templates  │
   │    → Magic Link                      │
   │                                       │
   │ 3. Copy this HTML:                   │
   │    [Copy to Clipboard]               │
   │                                       │
   │ 4. Paste in Supabase                 │
   │                                       │
   │ 5. Click Save                        │
   │                                       │
   │ ✓ Done! Future emails will show logo│
   └──────────────────────────────────────┘
5. Follow instructions
6. Done
```

**Paso 2: Cambiar Sponsor (Cuando sea necesario)**
```
1. Marcar nuevo booth como Platinum
2. Ir a Email Settings
3. Select nuevo sponsor en dropdown
4. Preview se actualiza
5. Click "Update Template in Supabase"
6. Copy-paste nuevo HTML
7. Done (2 min)
```

**Frecuencia de updates:** 1-2 veces por evento  
**Tiempo por update:** 2 minutos  
**Control:** 100% visual con preview

---

## 📊 FLUJO COMPLETO: Setup de un Evento con Sponsors

### Timeline Típico:

```
DÍA 1: Setup Inicial
├─ 9:00 AM: Crear evento en sistema
├─ 9:30 AM: Import booths/attendees
├─ 10:00 AM: Contactar potenciales sponsors
└─ [Esperar confirmación de sponsors...]

DÍA 7: Sponsor Confirmado
├─ 2:00 PM: Recibir logo del sponsor
├─ 2:05 PM: Marcar booth como Platinum sponsor
│           • Booth Setup → Edit → Mark as Sponsor
│           • Upload logo
│           • Add website
│           • Save
├─ 2:06 PM: ✅ Logo aparece en portal (automático)
├─ 2:10 PM: Configurar email
│           • Email Settings → Update Template
│           • Copy HTML → Paste en Supabase
│           • Save
└─ 2:12 PM: ✅ Logo aparece en magic links

DÍA 8: Más Sponsors
├─ Marcar 3 booths como Gold
├─ Marcar 8 booths como Silver
└─ ✅ Todos aparecen automáticamente

DÍA 9: Evento empieza
└─ ✅ Sponsors visibles en todo el sistema
```

**Tiempo total de configuración:** ~20 minutos  
**Mantenimiento:** Casi cero

---

## ✅ GARANTÍAS DE CALIDAD

### Profesionalismo:
- ✅ UI consistente con resto de la app
- ✅ Design system existente
- ✅ Mobile responsive
- ✅ Dark mode support
- ✅ Loading states
- ✅ Error handling

### Funcionalidad:
- ✅ Zero bugs conocidos
- ✅ Validaciones completas
- ✅ Preview antes de publicar
- ✅ Rollback fácil
- ✅ Logs de cambios

### Simplicidad:
- ✅ 2 páginas principales
- ✅ Flujos claros
- ✅ Feedback visual
- ✅ Help text contextual
- ✅ Errores claros

### Control:
- ✅ Enable/disable cualquier feature
- ✅ Preview antes de cambios
- ✅ Confirmaciones para cambios importantes
- ✅ Revenue tracking en tiempo real
- ✅ Audit log (quien cambió qué)

---

## 🚀 IMPLEMENTACIÓN (Lo que Falta)

### Tarea 1: Email Settings Page (4 horas)

**Archivo:** `src/pages/admin/EmailSettingsPage.tsx`

**Componentes:**
```typescript
<EmailSettingsPage>
  ├─ <MagicLinkPreview />        // Preview del email
  ├─ <SponsorSelector />         // Dropdown de sponsors
  ├─ <VisibilityToggles />       // Checkboxes
  ├─ <TemplateUpdateGuide />     // Instrucciones Supabase
  ├─ <SponsorGrid />             // Visual de todos sponsors
  └─ <RevenueSummary />          // Calculator
</EmailSettingsPage>
```

**Features:**
- Preview en tiempo real
- Sponsor dropdown con autocomplete
- Copy-to-clipboard HTML
- Link directo a Supabase
- Revenue calculator automático

---

### Tarea 2: Supabase Template HTML (30 min)

**Template con placeholder:**
```html
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <!-- Sponsor Header -->
  <div style="text-align: center; padding: 20px; background: #f5f5f5;">
    <p style="font-size: 11px; color: #666; text-transform: uppercase;">
      Sponsored by
    </p>
    <img src="{{PLATINUM_LOGO_URL}}" 
         alt="{{PLATINUM_NAME}}"
         style="max-width: 200px; height: auto;" />
  </div>

  <!-- Main Content -->
  <div style="padding: 40px; text-align: center;">
    <h2 style="margin: 0 0 20px;">Welcome to Your Event! 🎉</h2>
    <p style="color: #666; margin: 0 0 30px;">
      Click the button below to access your personalized portal:
    </p>
    
    <a href="{{ .ConfirmationURL }}" 
       style="display: inline-block; padding: 14px 32px; 
              background: #4f46e5; color: white; 
              text-decoration: none; border-radius: 6px;
              font-weight: 600;">
      Access Event Portal →
    </a>
    
    <p style="color: #999; font-size: 14px; margin: 30px 0 0;">
      This link expires in 24 hours for security.
    </p>
  </div>

  <!-- Sponsor Footer -->
  <div style="text-align: center; padding: 20px; background: #f5f5f5;">
    <p style="margin: 0 0 10px; font-size: 13px; color: #666;">
      Thank you to our sponsors
    </p>
    <a href="{{PLATINUM_WEBSITE}}" 
       style="color: #4f46e5; font-size: 14px; font-weight: 500;">
      Visit {{PLATINUM_NAME}} →
    </a>
  </div>
</body>
</html>
```

**Placeholders se reemplazan desde UI:**
- `{{PLATINUM_LOGO_URL}}` → Logo URL actual
- `{{PLATINUM_NAME}}` → Company name
- `{{PLATINUM_WEBSITE}}` → Website URL

---

### Tarea 3: Testing & Polish (2 horas)

**Checklist:**
- [ ] Email Settings page renderiza correctamente
- [ ] Preview se actualiza al cambiar sponsor
- [ ] Copy-to-clipboard funciona
- [ ] Template en Supabase funciona
- [ ] Emails se envían con logo correcto
- [ ] Mobile responsive
- [ ] Dark mode OK
- [ ] Error handling completo

**Total:** 6-7 horas de trabajo

---

## 📋 CHECKLIST DE LANZAMIENTO

### Pre-Requisitos:
- [x] SQL de sponsors ejecutado (YA HECHO)
- [x] Storage bucket creado (YA HECHO)
- [x] Portal display funcionando (YA HECHO)
- [x] Booth Setup UI funcionando (YA HECHO)

### Por Hacer:
- [ ] Crear EmailSettingsPage
- [ ] Implementar preview component
- [ ] Agregar sponsor selector
- [ ] Template HTML con placeholders
- [ ] Copy-to-clipboard helper
- [ ] Revenue calculator
- [ ] Testing end-to-end
- [ ] Documentation para organizers

### Verificación Final:
- [ ] Marcar booth como sponsor → aparece en portal ✓
- [ ] Upload logo → preview funciona ✓
- [ ] Ir a Email Settings → ve preview correcto ✓
- [ ] Update template → copy HTML fácil ✓
- [ ] Enviar magic link → email tiene logo ✓
- [ ] Cambiar sponsor → update en 2 min ✓
- [ ] Mobile responsive ✓
- [ ] Zero bugs ✓

---

## 🎓 TRAINING PARA ORGANIZERS

### Guía Rápida (Para clientes):

**Cómo vender un paquete Platinum:**

1. **Mostrar valor:**
   - "Tu logo en TODAS las páginas del portal"
   - "Tu logo en TODOS los emails de login"
   - "Exposición garantizada a 100% de attendees"

2. **Setup en vivo (impresiona al sponsor):**
   - Login, Booth Setup, Mark as Sponsor
   - Upload logo
   - Save
   - Mostrar portal en vivo con su logo
   - Mostrar preview del email
   - **2 minutos = sponsor feliz**

3. **Analytics (próxima fase):**
   - "Verás impressions exactas"
   - "Clicks a tu website"
   - "ROI medible"

---

## 💰 PITCH INTERNO (Por qué vale la pena)

### Inversión:
- Tiempo desarrollo: 6-7 horas
- Costo (@ $100/hr): $700

### Retorno:
- 1 Platinum por evento: $8,000
- ROI: 1,143%
- Breakeven: Primer sponsor

### Escalabilidad:
- Setup: 20 min por evento
- Mantenimiento: Zero
- Revenue adicional por evento: $15K-$25K
- Margen: 100% (costo = $0)

**Conclusión:** No-brainer. Implementar YA.

---

## 📞 CONTACTO Y SOPORTE

**Para desarrolladores:**
- Código: `src/pages/admin/EmailSettingsPage.tsx`
- Database: README.md líneas 925-1003
- Components: `src/components/sponsors/`

**Para organizers:**
- Setup guide: Este documento sección "FLUJO COMPLETO"
- Video tutorial: [Por crear después de implementar]
- Support: [Tu email de soporte]

**Para sponsors:**
- Ver analytics: EmailSettings page
- Cambiar logo: Contact organizer
- Remove sponsorship: Contact organizer

---

**Documento final aprobado:** [PENDIENTE]  
**Implementación start:** [PENDIENTE]  
**Fecha objetivo launch:** [PENDIENTE]

---

## ✅ CONCLUSIÓN

**Lo que tienes:**
- Sistema completo de sponsors en portal (funciona 100%)
- Plan claro para emails (6 horas de trabajo)
- UX profesional y simple
- Control total del contenido
- Revenue potential de $20K+ por evento

**Próximo paso:**
Implementar EmailSettingsPage (6 horas) y lanzar sistema completo.

**¿Aprobado para implementar?**
