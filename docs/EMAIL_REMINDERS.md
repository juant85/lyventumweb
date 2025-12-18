# 📧 Email Reminder System - Complete Documentation

## 📋 **Overview**

Automated email reminder system for LyVentum events that sends:
- **Session Reminders**: 15 minutes before scheduled meetings
- **Daily Agenda**: End-of-day summary of tomorrow's schedule

---

## 🏗️ **Architecture**

### **Components:**

```
┌─────────────────────────────────────────────────────┐
│                   Supabase                          │
│                                                     │
│  ┌──────────────┐      ┌──────────────────────┐   │
│  │   pg_cron    │─────▶│  Edge Functions      │   │
│  │              │      │                      │   │
│  │ Every 5 min  │      │ send-session-        │   │
│  │ Daily 6 PM   │      │   reminders          │   │
│  └──────────────┘      │                      │   │
│                        │ send-daily-agenda    │   │
│                        └──────────┬───────────┘   │
│                                   │               │
└───────────────────────────────────┼───────────────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │  Resend API   │
                            │  (Email Send) │
                            └───────────────┘
```

---

## 📁 **File Structure**

```
supabase/functions/
├── _shared/
│   └── email-templates.ts          # HTML email templates
│
├── send-session-reminders/
│   └── index.ts                     # Session reminder logic
│
└── send-daily-agenda/
    └── index.ts                     # Daily agenda logic
```

---

## 🎨 **Email Templates**

### **Session Reminder Email**

**Sent:** 15 minutes before session starts

**Features:**
- ✅ Event logo header
- ✅ Alert badge ("⏰ Starts in 15 minutes")
- ✅ List of meetings with:
  - Time badge (e.g., "9:15 AM")
  - Company name (bold)
  - Booth location (with 📍 icon)
- ✅ CTA button to view full schedule
- ✅ Sponsor logos footer
- ✅ Responsive design

**Example:**
```
┌─────────────────────────────────────┐
│ ╔═══════════════════════════════╗  │
│ ║  [Event Logo]                 ║  │
│ ╚═══════════════════════════════╝  │
│                                     │
│  ⏰ Starts in 15 minutes            │
│                                     │
│  Hi Alissa,                         │
│  Your next session starts at 9:00AM │
│                                     │
│  You have 3 meetings scheduled:     │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 9:15 AM  Microsoft           │  │
│  │          📍 Booth #42        │  │
│  ├──────────────────────────────┤  │
│  │ 9:30 AM  Google              │  │
│  │          📍 Booth #45        │  │
│  ├──────────────────────────────┤  │
│  │ 9:45 AM  Amazon              │  │
│  │          📍 Booth #51        │  │
│  └──────────────────────────────┘  │
│                                     │
│  [View Full Schedule →]             │
│                                     │
│  💡 Tip: Head there now!            │
│                                     │
├─────────────────────────────────────┤
│  Sponsored by                       │
│  [Logo] [Logo] [Logo]              │
└─────────────────────────────────────┘
```

---

### **Daily Agenda Email**

**Sent:** Daily at 6:00 PM

**Features:**
- ✅ Event logo header
- ✅ Date badge
- ✅ Professional greeting ("Dear [Name]")
- ✅ Friendly reminder message
- ✅ List of tomorrow's sessions with:
  - Time badge
  - Session name
  - Location and duration
- ✅ CTA button
- ✅ Sponsor logos

**Example:**
```
Dear Alissa,

This is a friendly reminder of your scheduled 
meetings for tomorrow. We're excited to have you 
at our event!

You have 3 meetings planned:

┌────────────────────────────────────┐
│ 9:00 AM  Opening Keynote           │
│          📍 Main Hall · ⏱️ 1h      │
├────────────────────────────────────┤
│ 10:30 AM Product Demo              │
│          📍 Booth #42 · ⏱️ 30min   │
├────────────────────────────────────┤
│ 2:00 PM  Networking Session        │
│          📍 Hall B · ⏱️ 2h         │
└────────────────────────────────────┘
```

---

## ⚙️ **Edge Functions**

### **1. send-session-reminders**

**Trigger:** Every 5 minutes (via pg_cron)

**Logic:**
```typescript
1. Query sessions starting in 15-16 minutes
2. Filter by status = 'Registered'
3. Group by attendee + session time
4. Fetch event logos and sponsor logos
5. Generate HTML email with meeting list
6. Send via Resend API
```

**Database Query:**
```sql
SELECT 
  sr.*,
  s.name, s.start_time, s.end_time,
  a.id, a.name, a.email,
  b.company_name, b.physical_id,
  e.id, e.name, e.logo_url
FROM session_registrations sr
INNER JOIN sessions s ON sr.session_id = s.id
INNER JOIN attendees a ON sr.attendee_id = a.id
LEFT JOIN booths b ON sr.booth_id = b.id
INNER JOIN events e ON sr.event_id = e.id
WHERE s.start_time >= NOW() + INTERVAL '15 minutes'
  AND s.start_time <= NOW() + INTERVAL '16 minutes'
  AND sr.status = 'Registered'
```

---

### **2. send-daily-agenda**

**Trigger:** Daily at 6:00 PM (via pg_cron)

**Logic:**
```typescript
1. Calculate tomorrow's date range
2. Query all sessions for tomorrow
3. Group sessions by attendee_id
4. Sort sessions by start_time
5. Fetch event logos and sponsor logos
6. Generate HTML email with session list
7. Send via Resend API
```

