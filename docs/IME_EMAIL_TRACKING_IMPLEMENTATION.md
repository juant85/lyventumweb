# IME Email Tracking System - Implementation Guide

**Date**: December 8, 2024  
**Project**: LyVentum  
**Feature**: Comprehensive Email Tracking for IME Access Codes

---

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Implementation Steps](#implementation-steps)
4. [Code Examples](#code-examples)
5. [Configuration](#configuration)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This implementation adds comprehensive email tracking for Individual Member Enrollment (IME) access codes, tracking the complete email lifecycle from sending through delivery, opens, clicks, and failures.

### Features Implemented
- ✅ Email status tracking: Sent, Delivered, Opened, Clicked, Failed
- ✅ Bulk email sending with multi-select UI
- ✅ Real-time status updates via webhooks
- ✅ Engagement metrics (open count, click count)
- ✅ Bounce and failure detection
- ✅ Individual and bulk management interfaces

### Tech Stack
- **Database**: PostgreSQL (Supabase)
- **Email Provider**: Resend
- **Backend**: Supabase Edge Functions (Deno)
- **Frontend**: React + TypeScript
- **Tracking Method**: Webhook-based updates

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
├──────────────────────────┬──────────────────────────────────────┤
│  AccessCodesManagementPage │    AttendeeProfileDetailPage       │
│  - Bulk selection         │    - Individual tracking display   │
│  - Filters & search       │    - Send/resend functionality     │
│  - Status visualization   │                                     │
└──────────────┬────────────┴────────────┬────────────────────────┘
               │                         │
               ▼                         ▼
       ┌───────────────────────────────────────┐
       │   emailTrackingService.ts             │
       │   - createTracking()                  │
       │   - getTrackingStatus()               │
       │   - getBulkTrackingStatus()           │
       └───────────────┬───────────────────────┘
                       │
                       ▼
       ┌───────────────────────────────────────┐
       │   emailService.ts                     │
       │   - sendAccessCode()                  │
       │   - Calls Edge Function               │
       └───────────────┬───────────────────────┘
                       │
                       ▼
       ┌───────────────────────────────────────┐
       │   Edge Function: send-email           │
       │   - Sends via Resend API              │
       │   - Returns email ID                  │
       └───────────────┬───────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   Resend API    │
              │   - Sends email │
              └────────┬────────┘
                       │
                       │ (webhooks)
                       ▼
       ┌───────────────────────────────────────┐
       │   Edge Function: handle-email-webhooks│
       │   - Processes events                  │
       │   - Updates tracking table            │
       └───────────────┬───────────────────────┘
                       │
                       ▼
       ┌───────────────────────────────────────┐
       │   Database: ime_email_tracking        │
       │   - Stores all tracking data          │
       └───────────────────────────────────────┘
```

---

## Implementation Steps

### Phase 1: Database Schema

#### 1.1 Create Migration File

**File**: `supabase/migrations/YYYYMMDD_create_ime_email_tracking.sql`

```sql
-- Create tracking table
CREATE TABLE IF NOT EXISTS public.ime_email_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attendee_id UUID NOT NULL REFERENCES public.attendees(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    access_code_id UUID REFERENCES public.attendee_access_codes(id) ON DELETE SET NULL,
    resend_email_id TEXT NOT NULL UNIQUE,
    
    -- Lifecycle timestamps
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    first_click_at TIMESTAMPTZ,
    
    -- Failure tracking
    delivery_failed_at TIMESTAMPTZ,
    delivery_error TEXT,
    
    -- Engagement metrics
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    last_opened_at TIMESTAMPTZ,
    last_clicked_at TIMESTAMPTZ,
    
    -- Additional context
    user_agent TEXT,
    ip_address INET,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_ime_tracking_attendee ON ime_email_tracking(attendee_id);
CREATE INDEX idx_ime_tracking_event ON ime_email_tracking(event_id);
CREATE INDEX idx_ime_tracking_resend_id ON ime_email_tracking(resend_email_id);
CREATE INDEX idx_ime_tracking_sent ON ime_email_tracking(sent_at DESC);
CREATE INDEX idx_ime_tracking_delivered ON ime_email_tracking(delivered_at) 
    WHERE delivered_at IS NOT NULL;
CREATE INDEX idx_ime_tracking_opened ON ime_email_tracking(opened_at) 
    WHERE opened_at IS NOT NULL;
CREATE INDEX idx_ime_tracking_access_code ON ime_email_tracking(access_code_id) 
    WHERE access_code_id IS NOT NULL;
CREATE INDEX idx_ime_tracking_failed ON ime_email_tracking(delivery_failed_at) 
    WHERE delivery_failed_at IS NOT NULL;

-- Enable RLS
ALTER TABLE ime_email_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view tracking for their events" ON ime_email_tracking
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM events WHERE created_by = auth.uid()
            UNION
            SELECT event_id FROM event_organizers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Event creators can insert tracking" ON ime_email_tracking
    FOR INSERT WITH CHECK (
        event_id IN (
            SELECT id FROM events WHERE created_by = auth.uid()
            UNION
            SELECT event_id FROM event_organizers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can update tracking" ON ime_email_tracking
    FOR UPDATE USING (true);

-- Update existing email_logs table
ALTER TABLE email_logs 
ADD COLUMN IF NOT EXISTS resend_email_id TEXT,
ADD COLUMN IF NOT EXISTS tracking_id UUID REFERENCES ime_email_tracking(id);
```

#### 1.2 Apply Migration

```bash
# Using Supabase MCP
mcp_apply_migration(
  project_id: "your-project-id",
  name: "create_ime_email_tracking",
  query: "..." # SQL above
)

# Or via CLI
supabase db push
```

---

### Phase 2: Backend - Edge Functions

#### 2.1 Modify `send-email` Edge Function

**File**: `supabase/functions/send-email/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, recipientEmail, code, eventId, html } = await req.json()

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LyVentum <noreply@lyventum.com>',
        to: [recipientEmail],
        subject: type === 'test' ? 'Test Access Code' : 'Your Access Code',
        html: html,
      }),
    })

    const result = await resendResponse.json()

    if (!resendResponse.ok) {
      throw new Error(result.message || 'Email failed')
    }

    // ✨ KEY CHANGE: Return the Resend email ID
    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: result.id  // 👈 This is crucial for tracking
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

#### 2.2 Create `handle-email-webhooks` Edge Function

**File**: `supabase/functions/handle-email-webhooks/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const event = await req.json()

    console.log('[Webhook] Received:', event.type, event.data?.email_id)

    const emailId = event.data?.email_id
    if (!emailId) {
      return new Response(
        JSON.stringify({ error: 'No email_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find tracking record
    const { data: tracking, error: findError } = await supabase
      .from('ime_email_tracking')
      .select('*')
      .eq('resend_email_id', emailId)
      .single()

    if (findError || !tracking) {
      console.log('[Webhook] Tracking not found for:', emailId)
      return new Response(
        JSON.stringify({ ok: true, message: 'Tracking not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update based on event type
    let updates: any = { updated_at: new Date().toISOString() }

    switch (event.type) {
      case 'email.delivered':
        updates.delivered_at = new Date().toISOString()
        break

      case 'email.bounced':
      case 'email.delivery_delayed':
        updates.delivery_failed_at = new Date().toISOString()
        updates.delivery_error = event.data?.error || 'Email bounced or delivery failed'
        break

      case 'email.opened':
        const isFirstOpen = !tracking.opened_at
        updates.open_count = (tracking.open_count || 0) + 1
        updates.last_opened_at = new Date().toISOString()
        if (isFirstOpen) {
          updates.opened_at = new Date().toISOString()
        }
        break

      case 'email.clicked':
        const isFirstClick = !tracking.first_click_at
        updates.click_count = (tracking.click_count || 0) + 1
        updates.last_clicked_at = new Date().toISOString()
        if (isFirstClick) {
          updates.first_click_at = new Date().toISOString()
        }
        break

      default:
        return new Response(
          JSON.stringify({ ok: true, message: 'Unknown event type' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Save changes
    const { error: updateError } = await supabase
      .from('ime_email_tracking')
      .update(updates)
      .eq('id', tracking.id)

    if (updateError) {
      console.error('[Webhook] Update error:', updateError)
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[Webhook] Successfully updated tracking for:', emailId, event.type)
    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[Webhook] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

#### 2.3 Deploy Edge Functions

```bash
# Deploy send-email
supabase functions deploy send-email

# Deploy webhook handler
supabase functions deploy handle-email-webhooks
```

---

### Phase 3: Frontend Services

#### 3.1 Create Email Tracking Service

**File**: `src/services/emailTrackingService.ts`

```typescript
import { supabase } from '../supabaseClient';

export interface EmailTrackingStatus {
  id: string;
  attendeeId: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  firstClickAt?: string;
  deliveryFailedAt?: string;
  deliveryError?: string;
  openCount: number;
  clickCount: number;
}

export class EmailTrackingService {
  /**
   * Create tracking record when email is sent
   */
  async createTracking(params: {
    attendeeId: string;
    eventId: string;
    accessCodeId: string;
    resendEmailId: string;
  }): Promise<{ success: boolean; trackingId?: string }> {
    try {
      const { data, error } = await supabase
        .from('ime_email_tracking')
        .insert({
          attendee_id: params.attendeeId,
          event_id: params.eventId,
          access_code_id: params.accessCodeId,
          resend_email_id: params.resendEmailId,
          sent_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;

      return { success: true, trackingId: data.id };
    } catch (error: any) {
      console.error('Error creating tracking:', error);
      return { success: false };
    }
  }

  /**
   * Get tracking status for an attendee
   */
  async getTrackingStatus(attendeeId: string, eventId: string): Promise<EmailTrackingStatus | null> {
    const { data, error } = await supabase
      .from('ime_email_tracking')
      .select('*')
      .eq('attendee_id', attendeeId)
      .eq('event_id', eventId)
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    // Determine status based on timestamps
    let status: EmailTrackingStatus['status'] = 'sent';
    if (data.delivery_failed_at) status = 'failed';
    else if (data.first_click_at) status = 'clicked';
    else if (data.opened_at) status = 'opened';
    else if (data.delivered_at) status = 'delivered';

    return {
      id: data.id,
      attendeeId: data.attendee_id,
      status,
      sentAt: data.sent_at,
      deliveredAt: data.delivered_at,
      openedAt: data.opened_at,
      firstClickAt: data.first_click_at,
      deliveryFailedAt: data.delivery_failed_at,
      deliveryError: data.delivery_error,
      openCount: data.open_count || 0,
      clickCount: data.click_count || 0,
    };
  }

  /**
   * Get bulk tracking for multiple attendees
   */
  async getBulkTrackingStatus(eventId: string): Promise<Map<string, EmailTrackingStatus>> {
    const { data, error } = await supabase
      .from('ime_email_tracking')
      .select('*')
      .eq('event_id', eventId)
      .order('sent_at', { ascending: false });

    if (error || !data) return new Map();

    // Group by attendee (latest email for each)
    const map = new Map<string, EmailTrackingStatus>();

    for (const record of data) {
      if (!map.has(record.attendee_id)) {
        let status: EmailTrackingStatus['status'] = 'sent';
        if (record.delivery_failed_at) status = 'failed';
        else if (record.first_click_at) status = 'clicked';
        else if (record.opened_at) status = 'opened';
        else if (record.delivered_at) status = 'delivered';

        map.set(record.attendee_id, {
          id: record.id,
          attendeeId: record.attendee_id,
          status,
          sentAt: record.sent_at,
          deliveredAt: record.delivered_at,
          openedAt: record.opened_at,
          firstClickAt: record.first_click_at,
          deliveryFailedAt: record.delivery_failed_at,
          deliveryError: record.delivery_error,
          openCount: record.open_count || 0,
          clickCount: record.click_count || 0,
        });
      }
    }

    return map;
  }
}

export const emailTrackingService = new EmailTrackingService();
```

#### 3.2 Update Email Service

**File**: `src/emails/services/emailService.ts`

Add tracking integration after successful email send:

```typescript
// Inside sendAccessCode method, after sending email:

const { data: result, error: fnError } = await supabase.functions.invoke('send-email', {
  body: {
    type: params.attendeeId.startsWith('test') ? 'test' : 'access_code',
    recipientEmail: params.recipientEmail,
    code: params.code,
    html,
    eventId: params.eventId
  }
});

if (fnError || !result?.success) {
  throw new Error(result?.error || 'Email send failed');
}

// ✨ Extract email ID and create tracking
const resendEmailId = result.emailId;
if (resendEmailId) {
  const { emailTrackingService } = await import('../../services/emailTrackingService');
  await emailTrackingService.createTracking({
    attendeeId: params.attendeeId,
    eventId: params.eventId,
    accessCodeId: accessCodeId, // From earlier in the function
    resendEmailId: resendEmailId,
  });
}

// Also update email_logs with resend_email_id
await supabase.from('email_logs').insert({
  // ... existing fields
  resend_email_id: resendEmailId,
});
```

---

### Phase 4: UI - Bulk Management Page

**File**: `src/pages/admin/AccessCodesManagementPage.tsx`

Key implementation patterns:

```typescript
// Load tracking data
const [trackingMap, setTrackingMap] = useState<Map<string, EmailTrackingStatus>>(new Map());

useEffect(() => {
  loadTracking();
}, [selectedEventId]);

async function loadTracking() {
  if (!selectedEventId) return;
  const map = await emailTrackingService.getBulkTrackingStatus(selectedEventId);
  setTrackingMap(map);
}

// Filter attendees
const filteredAttendees = nonVendorAttendees.filter(a => {
  const tracking = trackingMap.get(a.id);
  if (filter === 'sent' && !tracking) return false;
  if (filter === 'not_sent' && tracking) return false;
  if (filter === 'opened' && (!tracking || tracking.status !== 'opened')) return false;
  // ... etc
  return true;
});

// Status badge component
function getStatusBadge(attendeeId: string) {
  const tracking = trackingMap.get(attendeeId);
  if (!tracking) {
    return <span className="badge-gray">Not Sent</span>;
  }

  const configs = {
    sent: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '📤', label: 'Sent' },
    delivered: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅', label: 'Delivered' },
    opened: { bg: 'bg-purple-100', text: 'text-purple-800', icon: '👀', label: 'Opened' },
    clicked: { bg: 'bg-pink-100', text: 'text-pink-800', icon: '🔗', label: 'Clicked' },
    failed: { bg: 'bg-red-100', text: 'text-red-800', icon: '❌', label: 'Failed' },
  };

  const config = configs[tracking.status];
  return (
    <span className={`px-2 py-1 text-xs rounded ${config.bg} ${config.text}`}>
      {config.icon} {config.label}
    </span>
  );
}
```

---

### Phase 5: UI - Individual Profile Update

Update `AccessCodeCard` in `AttendeeProfileDetailPage.tsx`:

```typescript
function AccessCodeCard({ attendeeId, attendeeEmail, eventId }) {
  const [tracking, setTracking] = useState<any>(null);
  
  async function fetchCode() {
    const code = await accessCodeService.getCurrentCode(attendeeId, eventId);
    setCurrentCode(code);
    
    // Load tracking
    const { emailTrackingService } = await import('../../services/emailTrackingService');
    const trackingStatus = await emailTrackingService.getTrackingStatus(attendeeId, eventId);
    setTracking(trackingStatus);
  }

  return (
    <Card title="Access Code">
      {/* Code display */}
      
      {/* Tracking status */}
      {tracking && (
        <div className="p-3 bg-slate-50 rounded-lg">
          <p className="text-xs font-semibold mb-2">Email Status</p>
          <StatusBadge status={tracking.status} />
          <div className="text-xs text-slate-500 space-y-1">
            {tracking.sentAt && <p>Sent: {new Date(tracking.sentAt).toLocaleString()}</p>}
            {tracking.openedAt && (
              <p>Opened: {new Date(tracking.openedAt).toLocaleString()}
                {tracking.openCount > 1 && ` (${tracking.openCount} times)`}
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
```

---

## Configuration

### 1. Resend Webhook Setup

**Critical Step**: Configure webhook in Resend dashboard

1. Go to: https://resend.com/webhooks
2. Click "Add Webhook"
3. Configure:
   - **Endpoint URL**: `https://[your-project-ref].supabase.co/functions/v1/handle-email-webhooks`
   - **Events to listen**:
     - ✅ `email.delivered`
     - ✅ `email.opened`
     - ✅ `email.clicked`
     - ✅ `email.bounced`
     - ✅ `email.delivery_delayed`
4. Save

### 2. Environment Variables

Ensure these are set in your Supabase project:

```bash
RESEND_API_KEY=re_xxxxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

### 3. Navigation Setup

Add to `src/constants.ts`:

```typescript
{
  category: localeKeys.navCategoryConfigure,
  links: [
    { 
      path: '/access-codes' as AppRoute, 
      labelKey: 'navLinkAccessCodes' as LocaleKeys, 
      title: "Access Codes Management", 
      icon: 'registration', 
      featureKey: Feature.BOOTH_SETUP 
    },
    // ... other links
  ]
}
```

Add translation in `src/i18n/locales.ts`:

```typescript
// In localeKeys object
navLinkAccessCodes: 'navLinkAccessCodes',

// In en translations
[localeKeys.navLinkAccessCodes]: 'Access Codes',
```

---

## Testing

### 1. Manual Testing Checklist

**Database**:
- [ ] Table `ime_email_tracking` exists
- [ ] Can query tracking records
- [ ] RLS policies work correctly

**Backend**:
- [ ] `send-email` returns email ID
- [ ] Webhook endpoint is accessible
- [ ] Webhook updates tracking table

**Frontend - Bulk Page**:
- [ ] Page loads at `/access-codes`
- [ ] Stats cards show correct counts
- [ ] Table displays attendees
- [ ] Filters work (All/Sent/Not Sent/Opened/Failed)
- [ ] Search filters results
- [ ] Can select attendees
- [ ] Bulk send button works
- [ ] Status badges display correctly

**Frontend - Individual Profile**:
- [ ] AccessCodeCard loads tracking
- [ ] Status badge shows
- [ ] Metrics display (open count, timestamps)
- [ ] Resend creates new tracking record

### 2. Test Email Flow

1. Send test email to your own address
2. Verify tracking record created in DB
3. Open the email
4. Check webhook updates `opened_at`
5. Click IME code link
6. Verify `first_click_at` updated

### 3. Performance Testing

```sql
-- Check query performance
EXPLAIN ANALYZE 
SELECT * FROM ime_email_tracking 
WHERE event_id = 'xxx' 
ORDER BY sent_at DESC;

-- Should use index idx_ime_tracking_event
```

---

## Troubleshooting

### Issue: Webhook not updating tracking

**Symptoms**: Emails sent but status doesn't change from "Sent"

**Solutions**:
1. Verify webhook is configured in Resend
2. Check Edge Function logs:
   ```bash
   supabase functions logs handle-email-webhooks
   ```
3. Verify `resend_email_id` matches in DB and webhook payload
4. Check RLS policy allows service role to UPDATE

### Issue: Email sends but no tracking record

**Symptoms**: Email received but no record in `ime_email_tracking`

**Solutions**:
1. Check `send-email` Edge Function returns `emailId`
2. Verify `emailService.ts` creates tracking after send
3. Check for errors in browser console
4. Verify RLS INSERT policy allows event creator

### Issue: Status badges not showing

**Symptoms**: Table loads but status shows blank

**Solutions**:
1. Verify `emailTrackingService.getBulkTrackingStatus()` returns data
2. Check `trackingMap` state in React DevTools
3. Verify status determination logic in service
4. Check console for errors

### Issue: Opens not tracking

**Symptoms**: Emails opened but `opened_at` stays null

**Causes**:
- Email client blocks tracking pixels (common)
- Recipient has images disabled
- Privacy protection enabled (Apple Mail)

**Expected**: Only ~60-70% of actual opens will be tracked

---

## Production Checklist

Before deploying to production:

- [ ] Database migration applied
- [ ] Edge Functions deployed
- [ ] Webhook configured in Resend
- [ ] Environment variables set
- [ ] RLS policies tested
- [ ] Performance indexes verified
- [ ] Error handling tested
- [ ] UI tested on mobile
- [ ] Documentation updated
- [ ] Team trained on new features

---

## Future Enhancements

### Real-time Updates
Add Supabase Realtime subscription for live status updates:

```typescript
const subscription = supabase
  .channel('ime_tracking_changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'ime_email_tracking' },
    (payload) => {
      // Update UI immediately
      updateTrackingInState(payload.new)
    }
  )
  .subscribe()
```

### Analytics Dashboard
- Open rate trends over time
- Best time to send analysis
- Engagement heatmaps
- Comparative metrics by organization

### Advanced Features
- Email scheduling
- A/B testing for subject lines
- Automated re-sends for bounces
- Custom email templates per event

---

## Replication Checklist

To replicate this in another project:

1. **Database**: Run migration SQL
2. **Backend**: Copy both Edge Functions
3. **Services**: Copy `emailTrackingService.ts`
4. **Email Service**: Add tracking integration
5. **UI Components**: Copy `AccessCodesManagementPage.tsx`
6. **Routes**: Add `/access-codes` route
7. **Navigation**: Add sidebar link
8. **Translations**: Add `navLinkAccessCodes` key
9. **Resend**: Configure webhook
10. **Test**: Follow testing checklist

---

## Credits

**Implemented**: December 8, 2024  
**Team**: LyVentum Development  
**Version**: 1.0.0

---

## Support

For questions or issues:
1. Check this documentation
2. Review [walkthrough.md](../walkthrough.md) in artifacts
3. Check Supabase Edge Function logs
4. Review Resend webhook delivery logs
