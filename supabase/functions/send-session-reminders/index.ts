import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { renderTemplate, loadSponsors, getSessionReminderTemplate } from '../_shared/template-helpers.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    // Parse body to check for Test Mode
    let isTest = false;
    let testEmail = '';
    let testEventId = '';

    try {
        const body = await req.json();
        isTest = body.isTest;
        testEmail = body.testEmail;
        testEventId = body.eventId;
    } catch {
        // No body or invalid json, normal scheduled execution
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
        if (!RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY not configured');
        }

        // --- TEST MODE LOGIC ---
        if (isTest && testEmail && testEventId) {
            console.log(`[SessionReminders] Running in TEST MODE for ${testEmail}`);

            // Get event details
            const { data: event, error: eventError } = await supabase
                .from('events')
                .select('*')
                .eq('id', testEventId)
                .single();

            if (eventError || !event) throw new Error('Test event not found');

            // Find ANY future session for this event to use as preview
            const { data: sampleSession, error: sessionError } = await supabase
                .from('sessions')
                .select('*, booths(company_name, physical_id)')
                .eq('event_id', testEventId)
                .gte('start_time', new Date().toISOString())
                .order('start_time', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (sessionError) throw sessionError;

            // If no sessions, create dummy data
            const sessionData = sampleSession || {
                name: 'Sample Session Title',
                description: 'This is a test session description to preview the email layout.',
                start_time: new Date(Date.now() + 3600000).toISOString(),
                end_time: new Date(Date.now() + 7200000).toISOString(),
                session_type: 'presentation',
                location: 'Auditorio Principal',
                speaker: 'Dr. Example Speaker',
                booths: { company_name: 'Test Booth', physical_id: 'A1' }
            };

            // Load sponsors
            // Get Email Settings (From name/email) - use maybeSingle to avoid errors
            const { data: prefs } = await supabase
                .from('email_preferences')
                .select('*')
                .eq('event_id', testEventId)
                .maybeSingle();

            const fromEmail = prefs?.fromEmail || 'noreply@lyventum.com';
            const fromName = prefs?.fromName || event.name || 'Event Team';

            const reminderMinutes = 15;
            const sessionTime = new Date(sessionData.start_time).toLocaleString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            // Generate simple HTML directly for test email
            const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:8px;max-width:600px;">
<tr><td style="background:linear-gradient(135deg,#f59e0b 0%,#ef4444 100%);padding:40px 20px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:28px;">⏰ Session Starting Soon!</h1>
</td></tr>
<tr><td style="padding:40px 30px;">
<p style="color:#64748b;font-size:16px;margin:0 0 20px 0;">Hi Test Attendee,</p>
<p style="color:#64748b;font-size:16px;margin:0 0 30px 0;">Your session is starting in <strong>${reminderMinutes} minutes</strong>.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-left:4px solid #f59e0b;border-radius:6px;margin-bottom:30px;">
<tr><td style="padding:20px;">
<h2 style="color:#1e293b;margin:0 0 15px 0;font-size:20px;">${sessionData.name}</h2>
<p style="color:#64748b;font-size:14px;margin:8px 0;"><strong>📅 Time:</strong> ${sessionTime}</p>
<p style="color:#64748b;font-size:14px;margin:8px 0;"><strong>📍 Location:</strong> ${sessionData.booths?.company_name || 'Main Stage'}</p>
</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center">
<a href="#" style="display:inline-block;background-color:#f59e0b;color:#fff;text-decoration:none;padding:16px 40px;border-radius:6px;font-size:16px;">View My Agenda</a>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:30px;text-align:center;background-color:#1e293b;color:#94a3b8;">
<p style="margin:0 0 10px 0;font-size:14px;color:#cbd5e1;"><strong style="color:#fff;">${event.name}</strong></p>
<p style="margin:0;font-size:12px;">Need help? <a href="mailto:${fromEmail}" style="color:#06b6d4;">${fromEmail}</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

            // Send Test Email
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: `${fromName} <${fromEmail}>`,
                    to: [testEmail],
                    subject: `[TEST] Reminder: ${sessionData.name} starts in ${reminderMinutes} minutes`,
                    html: emailHtml
                })
            });

            if (!res.ok) throw new Error(`Resend error: ${await res.text()}`);

            return new Response(JSON.stringify({ sent: 1, message: 'Test email sent successfully' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        // --- END TEST MODE LOGIC ---

        // Get all events with session reminders enabled
        const { data: enabledEvents, error: settingsError } = await supabase
            .from('email_settings')
            .select('event_id, session_reminders_enabled, session_reminder_minutes, from_name, from_email')
            .eq('session_reminders_enabled', true);

        if (settingsError) {
            console.error('[SessionReminders] Settings query error:', settingsError);
            throw settingsError;
        }

        if (!enabledEvents || enabledEvents.length === 0) {
            console.log('[SessionReminders] No events have session reminders enabled');
            return new Response(JSON.stringify({ sent: 0, message: 'Session reminders not enabled for any event' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log(`[SessionReminders] Found ${enabledEvents.length} events with reminders enabled`);

        // Use the most common reminder time (default 15 minutes)
        const reminderMinutes = enabledEvents[0]?.session_reminder_minutes || 15;
        const now = new Date();

        // Window logic: check from [now + reminderMinutes] to [now + reminderMinutes + 5 minutes]
        // This covers the entire 5-minute interval between cron runs so no session is missed due to timing mismatches
        const windowStart = new Date(now.getTime() + reminderMinutes * 60000);
        const windowEnd = new Date(now.getTime() + (reminderMinutes + 5) * 60000);

        console.log(`[SessionReminders] Checking sessions between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`);

        const enabledEventIds = enabledEvents.map(e => e.event_id);

        const { data: upcomingSessions, error: sessionsError } = await supabase
            .from('session_registrations')
            .select(`
        *,
        sessions!inner(name, start_time, end_time, session_type, location, speaker, description),
        attendees!inner(id, name, email),
        booths(company_name, physical_id),
        events!inner(id, name)
      `)
            .gte('sessions.start_time', windowStart.toISOString())
            .lt('sessions.start_time', windowEnd.toISOString())
            .eq('status', 'Registered')
            .in('event_id', enabledEventIds);

        if (sessionsError) {
            console.error('[SessionReminders] Query error:', sessionsError);
            throw sessionsError;
        }

        console.log(`[SessionReminders] Found ${upcomingSessions?.length || 0} sessions`);

        if (!upcomingSessions || upcomingSessions.length === 0) {
            return new Response(JSON.stringify({ sent: 0, message: 'No sessions starting in 15 minutes' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get unique event IDs to fetch sponsors
        const eventIds = [...new Set(upcomingSessions.map(s => s.event_id))];

        let sentCount = 0;
        const errors: string[] = [];

        // Send email for each session
        for (const session of upcomingSessions) {
            try {
                // Load sponsors for this event
                const sponsors = await loadSponsors(supabase, session.event_id);

                // Get email settings for this event
                const eventSettings = enabledEvents.find(e => e.event_id === session.event_id);

                // Format session time
                const sessionTime = new Date(session.sessions.start_time).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                // Get template
                const template = getSessionReminderTemplate();

                // Render with variables
                const emailHtml = renderTemplate(template, {
                    ATTENDEE_NAME: session.attendees.name,
                    SESSION_NAME: session.sessions.name,
                    SESSION_TIME: sessionTime,
                    SESSION_TYPE: session.sessions.session_type || 'meeting',
                    // For meetings
                    BOOTH_NAME: session.booths?.company_name || null,
                    BOOTH_ID: session.booths?.physical_id || null,
                    // For presentations
                    LOCATION: session.sessions.location || null,
                    SPEAKER: session.sessions.speaker || null,
                    DESCRIPTION: session.sessions.description || null,
                    SESSION_DESCRIPTION: session.sessions.description || null, // Legacy support
                    REMINDER_MINUTES: reminderMinutes,
                    AGENDA_URL: `${Deno.env.get('PORTAL_URL') || 'https://app.lyventum.com'}/attendee/agenda`,
                    EVENT_NAME: session.events.name,
                    EVENT_LOGO_URL: '',
                    SUPPORT_EMAIL: eventSettings?.from_email || 'support@lyventum.com',
                    PLATINUM_SPONSOR: sponsors.platinum,
                    GOLD_SPONSORS: sponsors.gold,
                    SILVER_SPONSORS: sponsors.silver
                });

                // Send via Resend
                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: eventSettings?.from_email || 'LyVentum <noreply@lyventum.com>',
                        to: [session.attendees.email],
                        subject: `Reminder: ${session.sessions.name} starts in ${reminderMinutes} minutes`,
                        html: emailHtml
                    })
                });

                if (!response.ok) {
                    throw new Error(`Resend error: ${await response.text()}`);
                }

                sentCount++;
                console.log(`[SessionReminders] Sent reminder to ${session.attendees.email}`);
            } catch (e: any) {
                console.error(`[SessionReminders] Error loop: ${e.message}`);
                errors.push(e.message);
            }
        }

        return new Response(JSON.stringify({
            sent: sentCount,
            total: upcomingSessions.length,
            errors: errors.length > 0 ? errors : undefined
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('[SessionReminders] Fatal error:', error);
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

function calculateDuration(start: string, end: string): string {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}min`;
    }
    return `${minutes}min`;
}
