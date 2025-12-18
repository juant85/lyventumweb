# Sistema Completo de Emails y Sponsors - Plan Integrado

**Fecha:** Diciembre 2, 2025  
**Versión:** 2.0 - Plan Holístico  
**Estado:** Diseño y Arquitectura

---

## 🎯 Visión General del Sistema

### Necesidades Identificadas:

1. **Magic Link Emails** - Login de attendees con sponsor
2. **Agenda Diaria Emails** - Email automático cada noche con agenda de mañana
3. **Email Templates Editables** - UI para que organizers editen contenido
4. **Sponsor Integration** - Logos en todos los emails
5. **Enable/Disable por Feature** - Control granular de qué emails enviar
6. **Sin Edge Functions** - Todo con Supabase nativo

---

## 📧 Tipos de Emails del Sistema

### 1. Magic Link (Transaccional)
**Trigger:** Usuario hace login  
**Frecuencia:** On-demand  
**Sponsor:** Logo Platinum en header  
**Editable:** ❌ No (por seguridad)  
**Actual:** Ya funciona con Supabase

### 2. Email Diario de Agenda (Automático)
**Trigger:** Cron job diario (8 PM)  
**Frecuencia:** 1 vez por día durante evento  
**Sponsor:** Logo Platinum + Grid Silver en footer  
**Editable:** ✅ Sí (subject, mensaje, hora)  
**Estado:** ⏸️ Por implementar

### 3. Confirmación de Registro (Transaccional)
**Trigger:** Attendee se registra  
**Frecuencia:** On-demand  
**Sponsor:** Logo Platinum  
**Editable:** ✅ Sí (mensaje de bienvenida)  
**Estado:** ⏸️ Por implementar

### 4. Recordatorio Pre-Sesión (Automático)
**Trigger:** 1 hora antes de sesión registrada  
**Frecuencia:** Por sesión  
**Sponsor:** Logo Gold del booth de la sesión  
**Editable:** ✅ Sí (timing, mensaje)  
**Estado:** ⏸️ Futuro (Fase 3)

---

## 🏗️ Arquitectura SIN Edge Functions

### Solución: Supabase + Resend desde el Cliente

**Por qué NO usar Edge Functions:**
- ✅ Más simple de mantener
- ✅ No requiere deploy extra
- ✅ Código vive en tu app
- ✅ Fácil debugging

**Stack Propuesto:**

```
Frontend (React)
    ↓
Email Service Layer (utils/email/)
    ↓
Resend API (directamente desde cliente/servidor)
    ↓
Attendee's Inbox
```

**Para emails automáticos:**
```
Supabase Cron (pg_cron)
    ↓
Webhook a tu API
    ↓
Email Service Layer
    ↓
Resend
```

---

## 💾 Database Schema para Email System

### Nueva Tabla: `email_templates`

```sql
CREATE TABLE email_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  
  -- Template info
  template_type text NOT NULL, -- 'magic_link', 'daily_agenda', 'registration', 'session_reminder'
  subject text NOT NULL,
  body_html text NOT NULL,
  body_text text, -- Fallback plain text
  
  -- Sponsor integration
  include_platinum_header boolean DEFAULT true,
  include_silver_footer boolean DEFAULT false,
  
  -- Scheduling (for automated emails)
  is_enabled boolean DEFAULT false,
  send_time time, -- e.g., '20:00:00' for 8 PM
  send_days_before integer, -- For reminders (e.g., 1 day before)
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Unique constraint: one template per type per event
  UNIQUE(event_id, template_type)
);

-- Index for quick lookups
CREATE INDEX idx_email_templates_event 
ON email_templates(event_id, template_type);
```

### Nueva Tabla: `email_logs`

```sql
CREATE TABLE email_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id uuid REFERENCES events(id),
  attendee_id uuid REFERENCES attendees(id),
  
  -- Email info
  template_type text NOT NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  
  -- Status
  status text NOT NULL, -- 'sent', 'failed', 'bounced', 'opened', 'clicked'
  sent_at timestamptz DEFAULT now(),
  opened_at timestamptz,
  clicked_at timestamptz,
  
  -- Error tracking
  error_message text,
  
  -- Sponsor tracking
  platinum_sponsor_id uuid REFERENCES booths(id),
  
  -- Metadata
  resend_email_id text -- ID from Resend for tracking
);

-- Indexes
CREATE INDEX idx_email_logs_attendee ON email_logs(attendee_id);
CREATE INDEX idx_email_logs_event ON email_logs(event_id);
CREATE INDEX idx_email_logs_sponsor ON email_logs(platinum_sponsor_id);
```