**Database Query:**
```sql
SELECT 
  sr.attendee_id,
  a.id, a.name, a.email,
  s.name, s.start_time, s.end_time,
  b.company_name,
  e.id, e.name, e.logo_url
FROM session_registrations sr
INNER JOIN sessions s ON sr.session_id = s.id
INNER JOIN attendees a ON sr.attendee_id = a.id
LEFT JOIN booths b ON sr.booth_id = b.id
INNER JOIN events e ON sr.event_id = e.id
WHERE s.start_time >= DATE_TRUNC('day', NOW() + INTERVAL '1 day')
  AND s.start_time < DATE_TRUNC('day', NOW() + INTERVAL '2 days')
```

---

## 🔧 **Configuration**

### **Environment Variables (Supabase Secrets):**

| Variable | Description | Example |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend API key | `re_abc123...` |
| `PORTAL_URL` | Attendee portal URL | `https://app.lyventum.com` |

**How to Set:**
1. Supabase Dashboard → Edge Functions → Secrets
2. Add each variable
3. Values are available immediately

---

### **Cron Jobs (pg_cron):**

**Session Reminders:**
```sql
SELECT cron.schedule(
  'send-session-reminders',
  '*/5 * * * *',  -- Every 5 minutes
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/send-session-reminders',
    headers:='{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

**Daily Agenda:**
```sql
SELECT cron.schedule(
  'send-daily-agenda',
  '0 18 * * *',  -- Daily at 6 PM
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/send-daily-agenda',
    headers:='{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

---

## 🚀 **Deployment Status**

### **✅ Deployed:**

- [x] `send-session-reminders` Edge Function
- [x] `send-daily-agenda` Edge Function
- [x] pg_cron extension enabled
- [x] Cron jobs scheduled
- [x] `RESEND_API_KEY` configured

### **⚠️ Pending:**

- [ ] Set `PORTAL_URL` secret (if not already set)

---

## 🧪 **Testing**

### **Manual Test (Session Reminders):**

```bash
curl -X POST \
  'https://rnltgsfzkgpbfgzqskex.supabase.co/functions/v1/send-session-reminders' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "sent": 2,
  "total": 2
}
```

---

### **Manual Test (Daily Agenda):**

```bash
curl -X POST \
  'https://rnltgsfzkgpbfgzqskex.supabase.co/functions/v1/send-daily-agenda' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

---

### **Create Test Data:**

```sql
-- Create session starting in 15 minutes
INSERT INTO sessions (name, start_time, end_time, event_id)
VALUES (
  'Test Session',
  NOW() + INTERVAL '15 minutes',
  NOW() + INTERVAL '1 hour',
  'your-event-id'
);

-- Create registration
INSERT INTO session_registrations (attendee_id, session_id, status)
VALUES ('your-attendee-id', 'session-id-above', 'Registered');
```

Wait 5 minutes for cron to trigger, then check email.

---

## 📊 **Monitoring**

### **View Logs:**

**Supabase Dashboard:**
1. Edge Functions → Select function
2. Click "Logs" tab
3. Filter by time range

**Look for:**
- ✅ `[SessionReminders] ✓ Sent to user@example.com`
- ❌ `[SessionReminders] ✗ Failed for user@example.com`

---

### **Check Cron Execution:**

```sql
-- View cron job history
SELECT 
  jobname,
  runid,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobname IN ('send-session-reminders', 'send-daily-agenda')
ORDER BY start_time DESC
LIMIT 20;
```

---

### **Resend Dashboard:**

Visit: `https://resend.com/emails`

**Check:**
- Emails sent today
- Delivery rate
- Bounces/errors

---

## 🐛 **Troubleshooting**

### **Problem: No emails sent**

**Check:**
1. Cron jobs active: `SELECT * FROM cron.job;`
2. Edge Function logs for errors
3. `RESEND_API_KEY` is set correctly
4. Test data exists (sessions in 15 min)

---

### **Problem: "RESEND_API_KEY not configured"**

**Solution:**
1. Dashboard → Edge Functions → Secrets
2. Add `RESEND_API_KEY` (no quotes)
3. Re-deploy function (optional, usually auto-picks up)

---

### **Problem: Emails go to spam**

**Solution:**
1. Verify domain in Resend
2. Add SPF/DKIM records
3. Use verified "from" address

---

## 📈 **Performance**

### **Expected Load:**

- **Session Reminders**: Runs every 5 min, typically 0-10 emails per run
- **Daily Agenda**: Runs once daily, emails = # of attendees with tomorrow sessions

### **Costs:**

- **Supabase Edge Functions**: Free tier includes 500K invocations/month
- **Resend**: Free tier includes 3,000 emails/month

---

## 🔮 **Future Enhancements**

- [ ] SMS reminders via Twilio
- [ ] Push notifications (web + mobile)
- [ ] Customizable reminder timing (5, 10, 15 min)
- [ ] Weekly digest emails
- [ ] Post-event follow-up emails
- [ ] A/B testing for email content
- [ ] Unsubscribe functionality

---

## 📚 **Related Documentation**

- [Deployment Guide](../brain/9b0d2605-b526-4a5c-96e8-06524651b989/edge_functions_deployment_guide.md)
- [Architecture Analysis](../brain/9b0d2605-b526-4a5c-96e8-06524651b989/edge_functions_architecture_analysis.md)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Resend API Docs](https://resend.com/docs)

---

**Last Updated:** 2025-12-05
**Status:** ✅ Deployed and Active
