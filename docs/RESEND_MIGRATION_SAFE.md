# Resend Email System - Implementación Sin Fallos

> **📌 Plan de Implementación Seguro**  
> Este documento describe la arquitectura y pasos para migrar el sistema de emails de Supabase Auth a Resend **sin causar errores de dependencias circulares** que rompan la aplicación.

---

## 🚨 Lecciones Aprendidas del Intento Anterior

### ❌ QUÉ ROMPIÓ LA APLICACIÓN:

1. **Error Principal:** Dependencias circulares
   ```
   AuthContext.tsx 
     → import emailService
       → import supabaseClient
         → (circular back to AuthContext)
   ```

2. **Violación de Reglas de React:**
   - Dynamic imports dentro de hooks (`useCallback`)
   - Hooks llamados después de un return condicional

3. **Gestión de Archivos:**
   - Eliminamos archivos pero no removimos las rutas en `App.tsx`
   - Lazy imports intentando cargar componentes inexistentes

### ✅ SOLUCIÓN: Arquitectura Sin Dependencias Circulares

En lugar de importar servicios directamente en AuthContext, usamos **API Endpoint** como intermediario:

```
┌─────────────┐         HTTP POST         ┌──────────────┐
│ AuthContext │ ────────────────────────> │ API Endpoint │
│  (Client)   │                           │  (Isolated)  │
└─────────────┘                           └──────┬───────┘
                                                 │
                                          import │
                                                 ▼
                                        ┌─────────────────┐
                                        │  emailService   │
                                        │  tokenService   │
                                        │  supabaseClient │
                                        └─────────────────┘
```

**Por qué funciona:**
- ✅ AuthContext NO importa servicios de email
- ✅ API endpoint es un boundary aislado
- ✅ No hay ciclos de dependencia

---

## 📋 PLAN DE IMPLEMENTACIÓN SEGURO

### FASE 0: Preparación (5 minutos)

#### Verificar que Resend esté configurado

```bash
# .env.local debe tener:
VITE_RESEND_API_KEY=re_xxxxxxxxxxxxx
```

Si no existe, crear cuenta en https://resend.com y obtener API key.

---

### FASE 1: Crear Servicios Aislados (2 horas)

Estos archivos se crean pero **NO se importan** en ningún archivo existente todavía.

#### 1.1 Token Service

```typescript
// src/emails/services/tokenService.ts
import { supabase } from '../../supabaseClient';

export class TokenService {
  /**
   * Generate secure random token using Web Crypto API
   */
  private generateSecureToken(): string {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Create magic link token and store in DB
   */
  async createToken(params: {
    email: string;
    eventId?: string;
    expiresInHours?: number;
  }): Promise<{ token: string; magicLink: string }> {
    const token = this.generateSecureToken();
    const expiresInHours = params.expiresInHours || 24;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const { error } = await supabase
      .from('magic_link_tokens')
      .insert({
        email: params.email,
        token,
        event_id: params.eventId || null,
        expires_at: expiresAt.toISOString(),
      });

    if (error) {
      throw new Error('Failed to create magic link token');
    }

    const baseUrl = window.location.origin;
    const magicLink = `${baseUrl}/auth/verify?token=${token}`;

    return { token, magicLink };
  }

  /**
   * Validate and consume token
   */
  async validateToken(token: string): Promise<{
    valid: boolean;
    email?: string;
    eventId?: string;
    error?: string;
  }> {
    const { data, error } = await supabase
      .from('magic_link_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !data) {
      return { valid: false, error: 'Token not found' };
    }

    if (data.used_at) {
      return { valid: false, error: 'Token already used' };
    }

    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      return { valid: false, error: 'Token expired' };
    }

    // Mark as used
    await supabase
      .from('magic_link_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    return {
      valid: true,
      email: data.email,
      eventId: data.event_id || undefined,
    };
  }
}

export const tokenService = new TokenService();
```

#### 1.2 Email Service