### Nueva Tabla: `email_preferences` (settings por evento)

```sql
CREATE TABLE email_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id uuid UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  
  -- Feature flags
  daily_agenda_enabled boolean DEFAULT false,
  session_reminders_enabled boolean DEFAULT false,
  
  -- Timing
  daily_agenda_time time DEFAULT '20:00:00',
  session_reminder_hours integer DEFAULT 1, -- Hours before session
  
  -- Sponsor settings
  always_include_sponsors boolean DEFAULT true,
  
  -- From address
  from_email text DEFAULT 'events@lyventum.com',
  from_name text DEFAULT 'Event Team',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## 🎨 UI de Administración - Email Settings

### Nueva Página: `/admin/email-settings`

**Secciones:**

#### 1. General Settings
```
┌─────────────────────────────────────┐
│ Email Settings                      │
│                                     │
│ From Address: [events@lyventum.com]│
│ From Name:    [Event Team        ] │
│                                     │
│ ☑ Always include sponsors in emails│
└─────────────────────────────────────┘
```

#### 2. Email Templates (Tabs)
```
┌───────────────────────────────────────────┐
│ ⚡ Magic Link │ 📅 Daily Agenda │ ... │
├───────────────────────────────────────────┤
│                                           │
│ Subject: [Your Daily Event Agenda      ] │
│                                           │
│ Message:                                  │
│ ┌───────────────────────────────────────┐ │
│ │ Good evening! Here's what's          │ │
│ │ happening tomorrow at the event:     │ │
│ │                                       │ │
│ │ {{AGENDA_SESSIONS}}                  │ │
│ │                                       │ │
│ │ See you tomorrow!                    │ │
│ └───────────────────────────────────────┘ │
│                                           │
│ Sponsor Integration:                      │
│ ☑ Include Platinum logo in header        │
│ ☑ Include Silver sponsors in footer      │
│                                           │
│ [Preview Email] [Save Template]          │
└───────────────────────────────────────────┘
```

#### 3. Automation Settings
```
┌─────────────────────────────────────┐
│ Automated Emails                    │
│                                     │
│ Daily Agenda Email:                 │
│ ☑ Enabled                          │
│ Send Time: [20:00] (8:00 PM)      │
│ Send to: ○ All attendees           │
│          ● Only registered attendees│
│                                     │
│ Session Reminders:                  │
│ ☐ Enabled                          │
│ Send: [1] hours before session     │
│                                     │
│ [Save Settings]                     │
└─────────────────────────────────────┘
```

#### 4. Preview & Test
```
┌─────────────────────────────────────┐
│ Email Preview                       │
│                                     │
│ Template: [Daily Agenda       ▼]   │
│                                     │
│ [Email Preview Window]              │
│ ┌─────────────────────────────────┐ │
│ │ SPONSORED BY                    │ │
│ │ [PLATINUM LOGO]                 │ │
│ │─────────────────────────────────│ │
│ │ Good evening! Here's what's     │ │
│ │ happening tomorrow...           │ │
│ │                                 │ │
│ │ • 9:00 AM - Keynote            │ │
│ │ • 10:30 AM - Workshop          │ │
│ │─────────────────────────────────│ │
│ │ [Silver Sponsor Grid]           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Send Test Email:                    │
│ To: [your@email.com            ]   │
│ [Send Test Email]                   │
└─────────────────────────────────────┘
```

---

## 🔧 Implementación Técnica

### Fase 1: Foundation (Esta Semana)

#### 1.1 SQL Migration
```sql
-- Ejecutar en Supabase SQL Editor
-- Crear tablas: email_templates, email_logs, email_preferences
-- (SQL completo incluido arriba)
```

#### 1.2 TypeScript Types
```typescript
// src/types/email.ts

export interface EmailTemplate {
  id: string;
  eventId: string;
  templateType: 'magic_link' | 'daily_agenda' | 'registration' | 'session_reminder';
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  includePlatinumHeader: boolean;
  includeSilverFooter: boolean;
  isEnabled: boolean;
  sendTime?: string; // HH:MM:SS
  sendDaysBefore?: number;
}

export interface EmailPreferences {
  id: string;
  eventId: string;
  dailyAgendaEnabled: boolean;
  sessionRemindersEnabled: boolean;
  dailyAgendaTime: string;
  sessionReminderHours: number;
  alwaysIncludeSponsors: boolean;
  fromEmail: string;
  fromName: string;
}

