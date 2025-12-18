# Plan Diciembre 4 - Edge Function Simple para Emails

## 🎯 Objetivo

Implementar UNA sola Edge Function que permita enviar emails desde el frontend de forma segura, simple y portable.

---

## ❌ Por Qué Necesitamos Esto

**Problema actual:** CORS error
- Los browsers NO pueden llamar a Resend API directamente (seguridad)
- Si Resend permitiera CORS, el API key quedaría público
- Esta es una limitación fundamental de seguridad web

**Intentos previos:**
- ✅ Access code system funciona (DB + lógica)
- ❌ Envío de emails falla por CORS
- ❌ Magic Links fueron complejos (autenticación de Supabase)

**Solución:**
- Edge Function SIMPLE que solo envía emails
- NO autenticación compleja (diferente a magic links)
- UN solo archivo, fácil de mantener

---

## ✅ Lo Que YA Funciona (No Tocar)

### Frontend
- ✅ `accessCodeService` - Genera códigos
- ✅ `emailService.buildAccessCodeEmailHTML()` - Template HTML
- ✅ Email Settings Page - UI completa
- ✅ Access Code Section - UI en perfil de attendee
- ✅ Test Email UI
- ✅ Manual Resend UI

### Database
- ✅ `attendee_access_codes` table
- ✅ `email_preferences` table
- ✅ Códigos se generan correctamente

**Solo falta:** El envío real del email (bloqueado por CORS)

---

## 📋 Plan de Implementación

### Duración Estimada: 1 hora

**Pasos:**
1. Crear Edge Function (20 min)
2. Deploy y configurar secrets (10 min)
3. Actualizar frontend para usar Edge Function (20 min)
4. Testing completo (10 min)

---

## 🔧 Paso 1: Crear Edge Function (20 min)

### A. Crear archivo de la función

**Ubicación:** `supabase/functions/send-email/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { type, recipientEmail, code, eventId, html } = await req.json()

    // Validación
    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Enviar email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Event <noreply@tudominio.com>', // Cambiar por tu dominio
        to: [recipientEmail],
        subject: type === 'test' ? 'Test Access Code' : 'Your Access Code',
        html: html, // HTML viene del frontend
      }),
    })

    if (!resendResponse.ok) {
      const error = await resendResponse.text()
      throw new Error(`Resend error: ${error}`)
    }

    const result = await resendResponse.json()

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )

  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
```

### B. ¿Por qué es SIMPLE?

- **60 líneas total** (vs 200+ de magic links)
- **NO autenticación** - solo envía email
- **NO database queries** - frontend prepara todo
- **NO session management** - stateless puro
- **UN solo endpoint** - fácil de debuggear

---

## 🚀 Paso 2: Deploy y Configurar (10 min)

### A. Deploy la función

```bash
# Desde la raíz del proyecto
supabase functions deploy send-email
```

### B. Configurar API key

```bash
supabase secrets set RESEND_API_KEY=re_tu_api_key_aqui
```

### C. Verificar que funciona

```bash
# Test directo con curl
curl -X POST https://tu-proyecto.supabase.co/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test",
    "recipientEmail": "tu@email.com",
    "code": "123456",
    "html": "<h1>Test</h1>"
  }'
```

**Resultado esperado:** Email recibido en tu inbox

---

## 💻 Paso 3: Actualizar Frontend (20 min)

### A. Crear helper function

**Archivo:** `src/services/emailSender.ts` (NUEVO)

```typescript
import { supabase } from '../supabaseClient';

export async function sendEmailViaEdgeFunction(params: {
  type: 'test' | 'access_code' | 'agenda' | 'reminder';
  recipientEmail: string;
  code?: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: params
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

### B. Actualizar emailService.ts

**Cambios en:** `src/emails/services/emailService.ts`

```typescript
// Al inicio del archivo, agregar import
import { sendEmailViaEdgeFunction } from '../../services/emailSender';