```typescript
// src/emails/services/emailService.ts
import { Resend } from 'resend';
import { supabase } from '../../supabaseClient';
import { render } from '@react-email/render';
import { MagicLinkEmail } from '../templates/MagicLinkEmail';

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

export class EmailService {
  /**
   * Send magic link email with dynamic logos
   */
  async sendMagicLink(params: {
    recipientEmail: string;
    recipientName?: string;
    eventId?: string;
    magicLink: string;
  }) {
    const config = params.eventId 
      ? await this.getEmailConfig(params.eventId)
      : await this.getDefaultEmailConfig();
    
    const html = render(
      MagicLinkEmail({
        magicLink: params.magicLink,
        attendeeName: params.recipientName,
        companyLogo: config.companyLogo,
        companyName: config.companyName,
        sponsorLogo: config.sponsorLogo,
        sponsorName: config.sponsorName,
        sponsorWebsite: config.sponsorWebsite,
        showSponsor: config.showSponsor,
      })
    );

    const { data, error } = await resend.emails.send({
      from: config.fromEmail,
      to: params.recipientEmail,
      subject: `Access ${config.companyName} Event`,
      html,
    });

    // Log email send
    if (params.eventId) {
      await this.logEmail({
        eventId: params.eventId,
        templateType: 'magic_link',
        recipientEmail: params.recipientEmail,
        status: error ? 'failed' : 'sent',
        errorMessage: error?.message,
      });
    }

    return { data, error };
  }

  /**
   * Get email configuration for event
   */
  private async getEmailConfig(eventId: string) {
    const { data: event } = await supabase
      .from('events')
      .select('name, event_logo_url')
      .eq('id', eventId)
      .single();

    const { data: prefs } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('event_id', eventId)
      .maybeSingle();

    const { data: sponsor } = await supabase
      .from('booths')
      .select('company_name, sponsor_logo_url, sponsor_website_url')
      .eq('event_id', eventId)
      .eq('is_sponsor', true)
      .eq('sponsorship_tier', 'platinum')
      .maybeSingle();

    return {
      companyName: event?.name || 'Event',
      companyLogo: event?.event_logo_url,
      sponsorLogo: sponsor?.sponsor_logo_url,
      sponsorName: sponsor?.company_name,
      sponsorWebsite: sponsor?.sponsor_website_url,
      showSponsor: prefs?.magic_link_show_sponsor && !!sponsor,
      fromEmail: prefs?.from_email || 'onboarding@resend.dev',
      fromName: prefs?.from_name || 'Event Team',
    };
  }

  /**
   * Get default config when no event specified
   */
  private async getDefaultEmailConfig() {
    return {
      companyName: 'LyVenTum',
      companyLogo: undefined,
      sponsorLogo: undefined,
      sponsorName: undefined,
      sponsorWebsite: undefined,
      showSponsor: false,
      fromEmail: 'onboarding@resend.dev',
      fromName: 'LyVenTum Events',
    };
  }

  /**
   * Log email send to database
   */
  private async logEmail(params: {
    eventId: string;
    templateType: string;
    recipientEmail: string;
    status: string;
    errorMessage?: string;
  }) {
    await supabase.from('email_logs').insert({
      event_id: params.eventId,
      template_type: params.templateType,
      recipient_email: params.recipientEmail,
      subject: `Magic Link for ${params.recipientEmail}`,
      status: params.status,
      error_message: params.errorMessage,
    });
  }
}

export const emailService = new EmailService();
```

#### 1.3 React Email Templates