export interface EmailLog {
  id: string;
  eventId: string;
  attendeeId: string;
  templateType: string;
  recipientEmail: string;
  subject: string;
  status: 'sent' | 'failed' | 'bounced' | 'opened' | 'clicked';
  sentAt: string;
  openedAt?: string;
  clickedAt?: string;
  errorMessage?: string;
  platinumSponsorId?: string;
  resendEmailId?: string;
}
```

#### 1.3 Email Service Layer
```typescript
// src/services/emailService.ts

import { EmailTemplate, EmailPreferences } from '../types/email';
import { Booth } from '../types';

interface SendEmailParams {
  to: string;
  template: EmailTemplate;
  data: Record<string, any>; // Variables del template
  platinumSponsor?: Booth;
  silverSponsors?: Booth[];
}

export class EmailService {
  private resendApiKey: string;

  constructor() {
    this.resendApiKey = import.meta.env.VITE_RESEND_API_KEY || '';
  }

  // Reemplazar variables en template
  private interpolate(template: string, data: Record<string, any>): string {
    return template.replace(/{{(\w+)}}/g, (match, key) => {
      return data[key] || match;
    });
  }

  // Construir HTML con sponsors
  private buildEmailHtml(
    bodyHtml: string,
    includePlatinumHeader: boolean,
    includeSilverFooter: boolean,
    platinumSponsor?: Booth,
    silverSponsors?: Booth[]
  ): string {
    let html = '<html><body style="font-family: sans-serif;">';

    // Platinum Header
    if (includePlatinumHeader && platinumSponsor?.sponsorLogoUrl) {
      html += `
        <div style="text-align: center; padding: 20px; background: #f5f5f5; border-bottom: 1px solid #e5e5e5;">
          <p style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">
            Sponsored by
          </p>
          <img src="${platinumSponsor.sponsorLogoUrl}" 
               alt="${platinumSponsor.companyName}" 
               style="max-width: 180px; height: auto;" />
        </div>
      `;
    }

    // Main Content
    html += `<div style="padding: 40px;">${bodyHtml}</div>`;

    // Silver Footer
    if (includeSilverFooter && silverSponsors && silverSponsors.length > 0) {
      html += `
        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #e5e5e5;">
          <p style="font-size: 13px; color: #666; margin: 0 0 15px 0;">
            Thank you to our sponsors
          </p>
          <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 20px;">
      `;
      
      silverSponsors.forEach(sponsor => {
        if (sponsor.sponsorLogoUrl) {
          html += `
            <a href="${sponsor.sponsorWebsiteUrl || '#'}" 
               style="display: inline-block;">
              <img src="${sponsor.sponsorLogoUrl}" 
                   alt="${sponsor.companyName}" 
                   style="height: 40px; width: auto;" />
            </a>
          `;
        }
      });
      
      html += `</div></div>`;
    }

    html += '</body></html>';
    return html;
  }