// Modificar método sendAccessCode (línea ~26)
async sendAccessCode(params: {
    recipientEmail: string;
    code: string;
    eventId: string;
    attendeeId: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. Get email configuration (MANTENER IGUAL)
        const config = await this.getEmailConfig(params.eventId);

        // 2. Get attendee name (MANTENER IGUAL)
        const { data: attendee } = await supabase
            .from('attendees')
            .select('name')
            .eq('id', params.attendeeId)
            .single();

        // 3. Build HTML (MANTENER IGUAL)
        const html = this.buildAccessCodeEmailHTML({
            code: params.code,
            attendeeName: attendee?.name,
            companyLogo: config.companyLogo,
            companyName: config.companyName,
            sponsorLogo: config.sponsorLogo,
            sponsorName: config.sponsorName,
            sponsorWebsite: config.sponsorWebsite,
            showSponsor: config.showSponsor,
        });

        // 4. CAMBIO: Enviar via Edge Function en lugar de Resend directo
        const result = await sendEmailViaEdgeFunction({
            type: params.attendeeId.startsWith('test') ? 'test' : 'access_code',
            recipientEmail: params.recipientEmail,
            code: params.code,
            html: html,
        });

        // 5. Log email (MANTENER IGUAL)
        await supabase.from('email_logs').insert({
            event_id: params.eventId,
            attendee_id: params.attendeeId,
            template_type: 'access_code',
            recipient_email: params.recipientEmail,
            subject: `Access Code for ${config.companyName}`,
            status: result.success ? 'sent' : 'failed',
            error_message: result.error,
            metadata: { code: params.code },
        });

        return result;

    } catch (error: any) {
        console.error('Exception in sendAccessCode:', error);
        return { success: false, error: error.message };
    }
}
```

### C. ¿Qué NO cambia?

- ✅ `accessCodeService` - IGUAL
- ✅ `buildAccessCodeEmailHTML()` - IGUAL
- ✅ Email Settings Page UI - IGUAL
- ✅ Access Code Section UI - IGUAL
- ✅ Database structure - IGUAL

**Solo cambia:** 4 líneas en `sendAccessCode()` para usar Edge Function

---

## 🧪 Paso 4: Testing (10 min)

### Test 1: Test Email desde Email Settings

```
1. Ir a /email-settings
2. Scroll to "Test Email"
3. Poner tu email
4. Click "Send Test"
5. ✅ Verificar email recibido con código 999999
```

### Test 2: Manual Resend desde Perfil

```
1. Ir a /attendees
2. Click en cualquier attendee
3. En sidebar, sección "Access Code"
4. Click "Generate Code" o "Resend Email"
5. ✅ Verificar email recibido con código
```

### Test 3: Auto-send en Check-in

```
1. Ir a Check-in Desk
2. Hacer check-in de attendee
3. ✅ Verificar email automático enviado
```

---

## 📦 Portabilidad

### Archivos necesarios para replicar:

```
proyecto/
├── supabase/
│   └── functions/
│       └── send-email/
│           └── index.ts          # 60 líneas - copiar a nuevo proyecto
├── src/
│   ├── services/
│   │   └── emailSender.ts        # 20 líneas - helper simple
│   └── emails/services/
│       └── emailService.ts       # Modificar 4 líneas
└── .env
    └── RESEND_API_KEY            # Configurar secret en Supabase
```

**Total cambios:** 
- 1 archivo nuevo (60 líneas)
- 1 helper nuevo (20 líneas)  
- 4 líneas modificadas en archivo existente

**Deploy en nuevo proyecto:**
```bash
# 1. Copiar carpeta supabase/functions/send-email
# 2. Deploy
supabase functions deploy send-email
# 3. Configurar secret
supabase secrets set RESEND_API_KEY=xxx
# 4. Listo
```

---

## ⚠️ Diferencias vs Magic Links (Por Qué Esto Es Más Simple)

| Aspecto | Magic Links (Complicado) | Access Codes (Simple) |
|---------|-------------------------|---------------------|
| Autenticación | ❌ Supabase Auth complejo | ✅ No required |
| Sessions | ❌ Token management | ✅ Stateless |
| Redirects | ❌ Multiple URLs | ✅ Direct links |
| Database queries | ❌ Multiple tables | ✅ Frontend prepara |
| Lines of code | ❌ 200+ | ✅ 60 |
| Debug complexity | ❌ High | ✅ Low |

---

## 🎯 Resultado Final

### Lo que funcionará:

1. **Test Email** ✅
   - EmailSettingsPage → Click "Send Test" → Email llega

2. **Manual Resend** ✅
   - Attendee Profile → Click "Resend" → Email llega

3. **Auto Check-in** ✅
   - Check-in Desk → Check-in → Email automático

4. **Agendas (Futuro)** ✅
   - Misma Edge Function, type: 'agenda'

5. **Reminders (Futuro)** ✅
   - Misma Edge Function, type: 'reminder'

### Beneficios:

- ✅ **Simple:** 60 líneas de código
- ✅ **Portable:** copia 1 carpeta + 1 archivo
- ✅ **Mantenible:** UN solo lugar para emails
- ✅ **Extensible:** agregar tipo nuevo = 5 líneas
- ✅ **Debuggeable:** logs claros, un endpoint

---

## 📝 Checklist para Mañana

- [ ] Crear `supabase/functions/send-email/index.ts`
- [ ] Deploy: `supabase functions deploy send-email`
- [ ] Configurar: `supabase secrets set RESEND_API_KEY=...`
- [ ] Test curl para verificar
- [ ] Crear `src/services/emailSender.ts`
- [ ] Modificar `emailService.ts` (4 líneas)
- [ ] Test: Email Settings → Send Test
- [ ] Test: Attendee Profile → Resend
- [ ] Test: Check-in → Auto-send
- [ ] ✅ Confirmar TODO funciona

**Tiempo estimado total:** 1 hora

---

## 🚨 Si Algo Falla

### Error: "Function not found"
```bash
# Re-deploy
supabase functions deploy send-email
```

### Error: "Resend API error"
```bash
# Verificar secret
supabase secrets list
# Re-configurar
supabase secrets set RESEND_API_KEY=re_xxx
```

### Error: CORS
→ Ya está manejado en el código (líneas 5-12)

### Email no llega
1. Check spam folder
2. Verificar dominio verificado en Resend
3. Check logs: `supabase functions logs send-email`

---

## 💡 Notas Importantes

1. **NO es complicado como Magic Links** - no hay autenticación
2. **Frontend casi NO cambia** - solo 4 líneas
3. **UI ya está lista** - ya la implementamos hoy
4. **Es la ÚNICA solución técnicamente posible** para enviar emails desde browser

**Esta es la solución correcta, simple y portable.** 

Mañana fresh, 1 hora de trabajo, y todo funciona forever.