```tsx
// src/emails/components/EmailHeader.tsx
import { Img, Section, Text } from '@react-email/components';

interface EmailHeaderProps {
  companyLogo?: string;
  companyName: string;
  sponsorLogo?: string;
  sponsorName?: string;
  showSponsor?: boolean;
}

export function EmailHeader({ 
  companyLogo, 
  companyName,
  sponsorLogo, 
  sponsorName,
  showSponsor = false 
}: EmailHeaderProps) {
  return (
    <>
      {/* Company Header */}
      <Section style={headerStyle}>
        {companyLogo ? (
          <Img src={companyLogo} alt={companyName} style={logoStyle} />
        ) : (
          <Text style={companyNameStyle}>{companyName}</Text>
        )}
      </Section>

      {/* Sponsor Section */}
      {showSponsor && sponsorLogo && (
        <Section style={sponsorSectionStyle}>
          <Text style={sponsorLabelStyle}>SPONSORED BY</Text>
          <Img src={sponsorLogo} alt={sponsorName || 'Sponsor'} style={sponsorLogoStyle} />
        </Section>
      )}
    </>
  );
}

const headerStyle = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: '30px 20px',
  textAlign: 'center' as const,
};

const logoStyle = {
  maxHeight: '60px',
  maxWidth: '250px',
  height: 'auto',
  width: 'auto',
};

const companyNameStyle = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#ffffff',
  margin: 0,
};

const sponsorSectionStyle = {
  backgroundColor: '#f8f9fa',
  padding: '15px 20px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #e9ecef',
};

const sponsorLabelStyle = {
  fontSize: '10px',
  fontWeight: '600',
  color: '#6c757d',
  letterSpacing: '1px',
  margin: '0 0 8px 0',
};

const sponsorLogoStyle = {
  maxHeight: '40px',
  maxWidth: '180px',
  height: 'auto',
  width: 'auto',
};
```

```tsx
// src/emails/components/EmailFooter.tsx
import { Section, Text, Link } from '@react-email/components';

interface EmailFooterProps {
  sponsorWebsite?: string;
  sponsorName?: string;
  showSponsor?: boolean;
}

export function EmailFooter({ sponsorWebsite, sponsorName, showSponsor }: EmailFooterProps) {
  return (
    <>
      {showSponsor && sponsorWebsite && (
        <Section style={sponsorFooterStyle}>
          <Text style={thankYouStyle}>Thank you to our sponsors</Text>
          <Link href={sponsorWebsite} style={linkStyle}>
            Visit {sponsorName} →
          </Link>
        </Section>
      )}
      
      <Section style={disclaimerStyle}>
        <Text style={disclaimerTextStyle}>
          © 2025 LyVenTum. All rights reserved.<br/>
          Powered by LyVenTum Event Management
        </Text>
      </Section>
    </>
  );
}

const sponsorFooterStyle = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e9ecef',
};

const thankYouStyle = {
  fontSize: '12px',
  color: '#6c757d',
  margin: '0 0 8px 0',
};

const linkStyle = {
  fontSize: '14px',
  color: '#667eea',
  textDecoration: 'none',
  fontWeight: '600',
};

const disclaimerStyle = {
  backgroundColor: '#212529',
  padding: '20px',
  textAlign: 'center' as const,
};

const disclaimerTextStyle = {
  fontSize: '12px',
  color: '#adb5bd',
  lineHeight: '1.5',
  margin: 0,
};
```