  // Enviar email
  async send({
    to,
    template,
    data,
    platinumSponsor,
    silverSponsors
  }: SendEmailParams): Promise<{ success: boolean; emailId?: string; error?: string }> {
    try {
      // Interpolar variables
      const subject = this.interpolate(template.subject, data);
      const bodyHtml = this.interpolate(template.bodyHtml, data);

      // Construir HTML final con sponsors
      const finalHtml = this.buildEmailHtml(
        bodyHtml,
        template.includePlatinumHeader,
        template.includeSilverFooter,
        platinumSponsor,
        silverSponsors
      );

      // Enviar con Resend
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'events@lyventum.com', // TODO: Get from preferences
          to: to,
          subject: subject,
          html: finalHtml
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send email');
      }

      return {
        success: true,
        emailId: result.id
      };

    } catch (error: any) {
      console.error('Email send error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export const emailService = new EmailService();
```

---

### Fase 2: Email Diario de Agenda (Próxima Semana)

#### 2.1 Función para Generar Agenda
```typescript
// src/services/agendaEmailService.ts

import { emailService } from './emailService';
import { supabase } from '../supabaseClient';

export async function sendDailyAgenda(eventId: string) {
  // 1. Get email preferences
  const { data: prefs } = await supabase
    .from('email_preferences')
    .select('*')
    .eq('event_id', eventId)
    .single();

  if (!prefs?.dailyAgendaEnabled) {
    console.log('Daily agenda disabled for event', eventId);
    return;
  }

  // 2. Get template
  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('event_id', eventId)
    .eq('template_type', 'daily_agenda')
    .single();

  if (!template) {
    console.error('No daily agenda template found');
    return;
  }

  // 3. Get tomorrow's sessions
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0));
  const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999));

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*, booths(*)')
    .eq('event_id', eventId)
    .gte('start_time', tomorrowStart.toISOString())
    .lte('start_time', tomorrowEnd.toISOString())
    .order('start_time');

  // 4. Build agenda HTML
  const agendaHtml = sessions?.map(session => `
    <div style="margin: 15px 0; padding: 15px; background: #f9f9f9; border-left: 4px solid #4f46e5;">
      <strong style="color: #4f46e5;">
        ${new Date(session.start_time).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </strong>
      <h3 style="margin: 5px 0;">${session.name}</h3>
      <p style="margin: 5px 0; color: #666;">${session.description || ''}</p>
      ${session.booths ? `<p style="margin: 5px 0; font-size: 14px;">📍 ${session.booths.company_name}</p>` : ''}
    </div>
  `).join('') || '<p>No sessions scheduled for tomorrow</p>';

  // 5. Get sponsors
  const { data: booths } = await supabase
    .from('booths')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_sponsor', true);

  const platinumSponsor = booths?.find(b => b.sponsorship_tier === 'platinum');
  const silverSponsors = booths?.filter(b => b.sponsorship_tier === 'silver');

  // 6. Get all attendees
  const { data: attendees } = await supabase
    .from('attendees')
    .select('email, id')
    .eq('event_id', eventId);

  // 7. Send to each attendee
  for (const attendee of attendees || []) {
    const result = await emailService.send({
      to: attendee.email,
      template: template,
      data: {
        AGENDA_SESSIONS: agendaHtml,
        ATTENDEE_NAME: 'there', // TODO: Get from attendee
        EVENT_DATE: tomorrow.toLocaleDateString()
      },
      platinumSponsor: platinumSponsor,
      silverSponsors: silverSponsors
    });

    // Log result
    await supabase.from('email_logs').insert({
      event_id: eventId,
      attendee_id: attendee.id,
      template_type: 'daily_agenda',
      recipient_email: attendee.email,
      subject: template.subject,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error,
      platinum_sponsor_id: platinumSponsor?.id,
      resend_email_id: result.emailId
    });
  }
}
```

#### 2.2 Cron Job Setup (Supabase)
```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily agenda email for 8 PM every day
SELECT cron.schedule(
  'send-daily-agenda-emails',
  '0 20 * * *', -- 8 PM daily
  $$
  -- Call webhook that triggers sendDailyAgenda
  SELECT
    net.http_post(
      url:='https://your-app.vercel.app/api/cron/daily-agenda',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb
    ) AS request_id;
  $$
);
```

**Alternativa sin pg_cron:**
- Usar Vercel Cron Jobs
- O GitHub Actions con schedule
- O servicio externo como cron-job.org

---

### Fase 3: UI de Administración (2-3 días)

#### 3.1 Página de Email Settings
```typescript
// src/pages/admin/EmailSettingsPage.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { EmailTemplate, EmailPreferences } from '../../types/email';