```tsx
// src/emails/templates/MagicLinkEmail.tsx
import { Html, Head, Body, Container, Section, Heading, Text, Button } from '@react-email/components';
import { EmailHeader } from '../components/EmailHeader';
import { EmailFooter } from '../components/EmailFooter';

interface MagicLinkEmailProps {
  magicLink: string;
  attendeeName?: string;
  companyLogo?: string;
  companyName: string;
  sponsorLogo?: string;
  sponsorName?: string;
  sponsorWebsite?: string;
  showSponsor?: boolean;
}

export function MagicLinkEmail({
  magicLink,
  attendeeName,
  companyLogo,
  companyName,
  sponsorLogo,
  sponsorName,
  sponsorWebsite,
  showSponsor = false
}: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          
          <EmailHeader 
            companyLogo={companyLogo}
            companyName={companyName}
            sponsorLogo={sponsorLogo}
            sponsorName={sponsorName}
            showSponsor={showSponsor}
          />

          <Section style={contentStyle}>
            <Heading style={headingStyle}>
              Welcome to Your Event! 🎉
            </Heading>
            
            {attendeeName && (
              <Text style={greetingStyle}>
                Hi {attendeeName},
              </Text>
            )}
            
            <Text style={textStyle}>
              Click the button below to securely access your personalized event portal:
            </Text>

            <Button href={magicLink} style={buttonStyle}>
              Access Event Portal →
            </Button>

            <Text style={disclaimerStyle}>
              This link expires in <strong>24 hours</strong> for your security.<br/>
              If you didn't request this email, you can safely ignore it.
            </Text>
          </Section>

          <EmailFooter 
            sponsorWebsite={sponsorWebsite}
            sponsorName={sponsorName}
            showSponsor={showSponsor}
          />

        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  backgroundColor: '#f5f5f5',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const containerStyle = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
};

const contentStyle = {
  padding: '40px 30px',
};

const headingStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#212529',
  marginBottom: '20px',
  textAlign: 'center' as const,
};

const greetingStyle = {
  fontSize: '16px',
  color: '#495057',
  marginBottom: '15px',
};

const textStyle = {
  fontSize: '16px',
  color: '#495057',
  lineHeight: '1.5',
  marginBottom: '25px',
};

const buttonStyle = {
  backgroundColor: '#667eea',
  color: '#ffffff',
  padding: '14px 28px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '16px',
  display: 'inline-block',
  textAlign: 'center' as const,
};

const disclaimerStyle = {
  fontSize: '13px',
  color: '#6c757d',
  marginTop: '25px',
  lineHeight: '1.5',
  textAlign: 'center' as const,
};
```

---

### FASE 2: Crear API Endpoint (1 hora)

#### 2.1 Crear API Handler

```typescript
// api/send-magic-link.ts
import { emailService } from '../src/emails/services/emailService';
import { tokenService } from '../src/emails/services/tokenService';

export default async function handler(req: Request) {
  // Only allow POST
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { email, eventId, attendeeName } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // 1. Generate token
    const { token, magicLink } = await tokenService.createToken({
      email,
      eventId,
      expiresInHours: 24
    });

    // 2. Send email via Resend
    const { error } = await emailService.sendMagicLink({
      recipientEmail: email,
      recipientName: attendeeName,
      eventId,
      magicLink
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });

  } catch (error: any) {
    console.error('Error sending magic link:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

---

### FASE 3: Actualizar AuthContext (30 minutos)

**IMPORTANTE:** Solo hacer llamada HTTP, NO importar servicios.

```typescript
// src/contexts/AuthContext.tsx
// Modificar solo la función loginWithMagicLink

const loginWithMagicLink = useCallback(async (
  email: string, 
  eventId?: string | null
): Promise<{ success: boolean, message: string }> => {
  setAuthOpError(null);

  // Step 1: Verify user is organizer or attendee
  const { data: isOrganizer } = await supabase
    .rpc('check_organizer_exists', { p_email: email });

  if (isOrganizer) {
    return { 
      success: false, 
      message: "This email belongs to an organizer. Please use the Organizer Portal." 
    };
  }

  const { data: attendeeExists } = await supabase
    .rpc('check_attendee_exists', { p_email: email });
    
  if (!attendeeExists) {
    return { 
      success: false, 
      message: "This email is not registered as an attendee." 
    };
  }

  // Step 2: Get attendee name for personalization
  const { data: attendeeData } = await supabase
    .from('attendees')
    .select('first_name, last_name')
    .eq('email', email)
    .limit(1)
    .maybeSingle();

  const attendeeName = attendeeData 
    ? `${attendeeData.first_name || ''} ${attendeeData.last_name || ''}`.trim()
    : undefined;

  // Step 3: Call API endpoint to send magic link
  try {
    const response = await fetch('/api/send-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        eventId: eventId || undefined,
        attendeeName
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to send magic link');
    }

    return { 
      success: true, 
      message: 'Check your email for the login link!' 
    };

  } catch (error: any) {
    console.error('Error sending magic link:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to send login email' 
    };
  }
}, []);
```

---

### FASE 4: Crear AuthVerifyPage (30 minutos)

```tsx
// src/pages/public/AuthVerifyPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { AppRoute } from '../../types';
import { toast } from 'react-hot-toast';
import { tokenService } from '../../emails/services/tokenService';
import LyVentumLogo from '../../components/Logo';
import BackgroundGradient from '../../components/ui/BackgroundGradient';

export default function AuthVerifyPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'validating' | 'success' | 'error'>('validating');
  const [message, setMessage] = useState('Validating your login link...');
  const navigate = useNavigate();

  useEffect(() => {
    validateToken();
  }, []);

  async function validateToken() {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid login link. Please request a new one.');
      return;
    }

    try {
      // Validate token
      const result = await tokenService.validateToken(token);

      if (!result.valid) {
        setStatus('error');
        setMessage(result.error || 'Invalid or expired login link.');
        toast.error(result.error || 'Invalid login link');
        return;
      }

      // Sign in with Supabase
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: result.email!,
        options: {
          data: { login_type: 'attendee' },
          emailRedirectTo: `${window.location.origin}${AppRoute.AttendeePortalDashboard}`,
          shouldCreateUser: true,
        },
      });

      if (signInError) {
        setStatus('error');
        setMessage('Failed to complete login. Please try again.');
        return;
      }

      setStatus('success');
      setMessage('Login successful! Redirecting...');
      toast.success('Welcome!');

      setTimeout(() => {
        navigate(AppRoute.AttendeePortalDashboard, { replace: true });
      }, 1500);

    } catch (error: any) {
      console.error('Error validating token:', error);
      setStatus('error');
      setMessage('An error occurred. Please try again.');
      toast.error('Login failed');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center mb-10">
          <LyVentumLogo className="h-20 w-auto mx-auto" />
          <p className="mt-2 text-sm font-bold uppercase tracking-widest text-slate-400">
            LyVenTum
          </p>
        </div>
        
        <BackgroundGradient containerClassName="rounded-2xl">
          <div className="bg-slate-900/80 rounded-[22px] p-8 space-y-6">
            <div className="text-center">
              {status === 'validating' && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4">
                    <div className="w-full h-full border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h2 className="text-xl font-bold text-slate-100">Verifying...</h2>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-slate-100">Success!</h2>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-slate-100">Oops!</h2>
                </>
              )}

              <p className="text-slate-400 mt-4">{message}</p>

              {status === 'error' && (
                <button
                  onClick={() => navigate('/attendee/login')}
                  className="mt-6 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Request New Link
                </button>
              )}
            </div>
          </div>
        </BackgroundGradient>
      </div>
    </div>
  );
}
```

#### Agregar ruta en App.tsx

```tsx
// src/App.tsx
// En la sección de imports
const AuthVerifyPage = lazy(() => import('./pages/public/AuthVerifyPage'));