export default function EmailSettingsPage() {
  const [activeTab, setActiveTab] = useState('daily_agenda');
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [preview, setPreview] = useState<string>('');

  // Load data
  useEffect(() => {
    loadTemplate(activeTab);
    loadPreferences();
  }, [activeTab]);

  async function loadTemplate(type: string) {
    const { data } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_type', type)
      .single();
    
    setTemplate(data);
  }

  async function loadPreferences() {
    const { data } = await supabase
      .from('email_preferences')
      .select('*')
      .single();
    
    setPreferences(data);
  }

  async function saveTemplate() {
    if (!template) return;

    await supabase
      .from('email_templates')
      .upsert(template);

    alert('Template saved!');
  }

  async function savePreferences() {
    if (!preferences) return;

    await supabase
      .from('email_preferences')
      .upsert(preferences);

    alert('Settings saved!');
  }

  function generatePreview() {
    // TODO: Call API to generate preview with real data
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Email Settings</h1>

      {/* Tabs */}
      <div className="border-b mb-6">
        <button
          className={`px-4 py-2 ${activeTab === 'daily_agenda' ? 'border-b-2 border-primary-600' : ''}`}
          onClick={() => setActiveTab('daily_agenda')}
        >
          📅 Daily Agenda
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'magic_link' ? 'border-b-2 border-primary-600' : ''}`}
          onClick={() => setActiveTab('magic_link')}
        >
          ⚡ Magic Link
        </button>
      </div>

      {/* Template Editor */}
      {template && (
        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-2">Subject</label>
            <input
              type="text"
              value={template.subject}
              onChange={e => setTemplate({ ...template, subject: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium mb-2">Message Body</label>
            <textarea
              value={template.bodyHtml}
              onChange={e => setTemplate({ ...template, bodyHtml: e.target.value })}
              rows={10}
              className="w-full border rounded px-3 py-2 font-mono text-sm"
            />
            <p className="text-sm text-gray-600 mt-1">
              Use {{`{ATTENDEE_NAME}`}}, {{`{AGENDA_SESSIONS}`}}, etc. for variables
            </p>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={template.includePlatinumHeader}
                onChange={e => setTemplate({ ...template, includePlatinumHeader: e.target.checked })}
              />
              Include Platinum sponsor in header
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={template.includeSilverFooter}
                onChange={e => setTemplate({ ...template, includeSilverFooter: e.target.checked })}
              />
              Include Silver sponsors in footer
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveTemplate}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              Save Template
            </button>
            <button
              onClick={generatePreview}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Preview Email
            </button>
          </div>
        </div>
      )}

      {/* Automation Settings */}
      {activeTab === 'daily_agenda' && preferences && (
        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Automation Settings</h2>
          
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={preferences.dailyAgendaEnabled}
              onChange={e => setPreferences({ 
                ...preferences, 
                dailyAgendaEnabled: e.target.checked 
              })}
            />
            <span className="font-medium">Enable Daily Agenda Emails</span>
          </label>

          <div>
            <label className="block font-medium mb-2">Send Time (24h format)</label>
            <input
              type="time"
              value={preferences.dailyAgendaTime}
              onChange={e => setPreferences({ 
                ...preferences, 
                dailyAgendaTime: e.target.value 
              })}
              className="border rounded px-3 py-2"
            />
            <p className="text-sm text-gray-600 mt-1">
              Email will be sent every day at this time
            </p>
          </div>

          <button
            onClick={savePreferences}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Save Automation Settings
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## ✅ Checklist de Implementación Completa

### Semana 1: Foundation
- [ ] Crear tablas SQL (email_templates, email_logs, email_preferences)
- [ ] Crear TypeScript types
- [ ] Implementar EmailService class
- [ ] Testing básico de envío de emails

### Semana 2: Daily Agenda
- [ ] Implementar agendaEmailService
- [ ] Setup cron job (Vercel o Supabase)
- [ ] Testing de email diario
- [ ] Crear templates por default

### Semana 3: Admin UI
- [ ] Crear EmailSettingsPage
- [ ] Template editor funcional
- [ ] Preview de emails
- [ ] Enable/disable automation

### Semana 4: Polish & Launch
- [ ] Analytics de emails
- [ ] Error handling robusto
- [ ] Documentación para organizers
- [ ] Training & rollout

---

## 🎯 Decisiones Clave a Tomar

### 1. ¿Cuándo enviar email diario?
**Opciones:**
- 8 PM día anterior (recomendado)
- 6 AM día del evento
- Configurable por evento

**Recomendación:** 8 PM con configuración opcional

### 2. ¿Qué incluir en email diario?
**Must have:**
- Sesiones de mañana con horarios
- Logo de sponsor Platinum
- Link al portal

**Nice to have:**
- Mapa del venue
- Weather forecast
- Sponsor benefits/coupons

### 3. ¿Cómo manejar sponsors para emails automatizados?
**Solución actual:**
- Sponsors a nivel de evento se mantienen
- Email templates tienen flag include_sponsors
- Se resuelven en tiempo de envío

**Esto significa:**
- ✅ Cambias sponsor Platinum → próximo email lo usa
- ✅ Sin necesidad de actualizar templates manualmente
- ✅ Consistencia en todos los emails

---

## 💡 Próximos Pasos Inmediatos

### DECISIÓN AHORA:

1. **¿Implementamos sin Edge Functions?**
   - ✅ Sí, usar EmailService desde cliente
   - ✅ Resend API directamente
   - ✅ Más simple, menos infraestructura

2. **¿Email diario de agenda es prioridad?**
   - Si sí → Empezar con Fase 1 (Foundation)
   - Si no → Solo magic links con sponsors (más simple)

3. **¿UI para editar templates es must-have?**
   - Si sí → Plan completo (3-4 semanas)
   - Si no → Templates hardcoded, más rápido (1 semana)

**Mi recomendación:**

```
OPCIÓN A (MVP Rápido - 1 semana):
- Magic links con sponsors (Supabase templates)
- Email diario hardcoded (sin UI editor)
- Sin analytics por ahora
→ Validar que sponsors valoran presencia en emails

OPCIÓN B (Sistema Completo - 3-4 semanas):
- Todo lo de Opción A +
- UI de administración
- Templates editables
- Analytics de emails
→ Sistema profesional escalable
```

**¿Cuál prefieres?**

---

**Documento creado:** Diciembre 2, 2025  
**Versión:** 2.0 - Plan Integrado  
**Próxima decisión:** Elegir MVP rápido vs sistema completo