// En las rutas públicas
<Route path="/auth/verify" element={<AuthVerifyPage />} />
```

---

## ⚠️ REGLAS CRÍTICAS - NO VIOLAR

### ❌ NUNCA HACER:

1. **NO importar emailService o tokenService en AuthContext**
   ```typescript
   // ❌ MAL
   import { emailService } from '../emails/services/emailService';
   ```

2. **NO usar dynamic imports dentro de hooks**
   ```typescript
   // ❌ MAL
   useCallback(async () => {
     const { emailService } = await import('../emails/services/emailService');
   }, []);
   ```

3. **NO llamar hooks después de returns condicionales**
   ```typescript
   // ❌ MAL
   if (loading) return <Loading />;
   const data = useTransform(...); // Error!
   ```

4. **NO eliminar archivos sin remover rutas primero**
   ```typescript
   // ❌ MAL - Primero remover del App.tsx
   rm -rf src/emails/
   ```

### ✅ SIEMPRE HACER:

1. **Usar API endpoint para comunicación**
   ```typescript
   // ✅ BIEN
   await fetch('/api/send-magic-link', { ... });
   ```

2. **Hooks siempre antes de conditional returns**
   ```typescript
   // ✅ BIEN
   const data = useTransform(...);
   if (loading) return <Loading />;
   ```

3. **Remover rutas antes de eliminar archivos**
   ```typescript
   // ✅ BIEN
   // 1. Remover de App.tsx
   // 2. Commit
   // 3. rm -rf src/emails/
   ```

---

## 🧪 CHECKLIST DE TESTING

### Antes de mergear a producción:

#### Database
- [ ] Tabla `magic_link_tokens` existe en Supabase
- [ ] Índices creados correctamente
- [ ] Permisos RLS configurados (si aplica)

#### API Endpoint
- [ ] Endpoint `/api/send-magic-link` responde
- [ ] Crea token en DB correctamente
- [ ] Envía email vía Resend
- [ ] Maneja errores apropiadamente

#### Client Integration
- [ ] AuthContext llama API sin errores
- [ ] No hay circular dependencies
- [ ] App compila sin warnings
- [ ] Hot reload funciona

#### End-to-End
- [ ] Attendee solicita magic link
- [ ] Email llega con logos dinámicos
- [ ] Click en link abre `/auth/verify`
- [ ] Token valida correctamente
- [ ] Login completa exitosamente
- [ ] Redirect al portal funciona

#### Edge Cases
- [ ] Token expirado muestra mensaje correcto
- [ ] Token usado muestra mensaje correcto
- [ ] Token inválido muestra mensaje correcto
- [ ] Email sin evento muestra config default

---

## 📊 TIMELINE ESTIMADO

### Implementación Completa:

| Fase | Tiempo | Descripción |
|------|--------|-------------|
| Fase 0 | 5 min | Verificar Resend configurado |
| Fase 1 | 2 horas | Crear servicios y templates |
| Fase 2 | 1 hora | API endpoint |
| Fase 3 | 30 min | Actualizar AuthContext |
| Fase 4 | 30 min | AuthVerifyPage + rutas |
| Testing | 1 hora | Pruebas end-to-end |
| **TOTAL** | **4-5 horas** | Implementación segura completa |

---

## 🚀 DEPLOYMENT

### Vercel (Recomendado)

```bash
# Asegurarse que .env.local tiene VITE_RESEND_API_KEY
vercel env add VITE_RESEND_API_KEY

# Deploy
vercel deploy
```

### Alternativa: Netlify

```bash
# Crear netlify.toml
[build]
  functions = "api"

# Deploy
netlify deploy
```

---

## 📝 NOTAS ADICIONALES

### Por qué este approach es seguro:

1. **Separation of Concerns:** AuthContext solo hace HTTP calls, no maneja lógica de email
2. **No Circular Dependencies:** API endpoint es un boundary aislado
3. **Testeable:** Cada capa se puede testear independientemente
4. **Escalable:** Fácil agregar más tipos de emails después

### Cuando agregar más emails:

Una vez que magic link funcione, agregar:
- Meeting Reminders (mismo pattern)
- Daily Agenda (mismo pattern)

### Migración gradual:

Si quieres, puedes:
1. Implementar solo el API endpoint primero
2. Probar con Postman/curl
3. Luego integrar con AuthContext
4. Luego agregar AuthVerifyPage

Esto permite testear cada pieza independientemente.

---

## ✅ RESUMEN EJECUTIVO

**QUÉ CAMBIÓ:**
- Emails de magic link ahora con logos dinámicos
- Sistema de tokens custom
- No más dependencia de Supabase Auth templates

**QUÉ SE MANTIENE:**
- Login flow similar para el usuario
- Misma UX en attendee side
- Backward compatible

**BENEFICIOS:**
- ✅ Logos de sponsor en emails
- ✅ Templates customizables
- ✅ Control total del sistema
- ✅ Preparado para agregar más tipos de emails

**RIESGOS MITIGADOS:**
- ✅ Sin circular dependencies
- ✅ Sin hooks violations
- ✅ Código testeable y mantenible
